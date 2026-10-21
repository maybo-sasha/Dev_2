import { chapters } from './content.ts';
export type State={chapter:number;beat:number;generation:number;ended:boolean;seen:string[];pauses:string[];lastEvent:string|null;skipped:boolean};
export const baseline=(chapter=0,generation=0):State=>({chapter,beat:0,generation,ended:false,seen:[],pauses:[],lastEvent:null,skipped:false});
export type Event={type:'NEXT'|'SKIP';chapter:number;beat:number;generation:number;id:string}|{type:'ENTER';chapter:number}|{type:'PAUSE';reason:string}|{type:'RESUME';reason:string};
export function reduce(state:State,event:Event):State {
 if(event.type==='ENTER') return Number.isInteger(event.chapter)&&chapters[event.chapter]?baseline(event.chapter,state.generation+1):state;
 if(event.type==='PAUSE') return {...state,pauses:[...new Set([...state.pauses,event.reason])]};
 if(event.type==='RESUME') return {...state,pauses:state.pauses.filter(p=>p!==event.reason)};
 if(state.pauses.length||state.ended||event.generation!==state.generation||event.chapter!==state.chapter||event.beat!==state.beat||event.id===state.lastEvent)return state;
 const c=chapters[state.chapter],b=c.beats[state.beat];
 return {...state,beat:Math.min(state.beat+1,c.beats.length-1),ended:b.next==='$chapterEnd',seen:[...new Set([...state.seen,b.id])],lastEvent:event.id,skipped:event.type==='SKIP'};
}
