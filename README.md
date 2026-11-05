<div align="center">

<a href="https://ayudas.bendi.dev/"><img src="assets/img/favicon.svg" width="112" alt="Logo de ayudas: un salvavidas"></a>

# ayudas

**Qué ayudas públicas te pueden corresponder en España, contestando unas preguntas.**<br>
Familia, mayores, pensiones, discapacidad, dependencia, vivienda, paro y deducciones. Sin registro, sin cookies y sin que tus respuestas salgan del navegador.

[![Abrir la web](https://img.shields.io/badge/abrir_la_web-ayudas.bendi.dev-1f6b68?style=for-the-badge)](https://ayudas.bendi.dev/)

[![Publicación](https://github.com/serbenda/ayudas/actions/workflows/publicar.yml/badge.svg)](https://github.com/serbenda/ayudas/actions/workflows/publicar.yml)
![Sin dependencias](https://img.shields.io/badge/dependencias-0-1f6b68)
![Sin cookies](https://img.shields.io/badge/cookies-0-1f6b68)
[![Apoya en GitHub Sponsors](https://img.shields.io/badge/apoya-GitHub_Sponsors-bf3989?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/serbenda)
[![Todos los derechos reservados](https://img.shields.io/badge/licencia-todos_los_derechos_reservados-1c2230)](LICENSE)

</div>

---

## Índice

1. [Qué es](#qué-es)
2. [Las páginas](#las-páginas)
3. [Qué ayudas recoge](#qué-ayudas-recoge)
4. [Cómo se decide qué te sale](#cómo-se-decide-qué-te-sale)
5. [Las cifras y de dónde salen](#las-cifras-y-de-dónde-salen)
6. [Privacidad](#privacidad)
7. [Cómo está hecha](#cómo-está-hecha)
8. [Cómo se publica](#cómo-se-publica)
9. [Mantenerla al día](#mantenerla-al-día)

## Qué es

Mucha gente no pide ayudas a las que tiene derecho porque no sabe que existen o no sabe si cumple. **ayudas** hace unas preguntas sencillas (edad, quién vive en casa, ingresos, vivienda, discapacidad, dependencia, pensión, trabajo) y enseña las ayudas que te pueden corresponder, con:

- **por qué te sale** cada una, con tus propios datos;
- **qué falta comprobar** (una convocatoria, el límite exacto de tu comunidad, la cotización…);
- **cuánto da en 2026** y, cuando se puede, una estimación para tu caso;
- **dónde se pide**, con enlace a la sede oficial (o a la web de tu comunidad cuando la gestiona ella).

Es hermana de [hucha](https://github.com/serbenda/hucha) (a dónde va el dinero público) y comparte su estilo.

## Las páginas

| Página | Qué hay |
| --- | --- |
| **Tus ayudas** (`/`) | Cuestionario en 6 pasos y la lista de ayudas que te salen, con **por dónde empezar**, los **papeles** que necesitas juntos, el seguimiento de cada ayuda y una **hoja para imprimir**. Accesos por tema, botón «Necesito ayuda hoy» con teléfonos y un gráfico de cómo han subido las ayudas desde 2018. |
| **Mayores** (`/mayores/`) | Para personas mayores o con poca soltura con el móvil: una pregunta cada vez, botones grandes, frases cortas, **lectura en voz alta** y los pasos de cada ayuda explicados. |
| **Todas las ayudas** (`/catalogo/`) | Todas las fichas, con buscador (sin tildes) y filtro por tema. Elige tu comunidad y los enlaces apuntan a su web. |
| **Fuentes** (`/fuentes/`) | Cómo funciona, la tabla de cifras de 2026 con su fuente, dónde se piden las ayudas y cómo avisar de un error. |

## Qué ayudas recoge

58 fichas en ocho temas. Cada una explica **cómo se pide paso a paso** (dónde, a quién llamar, qué papeles, cuánto tardan y qué hacer si dicen que no), con los pasos de la Comunidad de Madrid cuando son distintos. Los trámites están en [`assets/js/tramites.js`](assets/js/tramites.js) y los teléfonos, papeles y palabras difíciles en [`assets/js/guia.js`](assets/js/guia.js).

- **Si lo necesitas ya:** emergencia social, comida, violencia de género (016), desahucio, sin hogar, soledad y sanidad sin papeles.
- **Comunidad y Ayuntamiento de Madrid:** RMI, Tarjeta Familias, agua de Canal de Isabel II, vivienda social, escuelas infantiles gratis, teleasistencia (900 111 065), transporte gratis desde 65 años.

- **Ingresos y prestaciones:** Ingreso Mínimo Vital, renta mínima autonómica, paro, subsidio por desempleo, subsidio para mayores de 52.
- **Hijos y familia:** complemento de ayuda para la infancia, prestación por nacimiento (19 semanas), subsidio y pago único por nacimiento, ayuda a la natalidad de la Comunidad de Madrid, título de familia numerosa, cuidado de menores con enfermedad grave, escuela infantil y ayudas escolares, orfandad.
- **Mayores y pensiones:** pensión no contributiva, complemento a mínimos, complemento de brecha de género, jubilación, viudedad, viajes y balnearios del IMSERSO, teleasistencia y ayuda a domicilio.
- **Discapacidad y dependencia:** reconocimiento de la dependencia, prestación por cuidados en el entorno familiar, servicios de la dependencia, cotización gratis para cuidadores, certificado de discapacidad, asignación por hijo a cargo, PNC de invalidez, ventajas fiscales y de aparcamiento.
- **Vivienda y suministros:** bono social de la luz y térmico, ayuda al alquiler (general y para jóvenes), complemento de alquiler para PNC.
- **Deducciones en la renta:** maternidad y guardería, familia numerosa, monoparental, familiar con discapacidad, mínimo por discapacidad, deducciones autonómicas.
- **Otras:** becas y abogado de oficio gratuito.

## Cómo se decide qué te sale

Cada ayuda tiene una regla en [`assets/js/reglas.js`](assets/js/reglas.js) (funciones puras, sin DOM) que devuelve:

- **Cumples lo principal** (`si`): con lo contestado encajas en los requisitos clave.
- **Mira si cumples** (`quizas`): puede corresponderte, pero depende de algo no preguntado o no contestado.
- nada, si no encaja.

Algunos cálculos que hace:

- **Renta garantizada del IMV** según el hogar: 733,60 € un adulto, +30 % por persona (hasta el 220 %) y +22 % si es monoparental o hay discapacidad ≥ 65 % o dependencia de grado III. El IMV estimado es la renta garantizada menos los ingresos del hogar.
- **Límite del bono social**: 1,5 veces el IPREM (14 pagas), +0,5 por cada menor (hasta dos) y +0,5 con discapacidad, dependencia de grado II o III o familia monoparental. Severo por debajo de la mitad.
- **Pensión mínima** que te toca según tipo, edad y cónyuge, y el complemento hasta llegar a ella.
- **Brecha de género**: 36,90 € por hijo (hasta 4) si la pensión empezó en 2021 o después.

Si no tienes papeles, no salen las ayudas que piden residencia legal, pero sí las que no (médico, padrón, comida, emergencia). Lo urgente sale siempre primero en «Por dónde empezar».

**Modo fácil:** el botón «Letra grande y fácil» agranda la letra y cambia los resúmenes por frases muy cortas. Las palabras difíciles (IPREM, PIA, Cl@ve…) se explican en cada ficha.

Las preguntas que no aplican se esconden (por ejemplo, la de familia monoparental solo sale si no vives en pareja y tienes hijos).

## Las cifras y de dónde salen

Todas las cifras están en un único sitio, [`assets/js/cifras.js`](assets/js/cifras.js), con su fuente al lado. Si cambia una (la revalorización de pensiones, el SMI, el IPREM…), se cambia ahí y se actualiza en todas las fichas y reglas.

| Cifra 2026 | Valor | Fuente |
| --- | --- | --- |
| IPREM | 600 €/mes · 8.400 €/año | Prorrogado desde los Presupuestos de 2023 |
| Salario mínimo | 1.221 €/mes · 17.094 €/año | Real Decreto 126/2026 |
| Revalorización de pensiones | +2,7 % · mínimas +7 % · PNC e IMV +11,4 % | La Moncloa |
| Pensión no contributiva | 8.803,20 €/año | La Moncloa, IMSERSO |
| Subsidio por desempleo | 570 / 540 / 480 €/mes | SEPE |
| Bono social de la luz | 42,5 % / 57,5 % | MITECO (vuelve al 35 % / 50 % en 2027 si no se prorroga) |
| Alquiler joven | hasta 300 €/mes | Plan Estatal de Vivienda 2026-2030 |

## Accesibilidad

- **Letra grande y fácil**, **alto contraste** y **escuchar** (lectura en voz alta) en todas las páginas.
- Se instala en el móvil como una app y funciona sin conexión.
- **Enviar a un familiar**: manda solo la lista de ayudas y un enlace con los pasos (`/catalogo/?ver=…`), nunca las respuestas.
- Pasos propios para la Comunidad de Madrid, Andalucía, Cataluña y la Comunitat Valenciana en las ayudas que gestionan ellas.

## Privacidad

- Las reglas se ejecutan en el navegador. **No hay servidor que reciba las respuestas.**
- Solo se guardan en el navegador (`localStorage`) si se marca «Recordar mis respuestas»; «Empezar de cero» las borra.
- Las visitas se cuentan con GoatCounter, sin cookies, como `/ayudas/…` en el mismo panel que el resto de webs de bendi.dev. Nunca se cuentan las respuestas.

## Cómo está hecha

HTML, CSS y JavaScript sin frameworks ni dependencias. La fuente (Archivo) se sirve desde la propia web.

```
index.html            Cuestionario y resultados
catalogo/index.html   Todas las ayudas
fuentes/index.html    Fuentes y condiciones
assets/js/cifras.js   Cifras de 2026 y sus fuentes
assets/js/ayudas.js   Catálogo: qué es, cuánto da, requisitos y dónde se pide
assets/js/reglas.js   Reglas: qué te sale con tus respuestas
assets/js/portada.js  Cuestionario por pasos
tests/                Tests de las reglas (node --test)
scripts/enlaces.mjs   Comprueba que los enlaces oficiales siguen vivos
```

Para verla en local:

```sh
npm test       # tests de las reglas
npm run dev    # sirve la web en local
```

## Cómo se publica

La Action [`publicar.yml`](.github/workflows/publicar.yml):

1. En cada **PR a `main`**: pasa los tests de reglas y los de navegador (axe WCAG 2.2 AA, sin desbordar, sin errores) en móvil, tablet y ordenador, claro, oscuro y alto contraste.
2. En cada **push a `main`**: además, la publica en GitHub Pages, con la fuente incluida y una versión en cada CSS/JS para que nadie mezcle ficheros nuevos y viejos.
3. **Cada lunes**: comprueba los enlaces oficiales (issue si alguno se rompe) y **mira el BOE de la semana**: si sale algo sobre pensiones, SMI, IPREM, IMV, bono social, dependencia, paro, vivienda o copago, abre un issue para revisar las cifras.

Se trabaja en la rama `development` y se lleva a `main` con una PR.

## Mantenerla al día

- **Enero**: revalorización de pensiones, IMV y PNC; SMI cuando se publique.
- **Cuando haya Presupuestos**: IPREM.
- **Antes de 2027**: descuentos del bono social, edad de jubilación (67 años) y la posible prestación universal por crianza, que en 2026 **no** está aprobada.
- Si alguien avisa de un error o de una ayuda que falta, llega como issue desde la página de Fuentes.

---

<sub>Web informativa, no vinculada a ninguna administración. Quien decide si te corresponde una ayuda es el organismo que la gestiona.</sub>
