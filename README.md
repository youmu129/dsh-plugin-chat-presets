# dsh-plugin-chat-presets

DSH 插件（组合包），提供两个聊天 preset，安装后出现在会话的 preset 选择器中：

- **搜索模式**（`web-search`）：开放网页搜索与网页读取能力，不挂载其他工具。
- **纯净模式**（`pure`）：不挂载任何工具，也不注入额外提示词。

## 安装

```powershell
dsh plugin --profile web add ./dsh-plugin-chat-presets
```

重启 `dsh web`（或刷新 Web GUI）后生效。

## 卸载

```powershell
dsh plugin --profile web remove dsh-plugin-chat-presets
```
