# dsh-plugin-chat-presets

把原先直接放在 `$DSH_HOME/.agent-presets/` 下的两个本地 preset —— **搜索模式**（`web-search`，原 id `chat-web`）与 **纯净模式**（`pure`，原 id `pure-chat`）—— 打包成一个可安装的 DSH 组合包（bundle），随插件加载、随插件卸载，不再占用用户 preset 目录。

## 内容

```text
├── package.json        # 声明 dsh.bundle manifest
├── cordis.patch.yml    # bundle 层：insert 一行挂载本插件
├── index.js            # apply()：把 ./presets 注册为 agentPresets 的扫描根目录
└── presets/            # 每个子目录是一个 preset（目录名即 preset id）
    ├── web-search/     # 搜索模式：persona + 仅 web_search 工具
    └── pure/           # 纯净模式：仅 persona，无工具
```

preset 目录的内容（`agent.cordis.yml` + `preset.yml`）与原 `$DSH_HOME/.agent-presets/` 下的版本逐字一致，preset id 不变，已记录这些 preset 的历史会话照常解析。

## 安装

```powershell
dsh plugin --profile web add ./dsh-plugin-chat-presets
```

`dsh plugin` 会把包 link 进 profile 并把本包追加到 `dsh.profile.bundles`；下次启动 `dsh web`（或重启 Web GUI）后，两个 preset 出现在会话的 preset 选择器中，trust 为 `system`。

## 工作机制

- `agentPresets` 服务的根目录列表在构造时生成一次，而发现（discovery）是**无记忆**的：每次 `list()` 都重新扫描所有根目录。因此本插件在 `apply()` 里把自带 `presets/` 追加进 `ctx.agentPresets.roots` 后立即生效，无需 patch `agent-presets` 行的 config（patch 会整行覆盖 config，反而要重述 `default` 等字段）。
- 根目录追加在**末尾**：同名 id 时 `$DSH_HOME/.agent-presets` 的用户 preset 仍然优先（first root wins），便于本地临时覆盖调试。
- trust 记为 `system`：这两个 preset 不会被当作"本地创作"——不会成为复制 preset 时的写入目标，也不能从 UI 删除；卸载插件即消失。
- `ctx.effect` 的 disposer 在插件卸载（HMR / profile 重载）时移除该根目录；`agentPresets` 服务重建时 Cordis 会重跑本插件完成重新注册。

## 已知依赖与限制

- **依赖内部行为**：`ctx.agentPresets.roots` 返回的是服务的活数组（截至 `dsh-agent-presets@0.1.5-rc.3`）；名单目前没有公开的运行时 root 注册 API。升级 DSH 后若该 getter 改为返回副本，本插件需要随之更新（届时 roots 推送会静默失效——preset 从选择器消失，可据此发现）。
- 只负责注册根目录，不改动 `default` preset 等任何名单配置。

## 开发

纯 JS ESM，无构建步骤。改动 preset 的 `agent.cordis.yml` 后，新会话即按新组装挂载（名单按文件 stamp 分代际）；改动 `preset.yml` 即时反映在名单。
