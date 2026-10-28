#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appDir = join(skillDir, 'assets', 'app')
const host = process.env.SAYFIELD_HOST || '127.0.0.1'
const port = process.env.SAYFIELD_PORT || '5173'
const npm = process.env.SAYFIELD_NPM || (process.platform === 'win32' ? 'npm.cmd' : 'npm')
const home = homedir()
const doctorOnly = process.argv.includes('--doctor')

const loadAgentConfig = () => {
  const configPath = process.platform === 'win32'
    ? join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'sayfield', 'agent.json')
    : join(home, '.config', 'sayfield', 'agent.json')
  try {
    return JSON.parse(readFileSync(configPath, 'utf8'))
  } catch {
    return {}
  }
}

const config = loadAgentConfig()

const commandExists = (command) => {
  const finder = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(finder, [command], { encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim().split(/\r?\n/)[0] : ''
}

const resolveExecutable = (candidates) => {
  for (const candidate of candidates) {
    if (!candidate) continue
    if (isAbsolute(candidate)) {
      if (existsSync(candidate)) return candidate
      continue
    }
    const found = commandExists(candidate)
    if (found) return found
  }
  return ''
}

const codexCandidates = [
  process.env.CODEX_CLI_PATH,
  config.codexPath,
  process.platform === 'darwin' ? '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex' : '',
  process.platform === 'win32' ? join(process.env.LOCALAPPDATA || '', 'Programs', 'ChatGPT', 'resources', 'codex-cli', 'CodexCLI.exe') : '',
  join(home, '.local', 'bin', 'codex'),
  join(home, '.npm-global', 'bin', 'codex'),
  join(home, '.bun', 'bin', 'codex'),
  '/opt/homebrew/bin/codex',
  '/usr/local/bin/codex',
  'codex',
]

const workbuddyCandidates = [
  process.env.WORKBUDDY_CLI_PATH,
  config.workbuddyPath,
  process.platform === 'darwin' ? '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/dist/codebuddy-lite-wb.mjs' : '',
  process.platform === 'win32' ? join(process.env.LOCALAPPDATA || '', 'Programs', 'WorkBuddy', 'resources', 'app.asar.unpacked', 'cli', 'dist', 'codebuddy-lite-wb.mjs') : '',
  'codebuddy-lite-wb.mjs',
  'codebuddy',
  'workbuddy',
]

const codexPath = resolveExecutable(codexCandidates)
const workbuddyPath = resolveExecutable(workbuddyCandidates)

const printAgentCheck = () => {
  console.log('\nAgent capability check')
  console.log(`  Core web app : ready`)
  console.log(`  Codex        : ${codexPath ? `found · ${codexPath}` : 'not found'}`)
  console.log(`  WorkBuddy    : ${workbuddyPath ? `found · ${workbuddyPath}` : 'not found'}`)
  if (!codexPath && !workbuddyPath) {
    console.log('\nAgent features are not enabled yet.')
    console.log('The timer, topic library, recording, history, and Obsidian sync still work.')
    console.log('To enable automatic topic extraction and recording analysis, choose one:')
    console.log('  1. Install and log in to Codex CLI, then run: codex login')
    console.log('  2. Install and log in to WorkBuddy, or set WORKBUDDY_CLI_PATH to its CLI file.')
    console.log('  Custom path example: CODEX_CLI_PATH="/absolute/path/to/codex" node scripts/start-local.mjs')
  } else {
    console.log('\nLocal Agent features are available for this launch.')
  }
  console.log('')
}

printAgentCheck()
if (doctorOnly) process.exit(0)
if (process.env.SAYFIELD_AGENT_REQUIRED === '1' && !codexPath && !workbuddyPath) {
  console.error('SAYFIELD_AGENT_REQUIRED=1, but neither Codex CLI nor WorkBuddy was found.')
  process.exit(2)
}

if (codexPath) process.env.CODEX_CLI_PATH = codexPath
if (workbuddyPath) process.env.WORKBUDDY_CLI_PATH = workbuddyPath

const major = Number(process.versions.node.split('.')[0])
if (major < 20) {
  console.error(`Node.js 20+ is required; current version is ${process.version}.`)
  process.exit(1)
}
if (!existsSync(join(appDir, 'package.json'))) {
  console.error(`Bundled app is missing at ${appDir}.`)
  process.exit(1)
}

const run = (args) => {
  const result = spawnSync(npm, args, { cwd: appDir, stdio: 'inherit', env: process.env })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!existsSync(join(appDir, 'node_modules'))) {
  console.log('Installing app dependencies...')
  run(['ci'])
} else {
  console.log('Dependencies already installed.')
}

if (process.env.SAYFIELD_SKIP_BUILD !== '1') {
  console.log('Building the local app...')
  run(['run', 'build'])
} else {
  console.log('Skipping build because SAYFIELD_SKIP_BUILD=1.')
}

console.log(`Starting 言之有物 on http://${host}:${port}/`)
const child = spawn(npm, ['run', 'preview', '--', '--host', host, '--port', String(port)], {
  cwd: appDir,
  stdio: 'inherit',
  env: process.env,
})

const stop = (signal) => {
  if (!child.killed) child.kill(signal)
}
process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 0)
})
