// Page for older people: one question at a time, big buttons, short sentences and reading aloud.
// Uses the same rules as the rest of the site. Nothing leaves the browser.

import { evaluate, emptyProfile, whereToStart } from '../lib/rules.js';
import { BY_ID, REGIONS } from '../data/benefits.js';
import { procedureOf, papersFor } from '../data/procedures.js';
import { DOCUMENTS, markTerms } from '../data/guide.js';
import { icon } from '../data/icons.js';
import { phoneButton, esc, exampleBox } from '../ui/card.js';
import { speak, canSpeak } from '../lib/voice.js';
import { share } from '../ui/share.js';

const box = document.getElementById('assistant');
const result = document.getElementById('result');
const answers = {};
let registerHistory = [];

// ── The questions ──────────────────────────────────────────────────────
// Each one: text, help (optional), options [text, value] and when it is asked (showIf)
const QUESTIONS = [
  {
    id: 'age',
    text: '¿Cuántos años tienes?',
    options: [
      ['Menos de 60', 55],
      ['De 60 a 64', 62],
      ['De 65 a 79', 72],
      ['80 o más', 85],
    ],
  },
  {
    id: 'where',
    text: '¿Dónde vives?',
    options: [
      ['En la ciudad de Madrid', 'capital'],
      ['En otro pueblo de la Comunidad de Madrid', 'madrid'],
      ['En otra comunidad', 'otra'],
    ],
  },
  { id: 'region', text: '¿En qué comunidad vives?', type: 'list', showIf: (r) => r.where === 'otra' },
  {
    id: 'livingWith',
    text: '¿Con quién vives?',
    options: [
      ['Vivo solo o sola', 'solo'],
      ['Con mi pareja', 'pareja'],
      ['Con otros familiares', 'familia'],
    ],
  },
  {
    id: 'pension',
    text: '¿Cobras alguna pensión?',
    options: [
      ['Sí, de jubilación', 'jubilacion'],
      ['Sí, de viudedad', 'viudedad'],
      ['Sí, de incapacidad', 'incapacidad'],
      ['Sí, no contributiva', 'pnc'],
      ['No cobro pensión', 'no'],
    ],
  },
  {
    id: 'pensionMonthly',
    text: '¿Cuánto cobras de pensión al mes, más o menos?',
    help: 'Lo pone en la carta de la Seguridad Social o en tu banco.',
    showIf: (r) => ['jubilacion', 'viudedad', 'incapacidad'].includes(r.pension),
    options: [
      ['Menos de 700 €', 650],
      ['De 700 a 900 €', 800],
      ['De 900 a 1.100 €', 1000],
      ['De 1.100 a 1.500 €', 1300],
      ['Más de 1.500 €', 1800],
      ['No lo sé', null],
    ],
  },
  {
    id: 'since2021',
    text: '¿Empezaste a cobrar la pensión en 2021 o después?',
    showIf: (r) => ['jubilacion', 'viudedad', 'incapacidad'].includes(r.pension),
    options: [
      ['Sí', true],
      ['No, antes', false],
      ['No lo sé', null],
    ],
  },
  {
    id: 'children',
    text: '¿Cuántos hijos has tenido?',
    showIf: (r) => ['jubilacion', 'viudedad', 'incapacidad'].includes(r.pension),
    options: [
      ['Ninguno', 0],
      ['1', 1],
      ['2', 2],
      ['3', 3],
      ['4 o más', 4],
    ],
  },
  {
    id: 'income',
    text: '¿Tienes algún dinero que te entre cada mes?',
    showIf: (r) => r.pension === 'no',
    options: [
      ['No, nada', 0],
      ['Menos de 500 € al mes', 4000],
      ['Más de 500 € al mes', 9000],
      ['No lo sé', null],
    ],
  },
  {
    id: 'household',
    text: '¿Cuánto dinero entra en casa al mes, entre todos?',
    help: 'Suma pensiones, sueldos y otras ayudas de las personas que viven contigo.',
    showIf: (r) => r.livingWith !== 'solo',
    options: [
      ['Menos de 800 €', 700 * 12],
      ['De 800 a 1.200 €', 1000 * 12],
      ['De 1.200 a 2.000 €', 1600 * 12],
      ['Más de 2.000 €', 2500 * 12],
      ['No lo sé', null],
    ],
  },
  {
    id: 'widowed',
    text: '¿Ha fallecido tu marido, tu mujer o tu pareja?',
    showIf: (r) => r.pension !== 'viudedad' && r.livingWith !== 'pareja',
    options: [
      ['Sí', true],
      ['No', false],
    ],
  },
  {
    id: 'dailyHelp',
    text: '¿Necesitas ayuda de otra persona para asearte, vestirte o comer?',
    options: [
      ['No', 'no'],
      ['Sí, pero no lo he pedido', 'necesita'],
      ['Lo he pedido y estoy esperando', 'tramite'],
      ['Sí, ya tengo el grado de dependencia', 'grado'],
    ],
  },
  {
    id: 'grade',
    text: '¿Qué grado de dependencia tienes?',
    showIf: (r) => r.dailyHelp === 'grado',
    options: [
      ['Grado I', '1'],
      ['Grado II', '2'],
      ['Grado III', '3'],
      ['No me acuerdo', '1'],
    ],
  },
  {
    id: 'disability',
    text: '¿Tienes certificado de discapacidad?',
    options: [
      ['No', 'no'],
      ['No, pero tengo problemas de salud que me limitan', 'sin'],
      ['Sí, de menos del 65 %', '33'],
      ['Sí, del 65 % o más', '65'],
    ],
  },
  {
    id: 'youCare',
    text: '¿Cuidas de alguien de tu familia que necesita ayuda?',
    options: [
      ['No', 'no'],
      ['Sí, a mi pareja', 'pareja'],
      ['Sí, a un hijo o hija', 'hijo'],
      ['Sí, a otra persona', 'otro'],
    ],
  },
  {
    id: 'careGrade',
    text: '¿Esa persona tiene la dependencia reconocida?',
    showIf: (r) => r.youCare && r.youCare !== 'no',
    options: [
      ['Sí', '2'],
      ['No', 'necesita'],
      ['Lo hemos pedido', 'tramite'],
    ],
  },
  {
    id: 'housing',
    text: '¿Tu casa es de alquiler?',
    options: [
      ['Sí, pago alquiler', 'alquiler'],
      ['No, es mía', 'propia'],
      ['Otra situación', 'otra'],
    ],
  },
  {
    id: 'reaches',
    text: '¿Te llega el dinero para comer y pagar la luz?',
    options: [
      ['Sí', 'si'],
      ['Justo', 'justo'],
      ['No', 'no'],
    ],
  },
  {
    id: 'soledad',
    text: '¿Te sientes solo o sola a menudo?',
    options: [
      ['Sí', true],
      ['A veces', false],
      ['No', false],
    ],
  },
];

