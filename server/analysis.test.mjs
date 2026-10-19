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
  const local = await analyzeText(text, { fetchImpl: async () => { throw new Error('Local mode must not call any provider.'); } });
  assert.deepEqual(local.skills, []);
  for (const section of ['certificates', 'experiences', 'education', 'projects', 'activities']) assert.deepEqual(local[section], []);
  assert.match(local.warnings[0], /تحليل محلي محدود/);
  for (const status of [401, 429, 500]) {
    await assert.rejects(analyzeText(text, { key: 'test-only', fetchImpl: async () => new Response('{}', { status }) }), error => !error.message.includes('test-only') && error.status >= 400);
  }
  await assert.rejects(analyzeText(text, { key: 'test-only', fetchImpl: async () => new Response(JSON.stringify({ choices: [{ finish_reason: 'length' }] })) }));
});
test('local mode extracts only literal skills under the approved English and Arabic headings', async () => {
  const source = [
    'Summary: communication, leadership',
    'Skills: Python, JavaScript, C++, Unknown Tool',
    'Experience:',
    'Communication',
    'Technical Skills',
    'SQL',
    'Education: Python',
    'المهارات التقنية: تحليل البيانات، قيادة',
    'المشاريع:',
    'Python',
    'المهارات',
    'Excel',
  ].join('\n');
  const local = await analyzeText(source, { fetchImpl: async () => { throw new Error('Provider must not be called.'); } });
  assert.deepEqual(local.skills.map(skill => skill.name), ['Python', 'JavaScript', 'C++', 'Unknown Tool', 'SQL', 'تحليل البيانات', 'قيادة', 'Excel']);
  assert.equal(local.skills[0].mapped_skill_id, matchSkillId('Python'));
  assert.equal(local.skills.find(skill => skill.name === 'Unknown Tool').mapped_skill_id, null);
  for (const skill of local.skills) assert.ok(source.includes(skill.evidence));
  for (const section of ['certificates', 'experiences', 'education', 'projects', 'activities']) assert.deepEqual(local[section], []);
  assert.match(local.warnings[0], /لم نخمن/);
});
test('local mode ignores nonapproved headings, sentence fragments, and other visual PDF columns', async () => {
  const source = [
    'Languages: Arabic, English',
    'Tools: Photoshop, Figma',
    'Skills and Interests: Figma, Python',
    'Skills: Python programming and software testing.',
    '[P1L4 y=250] (x=20) Skills: | (x=400) Python, JavaScript',
    '[P1L5 y=300] (x=20) Database administration | (x=400) SQL',
    '[P1L6 y=320] (x=20) Education | (x=400) Bachelor of Science',
  ].join('\n');
  assert.deepEqual((await analyzeText(source)).skills, []);
});

test('local mode extracts explicit English work experience with exact evidence and its source date line', async () => {
  const experience = 'Senior Data Analyst at Sample Labs, Jan 2021 – Present';
  const source = [
    'Technical Skills: Python, SQL',
    `[P1L4 y=250] (x=20) ${experience}`,
    'Education: Bachelor of Science in Computing',
    'Engineer at an unrelated organization, 2020',
  ].join('\n');
  const local = await analyzeText(source, { fetchImpl: async () => { throw new Error('Local mode must not call a provider.'); } });
  assert.deepEqual(local.skills.map(item => item.name), ['Python', 'SQL']);
  assert.equal(local.experiences.length, 1);
  assert.deepEqual(local.experiences[0], {
    role: 'Senior Data Analyst', organization: 'Sample Labs', dates: 'Jan 2021 – Present',
    date_line_id: 'P1L4', description: '', evidence: experience,
  });
});

test('local mode extracts Arabic work experience and preserves Arabic dates without inference', async () => {
  const experience = 'مهندسة برمجيات لدى شركة آفاق، يناير ٢٠٢٢ - مارس ٢٠٢٤';
  const source = ['الخبرات العملية:', `[D1L2] ${experience}`, 'الشهادات: شهادة مهنية، ٢٠٢٣'].join('\n');
  const local = await analyzeText(source, { fetchImpl: async () => { throw new Error('Local mode must not call a provider.'); } });
  assert.equal(local.experiences.length, 1);
  assert.deepEqual(local.experiences[0], {
    role: 'مهندسة برمجيات', organization: 'شركة آفاق', dates: 'يناير ٢٠٢٢ - مارس ٢٠٢٤',
    date_line_id: 'D1L2', description: '', evidence: experience,
  });
  assert.deepEqual(local.certificates, []);
});

test('local mode leaves unclear experience empty and never turns actions or ambiguous PDF columns into jobs', async () => {
  const source = [
    'Experience:',
    'Built a dashboard at Sample Labs during 2024.',
    'Supported the release at Example Company.',
    '[P1L4 y=250] (x=20) Software Engineer | (x=600) Example Company, 2022–2023',
    'Projects: Product Designer at a fictional employer, 2021',
    'Education: Engineer at a fictional employer, 2020',
  ].join('\n');
  const local = await analyzeText(source, { fetchImpl: async () => { throw new Error('Local mode must not call a provider.'); } });
  assert.deepEqual(local.experiences, []);
  assert.deepEqual(local.projects, []);
  assert.match(local.warnings[0], /لا نخمن|لم نخمن/);
});

test('local mode accepts an explicit role while leaving unstated employer and dates blank', async () => {
  const source = 'Work Experience:\nRole: Product Designer\nSkills: Figma';
  const local = await analyzeText(source);
  assert.deepEqual(local.experiences, [{
    role: 'Product Designer', organization: '', dates: '', date_line_id: '', description: '', evidence: 'Role: Product Designer',
  }]);
  assert.deepEqual(local.skills.map(item => item.name), ['Figma']);
});

function matchSkillId(name) {
  return dictionary.find(entry => entry.aliases.some(alias => alias.toLowerCase() === name.toLowerCase()))?.id ?? null;
}
test('extracts actual PDF and DOCX files and rejects empty or disguised documents', async () => {
  for (const extension of ['pdf', 'docx']) {
    const buffer = await readFile(new URL(`fixtures/demo.${extension}`, import.meta.url));
    const extracted = await extractText({ originalname: `demo.${extension}`, buffer });
    assert.match(extracted, /Python programming/);
  }
  await assert.rejects(extractText({ originalname: 'cv.pdf', buffer: Buffer.from('not a pdf') }));
  await assert.rejects(extractText({ originalname: 'cv.docx', buffer: Buffer.alloc(0) }));
});

