// Benefits to review: more than a year since the last review, or the deadline of their call has passed.
// Writes to-review.md (empty if there is nothing); the Action opens or updates an issue.
// Usage: node scripts/watch/review.mjs

import { writeFile } from 'node:fs/promises';
import { BENEFITS } from '../../site/assets/js/data/benefits.js';
import { toReview } from '../../site/assets/js/data/review.js';

const notices = toReview(BENEFITS.map((a) => a.id));
const name = Object.fromEntries(BENEFITS.map((a) => [a.id, a.name]));
const text = notices.length
  ? `Estas fichas necesitan una revisión. Cuando la hagas, actualiza la fecha en \`site/assets/js/data/review.js\` (\`REVIEWED\` o \`CHECK_ON\`):\n\n${notices.map((x) => `- [ ] **${name[x.id]}** (\`${x.id}\`): ${x.reason}. [Ver ficha](https://ayudas.bendi.dev/ayuda/${x.id}/)`).join('\n')}\n`
  : '';
await writeFile('to-review.md', text);
console.log(text || 'Every card is up to date.');
