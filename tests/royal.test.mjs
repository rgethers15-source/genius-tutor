import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { ROYAL_MISSIONS } from '../src/data/royalMissions.ts';
test('royal quests cover nine subjects with distinct answerable choices',()=>{
 assert.equal(new Set(ROYAL_MISSIONS.map(q=>q.subject)).size,9);
 for(const q of ROYAL_MISSIONS){assert.ok(q.choices.includes(q.answer));assert.equal(new Set(q.choices).size,3);assert.ok(q.hint);}
});
test('every tutor and the royal prince has a nonempty original instrumental',()=>{
 const themes=JSON.parse(readFileSync(new URL('../src/data/tutorThemes.json',import.meta.url)));
 assert.equal(Object.keys(themes).length,23);
 assert.equal(new Set(Object.values(themes).map(t=>t.url)).size,23);
 for(const t of Object.values(themes)){assert.ok(t.title);assert.ok(statSync(new URL('../public/'+t.url.replace(/^\.\//,''),import.meta.url)).size>100000);}
});
