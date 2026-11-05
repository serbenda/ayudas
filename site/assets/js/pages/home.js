// Portada: el cuestionario por pasos y la lista de ayudas que salen.
// Nada se envía: las respuestas solo viven en esta página (y en el navegador si marcas «recordar»).

import { evaluate, emptyProfile, totalChildren, whereToStart, estimatedMoney } from '../lib/rules.js';
import { CITIES } from '../data/regions.js';
import { euros } from '../lib/format.js';
import { BENEFITS, BY_ID, CATEGORIES, REGIONS } from '../data/benefits.js';
import { papersFor, procedureOf } from '../data/procedures.js';
import { DOCUMENTS } from '../data/guide.js';
import { parseNumber } from '../lib/format.js';
import { icon } from '../data/icons.js';
import { benefitCard, phoneButton, esc } from '../ui/card.js';
import { renderHistory } from '../ui/evolution-chart.js';
import { share } from '../ui/share.js';
import { downloadCalendar } from '../lib/reminders.js';
import { toLink, fromLink } from '../lib/answers-link.js';

const form = document.getElementById('cuestionario');
const steps = [...form.querySelectorAll('.paso')];
const stepButtons = [...document.querySelectorAll('#pasos [data-ir]')];
const back = document.getElementById('atras');
const next = document.getElementById('siguiente');
const skip = document.getElementById('saltar');
const results = document.getElementById('resultados');
const list = document.getElementById('lista');
const remember = document.getElementById('recordar');
const peopleBox = document.getElementById('personas');
const STORAGE_KEY = 'ayudas:respuestas';
const TRACKING_KEY = 'ayudas:seguimiento';
let tracking = {};
const ORDER = Object.fromEntries(BENEFITS.map((a, i) => [a.id, i]));

let currentStep = 1;
let visited = new Set([1]);
let activeFilter = 'todas';
let singleParentTouched = false;

// ── Comunidades ─────────────────────────────────────────────────────────
const regionSelect = document.getElementById('region');
for (const c of REGIONS) regionSelect.add(new Option(c.name, c.id));

// ── Pasos ───────────────────────────────────────────────────────────────
function goTo(n, { focus = true } = {}) {
  currentStep = Math.min(Math.max(n, 1), steps.length);
  visited.add(currentStep);
  steps.forEach((p, i) => (p.hidden = i + 1 !== currentStep));
  stepButtons.forEach((b, i) => {
    if (i + 1 === currentStep) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
    b.classList.toggle('hecho', visited.has(i + 1) && i + 1 !== currentStep);
  });
  back.hidden = currentStep === 1;
  next.textContent = currentStep === steps.length ? 'Ver mis ayudas' : 'Siguiente';
  if (focus) {
    const legend = steps[currentStep - 1].querySelector('legend');
    form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    legend.setAttribute('tabindex', '-1');
    legend.focus({ preventScroll: true });
  }
}

stepButtons.forEach((b) => b.addEventListener('click', () => goTo(Number(b.dataset.ir))));
back.addEventListener('click', () => goTo(currentStep - 1));
next.addEventListener('click', () => (currentStep === steps.length ? showResults() : goTo(currentStep + 1)));
skip.addEventListener('click', showResults);

