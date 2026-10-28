# 言之有物 · 安装说明

> 适用平台：macOS / Windows / Linux  
> GitHub 仓库：https://github.com/XiaoYangUncle/xiaoyang-speaking-coach  
> 默认本地地址：http://127.0.0.1:5173/

“言之有物”是一个在个人电脑上运行的中英双语表达训练网页。它支持题目练习、计时、录音、Agent 分析和 Obsidian 同步。

---

## 一、准备

每次运行前请确认电脑已安装：

- Node.js 20 或更高版本
- npm
- Chrome、Edge 或 Safari 等现代浏览器

可以从 [Node.js 官网](https://nodejs.org/) 下载 LTS 版本。安装后重新打开终端，运行：

```bash
node -v
npm -v
```

能显示版本号即可继续。

### 先确认你需要哪一种模式

| 模式 | 你能做什么 | 需要安装 |
|---|---|---|
| 基础模式 | 题库、计时、录音、回放、成长记录、Obsidian 同步 | 只需要 Node.js |
| Agent 模式 | 自动拆题、PDF 拆解、录音转写和评分 | 还需要本机找到并登录 Codex CLI 或 WorkBuddy CLI |

**打开 Codex 或 WorkBuddy 桌面端不等于已经配置好。** 启动脚本必须在本机找到对应 CLI。

检查 Codex CLI：

```bash
codex --version
codex login status
```

如果第二个命令提示未登录，先执行：

```bash
codex login
```

如果 Codex CLI 装在了非标准位置，可以启动时指定：

```bash
CODEX_CLI_PATH="/absolute/path/to/codex" node scripts/start-local.mjs
```

WorkBuddy 用户需要先在 WorkBuddy 桌面端和 CLI 完成一次登录。若启动脚本没有找到它，可以指定 CLI 文件路径：

```bash
WORKBUDDY_CLI_PATH="/absolute/path/to/codebuddy-lite-wb.mjs" node scripts/start-local.mjs
```

启动脚本会打印：

```text
Agent capability check
  Core web app : ready
  Codex        : found / not found
  WorkBuddy    : found / not found
```

如果两项都是 `not found`，网页仍然可以启动；只是自动拆题和录音评分会保持关闭。

---

## 二、推荐方式：通过 Agent Skill 安装

适合已经使用 Codex 或 Claude Code 的朋友。

### 1. 下载仓库

```bash
git clone https://github.com/XiaoYangUncle/xiaoyang-speaking-coach.git
```

不会使用 Git 时，也可以在 GitHub 页面点击 `Code → Download ZIP`，然后解压。

### 2. 安装 Skill

把仓库中的：

```text
skills/xiaoyang-speaking-coach
```

复制到对应目录：

- Codex：`~/.codex/skills/xiaoyang-speaking-coach`
- Claude Code：`~/.claude/skills/xiaoyang-speaking-coach`

Windows 对应路径类似：

```text
%USERPROFILE%\.codex\skills\xiaoyang-speaking-coach
```

复制完成后重启 Codex 或 Claude Code。

### 3. 调用 Skill

对 Agent 说：

```text
使用 $xiaoyang-speaking-coach 在本地启动言之有物
```

Agent 会自动安装依赖、构建应用并启动本地网页。首次运行需要几分钟。

---

## 三、Codex 插件市场方式

```bash
codex plugin marketplace add XiaoYangUncle/xiaoyang-speaking-coach
codex plugin add xiaoyang-speaking-coach@xiaoyang-speaking-coach
```

安装完成后，对 Codex 说：

```text
使用 $xiaoyang-speaking-coach 在本地启动言之有物
```

---

## 四、备用方式：直接启动

不想使用 Agent，也可以直接在终端启动。

### macOS / Linux

```bash
git clone https://github.com/XiaoYangUncle/xiaoyang-speaking-coach.git
cd xiaoyang-speaking-coach/skills/xiaoyang-speaking-coach
node scripts/start-local.mjs
```

### Windows PowerShell

```powershell
git clone https://github.com/XiaoYangUncle/xiaoyang-speaking-coach.git
cd xiaoyang-speaking-coach\skills\xiaoyang-speaking-coach
node .\scripts\start-local.mjs
```

启动前建议先自检 Agent 状态：

```bash
node scripts/start-local.mjs --doctor
```

看到下面的地址后，用浏览器打开：

```text
http://127.0.0.1:5173/
```

停止服务：在终端按 `Ctrl+C`。

### 如果 5173 端口被占用

macOS / Linux：

```bash
SAYFIELD_PORT=4318 node scripts/start-local.mjs
```

Windows PowerShell：

```powershell
$env:SAYFIELD_PORT=4318
node .\scripts\start-local.mjs
```

---

## 五、首次使用

1. 浏览器询问麦克风权限时，选择允许。
2. 建议佩戴耳机，麦克风距离嘴部约 10–20 厘米。
3. 选择练习方式、主题和时长。
4. 完成录音后，可以在“成长记录”里回放、转写和分析。
5. 点击“同步到 Obsidian”可以保存训练过程、转写和最终评分。

没有安装 Codex CLI 或 WorkBuddy 时，以下功能仍然可以正常使用：

- 题库和主题拆解的手动流程
- 计时练习
- 录音、回放和下载
- 成长记录
- Obsidian 同步

以下功能需要本机 Agent：

- PDF 和大主题的自动拆解
- 录音自动转写
- Agent 评分和优化建议

---

## 六、Obsidian 同步

1. 先安装并打开一次 Obsidian。
2. 在“成长记录”页面点击 `Obsidian 设置`。
3. 选择本地 Vault 和笔记目录。
4. 点击 `同步到 Obsidian`。

默认目录：

```text
言之有物/训练记录
```

会自动生成：

- 每次训练一篇独立笔记
- `言之有物 · 训练总览.md` 总览索引
- 可选录音附件

再次同步会更新原笔记，不会重复创建。

---

## 七、常见问题

### `node: command not found`

没有安装 Node.js，或者安装后没有重新打开终端。安装 Node.js 20+ 后重试。

### `npm install` 失败

确认网络可用，然后重新运行启动脚本。脚本会自动执行依赖安装和构建。

### 页面打不开

确认终端里的服务仍在运行，并访问终端打印的 `Local` 地址。不要关闭终端窗口。

### Agent 分析不可用

先运行：

```bash
node scripts/start-local.mjs --doctor
```

如果显示 `not found`，按以下顺序处理：

1. 安装 Codex CLI 或 WorkBuddy。
2. 完成 CLI 登录：Codex 使用 `codex login`。
3. 重启本地服务，不要只刷新浏览器。
4. 如果 CLI 已安装但仍显示 `not found`，设置 `CODEX_CLI_PATH` 或 `WORKBUDDY_CLI_PATH` 为绝对路径后重新启动。

如果暂时不想配置 Agent，可以直接使用“复制提示词 → 回到 Agent → 粘贴结果”的手动流程。题库、计时、录音和 Obsidian 不受影响。

### PDF 无法拆解

先确认 PDF 文件可以正常打开。扫描版 PDF 如果没有可提取文本，会走本机 Agent 读取原文件的流程。

### 更换端口后地址变了

以终端输出的 `Local:` 地址为准，不要固定使用旧地址。

---

## 八、数据说明

- 训练历史、偏好和录音保存在该浏览器对应的本地站点数据中。
- 清除浏览器站点数据会同时清除训练历史和录音。
- Obsidian 笔记保存在你选择的 Vault 中。
- 应用只监听本机 `127.0.0.1`，默认不对公网开放。
