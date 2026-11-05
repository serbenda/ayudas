// Simple flags (SVG) for the language list. They are decorative: the language name is always written.
// Spain, Catalonia (senyera), Valencian Community (senyera with a blue stripe), Galicia, Basque Country (ikurriña) and English (United Kingdom).

const svg = (view, body) => `<svg class="flag" viewBox="${view}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${body}</svg>`;
const stripes = [1, 3, 5, 7].map((i) => `<rect y="${((20 / 9) * i).toFixed(2)}" width="30" height="2.22" fill="#da121a"/>`).join('');

export const FLAGS = {
  es: svg('0 0 30 20', '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>'),
  ca: svg('0 0 30 20', `<rect width="30" height="20" fill="#fcdd09"/>${stripes}`),
  va: svg('0 0 30 20', `<rect width="30" height="20" fill="#fcdd09"/>${stripes}<rect width="10.5" height="20" fill="#0073cf"/>`),
  gl: svg('0 0 30 20', '<rect width="30" height="20" fill="#fff"/><path d="M0 0h4.6L30 16.6V20h-4.6L0 3.4Z" fill="#0099cc"/>'),
  eu: svg('0 0 30 20', '<rect width="30" height="20" fill="#d52b1e"/><path d="M0 0 30 20M30 0 0 20" stroke="#009b48" stroke-width="3"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="3"/>'),
  en: svg('0 0 60 40', '<rect width="60" height="40" fill="#012169"/><path d="M0 0 60 40M60 0 0 40" stroke="#fff" stroke-width="8"/><path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" stroke-width="3"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/><path d="M30 0v40M0 20h60" stroke="#c8102e" stroke-width="7"/>'),
};

// page code, link lang and name in its own language
export const LANGUAGE_LIST = [
  ['es', 'es', 'Español'],
  ['ca', 'ca', 'Català'],
  ['va', 'ca-ES-valencia', 'Valencià'],
  ['gl', 'gl', 'Galego'],
  ['eu', 'eu', 'Euskara'],
  ['en', 'en', 'English'],
];

const href = (base, c) => (c === 'es' ? base || './' : `${base}${c}/`);

/** Language list with flags (footer). `base` is the route prefix ('', '../' or '/'); `current` is the page's code.*/
export function languageLinks(base, current = 'es') {
  return `<ul class="languages-list">${LANGUAGE_LIST.map(([c, lang, name]) => {
    const here = c === current ? ' aria-current="page"' : '';
    return `<li><a href="${href(base, c)}" hreflang="${lang}" lang="${lang}"${here}>${FLAGS[c]}<span>${name}</span></a></li>`;
  }).join('')}</ul>`;
}

/** Language selector in the top bar: a button with the current language's flag and a menu with the others*/
export function languageSelector(base, current = 'es', label = 'Idioma') {
  const [, , currentName] = LANGUAGE_LIST.find(([c]) => c === current) ?? LANGUAGE_LIST[0];
  return `<details class="language-setting">
      <summary class="button secondary" aria-label="${label}: ${currentName}">${FLAGS[current]}<span>${currentName}</span></summary>
      <ul class="language-setting-panel">${LANGUAGE_LIST.map(([c, lang, name]) => `<li><a href="${href(base, c)}" hreflang="${lang}" lang="${lang}"${c === current ? ' aria-current="page"' : ''}>${FLAGS[c]}<span>${name}</span></a></li>`).join('')}</ul>
    </details>`;
}
