// Fichas que hay que revisar: más de un año sin revisar o con el plazo de la convocatoria ya pasado.
// Escribe revisar.md (vacío si no hay nada); la Action abre o actualiza un issue.
// Uso: node scripts/caducidad.mjs

import { writeFile } from 'node:fs/promises';
import { AYUDAS } from '../assets/js/ayudas.js';
import { porRevisar } from '../assets/js/revision.js';

const avisos = porRevisar(AYUDAS.map((a) => a.id));
const nombre = Object.fromEntries(AYUDAS.map((a) => [a.id, a.nombre]));
const texto = avisos.length
  ? `Estas fichas necesitan una revisión. Cuando la hagas, actualiza la fecha en \`assets/js/revision.js\` (\`REVISADO\` o \`PLAZO_HASTA\`):\n\n${avisos.map((x) => `- [ ] **${nombre[x.id]}** (\`${x.id}\`): ${x.motivo}. [Ver ficha](https://ayudas.bendi.dev/ayuda/${x.id}/)`).join('\n')}\n`
  : '';
await writeFile('revisar.md', texto);
console.log(texto || 'Todas las fichas están al día.');
