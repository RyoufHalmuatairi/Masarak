// Tests for src/utils/skill-gap.ts (readiness score and skill gap lists).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = process.env.MASARAK_TEST_ROOT || path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const dataset = JSON.parse(fs.readFileSync(path.join(root, 'src/masarak_dataset.json'), 'utf8'));

// Compile the TypeScript file and load it with the real dataset.
const source = fs.readFileSync(path.join(root, 'src/utils/skill-gap.ts'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const mod = {};
vm.runInNewContext(output, { exports: mod, require: () => dataset });
const { getSkillGapReport, readinessLevel } = mod;

const coreIds = careerId => [...new Set(dataset.career_skills.filter(l => l.career_id === careerId && l.priority === 'core').map(l => l.skill_id))];

test('no saved skills gives no score and no level', () => {
  const report = getSkillGapReport('C01', null);
  assert.equal(report.score, null);
  assert.equal(report.level, null);
});

test('score follows the report formula: matched core / total core * 100', () => {
  const core = coreIds('C01');
  const half = core.slice(0, Math.floor(core.length / 2));
  const report = getSkillGapReport('C01', half);
  assert.equal(report.score, Math.round((half.length / core.length) * 100));
  assert.equal(report.matchedCore.length, half.length);
  assert.equal(report.missingCore.length, core.length - half.length);
});

test('all core skills gives 100 and an empty gap', () => {
  const report = getSkillGapReport('C02', coreIds('C02'));
  assert.equal(report.score, 100);
  assert.equal(report.level, 'ready');
  assert.equal(report.missingCore.length, 0);
});

test('additional skills never change the score', () => {
  const extra = dataset.career_skills.filter(l => l.career_id === 'C01' && l.priority === 'additional').map(l => l.skill_id);
  const withExtra = getSkillGapReport('C01', extra);
  assert.equal(withExtra.score, 0);
  assert.equal(withExtra.matchedAdditional.length, new Set(extra).size);
});

test('level thresholds', () => {
  assert.equal(readinessLevel(0), 'early');
  assert.equal(readinessLevel(39), 'early');
  assert.equal(readinessLevel(40), 'developing');
  assert.equal(readinessLevel(69), 'developing');
  assert.equal(readinessLevel(70), 'ready');
  assert.equal(readinessLevel(null), null);
});

test('score matches the one used on the home screen', () => {
  const ids = coreIds('C03').slice(0, 3);
  const calc = require('node:vm');
  const out = ts.transpileModule(fs.readFileSync(path.join(root, 'src/utils/career-matches.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const ex = {}; calc.runInNewContext(out, { exports: ex, require: () => dataset });
  const home = ex.getCareerMatches(ids).find(c => c.career_id === 'C03').score;
  assert.equal(getSkillGapReport('C03', ids).score, home);
});