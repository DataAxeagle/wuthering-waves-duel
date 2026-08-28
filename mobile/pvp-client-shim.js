(() => {
  "use strict";

  const STORAGE_KEY = "waves-duel-tencent-auth-v1";
  const channels = new Set();

  function loadSession() {
    try {
      const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!session?.access_token || Number(session.expires_at || 0) * 1000 <= Date.now()) return null;
      return session;
    } catch {
      return null;
    }
  }

  function saveSession(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  function normalizeBase(value) {
    const configured = String(value || location.origin);
    return configured.replace(/\/$/, "");
  }

  function websocketUrl(baseUrl, token, roomId) {
    const url = new URL(baseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    url.search = new URLSearchParams({ token, roomId }).toString();
    return url.href;
  }

  class RealtimeChannel {
    constructor(baseUrl, name) {
      this.baseUrl = baseUrl;
      this.name = name;
      this.callback = null;
      this.statusCallback = null;
      this.socket = null;
      this.closed = false;
      this.retry = 0;
      this.retryTimer = null;
      this.roomId = String(name || "").split(":").pop() || "";
    }

    on(_event, filter, callback) {
      const match = String(filter?.filter || "").match(/room_id=eq\.([0-9a-z-]+)/i);
      if (match) this.roomId = match[1];
      this.callback = callback;
      return this;
    }

    subscribe(callback) {
      this.statusCallback = callback;
      this.closed = false;
      this.connect();
      channels.add(this);
      return this;
    }

    connect() {
      if (this.closed) return;
      const session = loadSession();
      if (!session?.access_token || !this.roomId) {
        this.statusCallback?.("CHANNEL_ERROR");
        return;
      }
      try {
        this.socket = new WebSocket(websocketUrl(this.baseUrl, session.access_token, this.roomId));
      } catch {
        this.scheduleReconnect();
        return;
      }
      this.socket.addEventListener("open", () => {
        this.retry = 0;
        this.statusCallback?.("SUBSCRIBED");
      });
      this.socket.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "changed") this.callback?.({ eventType:"UPDATE", new:payload.row || {} });
        } catch { /* 后续完整 state 拉取负责恢复 */ }
      });
      this.socket.addEventListener("close", () => {
        if (!this.closed) {
          this.statusCallback?.("CLOSED");
          this.scheduleReconnect();
        }
      });
      this.socket.addEventListener("error", () => this.socket?.close());
    }

    scheduleReconnect() {
      clearTimeout(this.retryTimer);
      const delay = Math.min(10_000, 500 * (2 ** Math.min(this.retry++, 5)));
      this.retryTimer = setTimeout(() => this.connect(), delay);
    }

    close() {
      this.closed = true;
      clearTimeout(this.retryTimer);
      this.socket?.close();
      channels.delete(this);
    }
  }

  function createClient(baseUrl) {
    const base = normalizeBase(baseUrl);
    return {
      auth: {
        async getSession() { return { data:{ session:loadSession() }, error:null }; },
        async getUser() {
          const session = loadSession();
          return session ? { data:{ user:session.user }, error:null } : { data:{ user:null }, error:{ message:"unauthorized" } };
        },
        async signInAnonymously() {
          try {
            const response = await fetch(`${base}/api/pvp/session`, { method:"POST", headers:{ "content-type":"application/json" }, body:"{}" });
            const payload = await response.json();
            if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
            const session = saveSession({ access_token:payload.access_token, expires_at:payload.expires_at, user:payload.user });
            return { data:{ session, user:session.user }, error:null };
          } catch (error) {
            return { data:{ session:null, user:null }, error };
          }
        },
        async signOut() {
          localStorage.removeItem(STORAGE_KEY);
          for (const channel of [...channels]) channel.close();
          return { error:null };
        },
      },
      channel(name) { return new RealtimeChannel(base, name); },
      async removeChannel(channel) { channel?.close?.(); return "ok"; },
    };
  }

  window.supabase = Object.freeze({ createClient });
})();
