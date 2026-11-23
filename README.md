# 无限工时 · 序章

《无限工时》的内容驱动重构版本。六 Vanilla 派系基础闭环及长期进度范围均已完成：18 种设施、完整派系强化与法术、Royal Exchange、Champion／Heritage、430 项原版 Trophy、46 项 Misc 登记和 R1–R5。

## 本地运行

项目使用原生 HTML、CSS 和 JavaScript ES Modules，无需构建。

```bash
npm run serve
```

访问 `http://127.0.0.1:4173/`。

## 当前内容

- 18 种设施及 414 项编号强化，包含 Hall of Legends 的双目标强化与 6 项 Hall Bonus；
- Fairy／Elven／Angel／Goblin／Undead／Demon 六派系完整的三层协议与 54 项普通强化；
- 六个派系法术、六个 Champion Trophy、六套 Heritage，以及六个法术 Trophy／同名 Upgrade；
- 412 项设施 Trophy、三项 Secret Trophy／Upgrade、三项 Assistant 前置 Trophy；连同阶段二的 12 项 Trophy，共 430 项原版 Trophy；
- Misc 共 46 项：27 项完整可用目标、9 项已接通完整离线依赖的登记项、10 项保持关闭的 Neutral／第二 Alignment 条目；
- R1–R5 的产出、mana、Assistant、FC、Exchange、自动点击、离线与 Gem 接口，以及 R40／R100／R160／R220 的 Ascension 边界；
- Royal Market（统筹调拨）使用通用升级未购买区首位的统一入口，点击打开六部门统筹调拨弹窗；Royal Exchange 保留逐枚价格、批量事务、统一 B／E／A 倍率与退休重置；
- Fairy／Goblin／Elven／Angel／Undead／Demon 六种部门影响力：加入部门前即可随机发现，立场与当前部门不缩窄掉落池；数字员工按 30-tick 累计器产生影响力，离线收益先进入共享缓存；
- 工资结算、全员冲刺、两个立场技能及六个派系技能；
- 序章：入职、第一笔工资、加入部门、退休指引与第一次退休；
- 退休、投胎、Ascension 重置、30 天离线结算、本地存档、导入导出和备份恢复。

Neutral、佣兵、Research、Challenge、Unique Building 和其他后续系统不在本版开放；涉及这些系统的 R Power 专属参数保持实际零值，不伪造目标或进度。

## 数值成长基准

序章不是一套临时数值。后续更新必须以当前原版兼容公式为基础：

- 期权：`floor(((1 + 4 × runCoins / 5e11) ^ 0.5 - 1) / 2)`。
- Gem Power：以 1 工资购买“期权激励”后，每份期权提供 2% 总产出，并附带 FC 发现率加成；三项 Gem Upgrade 各增加 1 个百分点，均随本轮升级重置。
- 数字员工：每名数字员工每秒产出当前点击收入的 5%，再乘专属产出倍率与全局产出倍率；不增加真实点击或点击收入统计。普通设施第 1、2 档升级各提供 1 名数字员工。在线 FC 使用 30-tick 累计器，按 `p = assistants × fcChance × seconds` 计算保证数量和余数判定，再将 `3 × n` 放入共享缓存；离线按 `round(assistants × fcChance × seconds / 100)` 进入同一缓存，下一次在线 tick 才随机分配到六派系并整数入账。选择器显示的每秒数值是期望速率，不是等额分配承诺。
- 部门影响力：余额与累计 found 分离，消费不回扣 found；四层分派系 found 使用稀疏存档，离线报告分别提供 `factionCoinsPending` 和实际 `factionCoinsFound`；退休清空余额与本轮 found。Fairy／Goblin 在 R0、0 期权时免费签约，之后消耗 20 点目标部门影响力。
- 首次退休仍使用序章的 100M 引导门槛；后续退休要求至少可结算 1 期权。
- R 投胎门槛：`1e27 × 1000^R`；期权不足时不显示投胎入口。
- R1 提供 `50R%` 全局产出、`R^1.75 × hours^0.65` 时间产出、`35R` 最大精力、`2R` 每秒恢复、`R` 名 Assistant、`2R%` Assistant 产出、`500R%` 离线加成、`0.5R` Exchange 加成池、`10R` FC 概率百分点和每 Gem `0.2R%` 加成。
- R2／R3／R4／R5 分别从 R40／R100／R160／R220 生效，各自使用 `R-39／R-99／R-159／R-219` 的非负有效数量，完整公式见 `original_verification/remaining_1.1.0/evidence/08a-reincarnation-power.md`。
- 投胎清空当前期权及 run／r 范围进度，跨 Ascension 时另清 Era 状态；Trophy、剧情和 total 历史统计保留。

## 图片与内容美术

设施、派系、升级、法术和 Trophy 通过各定义的 `ui.icon` 配置图片，通用 Renderer 只读取该字段。禁止在 UI 中按具体内容 ID 写图片分支。新增图片必须放入 `assets/`，保留来源与许可记录，并在浏览器验收中检查加载结果。

阶段二、三新增内容按既定验收要求统一复用 `assets/images/content-icons/red-cross.svg`，不单独制作图片；红色大叉仅作为图片复用，不代表空效果或未实现规则。

## 架构

```text
Content Definitions → ContentGraph → GameRuntime → Selector / ViewModel → UI
                              ↓
                       Transactional SaveState
                              ↓
                 RuntimeCache / Scheduler / SaveAdapter
```

