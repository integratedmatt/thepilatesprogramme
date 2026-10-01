import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function run(html) {
  const dir = mkdtempSync(join(tmpdir(), 'tpp-'));
  mkdirSync(join(dir, 'x'));
  writeFileSync(join(dir, 'x', 'index.html'), html);
  try { execFileSync('node', ['scripts/check-banned-terms.mjs', dir], { stdio: 'pipe' }); return 0; } catch (e) { return e.status; }
}

test('passes clean copy and the allowlisted discount sentence', () => {
  assert.equal(run('<p>Students with an existing Level 3 fitness qualification receive £400 off. Accredited by ITTAP.</p>'), 0);
});
test('fails on Level 3 outside the allowlist', () => { assert.equal(run('<h1>Reformer Teacher Training (Level 3)</h1>'), 1); });
test('fails on Ofqual, NVQ and regulated', () => {
  assert.equal(run('<p>Ofqual approved</p>'), 1);
  assert.equal(run('<p>an NVQ course</p>'), 1);
  assert.equal(run('<p>a regulated qualification</p>'), 1);
});
test('ignores script contents', () => { assert.equal(run('<script>var x = "Level 3";</script><p>fine</p>'), 0); });
