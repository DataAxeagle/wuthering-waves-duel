(() => {
  "use strict";
  const config = window.WavesDuelPvpConfig || {};
  const SESSION_KEY = "waves-duel-pvp-session-v1";
  const VIEW_CACHE_PREFIX = "waves-duel-pvp-view-v2:";
  const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } };
  let client = null, session = readSession(), channel = null, heartbeat = null, current = null, onState = null, onEvent = null, onError = null, eventCursor = null;
  let syncChain = Promise.resolve();

  function errorText(code) {
    return ({ stale_version:"状态已更新，正在重新同步", ruleset_mismatch:"当前房间使用旧规则版本，请重新创建房间", unauthorized:"匿名身份已失效，请重新进入房间", not_room_member:"当前身份不属于该房间", match_ended:"本局已经结束", room_ended:"房间已经结束" })[code] || String(code || "请求失败");
  }
  function cacheKey() { return `${VIEW_CACHE_PREFIX}${session?.roomId || "unknown"}`; }
  function readCachedView() {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey()) || "null");
      return cached?.view?.players && Number.isSafeInteger(Number(cached.version)) ? cached : null;
    } catch { return null; }
  }
  function saveCachedView(row) {
    if (!row?.view?.players) return;
    try { localStorage.setItem(cacheKey(), JSON.stringify({ version:Number(row.version) || 0, view:row.view, event:null, updated_at:row.updated_at || new Date().toISOString() })); } catch { /* 缓存失败只影响断线补动画 */ }
  }
  async function authSession() {
    const { data } = await client.auth.getSession();
    if (!data.session) throw Object.assign(new Error("匿名身份已失效，请返回房间页重新验证"), { code:"unauthorized" });
    return data.session;
  }
  async function api(operation, body = {}) {
    const auth = await authSession();
    const response = await fetch(`${config.supabaseUrl}/functions/v1/pvp/${operation}`, { method:"POST", headers:{ "content-type":"application/json", apikey:config.supabasePublishableKey, authorization:`Bearer ${auth.access_token}` }, body:JSON.stringify(body) });
    const result = await response.json().catch(() => ({ ok:false,error:`HTTP ${response.status}` }));
    if (!response.ok || !result.ok) throw Object.assign(new Error(errorText(result.error)), { code:result.error });
    return result;
  }
  function report(error) { onError?.(error); }
  function enqueue(task) {
    const next = syncChain.then(task, task);
    syncChain = next.catch((error) => { report(error); });
    return next;
  }
  function applyView(row, base = current) {
    if (!row?.view?.players) return false;
    current = { ...(base || {}), view:row };
    eventCursor = Math.max(Number(eventCursor) || 0, Number(row.version) || 0);
    saveCachedView(row);
    onState?.(current);
    return true;
  }
  async function deliverEvent(item, base) {
    const version = Number(item?.version) || 0;
    if (!version || version <= (Number(eventCursor) || 0)) return false;
    try {
      if (item.event?.commandType) await onEvent?.(item.event, { version });
    } catch (error) {
      // 表现层异常不能阻止权威版本落地；错误会上报，后续事件仍按顺序继续。
      report(error);
    } finally {
      if (item.view?.players) applyView({ version, view:item.view, event:item.event, updated_at:new Date().toISOString() }, base);
      else eventCursor = version;
    }
    return true;
  }
  async function syncFromServer() {
    if (!session?.roomId) throw new Error("缺少 PVP 房间会话");
    let rounds = 0;
    do {
      const body = { roomId:session.roomId };
      if (Number.isSafeInteger(Number(eventCursor))) body.sinceVersion = Number(eventCursor);
      const payload = await api("state", body);
      if (payload.room?.status === "waiting") { location.replace("pvp.html"); return payload; }
      const row = payload.view;
      if (!current) {
        const cached = readCachedView();
        if (cached && Number(cached.version) <= Number(row?.version || 0)) {
          eventCursor = Number(cached.version);
          applyView(cached, payload);
        } else {
          applyView(row, payload);
          return payload;
        }
      }
      const events = [...(payload.events || [])].sort((a, b) => Number(a.version) - Number(b.version));
      for (const event of events) await deliverEvent(event, payload);
      if (row?.view?.players && Number(row.version) > (Number(eventCursor) || 0)) applyView(row, payload);
      else current = { ...(current || {}), ...payload, view:current?.view || row };
      rounds += 1;
      if (!payload.hasMore || rounds >= 20) return payload;
    } while (true);
  }
  function refresh() { return enqueue(syncFromServer); }
  async function subscribe() {
    if (channel) await client.removeChannel(channel);
    channel = client.channel(`pvp-game:${session.roomId}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"pvp_player_views", filter:`room_id=eq.${session.roomId}` }, () => { refresh().catch(() => {}); })
      .subscribe();
  }
  async function init(callbacks = {}) {
    onState = callbacks.onState; onEvent = callbacks.onEvent; onError = callbacks.onError;
    session = readSession();
    if (!session?.roomId || !config.supabaseUrl || !config.supabasePublishableKey) throw new Error("PVP 会话或后端配置缺失");
    client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, { auth:{ persistSession:true, autoRefreshToken:true } });
    const cached = readCachedView();
    if (cached) { eventCursor = Number(cached.version); applyView(cached, { room:{ status:"in_game" } }); }
    await authSession(); await subscribe(); await refresh();
    clearInterval(heartbeat); heartbeat=setInterval(()=>api("heartbeat",{roomId:session.roomId}).catch(()=>{}),20_000);
  }
  async function command(type, payload, expectedVersion) {
    const wirePayload = type === "choose_initiative" ? { ...payload, choice:Number(payload.choice) === 0 ? Number(session.seat) : 1-Number(session.seat) } : payload;
    const response = await api("command", { roomId:session.roomId, actionId:crypto.randomUUID(), expectedVersion, type, payload:wirePayload });
    await enqueue(async () => {
      const applied = await deliverEvent({ version:response.version, event:response.result, view:response.view }, current);
      if (!applied && Number(response.version) > (Number(current?.view?.version) || 0) && response?.view?.players) applyView({ version:response.version, view:response.view, event:response.result, updated_at:new Date().toISOString() });
    });
    return response;
  }
  async function forfeit() { return api("forfeit", { roomId:session.roomId }); }
  window.WavesDuelPvpGame = Object.freeze({ init, command, refresh, forfeit, get current(){ return current; }, get session(){ return session; } });
})();
