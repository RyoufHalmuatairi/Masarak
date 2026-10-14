import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyzeText, extractText, validateAnalysis, dictionary } from './analysis.mjs';

const text = 'Demo Candidate. Skills: Python programming and software testing. Certificate: Example Certificate, issued by Demo Institute in 2024. Experience: Developer Intern at Demo Company, 2023.';
const id = dictionary.find(item => item.name === 'Programming').id;
const result = {
  education: [], projects: [], activities: [],
  skills: [{ name: 'Python', mapped_skill_id: id, evidence: 'Python programming' }],
  certificates: [{ name: 'Example Certificate', issuer: 'Demo Institute', date: '2024', evidence: 'Example Certificate, issued by Demo Institute in 2024' }],
  experiences: [{ role: 'Developer Intern', organization: 'Demo Company', dates: '2023', description: '', evidence: 'Developer Intern at Demo Company, 2023' }],
};
test('validates source evidence and rejects unsupported information', () => {
  const safe = validateAnalysis({ ...result, skills: [...result.skills, { name: 'Invented skill', mapped_skill_id: id, evidence: 'No such words in the CV' }] }, text);
  assert.equal(safe.skills.length, 1);
  assert.equal(safe.certificates.length, 1);
  assert.equal(safe.experiences.length, 1);
  assert.ok(safe.warnings.length >= 1);
  assert.equal(safe.certificates[0].date, '');
  const unmapped = validateAnalysis({ ...result, skills: [{ ...result.skills[0], mapped_skill_id: 'UNKNOWN' }] }, text);
  assert.equal(unmapped.skills[0].mapped_skill_id, id); // A known literal name repairs an invalid model ID.
  assert.throws(() => validateAnalysis({ skills: 'bad' }, text));
});
test('handles schema completion and provider failures without leaking secrets', async () => {
  const fakeFetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.response_format.json_schema.strict, true);
    assert.match(request.messages[0].content, /untrusted/);
    return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(result) } }] }));
  };
  assert.equal((await analyzeText(text, { key: 'test-only', fetchImpl: fakeFetch })).skills.length, 1);
  await assert.rejects(analyzeText(text), error => error.status === 503);
  for (const status of [401, 429, 500]) {
    await assert.rejects(analyzeText(text, { key: 'test-only', fetchImpl: async () => new Response('{}', { status }) }), error => !error.message.includes('test-only') && error.status >= 400);
  }
  await assert.rejects(analyzeText(text, { key: 'test-only', fetchImpl: async () => new Response(JSON.stringify({ choices: [{ finish_reason: 'length' }] })) }));
});
test('extracts actual PDF and DOCX files and rejects empty or disguised documents', async () => {
  for (const extension of ['pdf', 'docx']) {
    const buffer = await readFile(new URL(`fixtures/demo.${extension}`, import.meta.url));
    const extracted = await extractText({ originalname: `demo.${extension}`, buffer });
    assert.match(extracted, /Python programming/);
  }
  await assert.rejects(extractText({ originalname: 'cv.pdf', buffer: Buffer.from('not a pdf') }));
  await assert.rejects(extractText({ originalname: 'cv.docx', buffer: Buffer.alloc(0) }));
});

