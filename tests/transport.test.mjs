import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mandeciesProfile,upgradeMandeciesProfile} from '../src/data/mandeciesProfile.ts';
import {TRANSPORT_LESSONS,transportMissions} from '../src/data/curriculumK.ts';
test('Mandecies upgrade preserves identity, progress, accessibility and unrelated profiles',()=>{
 const old={...mandeciesProfile(),transportEnvironment:false,princessEnvironment:true,id:'keep',starsEarned:17,progress:{math:3}};
 const next=upgradeMandeciesProfile(old);assert.equal(next.id,'keep');assert.equal(next.starsEarned,17);assert.deepEqual(next.progress,old.progress);assert.equal(next.plan.gradeLevel,'K');assert.equal(next.princessEnvironment,false);
 const other={...old,name:'McKenzie'};assert.equal(upgradeMandeciesProfile(other),other);
});
test('Kindergarten trips rotate through 27 valid questions across nine subjects',()=>{
 assert.equal(TRANSPORT_LESSONS.length,27);assert.equal(new Set(TRANSPORT_LESSONS.map(l=>l.id)).size,27);
 for(let trip=0;trip<3;trip++){const missions=transportMissions(trip);assert.equal(new Set(missions.map(m=>m.subject)).size,9);for(const m of missions){assert.equal(m.choices.length,3);assert.ok(m.choices.includes(m.answer));assert.ok(m.hint);}}
 assert.notEqual(transportMissions(0)[0].q,transportMissions(1)[0].q);
});
