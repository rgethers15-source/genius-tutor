import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mandelaProfile } from '../src/data/mandelaProfile.ts';
import { EXPEDITION_LESSONS } from '../src/data/expeditionCurriculum.ts';
import { JURASSIC_TUTORS } from '../src/data/jurassicTutors.ts';
test('Mandela setup selects his own world and all nine subjects', () => {
  const p = mandelaProfile();
  assert.equal(p.name, 'Mandela'); assert.equal(p.age, 7);
  assert.match(p.school, /Palisades Park/); assert.equal(p.plan.gradeLevel, '1');
  assert.equal(p.jurassicEnvironment, true); assert.equal(p.princessEnvironment, undefined);
  assert.equal(p.plan.subjects.length, 9); assert.equal(p.jurassicZombies, false);
  assert.equal(new Set(JURASSIC_TUTORS.map(t => t.subject)).size, 9);
});
test('expedition lessons have unique ids and answerable mission questions', () => {
  assert.ok(EXPEDITION_LESSONS.length >= 40);
  assert.equal(new Set(EXPEDITION_LESSONS.map(l => l.id)).size, EXPEDITION_LESSONS.length);
  for (const l of EXPEDITION_LESSONS) {
    assert.ok(l.steps.length >= 2); assert.ok(l.standard);
    for (const q of l.quiz) { assert.ok(q.choices.includes(q.answer)); assert.equal(new Set(q.choices).size, q.choices.length); }
  }
});
