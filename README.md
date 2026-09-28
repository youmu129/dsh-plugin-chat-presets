# dsh-plugin-chat-presets

把原先直接放在 `$DSH_HOME/.agent-presets/` 下的两个本地 preset —— **搜索模式**（`web-search`，原 id `chat-web`）与 **纯净模式**（`pure`，原 id `pure-chat`）—— 打包成一个可安装的 DSH 组合包（bundle），随插件加载、随插件卸载，不再占用用户 preset 目录。

适配 DSH `0.1.7-rc.2` 的声明式 preset 架构：整个插件是**纯声明式 bundle**，没有任何运行时代码。

## 内容

```text
├── package.json        # 声明 dsh.bundle manifest（本包实体就是 patch 文件）
└── cordis.patch.yml    # insert 两条 @deepseek-ai/dsh-agent-preset 声明
```

## 安装

```powershell
dsh plugin --profile web add ./dsh-plugin-chat-presets
```

`dsh plugin` 会把包 link 进 profile 并把本包追加到 `dsh.profile.bundles`；下次启动 `dsh web`（或重启 Web GUI）后，两个 preset 出现在会话的 preset 选择器中。

## 工作机制（dsh ≥ 0.1.7）

- preset 是一条**普通声明行**：insert 一条 `@deepseek-ai/dsh-agent-preset`，其 `config` 为 `{ id, name, description, order?, plugins }`，`plugins` 就是选中该 preset 的 Agent 挂载的 Cordis 组合。注册由声明行插件自己完成（内部调 `ctx.agentPresets.register(definition)`），本包无需任何代码。
- 目录扫描机制已移除：preset registry **不扫描目录、不接受 preset 路径**（官方 `dsh-agent-preset-registry` README 原话）。旧版 `.agent-presets/<id>/`（`agent.cordis.yml` + `preset.yml`）的正文已平移进声明行的 `config.plugins` / `name` / `description`。
- `config.id` 保持历史 id（`web-search` / `pure`），这些 preset 的历史会话照常解析。
- 行内模块名（`@deepseek-ai/dsh-persona` 等）经 profile 运行时解析表解析，其覆盖整个 dsh 安装作用域，因此本包无需声明对它们的依赖。
- 旧版的 `trust: 'system'` 概念随目录机制一起移除：声明式 preset 本来就不是"本地创作"，没有从 UI 删除的入口；Web 编辑器保存编辑时按行 id 覆盖 `config.plugins`。

## 与 0.1.5-rc.3 版本的差异

0.1.5 时代的实现是运行时插件：`apply()` 往 `ctx.agentPresets.roots`（服务的活数组）push 自带 `presets/` 目录。dsh 0.1.7 重构后 `roots` 属性不复存在，访问即抛 `TypeError`，插件加载失败——插件因此重写为上述纯声明形态，不再依赖任何内部行为。

## 已知依赖与限制

- **依赖 preset 声明行格式**（`@deepseek-ai/dsh-agent-preset` 的 `Config`：`{ id, name, description, order, plugins }`，截至 dsh `0.1.7-rc.2`）。上游若再改声明格式，本包随之更新。
- 不改动 `agent-preset-registry` 行的 `default` 等任何名单配置。

## 开发

纯 YAML，无构建步骤、无运行时代码。改动 `cordis.patch.yml` 后，profile 的 `patchReload: live` 会让运行中的 Web GUI 热重载；改动即反映在 preset 选择器。
