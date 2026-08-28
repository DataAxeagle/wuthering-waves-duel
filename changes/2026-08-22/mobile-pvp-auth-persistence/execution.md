# 执行记录

1. 审计PVP成功回调与 `ensureAuth()`，确认一次性token只存内存，离开页面前不会创建Supabase会话。
2. 备份当前 `mobile/`，源文件264、备份264、SHA-256差异0。
3. 新增 `persistCaptchaSession(token)`，在Turnstile成功回调中立即建立并持久化匿名身份。
4. 新增 `tests/check-pvp-auth-persistence.mjs`：模拟Turnstile与Supabase，验证PVP成功→单机首页→返回PVP的完整流程。
5. 回归结果：
   - `node --check mobile/pvp.js`：通过。
   - `node --test tests/pvp.test.cjs tests/mobile-core.test.cjs tests/card-library.test.cjs`：33/33通过。
   - `node tests/check-pvp-auth-persistence.mjs`：通过；返回PVP状态为“身份已验证”，Turnstile渲染次数0。
6. 部署Cloudflare Pages，生产版本 `bfaf1fed`；公开脚本哈希与本地一致。
7. 打包与归档：
   - 完整包265条目、303,655,252字节、SHA-256 `0659699D184940A5BD3A3913C380D26E6575F7E76C40B32D3E1600F21BE72D0E`。
   - 精简包81条目、22,329,577字节、SHA-256 `D17A0BDB6F8FC61F2A4FC1CCCD1EADFD4A94CACFEA87904CF3D099DC33CD862F`。
   - 两个ZIP完整读取通过，均包含会话持久化逻辑，日期归档副本哈希一致。

## 浏览器自动化检查清单

- 环境就绪：通过，Chrome 9222和CDP代理3456可连接。
- 登录态：通过，测试确认同源PVP匿名会话跨单机页面保持。
- 任务执行：通过，完成首次验证、会话保存、跨页面返回和Turnstile不重复渲染检查。
- 结果交付：通过，结果保存为 `output/测试/2026-08-22/pvp-auth-persistence.json`。
