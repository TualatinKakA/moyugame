# 项目工作约定

## 制作数据库同步

凡修改游戏条目的名称、描述、剧情、图片、实装版本、开放状态或机制，必须同步更新制作数据库，不能只修改游戏代码。

- `data/production/production_items.json` 是人工编辑的源数据。
- `data/production/production.db` 是构建结果，禁止直接手工编辑。
- 修改后必须运行 `python data/production/build.py` 重建数据库。
- 提交前必须运行 `python data/production/build.py --check`。
- 提交必须同时包含相关游戏文件、`production_items.json` 和 `production.db`。
- 修改名称后，还需检查 `src/content/definitions/` 中的相关描述和 SVG `<title>`。
- 图片或剧情未完成时，必须更新对应状态，不能只替换占位资源。
- 仅修改引擎实现且不涉及任何条目内容或状态时，不需要重建数据库。