// ── Contadores − / + ────────────────────────────────────────────────────
form.addEventListener('click', (e) => {
  const b = e.target.closest('[data-increment], [data-decrement]');
  if (!b) return;
  const input = document.getElementById(b.dataset.increment ?? b.dataset.decrement);
  const v = Number(input.value) || 0;
  const n = b.dataset.increment ? v + 1 : v - 1;
  input.value = Math.min(Math.max(n, Number(input.min) || 0), Number(input.max) || 99);
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

// ── Personas a cargo ────────────────────────────────────────────────────
function personTemplate(i) {
  const n = i + 1;
  return `
  <div class="persona" data-persona="${n}">
    <h3>Persona ${n}</h3>
    <div class="persona-campos">
      <label>¿Quién es?
        <select name="p${n}-relationship">
          <option value="padre">Mi padre o mi madre</option>
          <option value="hijo">Mi hijo o hija</option>
          <option value="partner">Mi pareja</option>
          <option value="otro">Otro familiar</option>
        </select>
      </label>
      <label>Edad
        <input name="p${n}-age" type="number" inputmode="numeric" min="0" max="120" class="corto">
      </label>
      <label>Discapacidad
        <select name="p${n}-disability">
          <option value="no">No tiene</option>
          <option value="sin">Tiene limitaciones, sin certificado</option>
          <option value="33">Del 33 % al 64 %</option>
          <option value="65">Del 65 % al 74 %</option>
          <option value="75">Del 75 % o más</option>
        </select>
      </label>
      <label>Dependencia
        <select name="p${n}-dependency">
          <option value="no">No necesita ayuda diaria</option>
          <option value="necesita">Necesita ayuda, sin reconocer</option>
          <option value="tramite">Pedida, en trámite</option>
          <option value="1">Grado I</option>
          <option value="2">Grado II</option>
          <option value="3">Grado III</option>
        </select>
      </label>
    </div>
    <label class="casilla"><input type="checkbox" name="p${n}-livesWith" checked><span>Vive conmigo</span></label>
    <label class="casilla"><input type="checkbox" name="p${n}-iCare" checked><span>La cuido yo (o alguien de la familia)</span></label>
  </div>`;
}

function adjustPeople() {
  const n = Number(form.caredForCount.value) || 0;
  const currentOnes = peopleBox.children.length;
  for (let i = currentOnes; i < n; i++) peopleBox.insertAdjacentHTML('beforeend', personTemplate(i));
  for (let i = currentOnes; i > n; i--) peopleBox.lastElementChild.remove();
}

// ── Leer el formulario ──────────────────────────────────────────────────
const fieldValue = (name) => form.elements[name]?.value ?? '';
const radio = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value ?? null;
const yesNo = (name) => {
  const v = radio(name);
  return v === 'si' ? true : v === 'no' ? false : null;
};
const integer = (name, definition = 0) => {
  const n = parseInt(fieldValue(name), 10);
  return Number.isFinite(n) && n >= 0 ? n : definition;
};
// ¿La pregunta está en juego? Solo cuentan las que se esconden por no aplicar, no las de otros pasos.
const visible = (el) => !el.closest('[data-show-if][hidden]');

export function readProfile() {
  const p = emptyProfile();
  p.age = fieldValue('age') === '' ? null : integer('age', null);
  p.region = fieldValue('region') || null;
  p.madridCity = p.region === 'madrid' ? yesNo('madridCity') : null;
  p.city = CITIES[p.region] && yesNo('inCity') ? CITIES[p.region].id : null;
  p.residence = radio('residence') || null;
  p.situation = radio('situation');
  p.startingBusiness = form.startingBusiness.checked;
  p.returnee = form.returnee.checked;
  p.partner = radio('partner') === 'si';
  p.adults = Math.max(1, integer('adults', 1));
  p.children = { under3: integer('children-under3'), age3to5: integer('children-age3to5'), age6to17: integer('children-age6to17') };
  p.baby = form.baby.checked;
  p.singleParent = form.singleParent.checked && visible(form.singleParent);
  p.largeFamily = visible(form.largeFamily) ? fieldValue('largeFamily') : 'no';
  p.widowed = form.widowed.checked;
  p.householdIncome = parseNumber(fieldValue('householdIncome'));
  p.ownIncome = visible(form.ownIncome) ? parseNumber(fieldValue('ownIncome')) : p.householdIncome;
  const wealth = radio('wealth');
  p.highWealth = wealth === 'alto' ? true : wealth === 'bajo' ? false : null;
  p.housing = radio('housing');
  p.disability = fieldValue('disability');
  p.dependency = fieldValue('dependency');
  p.caredFor = [...peopleBox.children].map((el, i) => {
    const n = i + 1;
    const age = fieldValue(`p${n}-age`);
    return {
      relationship: fieldValue(`p${n}-relationship`),
      age: age === '' ? null : Number(age),
      disability: fieldValue(`p${n}-disability`),
      dependency: fieldValue(`p${n}-dependency`),
      livesWith: form.elements[`p${n}-livesWith`].checked,
      iCare: form.elements[`p${n}-iCare`].checked,
    };
  });
  p.childSeriousIllness = form.childSeriousIllness.checked && visible(form.childSeriousIllness);
  p.pension = fieldValue('pension');
  const contributory = ['jubilacion', 'viudedad', 'incapacidad'].includes(p.pension);
  p.pensionMonthly = contributory ? parseNumber(fieldValue('pensionMonthly')) : null;
  p.pensionSince2021 = contributory ? yesNo('pensionSince2021') : null;
  p.childrenBorn = contributory ? integer('childrenBorn') : 0;
  p.contributed15 = visible(form.querySelector('[name="contributed15"]')) ? yesNo('contributed15') : null;
  p.contributedOneYear = visible(form.querySelector('[name="contributedOneYear"]')) ? yesNo('contributedOneYear') : null;
  p.urgent = Object.fromEntries(['food', 'housingAtRisk', 'homeless', 'violence', 'soledad'].map((k) => [k, form.elements[`u-${k}`].checked]));
  return p;
}

// ── Preguntas que solo salen cuando hacen falta ─────────────────────────
function updateConditions() {
  const p = readProfile();
  const n = totalChildren(p);
  const unemployed = p.situation === 'paro-cobrando' || p.situation === 'paro-sin';
  const asksContributions = (unemployed && (p.age ?? 0) >= 50) || (p.pension === 'no' && (p.age ?? 0) >= 58);
  const rules = {
    madrid: p.region === 'madrid',
    city: Boolean(CITIES[p.region]),
    'single-parent': !p.partner && n > 0,
    'large-family': n >= 2 || (n >= 1 && p.baby),
    'own-income': p.adults > 1 || p.partner,
    children: n > 0,
    'contributory-pension': ['jubilacion', 'viudedad', 'incapacidad'].includes(p.pension),
    'unemployed-no-benefit': p.situation === 'paro-sin',
    'contributed-15': asksContributions,
    'nothing-in-step-5': p.pension === 'no' && !unemployed && !asksContributions,
  };
  for (const el of form.querySelectorAll('[data-show-if]')) el.hidden = !rules[el.dataset.showIf];
  if (CITIES[p.region]) document.getElementById('nombre-ciudad').textContent = `la ciudad de ${CITIES[p.region].name}`;
  // Una persona sola con hijos: casi siempre es monoparental (se puede desmarcar)
  if (rules['single-parent'] && !singleParentTouched && radio('partner') === 'no' && p.adults === 1) form.singleParent.checked = true;
}

form.singleParent.addEventListener('change', () => (singleParentTouched = true));

form.addEventListener('change', (e) => {
  const t = e.target;
  if (t.name === 'situation' && t.value === 'pensionista' && form.pension.value === 'no') form.pension.value = 'jubilacion';
  if (t.name === 'partner' && t.value === 'si' && (Number(form.adults.value) || 1) < 2) form.adults.value = 2;
  if (t.name === 'caredForCount') adjustPeople();
  onChange();
});
form.addEventListener('input', onChange);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  showResults();
});

