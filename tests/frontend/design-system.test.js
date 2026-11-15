'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const raiz = path.join(__dirname, '..', '..');
const estilos = fs.readFileSync(path.join(raiz, 'frontend', 'css', 'estilos.css'), 'utf8');
const diseno = fs.readFileSync(path.join(raiz, 'docs', 'design.md'), 'utf8');

test('el sistema visual expone tokens reutilizables para controles y datos', () => {
  for (const token of [
    '--control-altura-minima',
    '--borde-ancho',
    '--borde-ancho-activo',
    '--ancho-tabla-estandar',
    '--ancho-tabla-evidencias',
  ]) {
    assert.match(estilos, new RegExp(`${token}:`));
  }

  assert.match(estilos, /min-height:\s*var\(--control-altura-minima\)/);
  assert.match(estilos, /min-width:\s*var\(--ancho-tabla-estandar\)/);
  assert.match(estilos, /min-width:\s*var\(--ancho-tabla-evidencias\)/);
});

test('la documentación describe los tokens y el catálogo de componentes', () => {
  assert.match(diseno, /^## Tokens reutilizables$/m);
  assert.match(diseno, /^## Componentes reutilizables$/m);
  for (const componente of ['Botones', 'Avisos', 'Fichas', 'Pestañas', 'Tablas', 'Sellos']) {
    assert.match(diseno, new RegExp(`^### ${componente}$`, 'm'));
  }
});
