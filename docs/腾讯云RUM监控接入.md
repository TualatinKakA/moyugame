# 腾讯云 RUM 监控接入

## 云端资源

当前游戏使用腾讯云可观测平台的用户体验监控（TDEM），不使用旧版 Aegis 应用。

- 业务系统：`endless-shift`
- 业务系统 ID：`rum-FyTy5AAyjZxL`
- Web 应用：`endless-shift-prologue`
- 应用 ID：`app-RbiFSkDuhEvR`
- Project Key：`bxN32phAGVf2`
- 区域：广州
- 采集地址：`https://dem.rumt-zh.com`
- 控制台：https://console.cloud.tencent.com/rum

原有 `moyu` 业务系统未接入当前游戏，其监控数据与 `endless-shift` 相互隔离。

Project Key 是浏览器端应用标识，不是 CAM 密钥。`kimi-scf-deploy-infos.md` 中的 SecretId、SecretKey 不得写入本文档、游戏代码或 Git 仓库。

## 本地接入文件

- `index.html`：在 `<head>` 中加载并初始化 TDEM，确保尽早采集页面性能和错误。
- `assets/vendor/tdem.min.js`：TDEM Web SDK 1.0.12 的浏览器构建产物，部署时必须一并发布。
- `package.json`：记录 `tdem-web-sdk` 依赖来源。
- `package-lock.json`：锁定依赖版本。

当前初始化配置：

```js
window.tdem = new window.TDEM({
  id: 'bxN32phAGVf2',
  url: 'https://dem.rumt-zh.com',
  version: '1.1.1',
  env: 'production',
  spa: false,
  api: true,
  assets: true,
});
window.tdem.reportPageView();
```

游戏是单页应用，但面板切换不改变浏览器路由，因此每次完整打开或刷新页面时显式调用一次 `reportPageView()`。此前仅依赖 SDK 自动 SPA 行为时，云端没有收到 `behavior` 类事件，故保留显式 PV 上报。

SDK 默认采集 JS/Promise 错误、页面性能、Web Vitals、卡顿、白屏和内存等指标；当前额外开启 API 与静态资源测速。会话回放、点击行为和控制台日志采集未开启。玩家首次进入必须设置 1～16 个字符的游戏 ID，ID 独立保存在 `endless-shift-user-id`，启动时通过 `setUser()` 关联 RUM 事件；退休、投胎和清除游戏进度不会删除该 ID。

## 验证与查看数据

1. 启动游戏并强制刷新页面。
2. 在浏览器 Console 中执行 `!!window.tdem`，应返回 `true`。
3. 在 Network 中筛选 `dem.rumt-zh.com`：
   - `sample-config` 返回 200，表示采样配置获取成功。
   - `events` 返回 2xx/204，表示事件请求被接收。
   - `events` 的 Payload 应包含 `event_type: "page_view"` 和 `event_category: "behavior"`，仅有 200 不能证明已发送 PV。
4. 在 RUM 控制台进入用户体验监控，选择业务系统 `endless-shift`、应用 `endless-shift-prologue` 和环境 `production`。
5. 数据可能延迟数分钟，汇总报表可能更慢。查询时间范围必须包含实际访问时间。

本地访问也会计入 `production` 数据。TTFB、完整加载耗时等本地指标不能代表公网玩家体验。

## 指标口径

- PV：页面打开或刷新次数，同一设备可累计多次。
- UV：独立访问设备数；换浏览器、清除存储或使用无痕模式可能产生新设备标识。
- 发生次数：所选时间范围内的样本或事件数量，不等于玩家数量。
- `—`：样本不足或无法计算比例，不代表监控故障。
- LCP：最大内容绘制时间，反映主体内容显示速度，通常不超过 2.5 秒为良好。
- FCP：首次内容绘制时间，即首次显示文字或图片等内容的时间。
- INP：交互到下一次画面更新的响应耗时，通常不超过 200ms 为良好。
- CLS：累积布局偏移，衡量元素意外跳动，通常低于 0.1 为良好。
- TTFB：请求发出到收到服务器首个字节的时间。
- 完全加载耗时：页面及资源完成加载所用时间。
- 3s 内打开率：页面在 3 秒内打开的比例。
- API 请求成功率/耗时：业务接口的成功比例与响应耗时；当前静态游戏没有后端业务 API 时无样本属于正常情况。
- 静态资源请求成功率/耗时：JS、CSS、图片等资源的加载成功比例与耗时。
- JS 错误：未捕获的 JavaScript 运行错误。
- Promise 错误：未被处理的 Promise 拒绝。
- 白屏：页面加载后缺少有效内容的异常。
- Ajax 请求异常：XHR/fetch 网络或 HTTP 异常。
- 接口返回码异常：业务返回码被判定为失败。
- JS/图片/CSS/音视频加载异常：对应静态资源加载失败。

## 常见问题

- 旧版 `/collect/pv`、`/collect/whitelist` 返回 403：说明误用了 Aegis SDK。当前应用必须使用 TDEM SDK 和 `dem.rumt-zh.com`。
- 性能数据存在但 PV 为 0：检查 `events` 请求 Payload 是否实际包含 `page_view`，并检查控制台应用、环境和时间范围。
- 页面没有数据：确认 `assets/vendor/tdem.min.js` 已部署、Project Key 与采集地址匹配、采样配置未关闭事件上报。
- UV 异常增长：检查用户是否频繁清理浏览器存储，以及不同浏览器、无痕模式是否被重复计为新设备。

## 更新 SDK

```bash
npm install tdem-web-sdk@^1 --save
cp node_modules/tdem-web-sdk/lib/tdem.min.js assets/vendor/tdem.min.js
```

更新后应同步修改初始化配置中的应用版本号，并重新检查 `sample-config`、`events` 和 `page_view` 上报。