function onChange() {
  updateConditions();
  if (!results.hidden) render();
  save();
}

// ── Resultados ──────────────────────────────────────────────────────────
function showResults() {
  updateConditions();
  renderPhones();
  render();
  results.hidden = false;
  results.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  results.focus({ preventScroll: true });
  save();
}

function render() {
  const p = readProfile();
  const all = evaluate(p).sort((x, y) => (x.status === y.status ? ORDER[x.id] - ORDER[y.id] : x.status === 'si' ? -1 : 1));
  const nYes = all.filter((r) => r.status === 'si').length;
  const nMaybe = all.length - nYes;
  document.getElementById('n-si').firstChild.textContent = nYes;
  document.getElementById('n-quizas').firstChild.textContent = nMaybe;
  document.getElementById('resultados-texto').textContent = all.length
    ? `Con lo que has contestado salen ${all.length} ${all.length === 1 ? 'ayuda' : 'ayudas'}. Pulsa cada una para ver cómo se pide, paso a paso.`
    : 'Con lo que has contestado no sale ninguna ayuda. Prueba a completar más preguntas: los ingresos y quién vive contigo cambian mucho el resultado.';

  // Lo que podría entrar en casa: lo que ya entra + cada ayuda, en una barra
  renderMoney(p, all);

  // Por dónde empezar
  const first = whereToStart(all);
  const begin = document.getElementById('empezar');
  begin.hidden = !first.length;
  document.getElementById('empezar-lista').innerHTML = first
    .map((r) => {
      const t = procedureOf(r.id, p.region);
      return `<li><a href="#ayuda-${r.id}" data-open-page="${r.id}"><strong>${esc(BY_ID[r.id].name)}</strong></a><span>${esc(t.steps[0])}</span></li>`;
    })
    .join('');

  // Papeles de todas las ayudas que salen
  const papeles = papersFor(all.map((r) => r.id));
  document.getElementById('papeles-bloque').hidden = !papeles.length;
  document.getElementById('papeles').innerHTML = papeles
    .map(({ doc, benefits }) => `<li><strong>${esc(DOCUMENTS[doc].name)}</strong>. ${esc(DOCUMENTS[doc].benefit)} <small>Para: ${benefits.map((id) => esc(BY_ID[id].name)).join(', ')}.</small></li>`)
    .join('');

  const visibleOnes = all.filter((r) => activeFilter === 'todas' || r.status === activeFilter);
  if (!visibleOnes.length) {
    list.innerHTML = all.length ? '<p class="vacio">Nada con este filtro.</p>' : '';
    return;
  }
  list.innerHTML = CATEGORIES.map((c) => {
    const inGroup = visibleOnes.filter((r) => BY_ID[r.id].category === c.id);
    if (!inGroup.length) return '';
    return `<section class="grupo grupo-${c.id}" aria-labelledby="g-${c.id}">
      <h3 class="grupo-titulo" id="g-${c.id}"><span class="insignia">${icon(c.icon)}</span>${esc(c.name)}</h3>
      <ul class="lista-ayudas">${inGroup.map((r) => benefitCard(r.id, { result: r, region: p.region, tracking: tracking[r.id] ?? '', profile: p })).join('')}</ul>
    </section>`;
  }).join('');
}

