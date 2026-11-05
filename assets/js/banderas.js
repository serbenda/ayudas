// Banderas sencillas (SVG) para la lista de idiomas. Son decorativas: el nombre del idioma va siempre escrito.
// España, Cataluña (senyera), Comunitat Valenciana (senyera con franja azul), Galicia, Euskadi (ikurriña) e inglés (Reino Unido).

const svg = (vista, cuerpo) => `<svg class="bandera" viewBox="${vista}" aria-hidden="true" focusable="false">${cuerpo}</svg>`;
const franjas = [1, 3, 5, 7].map((i) => `<rect y="${((20 / 9) * i).toFixed(2)}" width="30" height="2.22" fill="#da121a"/>`).join('');

export const BANDERAS = {
  es: svg('0 0 30 20', '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>'),
  ca: svg('0 0 30 20', `<rect width="30" height="20" fill="#fcdd09"/>${franjas}`),
  va: svg('0 0 30 20', `<rect width="30" height="20" fill="#fcdd09"/>${franjas}<rect width="7.5" height="20" fill="#0073cf"/>`),
  gl: svg('0 0 30 20', '<rect width="30" height="20" fill="#fff"/><path d="M0 0h4.6L30 16.6V20h-4.6L0 3.4Z" fill="#0099cc"/>'),
  eu: svg('0 0 30 20', '<rect width="30" height="20" fill="#d52b1e"/><path d="M0 0 30 20M30 0 0 20" stroke="#009b48" stroke-width="3"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="3"/>'),
  en: svg('0 0 60 40', '<rect width="60" height="40" fill="#012169"/><path d="M0 0 60 40M60 0 0 40" stroke="#fff" stroke-width="8"/><path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" stroke-width="3"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/><path d="M30 0v40M0 20h60" stroke="#c8102e" stroke-width="7"/>'),
};

// code de la página, lang del enlace y nombre en su propia lengua
export const LISTA_IDIOMAS = [
  ['es', 'es', 'Español'],
  ['ca', 'ca', 'Català'],
  ['va', 'ca-ES-valencia', 'Valencià'],
  ['gl', 'gl', 'Galego'],
  ['eu', 'eu', 'Euskara'],
  ['en', 'en', 'English'],
];

/** Lista de idiomas con bandera. `base` es el prefijo de las rutas ('', '../' o '/'); `actual` el código de la página. */
export function enlacesIdiomas(base, actual = 'es') {
  return `<ul class="idiomas-lista">${LISTA_IDIOMAS.map(([c, lang, nombre]) => {
    const href = c === 'es' ? base || './' : `${base}${c}/`;
    const aqui = c === actual ? ' aria-current="page"' : '';
    return `<li><a href="${href}" hreflang="${lang}" lang="${lang}"${aqui}>${BANDERAS[c]}<span>${nombre}</span></a></li>`;
  }).join('')}</ul>`;
}
