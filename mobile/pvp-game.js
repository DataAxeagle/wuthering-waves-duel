(() => {
  "use strict";
  const config = window.WavesDuelPvpConfig || {};
  const SESSION_KEY = "waves-duel-pvp-session-v1";
  const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } };
  let client = null, session = readSession(), channel = null, heartbeat = null, current = null, onState = null, onError = null;

  function errorText(code) {
    return ({ stale_version:"状态已更新，正在重新同步", ruleset_mismatch:"当前房间使用旧规则版本，请重新创建房间", unauthorized:"匿名身份已失效，请重新进入房间", not_room_member:"当前身份不属于该房间", match_ended:"本局已经结束", room_ended:"房间已经结束" })[code] || String(code || "请求失败");
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
  async function refresh() {
    if (!session?.roomId) throw new Error("缺少 PVP 房间会话");
    current = await api("state", { roomId:session.roomId });
    if (current.room?.status === "waiting") { location.replace("pvp.html"); return current; }
    if (current.view?.view?.players) onState?.(current);
    return current;
  }
  function applyViewRow(row) {
    if (!row?.view?.players) return false;
    const incomingVersion = Number(row.version) || 0;
    const currentVersion = Number(current?.view?.version) || 0;
    if (incomingVersion <= currentVersion) return false;
    current = { ...(current || {}), view: row };
    onState?.(current);
    return true;
  }
  async function subscribe() {
    if (channel) await client.removeChannel(channel);
    channel = client.channel(`pvp-game:${session.roomId}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"pvp_player_views", filter:`room_id=eq.${session.roomId}` }, (change) => {
        if (!applyViewRow(change.new)) refresh().catch(report);
      })
      .subscribe();
  }
  function report(error) { onError?.(error); }
  async function init(callbacks = {}) {
    onState = callbacks.onState; onError = callbacks.onError;
    session = readSession();
    if (!session?.roomId || !config.supabaseUrl || !config.supabasePublishableKey) throw new Error("PVP 会话或后端配置缺失");
    client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, { auth:{ persistSession:true, autoRefreshToken:true } });
    await authSession(); await subscribe(); await refresh();
    clearInterval(heartbeat); heartbeat=setInterval(()=>api("heartbeat",{roomId:session.roomId}).catch(()=>{}),20_000);
  }
  async function command(type, payload, expectedVersion) {
    const wirePayload = type === "choose_initiative" ? { ...payload, choice:Number(payload.choice) === 0 ? Number(session.seat) : 1-Number(session.seat) } : payload;
    const response = await api("command", { roomId:session.roomId, actionId:crypto.randomUUID(), expectedVersion, type, payload:wirePayload });
    if (response?.view?.players) applyViewRow({ ...(current?.view || {}), version:response.version, view:response.view, event:response.result, updated_at:new Date().toISOString() });
    else await refresh();
    return response;
  }
  async function forfeit() { return api("forfeit", { roomId:session.roomId }); }
  window.WavesDuelPvpGame = Object.freeze({ init, command, refresh, forfeit, get current(){ return current; }, get session(){ return session; } });
})();
