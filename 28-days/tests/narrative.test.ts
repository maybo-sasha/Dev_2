import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, validateContent } from '../src/narrative/content.ts';
import { baseline, reduce } from '../src/narrative/reducer.ts';
import { decode } from '../src/persistence/progress.ts';

test('master route has all 21 chapters in the required order',()=>{
 validateContent();assert.deepEqual(chapters.map(c=>c.id.split('_')[1]),['opening','wall','inside','deportation','realization','two-undergrounds','contacts','january','prepare','network','night-before','day-one','muranowski','districts','fire','beneath-fire','mila','without-center','sewers','may-sixteen','epilogue']);
 assert.equal(chapters[1].date,'November 1940');assert.match(chapters[10].date,/April 18/);assert.match(chapters[11].date,/April 19/);
});
test('every chapter completes identically through continue or skip with no evidence prerequisites',()=>{
 for(const c of chapters){let a=baseline(c.order),b=baseline(c.order);for(let i=0;i<c.beats.length;i++){a=reduce(a,{type:'NEXT',chapter:c.order,beat:i,generation:0,id:String(i)});b=reduce(b,{type:'SKIP',chapter:c.order,beat:i,generation:0,id:String(i)});}assert.equal(a.ended,true);assert.deepEqual({...a,skipped:true},b);}
});
test('stale, duplicate and suspended events cannot advance; pause reasons are independent',()=>{
 let s=baseline(12,3);const event={type:'NEXT' as const,chapter:12,beat:0,generation:3,id:'once'};
 assert.equal(reduce(s,{...event,generation:2}),s);s=reduce(s,{type:'PAUSE',reason:'manual'});s=reduce(s,{type:'PAUSE',reason:'overlay'});s=reduce(s,{type:'RESUME',reason:'overlay'});assert.deepEqual(s.pauses,['manual']);assert.equal(reduce(s,event),s);s=reduce(s,{type:'RESUME',reason:'manual'});s=reduce(s,event);assert.equal(s.beat,1);assert.equal(reduce(s,event),s);
});
test('direct entry restores an independent chapter baseline',()=>{let s={...baseline(19),beat:3,ended:true};for(const chapter of [12,16,18,1]){s=reduce(s,{type:'ENTER',chapter});assert.equal(s.beat,0);assert.equal(s.ended,false);assert.equal(s.chapter,chapter);}});
test('invalid, old and corrupt saves safely return null; known checkpoints restore',()=>{for(const raw of [null,'bad','{}','{"schemaVersion":9}','{"schemaVersion":1,"contentVersion":"old"}'])assert.equal(decode(raw),null);const c=chapters[18];assert.equal(decode(JSON.stringify({schemaVersion:1,contentVersion:'master-1',chapterId:c.id,checkpointId:c.beats[3].checkpoint}))?.beat,3);assert.equal(decode(JSON.stringify({schemaVersion:1,contentVersion:'master-1',chapterId:c.id,checkpointId:'unknown'})),null);});
