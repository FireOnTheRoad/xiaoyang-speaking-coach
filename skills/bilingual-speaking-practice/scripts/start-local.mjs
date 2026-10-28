#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appDir = join(skillDir, 'assets', 'app')
const host = process.env.SAYFIELD_HOST || '127.0.0.1'
const port = process.env.SAYFIELD_PORT || '5173'
const npm = process.env.SAYFIELD_NPM || (process.platform === 'win32' ? 'npm.cmd' : 'npm')

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
