const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');
const source = readFileSync(resolve(__dirname, '../src/components/ui/dialog-controller.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const loaded = { exports: {} };
runInNewContext(compiled, { exports: loaded.exports, module: loaded, Promise });
const { createDialogController } = loaded.exports;

test('cancelling a confirmation never executes its destructive action', async () => {
  const controller = createDialogController(() => {}); let writes = 0;
  const action = async () => { if (await controller.confirm('Eliminar materia')) writes++; };
  const pending = action(); controller.settle(false); await pending; assert.equal(writes, 0);
});

test('accepting a confirmation executes its action exactly once', async () => {
  const controller = createDialogController(() => {}); let writes = 0;
  const action = async () => { if (await controller.confirm('Eliminar materia')) writes++; };
  const pending = action(); controller.settle(true); controller.settle(true); await pending; assert.equal(writes, 1);
});

test('each queued request retains its own choice and message', async () => {
  const changes = []; const controller = createDialogController(value => changes.push(value));
  const first = controller.confirm('Primera'); const second = controller.confirm('Segunda');
  assert.equal(changes.length, 1); assert.equal(changes[0].message, 'Primera');
  controller.settle(true); assert.equal(await first, true); assert.equal(changes[1].message, 'Segunda');
  controller.settle(false); assert.equal(await second, false); assert.equal(changes[2], null);
});

test('route cancellation rejects every pending action, and future dialogs still work', async () => {
  const controller = createDialogController(() => {}); let writes = 0;
  const first = controller.confirm('Eliminar usuario').then(ok => { if (ok) writes++; });
  const second = controller.confirm('Eliminar horario').then(ok => { if (ok) writes++; });
  controller.cancelAll(); await Promise.all([first, second]); assert.equal(writes, 0);
  const next = controller.confirm('Nueva pantalla'); controller.settle(true); assert.equal(await next, true);
});

test('alerts resolve without confirmation results and content remains plain text', async () => {
  let current; const controller = createDialogController(value => { current = value; });
  const message = '<img src=x onerror=alert(1)>\nMensaje';
  const pending = controller.alert(message, { title: 'Aviso' });
  assert.equal(current.kind, 'alert'); assert.equal(current.message, message); assert.equal(current.title, 'Aviso');
  controller.settle(true); assert.equal(await pending, undefined);
});
