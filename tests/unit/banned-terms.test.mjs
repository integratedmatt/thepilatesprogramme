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
  assert.equal(run('<p>Students with an existing Level 3 fitness qualification receive £400 off. Accredited by ITTAP. Certify to teach Mat Pilates. 30 observation, 25 personal study and 25 practice teaching hours. Usually around 6 months.</p>'), 0);
});
test('fails on Level 3 outside the allowlist', () => { assert.equal(run('<h1>Reformer Teacher Training (Level 3)</h1>'), 1); });
test('fails on Ofqual, NVQ and regulated', () => {
  assert.equal(run('<p>Ofqual approved</p>'), 1);
  assert.equal(run('<p>an NVQ course</p>'), 1);
  assert.equal(run('<p>a regulated qualification</p>'), 1);
});
test('fails on qualify and qualification for TPP courses', () => {
  assert.equal(run('<p>I want to qualify</p>'), 1);
  assert.equal(run('<p>a qualification that covers every Mat tradition</p>'), 1);
  assert.equal(run('<p>Not qualified yet?</p>'), 1);
});
test('fails on 80 hours, supported hours and the 8-week plan', () => {
  assert.equal(run('<p>80 supported practice hours</p>'), 1);
  assert.equal(run('<p>around 80 hours of practice</p>'), 1);
  assert.equal(run('<p>supported hours</p>'), 1);
  assert.equal(run('<p>Most students finish in eight weeks</p>'), 1);
  assert.equal(run('<p>A suggested 8-week plan</p>'), 1);
});
test('fails on negative fit framing, Zoom, random exercises, welcome trainees and £5', () => {
  assert.equal(run("<p>This isn't for you if</p>"), 1);
  assert.equal(run('<p>a 45-minute class plus 5 random exercises, via Zoom</p>'), 1);
  assert.equal(run('<p>Many studios welcome trainees to observe and cover.</p>'), 1);
  assert.equal(run('<p>Equipment hire. £5 per hour.</p>'), 1);
});
test('allows prices that merely start with £5', () => { assert.equal(run('<p>4 × £550, or £5,000 total</p>'), 0); });
test('ignores script contents', () => { assert.equal(run('<script>var x = "Level 3";</script><p>fine</p>'), 0); });
