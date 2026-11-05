// Todas las ayudas, con buscador y filtro por tema

import { BENEFITS, CATEGORIES, REGIONS } from '../data/benefits.js';
import { PROCEDURES } from '../data/procedures.js';
import { icon } from '../data/icons.js';
import { benefitCard, esc } from '../ui/card.js';

const list = document.getElementById('lista');
const search = document.getElementById('buscar');
const count = document.getElementById('cuantas');
const regionSelect = document.getElementById('ccaa');
const chips = document.getElementById('categorias');
const REGION_KEY = 'ayudas:ccaa';

let topic = new URLSearchParams(location.search).get('tema') ?? 'todas';
// Lista enviada por alguien («Enviar a un familiar»): solo esas ayudas, en ese orden
const sent = (new URLSearchParams(location.search).get('ver') ?? '').split(',').filter((id) => BENEFITS.some((a) => a.id === id));

for (const c of REGIONS) regionSelect.add(new Option(c.name, c.id));
try {
  regionSelect.value = localStorage.getItem(REGION_KEY) ?? '';
} catch {}

chips.innerHTML = [{ id: 'todas', name: 'Todas' }, ...CATEGORIES].map((c) => `<button type="button" data-topic="${c.id}" aria-pressed="${c.id === topic}">${c.name}</button>`).join('');
chips.addEventListener('click', (e) => {
  const b = e.target.closest('[data-topic]');
  if (!b) return;
  topic = b.dataset.topic;
  chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  render();
});

// Busca sin tildes ni mayúsculas
const normal = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function renderSent() {
  const region = regionSelect.value || null;
  document.getElementById('titular').textContent = 'Ayudas que te han enviado.';
  document.querySelector('.entradilla').innerHTML = 'Alguien te ha mandado esta lista. Pulsa cada ayuda para ver <strong>cómo se pide, paso a paso</strong>. <a href="./">Ver todas las ayudas</a>.';
  document.querySelector('.filtros .buscador').hidden = true;
  chips.hidden = true;
  count.textContent = `${sent.length} ${sent.length === 1 ? 'ayuda' : 'ayudas'}`;
  list.innerHTML = `<ul class="lista-ayudas">${sent.map((id) => benefitCard(id, { region })).join('')}</ul>`;
}

function render() {
  if (sent.length) return renderSent();
  const q = normal(search.value.trim());
  const region = regionSelect.value || null;
  const filtered = BENEFITS.filter((a) => (topic === 'todas' || a.category === topic) && (!q || normal([a.name, a.summary, a.amount, a.agency, ...a.requirements, ...(PROCEDURES[a.id]?.easy ?? [])].join(' ')).includes(q)));
  count.textContent = `${filtered.length} de ${BENEFITS.length} ayudas`;
  list.innerHTML = filtered.length
    ? CATEGORIES.map((c) => {
        const inGroup = filtered.filter((a) => a.category === c.id);
        if (!inGroup.length) return '';
        return `<section class="grupo grupo-${c.id}" aria-labelledby="g-${c.id}">
        <h2 class="grupo-titulo" id="g-${c.id}"><span class="insignia">${icon(c.icon)}</span>${esc(c.name)}</h2>
        <ul class="lista-ayudas">${inGroup.map((a) => benefitCard(a.id, { region })).join('')}</ul>
      </section>`;
      }).join('')
    : '<p class="vacio">No hay ninguna ayuda con esa búsqueda. Prueba con otra palabra o <a href="../fuentes/#t-error">avísanos si falta alguna</a>.</p>';
}

search.addEventListener('input', render);
regionSelect.addEventListener('change', () => {
  try {
    localStorage.setItem(REGION_KEY, regionSelect.value);
  } catch {}
  render();
});

render();

// Si se llega con #id-de-ayuda, se abre esa ficha
if (location.hash) {
  const id = decodeURIComponent(location.hash.slice(1)).replace(/^ayuda-/, '');
  const d = document.getElementById(`ayuda-${id}`)?.querySelector('details');
  if (d) {
    d.open = true;
    d.scrollIntoView({ block: 'start' });
  }
}
