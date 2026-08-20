# 手机版国内云迁移可行性评估

## 结论

- 可以迁移到国内云，但只迁移静态网页和卡牌素材不能解决 PVP 操作延迟。
- 当前 PVP 权威链路仍经过 Supabase 新加坡的 Edge Function、Postgres 与 Realtime；这是优先需要迁移的部分。
- 最小改造路线：在阿里云或火山引擎的中国大陆云服务器上自托管 Supabase，并把静态站点迁到国内 CDN。
- 长期托管路线：迁移到腾讯云 CloudBase；其匿名登录、数据库实时推送、云函数、静态托管与 WebSocket 能力更接近当前组合，但代码改造量明显更大。
- 本次只完成本地备份、只读检查和方案研究，没有修改线上资源、数据库、环境变量或部署。

## 已完成备份

- 备份目录：`archives/backups/mobile-20260820-202246-pre-domestic-cloud-evaluation/`
- 源码快照：`mobile-source/`，共 248 个文件
- 发布包副本：`release-package/鸣潮对决-手机版-20260820-180437.zip`
- 原发布包与备份副本 SHA-256 均为：`3B8223A48A697A9F245FCBBF00911C094A7B7AF917C9C90F8C145A9F80F4FCE2`

## 当前架构与延迟判断

当前链路包含：

1. Cloudflare Pages：前端与静态素材。
2. Cloudflare Pages Functions：部分代理能力。
3. Supabase Edge Function：PVP 权威动作入口。
4. Supabase Singapore：Auth、Postgres、Realtime。
5. Cloudflare Turnstile：人机验证。

当前网络环境的 5 次方向性抽样：

| 入口 | 总耗时范围 | 中位数 | 说明 |
|---|---:|---:|---|
| Cloudflare 首页 | 0.84–2.06 秒 | 1.03 秒 | 静态首页请求 |
| Supabase Auth | 0.55–1.96 秒 | 0.97 秒 | 未携带身份，返回 401 |
| Supabase PVP Function | 0.70–1.72 秒 | 0.91 秒 | 未携带身份，返回 401 |

该抽样只覆盖入口基础往返，不包含合法动作处理、数据库事务和对手 Realtime 推送，不能当作完整对局基准；但已说明当前跨境链路存在接近 1 秒的基础波动。

卡牌在线素材此前已转为 WebP，总体积下降约 92.15%。因此目前“点击后过一会才生效”的首要矛盾更可能是 PVP 后端往返，而不是单纯图片格式。

## 候选路线

### 路线 A：阿里云或火山引擎 ECS 自托管 Supabase

适合目标：尽量少改现有 PVP 代码，先验证国内链路收益。

- 保留 Supabase JS SDK、Auth、Postgres、Realtime 与大部分 Edge Function 调用方式。
- 前端迁到阿里云 ESA/OSS+CDN，或火山引擎 TOS+CDN。
- Turnstile 需评估替换为国内验证码服务。
- 需要自行负责 Docker、HTTPS、数据库备份、监控、升级和故障恢复。
- 中国大陆生产域名通常需要 ICP 备案。

### 路线 B：腾讯云 CloudBase 托管化重构

适合目标：降低长期服务器维护负担。

- CloudBase 提供匿名登录、数据库实时推送、云函数、静态托管和 WebSocket/云托管能力。
- 需要重写 Supabase Auth、RLS、Postgres、Realtime 与 Edge Function 接口层。
- 不适合直接切换生产，应该建立独立测试环境后逐步迁移。

### 路线 C：阿里云原生组合

- ESA/OSS+CDN 承载前端与素材。
- ECS/SAE/函数计算承载 API，RDS PostgreSQL 与 Redis 承载状态和消息。
- 可实现，但不是 Supabase 的直接替代，后端改造量较大。

### 路线 D：火山引擎原生组合

- TOS+CDN 承载前端与素材。
- ECS/veFaaS、RDS/Redis 与 CLB WS/WSS 承载业务。
- 可实现，但需要自行组合权威服务、鉴权、数据库与实时同步。

## 推荐执行顺序

1. 保留当前线上版，建立并行的 `cn-test` 环境。
2. 优先用广州或华南节点做“自托管 Supabase + 国内静态托管”技术验证，减少客户端改造。
3. 使用两台真实手机测试创建房间、准备、先后手、换牌、出牌、追击、断线恢复，并记录动作确认与对手可见时间。
4. 达到稳定性与延迟目标后再讨论数据迁移和正式域名切换。
5. 如果服务器维护成本不能接受，再转向 CloudBase 托管化重构。

## 官方资料

- Alibaba Cloud ESA Functions and Pages：<https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/what-is-functions-and-pages/>
- Alibaba Cloud CDN 与备案：<https://help.aliyun.com/zh/icp-filing/basic-icp-service/product-overview/use-alibaba-cloud-cdn>
- Volcengine CDN：<https://www.volcengine.com/docs/6454/1164068?lang=zh>
- Volcengine TOS/CDN 与备案：<https://www.volcengine.com/docs/6428/68721?lang=zh>
- Volcengine CLB WebSocket：<https://www.volcengine.com/docs/6406/68057>
- Tencent CloudBase 产品能力：<https://cloud.tencent.com/document/product/876/40406>
- Tencent CloudBase Web Functions：<https://cloud.tencent.com/document/product/583/56124>
- Supabase Docker 自托管：<https://supabase.com/docs/guides/self-hosting/docker>
- Supabase Realtime 自托管：<https://supabase.com/docs/reference/self-hosting-realtime>
