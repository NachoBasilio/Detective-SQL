'use strict';

// Tema oscuro opcional: redefine los mismos tokens que el tema claro y cumple
// los contrastes mínimos de Skills/ui-ux en los dos temas. El tema claro es
// siempre el predeterminado.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const raiz = path.join(__dirname, '..', '..');
const estilos = fs.readFileSync(path.join(raiz, 'frontend', 'css', 'estilos.css'), 'utf8');
const indice = fs.readFileSync(path.join(raiz, 'frontend', 'index.html'), 'utf8');

const BLOQUE_CLARO = /:root\s*\{([\s\S]*?)\n\}/;
const BLOQUE_OSCURO = /:root\[data-tema="oscuro"\]\s*\{([\s\S]*?)\n\}/;

function tokensDe(bloque) {
  return Object.fromEntries([...bloque.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, nombre, valor]) => [nombre, valor.trim()]));
}

const claro = tokensDe(BLOQUE_CLARO.exec(estilos)[1]);
const oscuro = tokensDe(BLOQUE_OSCURO.exec(estilos)[1]);

/** Luminancia relativa y contraste según WCAG 2.2. */
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((inicio) => Number.parseInt(hex.slice(inicio, inicio + 2), 16) / 255)
    .map((canal) => (canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const [mayor, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (mayor + 0.05) / (menor + 0.05);
}

// [texto o ícono, fondo, mínimo]. 4.5:1 para texto; 3:1 para bordes de controles, foco e indicadores.
const PARES = [
  ['texto', 'hoja', 4.5],
  ['texto', 'fondo', 4.5],
  ['texto', 'hoja-alterna', 4.5],
  ['texto', 'aviso-fondo', 4.5],
  ['texto', 'seleccion', 4.5],
  ['texto-suave', 'hoja', 4.5],
  ['texto-suave', 'fondo', 4.5],
  ['texto-suave', 'hoja-alterna', 4.5],
  ['texto-suave', 'aviso-fondo', 4.5],
  ['primario', 'hoja', 4.5],
  ['primario', 'hoja-alterna', 4.5],
  ['primario', 'fondo', 4.5],
  ['sobre-primario', 'primario', 4.5],
  ['sobre-primario', 'primario-hover', 4.5],
  ['sobre-primario', 'peligro', 4.5],
  ['sobre-primario', 'peligro-hover', 4.5],
  ['peligro', 'hoja', 4.5],
  ['exito', 'hoja', 4.5],
  ['error-texto', 'error-fondo', 4.5],
  ['error-texto', 'hoja', 4.5],
  ['aviso-texto', 'aviso-fondo', 4.5],
  ['borde-control', 'hoja', 3],
  ['borde-control', 'hoja-alterna', 3],
  ['borde-control', 'fondo', 3],
  ['foco', 'hoja', 3],
  ['foco', 'hoja-alterna', 3],
  ['foco', 'fondo', 3],
  ['primario', 'aviso-fondo', 3],
];

test('el tema oscuro redefine cada token de color y de sombra del tema claro, y ningún otro', () => {
  const temables = Object.keys(claro).filter((nombre) => /^--(color|sombra)-/.test(nombre));
  assert.ok(temables.length >= 20);
  assert.deepEqual(temables.filter((nombre) => !Object.hasOwn(oscuro, nombre)), []);
  assert.deepEqual(Object.keys(oscuro).filter((nombre) => !temables.includes(nombre)), []);
  assert.match(BLOQUE_CLARO.exec(estilos)[1], /color-scheme:\s*light;/);
  assert.match(BLOQUE_OSCURO.exec(estilos)[1], /color-scheme:\s*dark;/);
});

test('los dos temas cumplen el contraste mínimo de texto, controles y foco', () => {
  for (const [nombreTema, tokens] of [['claro', claro], ['oscuro', oscuro]]) {
    for (const [primerPlano, fondo, minimo] of PARES) {
      const a = tokens[`--color-${primerPlano}`];
      const b = tokens[`--color-${fondo}`];
      assert.match(a, /^#[0-9a-f]{6}$/i, `${nombreTema} ${primerPlano}`);
      assert.match(b, /^#[0-9a-f]{6}$/i, `${nombreTema} ${fondo}`);
      const valor = contraste(a, b);
      assert.ok(valor >= minimo, `${nombreTema}: ${primerPlano} sobre ${fondo} = ${valor.toFixed(2)}:1 (mínimo ${minimo}:1)`);
    }
  }
});

test('los colores se declaran solo en los bloques :root de los dos temas', () => {
  const reglas = estilos.replace(BLOQUE_CLARO, '').replace(BLOQUE_OSCURO, '');
  assert.doesNotMatch(reglas, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(reglas, /\b(rgba?|hsla?)\(/i);
});

test('el tema claro es el predeterminado: no se sigue prefers-color-scheme', () => {
  assert.doesNotMatch(estilos, /@media[^{]*prefers-color-scheme/);
  assert.match(indice, /<meta name="color-scheme" content="light">/);
  // El script que aplica el tema guardado va antes de la hoja de estilos para evitar un destello.
  assert.ok(indice.indexOf('js/preferencias-iniciales.js') < indice.indexOf('css/estilos.css'));
});

test('el script inicial y preferencias.js usan las mismas claves de localStorage', () => {
  const clavesDe = (archivo) => {
    const texto = fs.readFileSync(path.join(raiz, 'frontend', 'js', archivo), 'utf8');
    return [...new Set(texto.match(/'detective-sql:[\w-]+'/g))].sort();
  };
  const esperadas = ["'detective-sql:idioma'", "'detective-sql:tema'"];
  assert.deepEqual(clavesDe('preferencias.js'), esperadas);
  assert.deepEqual(clavesDe('preferencias-iniciales.js'), esperadas);
});
