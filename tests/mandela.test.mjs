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
import { readFileSync } from 'node:fs';
import { activityFor } from '../src/data/mandelaActivities.ts';
import { parseMandelaQuestions } from '../src/engine/mandelaQuestions.ts';
test('all 13 reference areas have valid guided activities with unique progress keys',()=>{
 const standards=JSON.parse(readFileSync(new URL('../src/data/ncGrade1Standards.json',import.meta.url)));
 assert.equal(new Set(standards.map(s=>s.area)).size,13);
 assert.equal(new Set(standards.map(s=>s.area+':'+s.code)).size,standards.length);
 assert.ok(standards.some(s=>s.code==='PE.1.MS.1.1'));
 assert.ok(standards.some(s=>s.code==='K2-AP-01'));
 for(const s of standards){const a=activityFor(s.area,s.code,s.objective);assert.ok(a.title);assert.ok(a.teach.length>40);assert.equal(a.steps.length,3);assert.ok(a.materials);assert.ok(a.check);}
});
test('AI practice rejects duplicate choices and answers absent from choices',()=>{
 const valid={q:'How many?',choices:['1','2','3'],answer:'2',hint:'Count.'};
 assert.equal(parseMandelaQuestions(JSON.stringify({questions:[valid]})).length,1);
 assert.throws(()=>parseMandelaQuestions(JSON.stringify({questions:[{...valid,answer:'4'}]})));
 assert.throws(()=>parseMandelaQuestions(JSON.stringify({questions:[{...valid,choices:['2','2','3']}]})));
});
