# 无限工时 · Moyu Game

一款受《Realm Grinder》增量放置玩法启发的现代打工无限流网页 Demo。点击搬砖、购买自动化设施、选择构筑、释放技能，并在一次次“离职”后进入新的职场副本。

项目使用原生 HTML、CSS 和 JavaScript，无需安装依赖或构建，支持电脑与手机浏览器。

## 在线运行

将仓库发布到 GitHub Pages 后，访问：

```text
https://ttt2718.github.io/moyugame/
```

也可以在本地直接双击 `index.html` 运行。

如需通过本地 HTTP 服务运行：

```bash
python -m http.server 8000
```

然后打开 `http://localhost:8000`。

## 核心玩法

- 点击显示器或按空格搬砖赚钱
- 购买见习牛马、续命咖啡机、自动化脚本和数字替身，获得持续收入
- 同种设施每累计 10 个，产量翻倍
- 使用 `1 / 10 / MAX` 批量采购
- 购买通用强化与构筑专属强化
- 消耗精力释放主动技能
- 本轮总收入达到 ¥2,500 后可提交离职申请
- 每次轮回获得永久产能 +35%，并可重新选择构筑

## 三套构筑

每轮只能选择一套构筑，轮回后可以更换。

### 键盘修会：连击点击流

- 点击基础收入 ×2
- 连击部分最高再 ×3
- 点击额外恢复精力
- 专属强化“腕豪附体”：点击收入再 ×3
- Deadline 持续时间由 18 秒提高到 27 秒

### 效率部：设施自动化流

- 所有设施产出 ×1.5
- 设施价格增长更慢
- 点击收入 ×0.5
- 专属强化“服务器集群”：自动化脚本 ×2、数字替身 ×3

### 隐身摸鱼办：放置离线流

- 停止操作后，设施产出逐渐提高，最高 ×3
- 点击收入 ×0.75
- 精力恢复速度翻倍
- 离线收益 100%，最多累计 4 小时
- 专属强化“精神离职”：停手加成最高 ×5，离线收益提高到 150%

## 主动技能

| 技能 | 精力消耗 | 效果 |
| --- | ---: | --- |
| Deadline 降临 | 30 | 点击 ×4、设施 ×2，持续 18 秒 |
| 复制粘贴 | 20 | 立即获得 60 秒被动产出或 10 次点击收入中的较高者 |
| 带薪摸鱼 | 40 | 设施产出 ×4，持续 20 秒 |

部分构筑会延长技能持续时间。

## 操作

- **鼠标点击 / 触屏点击显示器**：搬砖
- **空格**：搬砖
- **点击技能按钮**：释放技能
- **右上角声音按钮**：开启或关闭音效

浏览器要求首次用户交互后才能播放声音，因此音效会在点击“打卡”后启用。

## 存档与离线收益

- 游戏每 15 秒自动保存，并在购买、轮回或关闭页面时保存
- 存档使用浏览器的 `localStorage`，不会上传到服务器
- 清除网站数据、使用隐私窗口或更换浏览器可能导致存档丢失
- 不同设备和浏览器之间的存档不互通
- 普通构筑按 50% 结算离线收益，最多 2 小时
- 摸鱼构筑按 100% 结算，最多 4 小时；专属强化后为 150%
- 关闭页面后不会实时运行，重新打开时统一补算收益
- 临时技能效果不会整段计入离线收益

## 手机与浏览器兼容性

- 页面包含响应式布局，已检查 390 × 844 手机尺寸
- 小屏幕可上下滚动查看剧情、技能和采购区域
- 部分 iPhone Safari 版本可能不支持 OGG 音效，但不影响核心玩法
- 推荐使用较新的 Chrome、Edge、Firefox 或 Safari

## GitHub Pages 发布

1. 打开仓库的 **Settings → Pages**
2. 在 **Build and deployment** 中选择 **Deploy from a branch**
3. 分支选择 **main**，目录选择 **/(root)**
4. 保存后等待 GitHub Pages 部署完成
5. 访问 `https://ttt2718.github.io/moyugame/`

更新玩法后，只需提交并推送到 `main` 分支：

```bash
git add .
git commit -m "Update game"
git push origin main
```

## 项目结构

```text
.
├── index.html          # 页面、样式和完整游戏逻辑
└── assets/
    ├── images/         # 工位、物品和商品图形
    ├── audio/          # 金币、收银机与轮回音效
    └── 许可说明文件
```

## 素材与许可

- 工位与物品图形：[Kenney Generic Items](https://kenney.nl/assets/generic-items)，CC0
- 轮回音效：[Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds)，CC0
- 收银机音效：[MediaCollege Money Sound Effects](https://www.mediacollege.com/downloads/sound-effects/money/)，来源页标记为 Public Domain
- 金币音效：[StarNinjas — 12 Coin Sound Effects](https://opengameart.org/content/12-coin-sound-effects)，CC0

详细来源说明保存在 `assets/` 目录的许可文件中。

## 开发说明

这是一个单文件、无依赖的玩法 Demo。游戏数值、剧情、音效和界面均集中在 `index.html`，可直接修改后刷新浏览器查看效果。