const activeQuestions = () => QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));

// ── Reading aloud ──────────────────────────────────────────────────────
function read(text) {
  speak(text, { lang: 'es' });
}
const listenButton = (id) => (canSpeak ? `<button type="button" class="listen" data-listen="${id}">${icon('altavoz')} Escuchar</button>` : '');

// ── Drawing a question ─────────────────────────────────────────────────
function showQuestion(i) {
  const list = activeQuestions();
  const q = list[i];
  if (!q) return showResult();
  const n = i + 1;
  const total = list.length;
  const options =
    q.type === 'list'
      ? `<div class="options-large">${REGIONS.filter((c) => c.id !== 'madrid')
          .map((c) => `<button type="button" class="option-large" data-field-value="${c.id}">${esc(c.name)}</button>`)
          .join('')}</div>`
      : `<div class="options-large">${q.options.map(([t], k) => `<button type="button" class="option-large" data-position="${k}">${esc(t)}</button>`).join('')}</div>`;
  box.innerHTML = `
    <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${n}" aria-label="Pregunta ${n} de ${total}">
      <span>Pregunta ${n} de ${total}</span>
      <div class="progress-bar"><i style="width:${Math.round((n / total) * 100)}%"></i></div>
    </div>
    <h2 class="question-large" id="question" tabindex="-1">${esc(q.text)}</h2>
    ${q.help ? `<p class="question-help">${esc(q.help)}</p>` : ''}
    ${listenButton('pregunta')}
    ${options}
    <div class="browse">
      ${i > 0 ? '<button type="button" class="button secondary large" data-back>← Volver</button>' : ''}
      <button type="button" class="button text" data-skip>No quiero contestar</button>
    </div>`;
  box.dataset.position = i;
  box.dataset.text = [q.text, q.help ?? '', ...(q.options ?? []).map(([t]) => t)].join('. ');
  document.getElementById('question').focus({ preventScroll: false });
}

