import { CHAPTERS, BEATS } from './story.js';
import { HE } from './lang.js';
import './hud.css';

export function buildHUD() {
  const panel=document.createElement('aside');
  panel.className='chapter-hud';
  panel.setAttribute('aria-label',HE?'הפרק הנוכחי':'Current chapter');
  const number=document.createElement('p'),title=document.createElement('h2'),date=document.createElement('p'),summary=document.createElement('p');
  number.className='chapter-hud__number';date.className='chapter-hud__date';summary.className='chapter-hud__summary';
  panel.append(number,title,date,summary);
  const timeline=document.createElement('nav');
  timeline.className='chapter-timeline';timeline.setAttribute('aria-label',HE?'ציר הזמן':'Chapter timeline');
  const buttons=CHAPTERS.slice(1).map((chapter,index)=>{
    const button=document.createElement('button');button.type='button';button.dataset.go=index+1;
    const marker=document.createElement('i');marker.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.textContent=chapter.label;
    const year=document.createElement('small');year.textContent=chapter.year;
    button.append(marker,label,year);timeline.append(button);return button;
  });
  document.body.append(panel,timeline);
  let previous=-1;
  return {update(index){
    if(index===previous)return;
    previous=index;
    const chapter=CHAPTERS[index];
    number.textContent=`${HE?'פרק':'Chapter'} ${String(index).padStart(2,'0')}`;
    title.textContent=chapter.label;date.textContent=chapter.year;
    const beat=BEATS.find(b=>b.at[0]===chapter.id);
    summary.textContent=beat?.body[0]||'';
    buttons.forEach((button,i)=>{
      if(i+1===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    });
    if(index>0){const button=buttons[index-1];timeline.scrollTo({left:button.offsetLeft-timeline.clientWidth/2+button.clientWidth/2,behavior:'instant'});}
  }};
}