const COLORS = ['var(--s-smi)', 'var(--s-pnc)', 'var(--s-imv)', 'var(--s-iprem)', 'var(--acento)', 'var(--calido-fuerte)', 'var(--quizas)', 'var(--tenue)'];

function renderMoney(p, all) {
  const box = document.getElementById('dinero');
  const d = estimatedMoney(all);
  if (!d.monthly && !d.yearly) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const now = p.householdIncome != null ? Math.round(p.householdIncome / 12) : 0;
  const total = now + d.monthly;
  const chunks = [
    ...(now && d.monthly ? [{ name: 'Lo que ya entra', figure: now, color: 'var(--linea)', already: true }] : []),
    ...d.parts.map((x, i) => ({ name: BY_ID[x.id].name, figure: x.monthly, color: COLORS[i % COLORS.length] })),
  ];
  document.getElementById('dinero-total').innerHTML = d.monthly
    ? `Hasta <strong>${euros(d.monthly)} más al mes</strong>${now ? `: de ${euros(now)} a unos ${euros(total)}` : ''}${d.yearly ? `, y <strong>${euros(d.yearly)} al año</strong> en pagos y deducciones` : ''}.`
    : `<strong>${euros(d.yearly)} al año</strong> en pagos y deducciones.`;
  const bar = document.getElementById('dinero-barra');
  bar.hidden = !d.monthly;
  bar.setAttribute('aria-label', chunks.map((t) => `${t.name}: ${euros(t.figure)} al mes`).join('. '));
  bar.innerHTML = chunks.map((t) => `<span style="flex:${t.figure} 1 0;background:${t.color}"${t.already ? ' class="ya"' : ''}></span>`).join('');
  document.getElementById('dinero-leyenda').innerHTML = [
    ...chunks.map((t) => `<li><i style="background:${t.color}"></i>${esc(t.name)} <strong>${euros(t.figure)}</strong><small>al mes</small></li>`),
    ...d.perYear.map((x) => `<li><i class="anual"></i>${esc(BY_ID[x.id].name)} <strong>${euros(x.yearly)}</strong><small>al año</small></li>`),
  ].join('');
}

