// dsh-plugin-chat-presets — ship the `chat-web`（搜索模式）and `pure-chat`（纯净模式）
// agent presets inside an installable bundle instead of `$DSH_HOME/.agent-presets`.
//
// Mechanism: the `agentPresets` service derives its root list once per service
// instance (shipped root, configured roots, user root) and re-scans it on every
// read — discovery is unmemoized. Appending one root here therefore takes effect
// immediately, without patching the `agent-presets` row. `ctx.agentPresets.roots`
// returns that live array. When this plugin unloads (HMR, profile reload), the
// effect disposer withdraws the root; when the service is re-provided, Cordis
// re-runs this dependent plugin and registers it again.
//
// Note: this relies on `roots` being the service's live array — an
// implementation-leaning seam, since the roster has no public runtime
// root-registration API as of dsh-agent-presets 0.1.5-rc.3. If a future version
// adds one (or returns a copy), update this plugin accordingly.

import { fileURLToPath } from 'node:url'

export const name = 'dsh-plugin-chat-presets'
export const inject = ['agentPresets']

/** The bundled preset root: one subdirectory per preset, next to this file. */
const presetsDir = fileURLToPath(new URL('./presets', import.meta.url))

/** @param {import('@deepseek-ai/cordis').Context} ctx */
export function apply(ctx) {
  // `trust: 'system'` marks the presets as bundle-provided: they never become
  // the copy target of preset authoring and cannot be deleted from the UI.
  // Appended LAST, so a same-id preset under `$DSH_HOME/.agent-presets` still
  // shadows the bundled one (first root wins) — useful for local debugging.
  const roots = ctx.agentPresets.roots
  const root = { path: presetsDir, trust: 'system' }
  if (roots.some((entry) => entry.path === root.path)) return
  roots.push(root)
  ctx.logger.info(`${name}: serving agent presets from ${presetsDir}`)
  ctx.effect(() => () => {
    const index = roots.indexOf(root)
    if (index >= 0) roots.splice(index, 1)
  }, `${name}.roots()`)
}
