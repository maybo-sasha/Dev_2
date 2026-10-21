import { baseline, type State } from '../narrative/reducer.ts';
import { chapters } from '../narrative/content.ts';
export const SAVE_KEY='28-days-master-v1';
export function decode(raw:string|null):State|null {
 try {const s=JSON.parse(raw??'null');if(!s||s.schemaVersion!==1||s.contentVersion!=='master-1')return null;
 const c=chapters.find(c=>c.id===s.chapterId);if(!c)return null;
 const beat=c.beats.findIndex(b=>b.checkpoint===s.checkpointId);if(beat<0)return null;
 return {...baseline(c.order),beat,ended:s.ended===true};} catch{return null;}
}
export function readProgress():State|null{try{return decode(localStorage.getItem(SAVE_KEY));}catch{return null;}}
export function saveProgress(s:State):boolean{try{localStorage.setItem(SAVE_KEY,JSON.stringify({schemaVersion:1,contentVersion:'master-1',chapterId:chapters[s.chapter].id,checkpointId:chapters[s.chapter].beats[s.beat].checkpoint,ended:s.ended}));return true;}catch{return false;}}