// Abrir una ayuda desde «Por dónde empezar»
document.getElementById('empezar-lista').addEventListener('click', (e) => {
  const a = e.target.closest('[data-open-page]');
  if (!a) return;
  const d = document.querySelector(`#ayuda-${a.dataset.openPage} details`);
  if (d) d.open = true;
});

// Seguimiento: cómo va cada ayuda
list.addEventListener('change', (e) => {
  const s = e.target.closest('[data-track]');
  if (!s) return;
  if (s.value) tracking[s.dataset.track] = s.value;
  else delete tracking[s.dataset.track];
  save();
  render();
  document.querySelector(`#ayuda-${s.dataset.track} details`)?.setAttribute('open', '');
});

for (const b of document.querySelectorAll('[data-active-filter]')) {
  b.addEventListener('click', () => {
    activeFilter = b.dataset.activeFilter;
    document.querySelectorAll('[data-active-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
}

document.getElementById('cambiar').addEventListener('click', () => goTo(1));
document.getElementById('imprimir').addEventListener('click', () => print());
document.getElementById('compartir').addEventListener('click', () => {
  const p = readProfile();
  const ids = whereToStart(evaluate(p), 99).concat(evaluate(p)).map((r) => r.id).filter((id, i, a) => a.indexOf(id) === i);
  if (ids.length) share(ids);
});
const resultIds = () => {
  const r = evaluate(readProfile());
  return whereToStart(r, 99).concat(r).map((x) => x.id).filter((id, i, a) => a.indexOf(id) === i);
};
document.getElementById('calendario').addEventListener('click', () => downloadCalendar(resultIds()));

// Guardar en un enlace: las respuestas van dentro del enlace (después de #), que no llega a ningún servidor
const linkStatus = document.getElementById('enlace-estado');
document.getElementById('enlace-respuestas').addEventListener('click', async () => {
  const url = `${location.origin}${location.pathname}#r=${toLink(answers())}`;
  try {
    await navigator.clipboard.writeText(url);
    linkStatus.textContent = 'Enlace copiado. Guárdalo en tus notas o mándatelo. Quien lo abra verá tus respuestas.';
  } catch {
    linkStatus.innerHTML = `Copia este enlace y guárdalo: <a href="${esc(url)}">enlace con tus respuestas</a>.`;
  }
});

// Modo profesional: para servicios sociales y entidades que orientan a varias personas
const PRO = 'pro' in document.documentElement.dataset;
const box = document.getElementById('pro');
if (PRO) {
  box.hidden = false;
  const header = () => {
    const ref = document.getElementById('pro-ref').value.trim();
    document.getElementById('pro-cabecera').textContent = `Orientación sobre ayudas · ${new Date().toLocaleDateString('es-ES')}${ref ? ` · Caso ${ref}` : ''} · ayudas.bendi.dev`;
  };
  document.getElementById('pro-ref').addEventListener('input', header);
  header();
}

document.getElementById('borrar').addEventListener('click', () => {
  if (PRO) {
    document.getElementById('pro-ref').value = '';
    document.getElementById('pro-notas').value = '';
  }
  linkStatus.textContent = '';
  form.reset();
  peopleBox.replaceChildren();
  singleParentTouched = false;
  visited = new Set([1]);
  tracking = {};
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TRACKING_KEY);
  } catch {}
  results.hidden = true;
  updateConditions();
  goTo(1);
});
// Al imprimir, todas las ayudas abiertas
addEventListener('beforeprint', () => results.querySelectorAll('details').forEach((d) => (d.open = true)));

// ── Recordar respuestas (solo si se marca) ──────────────────────────────
function answers() {
  const data = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'radio') {
      if (el.checked) data[el.name] = el.value;
    } else if (el.type === 'checkbox') data[el.name] = el.checked;
    else data[el.name] = el.value;
  }
  return data;
}

