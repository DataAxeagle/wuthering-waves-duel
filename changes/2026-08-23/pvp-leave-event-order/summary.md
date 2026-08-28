# PVP 离房与网络顺序补帧修复

## 修复结果

- 空房离开改为服务端确认操作；只有服务端确认或返回终态后才清除本地房间会话。
- 房主独自在等待房时离开会删除房间并级联清理成员、视图和卡组提交。
- 新建房间会自动清理当前用户遗留的“单人等待房”，修复旧版本残留导致永久 `already_in_room`。
- 访客离开等待房会删除自己的成员、视图和卡组提交，并取消房主准备状态。
- 实时通知不再直接套用最新一行，而是向服务端请求最后已播放版本后的全部事件。
- 事件按版本升序串行执行：先播放该事件动画，再应用该版本权威视图；网络乱序、版本跳跃和页面恢复均不会漏掉中间事件。
- 表现层动画异常会被上报，但不会阻止权威状态落地或后续事件继续，避免因单个动画异常卡死对局。
- 未新增数据库表或字段，复用现有服务端私有 `pvp_action_receipts.result jsonb` 保存事件与对应权威快照。

## 线上

- Supabase 项目：`pgxfrxrrcumavalbwqse`
- PVP Edge Function：版本 7，状态 `ACTIVE`
- Cloudflare Pages 部署：`45d59595`
- 生产地址：`https://wuthering-waves-duel-mobile.pages.dev`

## 安装包

- 完整包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-20260823-112704.zip`
- 精简包：`releases/share-packages/mobile/builds/鸣潮对决-手机版-上传精简版-20260823-112704.zip`
