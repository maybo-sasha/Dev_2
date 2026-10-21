import { CHAPTERS } from './story.js';
import { HE } from './lang.js';
import './resistance.css';

const L = (en, he) => HE ? he : en;
const source = 'https://encyclopedia.ushmm.org/content/en/article/warsaw-ghetto-uprising';
// Invitations are narration, not quotations attributed to historical people.
const missions = [
  { id:'two', next:'zzw', date:'1942 → 1943', name:L('Inside the ŻOB','בתוך אי״ל'), lead:L('A connection beneath the street','קשר מתחת לרחוב'), text:L('After the mass deportations, underground organizers prepared armed resistance. Follow the street into the cellar and examine what resistance required.','לאחר הגירושים ההמוניים נערכו אנשי המחתרת להתנגדות חמושה. עקבו אחר הרחוב אל המרתף וגלו מה נדרש כדי להתכונן.'), points:[
    [L('Contact','קשר'),L('Couriers carried information and linked people inside and outside the ghetto. Secrecy was essential.','קשרים וקשריות העבירו מידע וחיברו בין אנשים בתוך הגטו ומחוצה לו. הסודיות הייתה חיונית.')],
    [L('Arms','נשק'),L('Weapons were scarce. Smuggling and improvised supplies could not erase the enormous imbalance of force.','הנשק היה מועט. הברחות וציוד מאולתר לא ביטלו את פער הכוחות העצום.')],
    [L('Shelter','מחסה'),L('Residents prepared hiding places. Civilian refusal to report for deportation became part of resistance.','תושבים הכינו מקומות מסתור. סירוב אזרחי להתייצב לגירוש נעשה חלק מן ההתנגדות.')]], bridge:L('Another organization was preparing too: meet the ŻZW, with its own leadership and positions.','גם ארגון נוסף התכונן: הכירו את אצ״י, בעל הנהגה ועמדות משלו.') },
  { id:'zzw', next:'january', date:'1943', name:L('Inside the ŻZW','בתוך אצ״י'), lead:L('Two organizations. A shared struggle.','שני ארגונים. מאבק משותף.'), text:L('The Jewish Military Union was distinct from the ŻOB. At Muranowski Square, its fighters would take part in the uprising. Explore the room before continuing to January.','האיגוד הצבאי היהודי היה ארגון נפרד מאי״ל. לוחמיו השתתפו במרד בכיכר מורנובסקי. חקרו את החדר לפני המעבר לינואר.'), points:[
    [L('Organization','ארגון'),L('The ŻZW and ŻOB retained separate structures. The experience follows both without merging their identities.','אצ״י ואי״ל שמרו על מסגרות נפרדות. המסע עוקב אחר שניהם תוך שמירה על זהותם.')],
    [L('Connections','חיבורים'),L('Contacts beyond the wall helped the underground obtain supplies and information.','קשרים מעבר לחומה סייעו למחתרת להשיג ציוד ומידע.')],
    [L('Position','עמדה'),L('Muranowski Square became a major site of armed resistance in April.','כיכר מורנובסקי הייתה מוקד חשוב של התנגדות חמושה באפריל.')]], bridge:L('Go back to the turning point: the January deportation action meets armed resistance.','כעת אל נקודת המפנה: פעולת הגירוש בינואר נתקלת בהתנגדות חמושה.') },
  { id:'january', next:'map', date:'18–21.01.1943', name:L('The first resistance','ההתנגדות הראשונה'), lead:L('January changes what comes next','ינואר משנה את ההמשך'), text:L('Armed resistance and widespread hiding disrupted the deportation action. In the following months, preparations intensified.','התנגדות חמושה והסתתרות נרחבת שיבשו את פעולת הגירוש. בחודשים הבאים התגברו ההכנות.'), points:[
    [L('Resist','התנגדות'),L('Underground fighters confronted German forces during the January roundups.','לוחמי מחתרת התעמתו עם הכוחות הגרמניים במהלך האקציה בינואר.')],
    [L('Hide','הסתתרות'),L('Many residents did not assemble for deportation and sought hiding places.','תושבים רבים לא התייצבו לגירוש וחיפשו מקומות מסתור.')],
    [L('Prepare','הכנות'),L('The months before April brought more bunker building and preparations for renewed fighting.','בחודשים שלפני אפריל נמשכו בניית הבונקרים וההיערכות ללחימה מחודשת.')]], bridge:L('Now examine the battle sectors before entering 19 April.','כעת הכירו את גזרות הלחימה לפני הכניסה ל־19 באפריל.') },
  { id:'map', next:'april', date:'19.04.1943 · 01 / 28', name:L('Before the uprising','ערב המרד'), lead:L('Read the ground. Understand the resistance.','הכירו את השטח. הבינו את ההתנגדות.'), text:L('Inspect three sectors on this schematic briefing. Then enter the existing three-dimensional battle reconstruction.','בדקו שלוש גזרות בתרשים התדרוך. לאחר מכן היכנסו לשחזור הקרב בתלת ממד.'), points:[
    [L('Central ghetto · ŻOB','הגטו המרכזי · אי״ל'),L('Small groups used buildings and familiar streets to resist forces with far greater firepower.','קבוצות קטנות נעזרו במבנים וברחובות מוכרים כדי להתנגד לכוח בעל עוצמת אש גדולה בהרבה.')],
    [L('Muranowski Square · ŻZW','כיכר מורנובסקי · אצ״י'),L('A separate focus of fighting. Continue to the square after the opening battle to follow the ŻZW.','מוקד לחימה נוסף. המשיכו לכיכר לאחר קרב הפתיחה כדי לעקוב אחר אצ״י.')],
    [L('Brushmakers’ district','אזור המברשתנים'),L('Resistance also took place around the workshops. The next scenes connect these different sectors.','ההתנגדות התקיימה גם בסביבת בתי המלאכה. הסצנות הבאות מחברות בין הגזרות השונות.')]], bridge:L('Your role is to observe positions and follow the resistance through the reconstructed battle. Historical outcomes remain fixed.','תפקידכם לזהות עמדות ולעקוב אחר ההתנגדות במהלך שחזור הקרב. תוצאות האירועים ההיסטוריים קבועות.') }
];
const root=document.documentElement;
const dock=document.createElement('aside'); dock.className='resistance-dock'; dock.hidden=true;
const dialog=document.createElement('dialog'); dialog.className='resistance-brief'; dialog.dir=HE?'rtl':'ltr'; dialog.setAttribute('aria-labelledby','resistance-title');
document.body.append(dock,dialog);
let current=missions[0], opener;
const explored=new Map(missions.map(m=>[m.id,new Set()]));
function go(id){const index=CHAPTERS.findIndex(c=>c.id===id); document.querySelector(`.mini__pin[data-go="${index}"]`)?.click();}
function render(){
  const m=current, seen=explored.get(m.id);
  dialog.innerHTML=`<header><span>${m.date} · ${m.name}</span><button class="resistance-close" aria-label="${L('Close briefing','סגירת התדרוך')}">×</button></header><p class="resistance-eyebrow">${L('RECON → PREPARE → RESIST','סיור ← הכנות ← התנגדות')}</p><h2 id="resistance-title">${m.lead}</h2><p>${m.text}</p><div class="resistance-map" aria-label="${L('Schematic briefing, not a geographic map','תרשים תדרוך, אינו מפה גאוגרפית')}">${m.points.map((p,i)=>`<button data-point="${i}" aria-pressed="${seen.has(i)}"><span>0${i+1}</span>${p[0]}<b>${seen.has(i)?'✓':'+'}</b></button>`).join('')}</div><small>${L('Interpretive diagram · reconstructed spaces','תרשים פרשני · חללים משוחזרים')}</small><p class="resistance-detail" aria-live="polite">${L('Select each marker to uncover the preparations.','בחרו בכל סמן כדי להכיר את ההכנות.')}</p><p class="resistance-bridge">${m.bridge}</p><footer><button data-explore>${L('Explore this scene','סיור בסצנה')}</button><button data-next ${seen.size<3?'disabled':''}>${L('Continue the story','המשך הסיפור')} →</button></footer><p class="resistance-source"><a href="${source}" target="_blank" rel="noopener">${L('Historical context · USHMM','הקשר היסטורי · מוזיאון השואה בוושינגטון')}</a></p>`;
}
function open(){if(document.querySelector('dialog[open]'))return; opener=document.activeElement;render();root.classList.add('field-open');document.dispatchEvent(new Event('days28-guide-open'));dialog.showModal();}
dock.addEventListener('click',open);
dialog.addEventListener('click',e=>{const point=e.target.closest('[data-point]'); if(point){const i=Number(point.dataset.point);explored.get(current.id).add(i);point.setAttribute('aria-pressed','true');point.querySelector('b').textContent='✓';dialog.querySelector('.resistance-detail').textContent=current.points[i][1];dialog.querySelector('[data-next]').disabled=explored.get(current.id).size<3;return;}if(e.target.closest('.resistance-close'))dialog.close();if(e.target.closest('[data-explore]')){dialog.close();go(current.id);}if(e.target.closest('[data-next]')){const next=current.next;dialog.close();go(next);}});
dialog.addEventListener('close',()=>{root.classList.remove('field-open');document.dispatchEvent(new Event('days28-guide-close'));opener?.focus({preventScroll:true});});
function sync(){const m=missions.find(m=>m.id===root.dataset.chapter);dock.hidden=!m;if(m){current=m;dock.innerHTML=`<button><span>${m.date} · ${m.name}</span><strong>${L('Open the underground briefing','פתיחת תדרוך המחתרת')} ↗</strong></button>`;}}
new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-chapter']});sync();