function fill(data) {
  form.reset();
  peopleBox.replaceChildren();
  if (data.caredForCount) {
    form.caredForCount.value = data.caredForCount;
    adjustPeople();
  }
  for (const [name, v] of Object.entries(data)) {
    const field = form.elements[name];
    if (!field) continue;
    if (field instanceof RadioNodeList) {
      for (const r of field) r.checked = r.value === v;
    } else if (field.type === 'checkbox') field.checked = Boolean(v);
    else field.value = v;
  }
  singleParentTouched = 'singleParent' in data;
  updateConditions();
}

function save() {
  try {
    if (remember.checked) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers()));
      localStorage.setItem(TRACKING_KEY, JSON.stringify(tracking));
    }
  } catch {}
}

remember.addEventListener('change', () => {
  try {
    if (remember.checked) save();
    else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TRACKING_KEY);
    }
  } catch {}
});

// ── Ejemplos ────────────────────────────────────────────────────────────
const EXAMPLES = {
  familia: { age: '29', region: 'madrid', madridCity: 'si', residence: 'si', situation: 'cuenta-ajena', partner: 'si', adults: '2', 'children-age3to5': '1', baby: true, householdIncome: '28.000', wealth: 'bajo', housing: 'alquiler' },
  jubilada: { age: '74', region: 'madrid', madridCity: 'si', residence: 'si', 'u-soledad': true, situation: 'pensionista', partner: 'no', adults: '1', widowed: true, householdIncome: '10.500', wealth: 'bajo', housing: 'propia', pension: 'viudedad', pensionMonthly: '720', pensionSince2021: 'si', childrenBorn: '3' },
  cuidador: {
    age: '52', region: 'castilla-leon', residence: 'si', situation: 'cuenta-ajena', partner: 'si', adults: '3', 'children-age6to17': '1', householdIncome: '38.000', ownIncome: '21.000', housing: 'hipoteca',
    caredForCount: '1', 'p1-relacion': 'padre', 'p1-edad': '84', 'p1-discapacidad': '65', 'p1-dependencia': '2', 'p1-convive': true, 'p1-cuidoYo': true,
  },
  paro: { age: '55', region: 'valencia', residence: 'si', 'u-food': true, situation: 'paro-sin', partner: 'si', adults: '2', householdIncome: '9.000', ownIncome: '0', wealth: 'bajo', housing: 'alquiler', contributed15: 'si', contributedOneYear: 'no' },
};

for (const b of document.querySelectorAll('[data-example]')) {
  b.addEventListener('click', () => {
    fill(EXAMPLES[b.dataset.example]);
    visited = new Set([1, 2, 3, 4, 5, 6]);
    goTo(1, { focus: false });
    showResults();
  });
}

// ── Necesito ayuda hoy ──────────────────────────────────────────────────
function renderPhones() {
  const madrid = form.region.value === 'madrid';
  const keys = ['emergencias', 'violencia', 'crisis', 'cruzRoja', ...(madrid ? ['madrid012', 'linea010', 'mayoresMadrid'] : []), 'imv'];
  document.getElementById('telefonos-hoy').innerHTML = keys.map(phoneButton).join('');
}
form.region.addEventListener('change', renderPhones);

// ── Arranque ────────────────────────────────────────────────────────────
try {
  const savedAnswers = localStorage.getItem(STORAGE_KEY);
  if (savedAnswers) {
    fill(JSON.parse(savedAnswers));
    tracking = JSON.parse(localStorage.getItem(TRACKING_KEY) ?? '{}');
    remember.checked = true;
  }
} catch {}
// Si se abre un enlace con respuestas (#r=…), se rellenan y se quitan de la barra de direcciones
const fromLinkAnswers = location.hash.startsWith('#r=') ? fromLink(location.hash.slice(3)) : null;
if (fromLinkAnswers) {
  fill(fromLinkAnswers);
  history.replaceState(null, '', location.pathname + location.search);
}
updateConditions();
renderPhones();
renderHistory(document.getElementById('evolucion'));
document.getElementById('n-ayudas').textContent = BENEFITS.length;
for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = icon(el.dataset.icon);
goTo(1, { focus: false });
if (fromLinkAnswers) {
  visited = new Set([1, 2, 3, 4, 5, 6]);
  showResults();
}