- `ContentGraph`：启动时校验并编译全部定义，建立事件、统计、可见性、购买和效果依赖索引。
- `SaveState`：schema 6 稀疏权威状态，只保存玩家事实，不保存派生产值和 UI 状态。
- `GameRuntime`：唯一运行门面；Command／Tick 开启事务，UI 不直接修改 State。
- `Transaction`：Undo Journal、changedPaths、Domain Facts、Reaction 队列、原子提交与失败回滚。
- `Reaction`：统一处理 Trophy、Challenge 和 Story；永久奖励按稳定 ID 幂等；设施 Trophy 按真实数量和统计路径订阅，不在普通 Tick 全扫定义。
- `RuntimeCache`：按依赖失效派生快照；普通 Tick 不扫描全部内容和剧情，R 时间产出只在 R1+ 随时间刷新。
- `Scheduler`：只处理到期法术与任务；离线按事件点分段，不补跑 200ms Tick。
- `SaveAdapter`：主槽、上一良好备份、损坏原档保留、schema 迁移与内容别名迁移。
- `Selector`：Command 与 UI 共用同一编译条件，输出通用状态和 ViewModel。

详细目标与约束见 `docs/增量内容驱动游戏引擎架构设计.md`；当前函数调用链和执行过程见 `docs/运行时引擎运作流程.md`；FC 当前实现以 `src/systems/runtime.js`、`src/systems/state.js` 和 `tests/content-runtime.test.js` 为准。被取代的方案、进度和历史对照表统一归入 `docs/legacy/`，只用于追溯，不作为当前实现依据。

## 常规内容更新

1. 在 `src/content/definitions/` 的对应领域数组追加声明式定义。
2. 新内容包放入 `src/content/packs/`，只修改 `src/content/index.js` 的 manifest。
3. 使用已注册条件、效果、Action、事件和 UI Kind；新基础机制先注册为通用原语。
4. 启动期自动完成 Schema、引用、公式、依赖和幂等奖励校验。
5. 运行引擎测试、迁移测试和性能检查。

新增普通条目不需要修改 Tick、购买 Command、State 字段或 UI 分支。条目改名通过 `src/content/migrations/content-aliases.js` 显式迁移。

## 制作内容数据库

`data/production/production_items.json` 是人工编辑的制作内容源数据，`data/production/production.db` 是对应的 SQLite 查询结果，两者都纳入 Git。`version` 只记录实际实装版本，未实装条目为 `null`；`enabled` 单独表示当前是否开放。条目、图片和剧情使用 `not_started`／`in_progress`／`done` 状态，无需独立图片的条目使用 `image_status = not_required`。

```bash
python data/production/build.py
python data/production/build.py --check
```

第一条命令重建数据库并校验源数据、状态、版本和正式图片路径；第二条只检查现有数据库是否与 JSON 一致，不写文件。构建过程不依赖 `original_verification/`。

## 存档与恢复

- 当前存档 schema 为 6，旧 schema 1～5 会先迁移再进入运行时。
- 迁移保留已有 FC、建筑、购买、Trophy、RNG 与历史事实；无法反推的累计建造历史从零开始，并在迁移报告中记录，不伪造历史。
- Ascension 按真实 R 门槛重新计算，不保留旧版本自定义的错误档位。
- 已移除内容对应的旧 ID 和数值进入 `quarantined`，不会静默清掉全部进度。
- 存档外层使用 HMAC-SHA-256 校验完整性；本地旧档可迁移一次，新导入的存档必须带有效校验值。
- 主槽损坏或校验失败时读取上一良好备份，损坏原文保留供恢复。
- 普通操作防抖保存；序章首通、退休等关键节点同步保存，失败会回滚并标记未保存。
- 存档仅保存在当前浏览器 localStorage，不跨设备同步。前端校验只能提高篡改门槛，不能替代服务器权威存档。

## 全局游戏文案禁令

以下规则适用于所有页面、按钮、剧情、提示、奖杯、错误状态和后续内容更新，长期有效：

- 游戏本体禁止出现编辑性、开发性、版本解释性或实现说明性语言。
- 不得向玩家展示“内容包”“schema”“运行时”“引擎”“声明式规则”“数值规则独立配置”“无外部运行依赖”“手机显示几个／桌面显示几个”等实现或版本说明。
- 不得用“当前版本只开放”“本次更新”“后续将开放”“临时实现”“占位内容”等编辑口径代替游戏内容。
- 玩家可见文字只能服务于世界观、角色叙事、实际玩法、即时状态和必要操作。
- 错误提示也必须使用可理解、可行动的档案/系统语言，不暴露内部报错、字段、模块或版本号。
- 新增或修改内容后必须全局检查玩家可见文案；README、开发文档和测试可以使用技术语言，但不得复制进游戏本体。

## 测试

```bash
npm test
npm run test:browser:stage2
npm run test:browser:stage3
npm run test:browser
```

引擎测试覆盖启动校验、Command 原子性、Reaction 幂等、关键保存失败回滚、派系与法术、Trophy／Misc、R1–R5、16 组黄金样例、Tick 到期边界、RNG 确定性重放、旧档迁移、主备恢复、离线和重置。浏览器验收分别覆盖六派系闭环、Royal Market／Hall、Misc／Secret、A4 购买链、430 项 Trophy、图片加载及 320–1440px 布局。

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
