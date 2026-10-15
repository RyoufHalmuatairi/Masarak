const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function harness({ configured = true, sessionError = null, tokens = ['test-only-current-token'], status = 200 } = {}) {
  const calls = { requests: [], forms: 0, sessions: 0, timers: 0 };
  const output = ts.transpileModule(fs.readFileSync('src/utils/cv-api.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  const auth = { getSession: async () => {
    const token = tokens[Math.min(calls.sessions++, tokens.length - 1)];
    return { data: { session: token ? { access_token: token } : null }, error: sessionError };
  } };
  const modules = {
    'expo-constants': {},
    'expo-file-system': { File: class { constructor() { throw Error('unexpected native file access'); } } },
    'expo/fetch': { fetch: async (url, init) => {
      calls.requests.push({ url, init });
      return { ok: status === 200, json: async () => status === 200 ? { skills: [] } : { error: 'سجّل الدخول مجددًا لتحليل السيرة.' } };
    } },
    'react-native': { Platform: { OS: 'web' } },
    './skill-profile': { isCvAnalysis: () => true },
    './supabase': { supabase: configured ? { auth } : null },
  };
  vm.runInNewContext(output, {
    exports, require: name => { if (!(name in modules)) throw Error(`Unexpected import ${name}`); return modules[name]; },
    process: { env: { EXPO_PUBLIC_CV_API_URL: 'https://test-only.invalid' } },
    FormData: class {
      constructor() { calls.forms++; this.fields = []; }
      append(...args) { this.fields.push(args); }
    },
    AbortController,
    setTimeout: () => { calls.timers++; return 1; },
    clearTimeout: () => { calls.timers--; },
  });
  return { analyzeCv: exports.analyzeCv, calls, file: { name: 'unused-test-upload.pdf', file: {} } };
}

test('client sends the current access token in Authorization, never in form fields', async () => {
  const h = harness({ tokens: ['test-only-first-token', 'test-only-refreshed-token'] });
  await h.analyzeCv(h.file);
  await h.analyzeCv(h.file);
  assert.equal(h.calls.sessions, 2);
  for (const [index, token] of ['test-only-first-token', 'test-only-refreshed-token'].entries()) {
    const { url, init } = h.calls.requests[index];
    assert.equal(url, 'https://test-only.invalid/analyze-cv');
    assert.equal(init.headers.Authorization, `Bearer ${token}`);
    assert.equal(init.headers['Content-Type'], undefined); // Fetch supplies multipart boundary.
    assert.deepEqual(Array.from(init.body.fields, field => field[0]), ['cv', 'consent']);
    assert.ok(!JSON.stringify(init.body.fields).includes(token));
  }
  assert.equal(h.calls.timers, 0);
});

for (const options of [{ configured: false }, { tokens: [null] }, { sessionError: { message: 'test-only auth error' } }]) {
  test(`client refuses missing/unavailable session before constructing upload: ${JSON.stringify(options)}`, async () => {
    const h = harness(options);
    await assert.rejects(h.analyzeCv(h.file), /تسجيل الدخول|سجّل الدخول/);
    assert.equal(h.calls.forms, 0);
    assert.equal(h.calls.requests.length, 0);
  });
}

test('client reports server 401 rather than returning analysis and clears its timer', async () => {
  const h = harness({ status: 401 });
  await assert.rejects(h.analyzeCv(h.file), /سجّل الدخول مجددًا/);
  assert.equal(h.calls.requests.length, 1);
  assert.equal(h.calls.timers, 0);
});