box.addEventListener('click', (e) => {
  const i = Number(box.dataset.position);
  const q = activeQuestions()[i];
  const b = e.target.closest('button');
  if (!b || !q) return;
  if (b.dataset.listen) return read(box.dataset.text);
  if ('volver' in b.dataset) {
    const previous = registerHistory.pop() ?? 0;
    return showQuestion(previous);
  }
  if ('saltar' in b.dataset) {
    delete answers[q.id];
  } else if (b.dataset.fieldValue !== undefined) {
    answers[q.id] = b.dataset.fieldValue;
  } else if (b.dataset.position !== undefined) {
    answers[q.id] = q.options[Number(b.dataset.position)][1];
  } else return;
  registerHistory.push(i);
  // Questions that no longer apply are cleared (for example, if you change the pension)
  const ids = new Set(activeQuestions().map((x) => x.id));
  for (const k of Object.keys(answers)) if (!ids.has(k)) delete answers[k];
  const next = activeQuestions().findIndex((x) => x.id === q.id) + 1;
  showQuestion(next);
});

// ── From the answers to the rules profile ──────────────────────────────
function profile() {
  const r = answers;
  const p = emptyProfile();
  p.age = r.age ?? null;
  p.region = r.where === 'capital' || r.where === 'madrid' ? 'madrid' : (r.region ?? null);
  p.madridCity = r.where === 'capital' ? true : r.where === 'madrid' ? false : null;
  p.partner = r.livingWith === 'pareja';
  p.adults = r.livingWith === 'solo' ? 1 : 2;
  p.situation = r.pension && r.pension !== 'no' ? 'pensionista' : null;
  p.pension = r.pension ?? 'no';
  p.pensionMonthly = r.pensionMonthly ?? null;
  p.pensionSince2021 = r.since2021 ?? null;
  p.childrenBorn = r.children ?? 0;
  p.widowed = r.pension === 'viudedad' || r.widowed === true;
  const ownItems = p.pension === 'no' ? (r.income ?? null) : p.pensionMonthly != null ? p.pensionMonthly * 14 : null;
  p.ownIncome = ownItems;
  p.householdIncome = r.livingWith === 'solo' ? ownItems : (r.household ?? null);
  p.dependency = r.dailyHelp === 'grado' ? (r.grade ?? '1') : (r.dailyHelp ?? 'no');
  p.disability = r.disability ?? 'no';
  p.housing = r.housing ?? null;
  if (r.youCare && r.youCare !== 'no') {
    p.caredFor = [{ relationship: r.youCare, age: r.youCare === 'pareja' ? p.age : null, disability: 'no', dependency: r.careGrade ?? 'necesita', livesWith: true, iCare: true }];
  }
  p.urgent = { ...p.urgent, food: r.reaches === 'no', soledad: r.soledad === true };
  return p;
}

// ── Result ─────────────────────────────────────────────────────────────
function seniorCard(r, region, number) {
  const a = BY_ID[r.id];
  const t = procedureOf(r.id, region);
  const used = new Set();
  const ex = (text) => markTerms(esc(text), used);
  return `
  <article class="senior-card${r.urgent ? ' urgent' : ''}" id="m-${r.id}">
    <h3><span class="number">${number}</span>${esc(a.name)}</h3>
    ${r.payment?.text ? `<p class="how-much">${esc(r.payment.text)}</p>` : ''}
    <ul class="sentences">${t.easy.map((f) => `<li>${ex(f)}</li>`).join('')}</ul>
    ${r.status === 'quizas' && r.check.length ? `<p class="seniors-check"><strong>Hay que comprobar:</strong> ${ex(r.check[0])}</p>` : ''}
    ${listenButton(r.id)}
    <details class="seniors-how">
      <summary>Qué tengo que hacer</summary>
      ${exampleBox(r.id)}
      <ol>${t.steps.map((p) => `<li>${ex(p)}</li>`).join('')}</ol>
      ${t.phones.length ? `<h4>Llama a</h4><div class="calls">${t.phones.map(phoneButton).join('')}</div>` : ''}
      ${t.documents.length ? `<h4>Lleva estos papeles</h4><ul class="papers">${t.documents.map((d) => `<li>${esc(DOCUMENTS[d].name)}</li>`).join('')}</ul>` : ''}
      <p><strong>Cuándo:</strong> ${ex(t.deadline)}</p>
    </details>
  </article>`;
}

