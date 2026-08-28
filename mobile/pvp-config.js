// 公开配置，不得在此填写任何服务端密钥。
// 腾讯云版本使用同源 API 与 WebSocket；file:// 本地预览回退到本机 8787 端口。
const wavesDuelPvpOrigin = location.protocol === "file:" ? "http://127.0.0.1:8787" : location.origin;
window.WavesDuelPvpConfig = Object.freeze({
  backend: "tencent-ws",
  supabaseUrl: wavesDuelPvpOrigin,
  supabasePublishableKey: "tencent-same-origin",
  turnstileSiteKey: "",
});
