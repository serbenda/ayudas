// Checks whether the Actions used by the workflows have a newer release.
// The workflows pin each Action to a commit (`uses: owner/repo@<sha> # v1.2.3`), so nothing changes without a review,
// but that also means nobody notices new versions. This replaces Dependabot, which would open pull requests
// and commit as a bot: here a person updates the line by hand.
// Writes actions-updates.md (empty if everything is up to date); the Action opens or updates an issue.
// Usage: node scripts/watch/actions.mjs   (uses GITHUB_TOKEN if set, to avoid the API rate limit)

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const WORKFLOWS = new URL('../../.github/workflows/', import.meta.url);

/** Every pinned Action in a workflow file: { action, repo, sha, version } */
export function pinnedActions(yaml) {
  return [...yaml.matchAll(/uses:\s*([\w.-]+\/[\w.-]+)(\/[\w./-]+)?@([0-9a-f]{40})\s*#\s*(v[\w.-]+)/g)].map(([, repo, path = '', sha, version]) => ({ action: repo + path, repo, sha, version }));
}

/** Compares two versions such as v5.0.1 and v5.1: negative if a is older than b */
export function compareVersions(a, b) {
  const parts = (v) =>
    String(v)
      .replace(/^v/, '')
      .split(/[.-]/)
      .map((x) => (/^\d+$/.test(x) ? Number(x) : 0));
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}

const headers = { accept: 'application/vnd.github+json', 'user-agent': 'ayudas-watch', ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
const api = async (path) => {
  const r = await fetch(`https://api.github.com/${path}`, { headers, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`GitHub ${path}: HTTP ${r.status}`);
  return r.json();
};

/** Latest release of a repo and the commit its tag points to */
async function latest(repo) {
  const release = await api(`repos/${repo}/releases/latest`);
  let ref = (await api(`repos/${repo}/git/ref/tags/${release.tag_name}`)).object;
  if (ref.type === 'tag') ref = (await api(`repos/${repo}/git/tags/${ref.sha}`)).object;
  return { version: release.tag_name, sha: ref.sha, url: release.html_url };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const used = new Map();
  for (const f of (await readdir(WORKFLOWS)).filter((f) => /\.ya?ml$/.test(f))) {
    for (const a of pinnedActions(await readFile(new URL(f, WORKFLOWS), 'utf8'))) {
      const key = `${a.action}@${a.sha}`;
      if (!used.has(key)) used.set(key, { ...a, files: new Set() });
      used.get(key).files.add(f);
    }
  }
  const updates = [];
  const failures = [];
  for (const a of used.values()) {
    try {
      const l = await latest(a.repo);
      if (compareVersions(a.version, l.version) < 0) updates.push({ ...a, latest: l });
    } catch (e) {
      failures.push(e.message);
      console.log(`::warning::${e.message}`);
    }
  }
  let text = '';
  if (updates.length) {
    text += `Hay versiones nuevas de las Actions que usan los workflows. Lee las notas de cada una (por si cambia algo incompatible) y cambia la línea \`uses:\` en los archivos indicados, en la rama development:\n\n`;
    text += updates
      .map((u) => `- [ ] **${u.action}** ${u.version} → [${u.latest.version}](${u.latest.url}) en ${[...u.files].join(', ')}\n  \`uses: ${u.action}@${u.latest.sha} # ${u.latest.version}\``)
      .join('\n');
    text += '\n';
  }
  if (failures.length && failures.length === used.size) text += `\nNo se ha podido consultar GitHub (${failures[0]}).\n`;
  await writeFile('actions-updates.md', text);
  console.log(text || `All ${used.size} pinned Actions are up to date.`);
}
