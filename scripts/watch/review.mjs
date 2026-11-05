// Fichas que hay que revisar: más de un año sin revisar o con el plazo de la convocatoria ya pasado.
// Escribe revisar.md (vacío si no hay nada); la Action abre o actualiza un issue.
// Uso: node scripts/caducidad.mjs

import { writeFile } from 'node:fs/promises';
import { BENEFITS } from '../../site/assets/js/data/benefits.js';
import { toReview } from '../../site/assets/js/data/review.js';

const notices = toReview(BENEFITS.map((a) => a.id));
const name = Object.fromEntries(BENEFITS.map((a) => [a.id, a.name]));
const text = notices.length
  ? `Estas fichas necesitan una revisión. Cuando la hagas, actualiza la fecha en \`assets/js/data/review.js\` (\`REVISADO\` o \`PLAZO_HASTA\`):\n\n${notices.map((x) => `- [ ] **${name[x.id]}** (\`${x.id}\`): ${x.reason}. [Ver ficha](https://ayudas.bendi.dev/ayuda/${x.id}/)`).join('\n')}\n`
  : '';
await writeFile('revisar.md', text);
console.log(text || 'Todas las fichas están al día.');
