(() => {
  "use strict";
  const config = window.WavesDuelPvpConfig || {};
  const core = window.WavesDuelCore;
  const presets = window.WavesDuelPresets?.presets || {};
  const catalog = window.WavesDuelCardLibrary;
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    setup: $("#setupPanel"), lobby: $("#lobbyPanel"), warning: $("#configWarning"), name: $("#displayNameInput"), code: $("#roomCodeInput"), create: $("#createRoomButton"), join: $("#joinRoomButton"), badge: $("#connectionBadge"), roomCode: $("#roomCodeLabel"), members: $("#memberList"), deck: $("#deckSelect"), ready: $("#readyButton"), leave: $("#leaveButton"), copy: $("#copyInviteButton"), hint: $("#lobbyHint"), toast: $("#toast"), turnstile: $("#turnstileSlot"), turnstileStatus: $("#turnstileStatus"), turnstileRetry: $("#turnstileRetryButton"),
  };
  const SESSION_KEY = "waves-duel-pvp-session-v1";
  const NAME_KEY = "waves-duel-player-name-v1";
  const CUSTOM_DECKS_KEY = "waves-duel-custom-decks-v1";
  const CAPTCHA_LOAD_TIMEOUT_MS = 15000;
  let client = null, captchaToken = "", captchaWidgetId = null, captchaEpoch = 0, captchaAttempt = 0, captchaRenderPending = false, captchaScriptLoading = false, captchaWatchdog = null, captchaAuthPromise = null, authenticatedSession = false, channel = null, heartbeat = null, refreshBusy = false, restoreBusy = false, leaveBusy = false;
  let session = loadSession(), payload = null;

  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]); }
  function toast(message) { elements.toast.textContent = message; elements.toast.classList.remove("hidden"); clearTimeout(toast.timer); toast.timer = setTimeout(() => elements.toast.classList.add("hidden"), 2600); }
  function loadSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } }
  function saveSession(next) { session = { ...(session || {}), ...next }; localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
  function clearSession() { session = null; localStorage.removeItem(SESSION_KEY); }
  function setRoomActionsEnabled(enabled) { elements.create.disabled = !enabled; elements.join.disabled = !enabled; }
  function setCaptchaStatus(state, message, retry = false) {
    elements.turnstileStatus.dataset.state = state;
    elements.turnstileStatus.textContent = message;
    elements.turnstileRetry.classList.toggle("hidden", !retry);
  }
  function clearCaptchaWatchdog() {
    if (captchaWatchdog !== null) clearTimeout(captchaWatchdog);
    captchaWatchdog = null;
  }
  function armCaptchaWatchdog() {
    clearCaptchaWatchdog();
    const attempt = ++captchaAttempt;
    captchaWatchdog = setTimeout(() => {
      captchaWatchdog = null;
      if (attempt !== captchaAttempt || captchaToken || authenticatedSession) return;
      markCaptchaBlocked("人机验证响应超时，请重新加载验证", true);
    }, CAPTCHA_LOAD_TIMEOUT_MS);
  }
  function markCaptchaVerified(message = "验证已完成，可以创建或加入房间") {
    clearCaptchaWatchdog();
    setCaptchaStatus("success", message);
    setRoomActionsEnabled(true);
  }
  function markCaptchaBlocked(message, retry = false) {
    if (authenticatedSession) return markCaptchaVerified("身份已验证，可以创建或加入房间");
    captchaToken = "";
    setCaptchaStatus(retry ? "error" : "loading", message, retry);
    setRoomActionsEnabled(false);
  }
  function removeCaptchaWidget() {
    captchaEpoch += 1;
    if (captchaWidgetId !== null && window.turnstile) {
      try { window.turnstile.remove(captchaWidgetId); } catch { /* 组件可能尚未完成挂载 */ }
    }
    captchaWidgetId = null;
    elements.turnstile.replaceChildren();
  }
  function loadTurnstileScript(force = false) {
    if (window.turnstile) return Promise.resolve();
    if (captchaScriptLoading && !force) return Promise.resolve();
    const existing = document.querySelector("#wavesDuelTurnstileScript");
    if (force && existing) existing.remove();
    if (!force && existing) return Promise.resolve();
    captchaScriptLoading = true;
    const script = document.createElement("script");
    script.id = "wavesDuelTurnstileScript";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=wavesDuelTurnstileReady";
    script.async = true;
    script.defer = true;
    script.onerror = () => { captchaScriptLoading = false; clearCaptchaWatchdog(); markCaptchaBlocked("人机验证脚本加载失败，请检查网络后重试", true); };
    document.head.appendChild(script);
    return Promise.resolve();
  }
  window.wavesDuelTurnstileReady = () => {
    captchaScriptLoading = false;
    if (captchaRenderPending && !authenticatedSession) renderCaptcha();
  };
  function renderCaptcha() {
    if (captchaWatchdog === null) armCaptchaWatchdog();
    removeCaptchaWidget();
    markCaptchaBlocked("正在加载人机验证……");
    captchaRenderPending = true;
    if (!window.turnstile) { loadTurnstileScript(); return; }
    captchaRenderPending = false;
    const epoch = ++captchaEpoch;
    const current = () => epoch === captchaEpoch;
    try {
        captchaWidgetId = window.turnstile.render(elements.turnstile, {
          sitekey: config.turnstileSiteKey,
          theme: "dark",
          size: "flexible",
          retry: "never",
          callback: (token) => { if (!current()) return; clearCaptchaWatchdog(); void persistCaptchaSession(token); },
          "before-interactive-callback": () => { if (current()) markCaptchaBlocked("请完成上方人机验证"); },
          "error-callback": (code) => { if (current()) { clearCaptchaWatchdog(); markCaptchaBlocked(`人机验证失败（${code || "未知错误"}），请重试`, true); } return false; },
          "expired-callback": () => { if (current()) { clearCaptchaWatchdog(); markCaptchaBlocked("人机验证已过期，请重新验证", true); } },
          "timeout-callback": () => { if (current()) { clearCaptchaWatchdog(); markCaptchaBlocked("人机验证超时，请重试", true); } },
          "unsupported-callback": () => { if (current()) { clearCaptchaWatchdog(); markCaptchaBlocked("当前浏览器无法完成人机验证，请更换浏览器", true); } },
        });
        setCaptchaStatus("loading", "请完成上方人机验证");
      } catch {
        clearCaptchaWatchdog();
        markCaptchaBlocked("人机验证初始化失败，请重试", true);
      }
  }
  function retryCaptcha() {
    clearCaptchaWatchdog();
    armCaptchaWatchdog();
    captchaRenderPending = true;
    markCaptchaBlocked("正在重新加载人机验证……");
    if (window.turnstile) renderCaptcha();
    else loadTurnstileScript(true);
  }

  async function persistCaptchaSession(token) {
    if (captchaAuthPromise) return captchaAuthPromise;
    captchaToken = token;
    setCaptchaStatus("loading", "验证已通过，正在建立联机身份……");
    setRoomActionsEnabled(false);
    captchaAuthPromise = (async () => {
      const { data, error } = await client.auth.signInAnonymously({ options:{ captchaToken:token } });
      captchaToken = "";
      if (error) throw error;
      if (!data?.session) throw new Error("anonymous_session_missing");
      authenticatedSession = true;
      markCaptchaVerified("联机身份已保存，可以创建或加入房间");
      if (session?.roomId) restoreExistingRoom().catch((restoreError) => toast(restoreError.message));
      return data.session;
    })();
    try { return await captchaAuthPromise; }
    catch {
      authenticatedSession = false;
      captchaToken = "";
      try { if (captchaWidgetId !== null) window.turnstile?.reset(captchaWidgetId); } catch { /* 由重试按钮兜底 */ }
      markCaptchaBlocked("联机身份建立失败，请重新验证", true);
      return null;
    } finally { captchaAuthPromise = null; }
  }

  function availableDecks() {
    const builtins = Object.values(presets).map((deck) => ({ ...deck, source: "预组" }));
    let custom = [];
    try {
      custom = JSON.parse(localStorage.getItem(CUSTOM_DECKS_KEY) || "[]").map((deck) => ({ id: `custom:${deck.id}`, name: deck.name, heroIds: deck.heroIds, roleCards: Array.isArray(deck.roleCards) ? deck.roleCards : (deck.heroIds || []).flatMap((heroId) => (catalog?.cards || []).filter((card) => card.type === "character" && card.hero === heroId).sort((a,b) => (a.level||0)-(b.level||0)).map((card) => card.id)), actions: Object.entries(deck.actions || {}).map(([id,count]) => [id,Number(count)]), source: "自组" }));
    } catch { custom = []; }
    return [...builtins, ...custom];
  }
  function refreshDecks() { elements.deck.innerHTML = availableDecks().map((deck) => `<option value="${escapeHtml(deck.id)}">${escapeHtml(deck.source)} · ${escapeHtml(deck.name)}</option>`).join(""); }
  function chosenDeck() { return availableDecks().find((deck) => deck.id === elements.deck.value) || availableDecks()[0]; }

  async function ensureAuth() {
    if (captchaAuthPromise) await captchaAuthPromise;
    const { data } = await client.auth.getSession();
    if (data.session) { authenticatedSession = true; return data.session; }
    if (config.turnstileSiteKey && !captchaToken) throw new Error("请先完成人机验证");
    const options = captchaToken ? { captchaToken } : undefined;
    const { data: signed, error } = await client.auth.signInAnonymously({ options });
    captchaToken = "";
    if (error) {
      if (config.turnstileSiteKey) {
        try { if (captchaWidgetId !== null) window.turnstile?.reset(captchaWidgetId); } catch { /* 由重试按钮兜底 */ }
        markCaptchaBlocked("验证未通过或已经失效，请重新验证", true);
      }
      throw error;
    }
    authenticatedSession = true;
    markCaptchaVerified("身份已验证，可以创建或加入房间");
    return signed.session;
  }
  async function api(operation, body = {}) {
    const auth = await ensureAuth();
    const response = await fetch(`${config.supabaseUrl}/functions/v1/pvp/${operation}`, { method:"POST", headers:{ "content-type":"application/json", apikey:config.supabasePublishableKey, authorization:`Bearer ${auth.access_token}` }, body:JSON.stringify(body) });
    const result = await response.json().catch(() => ({ ok:false,error:`HTTP ${response.status}` }));
    if (!response.ok || !result.ok) {
      if (response.status === 401 || result.error === "unauthorized") {
        authenticatedSession = false;
        await client.auth.signOut({ scope:"local" }).catch(() => {});
        if (config.turnstileSiteKey) retryCaptcha();
      }
      const error=new Error(errorText(result.error)); error.code=result.error; throw error;
    }
    return result;
  }
  function errorText(code) {
    return ({ room_not_found:"房间不存在或已过期", room_full:"房间已满", already_in_room:"你已经在另一个房间中", invalid_invite:"邀请链接无效", ruleset_mismatch:"游戏版本不一致，请刷新页面", stale_version:"状态已更新，正在重新同步", disconnect_grace_active:"对手断线尚未满5分钟", unauthorized:"匿名身份已失效，请重新进入", not_room_member:"当前身份不属于该房间", match_ended:"本局已经结束", room_ended:"房间已经结束", room_not_waiting:"房间已经开始或结束" })[code] || String(code || "请求失败");
  }

  async function createRoom() {
    const name = elements.name.value.trim(); if (!name) return toast("请填写玩家名称");
    localStorage.setItem(NAME_KEY, name);
    const result = await api("create", { displayName:name });
    saveSession({ roomId:result.room.id, roomCode:result.room.code, inviteToken:result.inviteToken, resumeToken:result.resumeToken, seat:result.seat });
    await enterRoom();
  }
  async function joinRoom() {
    const name = elements.name.value.trim(), code = elements.code.value.trim().toUpperCase();
    if (!name || code.length !== 6) return toast("请填写名称和6位房间号");
    localStorage.setItem(NAME_KEY, name);
    const query = new URLSearchParams(location.search);
    const result = await api("join", { displayName:name, roomCode:code, inviteToken:query.get("invite") || undefined });
    saveSession({ roomId:result.room.id, roomCode:result.room.code, resumeToken:result.resumeToken, seat:result.seat });
    await enterRoom();
  }
  async function tryResume() {
    if (!session?.roomId || !session?.resumeToken) return false;
    try { const result=await api("resume", { roomId:session.roomId, resumeToken:session.resumeToken }); saveSession({seat:result.seat}); return true; }
    catch(error) { if(["invalid_resume_token","room_not_found"].includes(error.code)) return false; throw error; }
  }
  async function restoreExistingRoom() {
    if (restoreBusy || !session?.roomId) return;
    restoreBusy=true;
    try {
      await ensureAuth();
      try { payload=await api("state",{roomId:session.roomId}); await enterRoom(); }
      catch(error) {
        if(error.code!=="not_room_member") throw error;
        if(await tryResume()) await enterRoom(); else { clearSession(); toast("恢复令牌无效，请重新加入房间"); }
      }
    } catch(error) { toast(error.message); }
    finally { restoreBusy=false; }
  }
  async function enterRoom() {
    elements.setup.classList.add("hidden"); elements.lobby.classList.remove("hidden"); elements.badge.textContent = "正在连接";
    await subscribe(); await refreshState();
    clearInterval(heartbeat); heartbeat = setInterval(() => api("heartbeat", { roomId:session.roomId }).catch(() => {}), 20_000);
  }
  async function subscribe() {
    if (channel) await client.removeChannel(channel);
    channel = client.channel(`pvp:${session.roomId}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"pvp_player_views", filter:`room_id=eq.${session.roomId}` }, refreshState)
      .subscribe((status) => { elements.badge.textContent = status === "SUBSCRIBED" ? "实时已连接" : status; });
  }
  async function refreshState() {
    if (refreshBusy || !session?.roomId) return;
    refreshBusy = true;
    try { payload = await api("state", { roomId:session.roomId }); render(); }
    catch (error) {
      if (["not_room_member", "room_not_found", "room_ended"].includes(error.code)) {
        clearSession();
        clearInterval(heartbeat);
        if (channel) { await client.removeChannel(channel).catch(() => {}); channel = null; }
        payload = null;
        elements.lobby.classList.add("hidden");
        elements.setup.classList.remove("hidden");
        toast("原房间已经关闭，可以重新创建或加入房间");
      } else toast(error.message);
    }
    finally { refreshBusy = false; }
  }

  function render() {
    if (!payload?.room) return;
    elements.roomCode.textContent = payload.room.room_code || session.roomCode;
    if (payload.room.status === "in_game" && payload.view?.view?.players) {
      location.replace("index.html?pvp=1");
      return;
    }
    renderLobby();
  }
  function renderLobby() {
    elements.lobby.classList.remove("hidden");
    const now = Date.now();
    elements.members.innerHTML = (payload.members || []).map((member) => `<article class="member ${member.ready ? "ready":""}"><strong>${escapeHtml(member.display_name)}</strong><small>${member.seat === payload.seat ? "你" : "对手"} · ${member.ready ? `已准备 · ${escapeHtml(member.deck_name || "卡组")}` : "未准备"} · ${now-new Date(member.last_seen_at).getTime()<45_000 ? "在线":"离线"}</small></article>`).join("") + ((payload.members || []).length < 2 ? '<article class="member"><strong>等待加入</strong><small>分享房间号或邀请链接</small></article>' : "");
    const mine = payload.members?.find((member) => member.seat === payload.seat);
    const ended = payload.room.status === "ended";
    elements.ready.hidden=ended; elements.deck.parentElement.hidden=ended;
    elements.ready.textContent = mine?.ready ? "取消准备" : "准备";
    elements.hint.textContent = ended ? "房间已经结束，请返回主菜单重新创建房间。" : payload.members?.length < 2 ? "等待另一位玩家加入。" : payload.members.every((member) => member.ready) ? "正在创建权威对局……" : "双方选择卡组并准备后开始。";
  }
  async function toggleReady() {
    const mine=payload.members?.find((member)=>member.seat===payload.seat), deck=chosenDeck();
    try { core.validatePresetConstruction(deck); await api("ready",{roomId:session.roomId,ready:!mine?.ready,rulesetVersion:core.RULESET_VERSION,deck}); await refreshState(); }
    catch(error) { toast(error.message); }
  }
  async function leaveRoom() {
    if (leaveBusy) return;
    if(payload?.room?.status==="ended") { clearSession(); location.href="index.html"; return; }
    if (!confirm(payload?.room?.status === "in_game" ? "确定认输并结束本局吗？" : "确定离开房间吗？")) return;
    leaveBusy = true;
    elements.leave.disabled = true;
    elements.leave.textContent = "正在离开…";
    try {
      await api("leave", { roomId:session.roomId });
      clearSession();
      location.href="index.html";
    } catch(error) {
      if (["not_room_member", "room_not_found", "room_ended"].includes(error.code)) {
        clearSession();
        location.href="index.html";
        return;
      }
      toast(`离开失败：${error.message}，请检查网络后重试`);
    } finally {
      leaveBusy = false;
      elements.leave.disabled = false;
      elements.leave.textContent = "离开房间";
    }
  }
  async function claimTimeout() {
    if (!confirm("确认按断线规则取得本局胜利吗？")) return;
    try { await api("claim-timeout",{roomId:session.roomId}); await refreshState(); } catch(error) { toast(error.message); }
  }
  async function copyInvite() {
    const base=new URL("pvp.html",location.href); base.searchParams.set("room",session.roomCode); if(session.inviteToken) base.searchParams.set("invite",session.inviteToken);
    await navigator.clipboard.writeText(base.href); toast("邀请链接已复制");
  }

  async function init() {
    elements.name.value=localStorage.getItem(NAME_KEY)||""; refreshDecks();
    const query=new URLSearchParams(location.search); if(query.get("room")) elements.code.value=query.get("room").toUpperCase();
    if (!config.supabaseUrl || !config.supabasePublishableKey) { elements.warning.textContent="PVP 后端尚未配置：部署前需填写 Supabase Project URL 与 publishable key。单人版不受影响。"; elements.warning.classList.remove("hidden"); markCaptchaBlocked("PVP 后端尚未配置"); return; }
    client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true}});
    const { data: existingAuth } = await client.auth.getSession();
    if (existingAuth.session) {
      const { data: verifiedAuth, error: authError } = await client.auth.getUser();
      authenticatedSession = Boolean(verifiedAuth?.user) && !authError;
      if (!authenticatedSession) await client.auth.signOut({ scope:"local" }).catch(() => {});
    }
    if (authenticatedSession) markCaptchaVerified("身份已验证，可以创建或加入房间");
    else if(config.turnstileSiteKey) renderCaptcha();
    else { setCaptchaStatus("success", "无需人机验证"); setRoomActionsEnabled(true); }
    if(session?.roomId && (authenticatedSession || !config.turnstileSiteKey)) await restoreExistingRoom();
  }
  elements.create.addEventListener("click",()=>createRoom().catch((error)=>toast(error.message)));
  elements.join.addEventListener("click",()=>joinRoom().catch((error)=>toast(error.message)));
  elements.turnstileRetry.addEventListener("click",retryCaptcha);
  elements.ready.addEventListener("click",toggleReady); elements.leave.addEventListener("click",leaveRoom); elements.copy.addEventListener("click",copyInvite);
  window.addEventListener("online",()=>{if(client)refreshState();}); window.addEventListener("pageshow",()=>{if(client)refreshState();}); document.addEventListener("visibilitychange",()=>{if(client&&!document.hidden&&session?.roomId){api("heartbeat",{roomId:session.roomId}).catch(()=>{});refreshState();}});
  init().catch((error)=>toast(error.message));
})();
