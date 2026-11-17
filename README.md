# 无限工时 · 序章

《无限工时》的内容驱动重构版本。当前内容包只开放基础设施、进取／强压立场、Fairy（产品部）、Goblin（财务部）及剧情序章；底层保留后续内容包、法术、升级、奖杯、剧情、重置和迁移所需的通用框架。

## 本地运行

项目使用原生 HTML、CSS 和 JavaScript ES Modules，无需构建。

```bash
npm run serve
```

访问 `http://127.0.0.1:4173/`。

## 当前内容

- 三类基础设施及进取／强压阵营设施；
- 通用设施升级、Fairy／Goblin 首批派系升级；
- 工资结算、全员冲刺、两个立场技能及两个派系技能；
- 序章：入职、第一笔工资、加入部门、退休指引与第一次退休；
- 通用 Trophy 触发、永久解锁、幂等奖励和关联剧情回看；
- 退休、投胎、离线结算、本地存档、导入导出和备份恢复。

未开放 Neutral、其他派系、佣兵、Research、后期挑战和 Ascension 内容。框架允许后续通过新内容包加入，不需要恢复旧硬编码分支。

## 架构

```text
Content Definitions → ContentGraph → GameRuntime → Selector / ViewModel → UI
                              ↓
                       Transactional SaveState
                              ↓
                 RuntimeCache / Scheduler / SaveAdapter
```

- `ContentGraph`：启动时校验并编译全部定义，建立事件、统计、可见性、购买和效果依赖索引。
- `SaveState`：schema 4 稀疏权威状态，只保存玩家事实，不保存派生产值和 UI 状态。
- `GameRuntime`：唯一运行门面；Command／Tick 开启事务，UI 不直接修改 State。
- `Transaction`：Undo Journal、changedPaths、Domain Facts、Reaction 队列、原子提交与失败回滚。
- `Reaction`：统一处理 Trophy、Challenge 和 Story；永久奖励按稳定 ID 幂等。
- `RuntimeCache`：按依赖失效派生快照；普通 Tick 不扫描全部内容和剧情。
- `Scheduler`：只处理到期法术与任务；离线按事件点分段，不补跑 200ms Tick。
- `SaveAdapter`：主槽、上一良好备份、损坏原档保留、schema 迁移与内容别名迁移。
- `Selector`：Command 与 UI 共用同一编译条件，输出通用状态和 ViewModel。

详细目标与约束见 `docs/增量内容驱动游戏引擎架构设计.md`。

## 常规内容更新

1. 在 `src/content/definitions/` 的对应领域数组追加声明式定义。
2. 新内容包放入 `src/content/packs/`，只修改 `src/content/index.js` 的 manifest。
3. 使用已注册条件、效果、Action、事件和 UI Kind；新基础机制先注册为通用原语。
4. 启动期自动完成 Schema、引用、公式、依赖和幂等奖励校验。
5. 运行引擎测试、迁移测试、完整浏览器验收和性能检查。

新增普通条目不需要修改 Tick、购买 Command、State 字段或 UI 分支。条目改名通过 `src/content/migrations/content-aliases.js` 显式迁移。

## 存档与恢复

- 当前存档 schema 为 4，旧 schema 1～3 会先迁移再进入运行时。
- 已移除内容对应的旧 ID 和数值进入 `quarantined`，不会静默清掉全部进度。
- 主槽损坏时读取上一良好备份，损坏原文保留供恢复。
- 普通操作防抖保存；序章首通、退休等关键节点同步保存，失败会回滚并标记未保存。
- 存档仅保存在当前浏览器 localStorage，不跨设备同步。

## 测试

```bash
npm test
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

引擎测试覆盖启动校验、Command 原子性、Reaction 幂等、关键保存失败回滚、派系与法术、Tick 到期边界、RNG 确定性重放、旧档迁移、主备恢复、离线和重置。

浏览器验收覆盖序章直出、剧情关闭与回看、Fairy／Goblin 范围、采购、施法、技能快捷栏、实时记录退出、奖杯面板、退休及 320～1440px 布局。

## 目录

```text
src/content/definitions/   声明式条目
src/content/packs/         内容包
src/content/migrations/    内容别名迁移
src/systems/               ContentGraph、事务、运行时、缓存、存档等
src/core/                  Clock、RNG、数字格式化
src/ui/app.js              通用 ViewModel 界面与 Command 派发
src/ui/story/              通用剧情弹窗
tests/                     引擎与浏览器验收
```
