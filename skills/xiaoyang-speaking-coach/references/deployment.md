# Local deployment and operations

## Requirements

- Node.js 20 or newer
- npm
- A modern browser such as Chrome, Edge, or Safari
- Optional: Codex CLI or WorkBuddy CodeBuddy CLI for topic extraction and recording analysis
- Optional: Obsidian desktop if training records should be written to a vault

## Start

```bash
node scripts/start-local.mjs
```

The script:

1. Enters the bundled app at `assets/app`.
2. Runs `npm ci` when `node_modules` is missing.
3. Runs `npm run build`.
4. Starts `npm run preview -- --host 127.0.0.1 --port 5173`.

Vite prints the final URL. If port 5173 is occupied, it may choose the next free port.

## Agent setup check

The core web app does not require an Agent CLI. These features do require one:

- Automatic topic extraction
- PDF handoff
- Recording transcription and scoring

Use either Codex CLI or WorkBuddy CodeBuddy CLI. Opening the desktop application alone is not enough; the local server must find the CLI executable.

```bash
node scripts/start-local.mjs --doctor
codex --version
codex login status
```

If Codex is installed in a custom location:

```bash
CODEX_CLI_PATH="/absolute/path/to/codex" node scripts/start-local.mjs
```

If WorkBuddy is installed in a custom location:

```bash
WORKBUDDY_CLI_PATH="/absolute/path/to/codebuddy-lite-wb.mjs" node scripts/start-local.mjs
```

If neither is found, the app still starts and the extractor shows a manual prompt-and-paste flow.

## Environment variables

- `SAYFIELD_PORT`: local port, default `5173`
- `SAYFIELD_HOST`: bind host, default `127.0.0.1`
- `SAYFIELD_SKIP_BUILD=1`: skip the build step after the app has already been built
- `SAYFIELD_NPM`: custom npm executable path
- `CODEX_CLI_PATH`: custom Codex CLI executable
- `WORKBUDDY_CLI_PATH`: custom WorkBuddy CodeBuddy CLI module
- `SAYFIELD_WHISPER_MODEL` / `SAYFIELD_WHISPER_CACHE`: local Whisper fallback settings

## Where data lives

- Training history and preferences: browser local storage / IndexedDB on the same origin
- Recordings: browser IndexedDB
- Obsidian notes: the selected local vault
- Agent requests: local loopback bridge inside the Vite server

The app is bound to `127.0.0.1`; it is not intended to be exposed on a public network.

## Obsidian

The app discovers installed Obsidian vaults from the platform config:

- macOS: `~/Library/Application Support/obsidian/obsidian.json`
- Windows: `%APPDATA%/obsidian/obsidian.json`
- Linux: `~/.config/obsidian/obsidian.json`

The default note folder is `言之有物/训练记录`. Each session gets one note; re-syncing updates that note and the managed index block in `言之有物 · 训练总览.md`.

## Troubleshooting

- `npm` not found: install Node.js 20+ and reopen the terminal.
- Agent button unavailable: run `node scripts/start-local.mjs --doctor`, install/log in to Codex CLI or WorkBuddy, then restart the local server. The manual extractor flow remains available.
- PDF extraction fails: confirm the file is readable locally and within the configured size limit.
- Obsidian sync fails: open Obsidian once so its vault config exists, then select the vault in the app settings.
- Port already occupied: set `SAYFIELD_PORT` to another port or stop the existing server.
- Stop the app: press `Ctrl-C` in the terminal running the skill script.

## Uninstall

Stop the server and delete the installed skill folder if desired. Obsidian notes are not deleted automatically. Clear the browser site data if stored training history should also be removed.
