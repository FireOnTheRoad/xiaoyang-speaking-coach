---
name: xiaoyang-speaking-coach
description: Install, run, and operate “言之有物” / Speaking Practice Coach by XiaoYangUncle as a local web app. Use when a user wants to deploy the speaking-training webpage on 127.0.0.1, practice impromptu / research / structured speaking, extract topics from a subject or PDF, record and transcribe an attempt, score delivery, track progress, or sync training records to Obsidian.
metadata:
  short-description: 本地部署中英双语表达训练工作台
---

# 言之有物 · Speaking Practice Coach by XiaoYangUncle

## Purpose

This skill ships the complete “言之有物” web application and starts it on the user's machine. The app provides:

- A bilingual Chinese / English topic library and custom topic groups
- Impromptu, research, and structured speaking modes
- Topic and PDF extraction through a local Agent bridge
- Timed speaking with recording, replay, transcription, and scoring
- A structured process timeline for every completed round
- Progress history with filtering, sorting, and review
- One-click Obsidian notes plus a training index

## Deploy locally

1. Check that Node.js 20+ and npm are available.
2. From this skill directory, run:

```bash
node scripts/start-local.mjs
```

3. Keep the process running and report the local URL printed by Vite, normally `http://127.0.0.1:5173/`.
4. If the user asks for another port, set `SAYFIELD_PORT`, for example:

```bash
SAYFIELD_PORT=4318 node scripts/start-local.mjs
```

The script installs dependencies when needed, builds the app, then starts the Vite preview server bound to loopback only. Read `references/deployment.md` for platform requirements, optional Agent setup, Obsidian behavior, troubleshooting, and data-location details.

## Agent-dependent features

The webpage itself runs without an external model. Topic/PDF extraction and recording analysis require one of these local Agent routes:

- Codex CLI available as `codex` or through `CODEX_CLI_PATH`
- WorkBuddy CodeBuddy CLI available through `WORKBUDDY_CLI_PATH`

If neither route is available, explain that the timer, recording, history, and Obsidian features still work, but automatic extraction and Agent scoring do not.

## Scoring contract

- Content: 30%
- Structure: 20%
- Conciseness: 15%
- Evidence: 20%
- Delivery: 15%

Never invent content that is not present in the recording or transcript. When transcription is unavailable, leave content-dependent scores and evidence-based claims unavailable instead of fabricating them.

## Output expectations

For an analysis request, return a structured result with transcript, overall score, five dimensions, strengths, improvements, summary, and one next practice action.

## Brand

- Chinese display name: 言之有物 · 小杨叔叔表达教练
- GitHub: @XiaoYangUncle
- Product surface: speaking practice coach
- Skill identifier: `xiaoyang-speaking-coach`
