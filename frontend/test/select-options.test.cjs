const {test}=require('node:test');const assert=require('node:assert/strict');
const ts=require('typescript');const {readFileSync}=require('node:fs');const {resolve}=require('node:path');const {runInNewContext}=require('node:vm');
const code=ts.transpileModule(readFileSync(resolve(__dirname,'../src/components/ui/select-options.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const loaded={exports:{}};runInNewContext(code,{module:loaded,exports:loaded.exports});const {matchesLabel}=loaded.exports;
test('searches the visible label regardless of accents, capitalization or word order',()=>{
 assert.equal(matchesLabel('MAT-01 - Matemática Aplicada','matematica'),true);
 assert.equal(matchesLabel('MAT-01 - Matemática Aplicada','APLICADA mat'),true);
 assert.equal(matchesLabel('Ingeniería en Sistemas','ingenieria sistemas'),true);
 assert.equal(matchesLabel('Matemática','uuid-interno'),false);
 assert.equal(matchesLabel('Ciclo 2026','   '),true);
 assert.equal(matchesLabel('<script>texto</script>','['),false);
});