function showResult() {
  const p = profile();
  const all = evaluate(p);
  const first = whereToStart(all, 99);
  const rest = all.filter((r) => !first.includes(r) && r.status === 'si');
  const maybe = all.filter((r) => !first.includes(r) && r.status === 'quizas');
  const order = [...first, ...rest, ...maybe];
  const papers = papersFor(order.map((r) => r.id)).slice(0, 8);
  const inMadrid = p.region === 'madrid';

  box.hidden = true;
  result.hidden = false;
  result.innerHTML = `
    <h2 class="question-large" id="t-result" tabindex="-1">${order.length ? `Puedes pedir ${order.length === 1 ? 'esta ayuda' : `estas ${order.length} ayudas`}` : 'No sale ninguna ayuda'}</h2>
    <p class="question-help">${order.length ? 'Empieza por la primera. Pulsa «Qué tengo que hacer» para ver los pasos.' : 'Con tus respuestas no sale ninguna. Llama a los servicios sociales de tu ayuntamiento: te orientan gratis.'}</p>
    <p class="tip">${icon('cuidados')} Puedes pedir ayuda a un familiar, a un vecino o a los servicios sociales para hacer los trámites.</p>
    <div class="senior-cards">${order.map((r, i) => seniorCard(r, p.region, i + 1)).join('')}</div>
    ${papers.length ? `<section class="seniors-block"><h3>${icon('papeles')} Papeles que conviene tener a mano</h3><ul class="papers">${papers.map(({ doc }) => `<li><strong>${esc(DOCUMENTS[doc].name)}</strong>. ${esc(DOCUMENTS[doc].benefit)}</li>`).join('')}</ul></section>` : ''}
    <section class="seniors-block"><h3>${icon('telefono')} Teléfonos que te pueden ayudar</h3>
      <div class="calls">${[...(inMadrid ? ['mayoresMadrid', 'madrid012', 'linea010'] : []), 'cruzRoja', 'infoInss', 'emergencias'].map(phoneButton).join('')}</div>
    </section>
    <div class="browse">
      <button type="button" class="button large" data-share>Enviar a un familiar</button>
      <button type="button" class="button secondary large" data-print>Imprimir para llevar</button>
      <button type="button" class="button secondary large" data-change>Cambiar respuestas</button>
      <a class="button text" href="../">Ver la versión completa</a>
    </div>
    <p class="note">Es una orientación. Quien decide es el organismo que da cada ayuda. Cifras de 2026.</p>`;
  document.getElementById('t-result').focus();
}

result.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.listen) {
    const card = document.getElementById(`m-${b.dataset.listen}`);
    const t = procedureOf(b.dataset.listen, profile().region);
    return read([BY_ID[b.dataset.listen].name, card.querySelector('.how-much')?.textContent ?? '', ...t.easy, 'Qué tengo que hacer.', ...t.steps].join('. '));
  }
  if ('compartir' in b.dataset) {
    const ids = [...result.querySelectorAll('.senior-card')].map((f) => f.id.replace(/^m-/, ''));
    return share(ids);
  }
  if ('imprimir' in b.dataset) {
    result.querySelectorAll('details').forEach((d) => (d.open = true));
    return print();
  }
  if ('cambiar' in b.dataset) {
    result.hidden = true;
    box.hidden = false;
    registerHistory = [];
    showQuestion(0);
  }
});

// ── Start-up ───────────────────────────────────────────────────────────
document.getElementById('start').addEventListener('click', () => {
  document.getElementById('welcome').hidden = true;
  box.hidden = false;
  showQuestion(0);
});
document.querySelector('[data-listen="bienvenida"]')?.addEventListener('click', () => read(document.getElementById('welcome').innerText));
if (!canSpeak) document.querySelector('[data-listen="bienvenida"]')?.remove();
