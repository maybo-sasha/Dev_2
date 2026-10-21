import { CHAPTERS } from './story.js';
import { HE } from './lang.js';

// The guide is independent of WebGL: every investigation can also be read.
const L = (en, he) => HE ? he : en;
const history = 'https://encyclopedia.ushmm.org/content/en/article/warsaw';
const uprising = 'https://encyclopedia.ushmm.org/content/en/article/warsaw-ghetto-uprising';
const archive = 'https://encyclopedia.ushmm.org/content/en/article/the-oneg-shabbat-archive';
const photoCredits = {
  closed: 'https://commons.wikimedia.org/wiki/File:Warsaw.Ghetto.20.12.1940.jpg',
  cans: 'https://commons.wikimedia.org/wiki/File:Boxes_and_milk_cans_used_by_Oneg_Shabbat.jpg'
};
const lessons = [
  {
    ids: ['wall', 'inside', 'bridge'], start: 'wall', image: 'closed',
    date: '1940–1942', title: L('A city cut off', 'עיר שנכלאה'),
    question: L('What did the wall change?', 'מה שינתה החומה?'),
    objective: L('Look beyond the bricks. Investigate how confinement changed everyday life.', 'הביטו מעבר ללבנים. גלו כיצד הכליאה שינתה את חיי היומיום.'),
    evidence: [
      L('Before the war, Warsaw was a major center of Jewish life and culture. German authorities established the ghetto in 1940 and sealed it that November.', 'לפני המלחמה הייתה ורשה מרכז חשוב של חיים ותרבות יהודיים. השלטונות הגרמניים הקימו את הגטו ב־1940 וסגרו אותו בנובמבר.'),
      L('The wall imposed isolation. Overcrowding, hunger, and disease devastated the people forced to live inside. The street photograph is evidence of that imposed boundary; the 3D street is an interpretation.', 'החומה כפתה בידוד. צפיפות, רעב ומחלות פגעו בתושבים שנאלצו לחיות בפנים. תצלום הרחוב הוא תיעוד של הגבול הכפוי; הרחוב בתלת ממד הוא פרשנות חזותית.')
    ],
    prompt: L('Which conclusion does the wall photograph support?', 'איזו מסקנה נתמכת בתצלום החומה?'),
    answers: [L('Residents chose to live apart.', 'התושבים בחרו לחיות בנפרד.'), L('Movement through this street was physically blocked.', 'התנועה ברחוב הזה נחסמה פיזית.'), L('The photograph explains every resident’s experience.', 'התצלום מסביר את חווייתו של כל תושב.')], correct: 1,
    explanation: L('The wall blocks the street. A photograph can show a physical barrier, but cannot tell us everything about daily life or people’s choices. Test those questions against testimony and other records.', 'החומה חוסמת את הרחוב. תצלום יכול להראות מחסום פיזי, אך אינו מספר הכול על חיי היומיום ועל בחירותיהם של אנשים. לשם כך נדרשים גם עדויות ותיעוד נוסף.'),
    source: history, sourceName: L('USHMM · Warsaw', 'מוזיאון השואה האמריקאי · ורשה')
  },
  {
    ids: ['trains'], start: 'trains', image: null,
    date: L('Summer 1942', 'קיץ 1942'), title: L('The deportations', 'הגירושים'),
    question: L('Why did resistance become urgent?', 'מדוע ההתנגדות נעשתה דחופה?'),
    objective: L('Connect the deportations of 1942 to the preparations for resistance.', 'קשרו בין גירושי 1942 להכנות להתנגדות.'),
    evidence: [L('From July to September 1942, German SS and police, assisted by auxiliaries, deported about 265,000 Jews from Warsaw to the Treblinka killing center.', 'מיולי עד ספטמבר 1942 גירשו אנשי אס־אס ומשטרה גרמניים, בסיוע כוחות עזר, כ־265,000 יהודים מוורשה למרכז ההשמדה טרבלינקה.'), L('As knowledge of mass murder spread, underground groups organized resistance. The deportations help explain the urgency of their preparations; they were not ordinary journeys or voluntary relocation.', 'ככל שהגיע מידע על הרצח ההמוני, ארגוני מחתרת נערכו להתנגדות. הגירושים מסבירים את דחיפות ההכנות; אלה לא היו נסיעות רגילות או מעבר מרצון.')],
    prompt: L('What gives the railway scene its historical meaning?', 'מה מעניק לסצנת הרכבת את משמעותה ההיסטורית?'),
    answers: [L('The documented destination and forced deportations.', 'היעד המתועד והגירוש בכפייה.'), L('The appearance of the locomotive alone.', 'מראה הקטר בלבד.'), L('A visitor’s ability to change the destination.', 'יכולתו של המבקר לשנות את היעד.')], correct: 0,
    explanation: L('The records establish who was deported, by whom, and to where. A reconstructed train cannot establish those facts by itself. Historical context turns scenery into understanding.', 'התיעוד מלמד מי גורש, בידי מי ולאן. רכבת משוחזרת אינה מוכיחה עובדות אלה בעצמה. ההקשר ההיסטורי מאפשר להבין את הסצנה.'),
    source: 'https://encyclopedia.ushmm.org/content/en/article/deportations-to-and-from-the-warsaw-ghetto', sourceName: L('USHMM · Deportations from Warsaw', 'מוזיאון השואה האמריקאי · הגירושים מוורשה')
  },
  {
    ids: ['two', 'zzw', 'january', 'map'], start: 'two', image: 'cans',
    date: '1942–1943', title: L('Many forms of resistance', 'פנים רבות להתנגדות'),
    question: L('Can preserving a record be resistance?', 'האם שמירת תיעוד יכולה להיות התנגדות?'),
    objective: L('Discover armed organizing alongside the work of documenting Jewish life.', 'גלו את ההתארגנות החמושה לצד התיעוד של החיים היהודיים.'),
    evidence: [L('The ŻOB and ŻZW organized armed resistance. Alongside that history, Emanuel Ringelblum and the Oneg Shabbat group gathered accounts, documents, and everyday materials in a secret archive.', 'אי״ל ואצ״י ארגנו התנגדות חמושה. לצד זאת, עמנואל רינגלבלום ואנשי עונג שבת אספו עדויות, מסמכים וחומרים מחיי היומיום לארכיון סודי.'), L('The archive preserved Jewish perspectives for the future. Its records also document underground education, cultural work, smuggling, and armed resistance. People acted in different ways under extreme constraints.', 'הארכיון שימר נקודות מבט יהודיות לדורות הבאים. הוא מתעד גם חינוך מחתרתי, פעילות תרבותית, הברחות והתנגדות חמושה. אנשים פעלו בדרכים שונות בתנאים קיצוניים.')],
    prompt: L('Why is the Oneg Shabbat archive important?', 'מדוע ארכיון עונג שבת חשוב?'),
    answers: [L('It proves that all residents had the same experience.', 'הוא מוכיח שלכל התושבים הייתה אותה חוויה.'), L('It replaces every other historical source.', 'הוא מחליף כל מקור היסטורי אחר.'), L('It preserves voices and records from within the ghetto.', 'הוא משמר קולות ותיעוד מתוך הגטו.')], correct: 2,
    explanation: L('Preserving documents challenged erasure and left evidence from inside the ghetto. These voices must be read alongside other sources, with attention to who created each record and why.', 'שמירת המסמכים נאבקה במחיקת הזיכרון והותירה תיעוד מתוך הגטו. יש לקרוא קולות אלה לצד מקורות נוספים ולבחון מי יצר כל מקור ומדוע.'),
    source: archive, sourceName: L('USHMM · The Oneg Shabbat archive', 'מוזיאון השואה האמריקאי · ארכיון עונג שבת')
  },
  {
    ids: ['april', 'flags', 'brush', 'burning', 'mila', 'sewers', 'raid'], start: 'april', image: null,
    date: L('19 April – May 1943', '19 באפריל – מאי 1943'), title: L('The uprising', 'המרד'),
    question: L('What can a reconstruction tell us?', 'מה אפשר ללמוד משחזור?'),
    objective: L('Explore the places of resistance, then distinguish evidence from interpretation.', 'חקרו את מוקדי ההתנגדות והבחינו בין תיעוד לפרשנות.'),
    evidence: [L('On 19 April 1943, German troops and police entered the ghetto to deport its remaining inhabitants. Jewish fighters resisted. Many civilians hid in bunkers and refused to report for deportation.', 'ב־19 באפריל 1943 נכנסו כוחות גרמניים לגטו כדי לגרש את תושביו שנותרו. לוחמים יהודים התנגדו. אזרחים רבים הסתתרו בבונקרים וסירבו להתייצב לגירוש.'), L('German forces burned buildings to force people out of hiding. The street scenes here are reconstructions. They help explain space and chronology, but their camera angles, movements, and effects are not archival footage.', 'הכוחות הגרמניים הציתו מבנים כדי להוציא אנשים ממחבואם. סצנות הרחוב כאן הן שחזורים. הן מסייעות להסביר מרחב ורצף אירועים, אך זוויות הצילום, התנועות והאפקטים אינם תיעוד מצולם מהתקופה.')],
    prompt: L('How should you interpret a reconstructed battle scene?', 'כיצד יש לפרש סצנת קרב משוחזרת?'),
    answers: [L('As an exact recording of the event.', 'כהקלטה מדויקת של האירוע.'), L('As an illustration to compare with documented accounts.', 'כהמחשה שיש להשוות לתיעוד ולעדויות.'), L('As proof of every detail shown on screen.', 'כהוכחה לכל פרט שמופיע על המסך.')], correct: 1,
    explanation: L('A reconstruction is an interpretation. Use the linked historical account and the photograph credits to investigate its basis. Do not assume every visual detail is established by a source.', 'שחזור הוא פרשנות. השתמשו במקור ההיסטורי המקושר ובפרטי התצלומים כדי לבדוק את הבסיס שלו. אין להניח שכל פרט חזותי נתמך במקור.'),
    source: uprising, sourceName: L('USHMM · Warsaw Ghetto Uprising', 'מוזיאון השואה האמריקאי · מרד גטו ורשה')
  },
  {
    ids: ['lastday', 'after', 'israel'], start: 'lastday', image: null,
    date: L('16 May 1943 · and after', '16 במאי 1943 · והלאה'), title: L('What remains', 'מה נשאר'),
    question: L('How do we remember without simplifying?', 'כיצד זוכרים בלי לפשט?'),
    objective: L('Separate the end of the uprising from the continuing work of memory.', 'הבחינו בין סיום המרד לבין עבודת הזיכרון הנמשכת.'),
    evidence: [L('On 16 May 1943, Jürgen Stroop ordered the destruction of the Great Synagogue to mark the end of the uprising. The ghetto had been devastated. Surviving residents were deported to camps.', 'ב־16 במאי 1943 הורה יירגן שטרופ להרוס את בית הכנסת הגדול כדי לציין את סיום המרד. הגטו נחרב ותושביו ששרדו גורשו למחנות.'), L('Read survivors’ accounts as individual voices. The Warsaw Ghetto Uprising of 1943 is distinct from the Warsaw Uprising of 1944. Later commemoration belongs to the history of memory, not to the 28-day chronology.', 'קראו עדויות של ניצולים כקולות של אנשים שונים. מרד גטו ורשה ב־1943 שונה ממרד ורשה ב־1944. ההנצחה המאוחרת שייכת לתולדות הזיכרון ולא לרצף של 28 ימי המרד.')],
    prompt: L('Which statement keeps the chronology accurate?', 'איזו אמירה שומרת על דיוק כרונולוגי?'),
    answers: [L('The 1943 ghetto uprising and the 1944 Warsaw uprising are different events.', 'מרד הגטו ב־1943 ומרד ורשה ב־1944 הם אירועים שונים.'), L('Every chapter shown here happened during the 28 days.', 'כל פרק שמוצג כאן התרחש במהלך 28 הימים.'), L('The end of the uprising ended all persecution.', 'סיום המרד שם קץ לכל הרדיפות.')], correct: 0,
    explanation: L('The ghetto uprising took place in April–May 1943. The wider Warsaw uprising began in August 1944. The earlier context and later remembrance on this site extend beyond the uprising’s dates.', 'מרד הגטו התרחש באפריל–מאי 1943. מרד ורשה החל באוגוסט 1944. הרקע המוקדם וההנצחה המאוחרת באתר חורגים מתאריכי מרד הגטו.'),
    source: history, sourceName: L('USHMM · Warsaw: history and aftermath', 'מוזיאון השואה האמריקאי · ורשה וההמשך')
  }
];

const root = document.documentElement;
const key = 'days28-field-guide-v1';
let stored = {};
try { stored = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { /* storage is optional */ }
const state = {
  solved: Array.isArray(stored.solved) ? [...new Set(stored.solved.filter(i => Number.isInteger(i) && i >= 0 && i < lessons.length))] : [],
  reflection: typeof stored.reflection === 'string' ? stored.reflection.slice(0, 2000) : '',
  last: CHAPTERS.some(c => c.id === stored.last) ? stored.last : 'wall'
};
let selected = Math.max(0, lessons.findIndex(l => l.ids.includes(state.last)));
let view = 'investigate';
let opener;
let storageOK = true;
const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch { storageOK = false; } };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t = {
  guide: L('Field guide', 'מדריך מסע'), close: L('Close field guide', 'סגירת המדריך'),
  investigate: L('Investigate', 'חקר'), journal: L('My journal', 'היומן שלי'), read: L('Reading view', 'תצוגת קריאה'),
  begin: L('Enter the story', 'כניסה לסיפור המרד'), resume: L('Resume exploration', 'המשך המסע'),
  explore: L('Explore this place', 'ביקור במקום'), insight: L('Investigations completed', 'חקירות שהושלמו'),
  source: L('Read the historical source ↗', 'קריאת המקור ההיסטורי ↗'),
};

const dialog = document.createElement('dialog');
dialog.className = 'field'; dialog.id = 'field-guide'; dialog.setAttribute('aria-labelledby', 'field-title'); dialog.dir = HE ? 'rtl' : 'ltr';
dialog.innerHTML = `<header class="field__header"><div><p class="field__eyebrow">${L('28 DAYS / A HISTORICAL EXPLORATION', '28 ימים / מסע היסטורי')}</p><h2 id="field-title">${t.guide}</h2></div><button class="field__close" aria-label="${t.close}">×</button></header>
  <nav class="field__views" aria-label="${L('Guide views', 'תצוגות המדריך')}">${['investigate','journal','read'].map(v => `<button data-view="${v}" aria-pressed="${v === view}">${t[v]}</button>`).join('')}</nav>
  <div class="field__layout"><nav class="field__chapters" aria-label="${L('Five investigations', 'חמש חקירות')}"></nav><div class="field__content" id="field-content"></div></div>
  <footer class="field__footer"><span id="field-count"></span><span>${L('Explore · Examine · Reflect', 'חקר · בחינה · מחשבה')}</span></footer>`;
document.body.append(dialog);
const content = dialog.querySelector('.field__content');

function updateProgress() {
  dialog.querySelector('#field-count').textContent = `${state.solved.length} / 5 · ${t.insight}`;
  dialog.querySelector('.field__chapters').innerHTML = lessons.map((l, i) => `<button data-lesson="${i}" ${selected === i ? 'aria-current="step"' : ''}><span class="field__number">${String(i + 1).padStart(2, '0')}</span><span><small>${l.date}</small><b>${l.title}</b></span><span class="field__check" aria-label="${state.solved.includes(i) ? L('Completed', 'הושלם') : L('Not completed', 'טרם הושלם')}">${state.solved.includes(i) ? '✓' : '○'}</span></button>`).join('');
  launcher.querySelector('span').textContent = `${t.guide} · ${state.solved.length}/5`;
}

function sourceBlock(l) {
  return `<a class="field__source" href="${l.source}" target="_blank" rel="noopener">${t.source}<small>${l.sourceName}</small></a>`;
}

function render(focus = false) {
  updateProgress();
  dialog.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  const l = lessons[selected];
  if (view === 'journal') {
    content.innerHTML = `<p class="field__eyebrow">${L('YOUR DISCOVERIES', 'התגליות שלכם')}</p><h3>${L('A record of understanding', 'תיעוד של הבנה')}</h3><p class="field__lead">${L('Each completed investigation adds an insight here. You can revisit any chapter.', 'כל חקירה שהושלמה מוסיפה תובנה ליומן. אפשר לחזור לכל פרק.')}</p>
      <div class="field__journal">${state.solved.length ? [...state.solved].sort().map(i => `<article><small>${lessons[i].date}</small><h4>${lessons[i].title}</h4><p>${lessons[i].explanation}</p><button class="field__text-button" data-lesson="${i}">${L('Revisit investigation →', 'חזרה לחקירה ←')}</button></article>`).join('') : `<p>${L('Your journal is ready. Start with the wall, examine the evidence, and answer the investigation question.', 'היומן מוכן. התחילו בחומה, בחנו את התיעוד והשיבו לשאלת החקירה.')}</p>`}</div>
      <label class="field__reflection-label" for="field-reflection">${L('What changed your understanding?', 'מה שינה את ההבנה שלכם?')}</label><textarea id="field-reflection" aria-describedby="field-save" rows="4" maxlength="2000" placeholder="${L('Write a reflection…', 'כתבו מחשבה…')}">${esc(state.reflection)}</textarea><p id="field-save" class="field__note" role="status">${storageOK ? L('Saved on this device only. Nothing is sent.', 'נשמר במכשיר הזה בלבד. דבר אינו נשלח.') : L('Device storage is unavailable. Your journal lasts for this visit.', 'האחסון במכשיר אינו זמין. היומן נשמר למשך הביקור הזה.')}</p><button class="field__text-button" data-reset>${L('Clear my journal', 'ניקוי היומן שלי')}</button><div id="field-reset"></div>`;
  } else {
    content.innerHTML = `<p class="field__eyebrow">${L('INVESTIGATION', 'חקירה')} ${String(selected + 1).padStart(2, '0')} / 05 · ${l.date}</p><h3>${l.question}</h3><p class="field__lead">${l.objective}</p>
      ${l.image ? `<figure class="field__photo"><img src="./assets/personal/28-days/img/${l.image}.jpg" alt="${l.image === 'closed' ? L('A wall blocks a Warsaw street in an archival photograph.', 'חומה חוסמת רחוב בוורשה בתצלום ארכיוני.') : L('Containers used to preserve the Ringelblum archive.', 'מכלים ששימשו לשימור ארכיון רינגלבלום.')}" loading="lazy"><figcaption>${L('Source photograph · ', 'תצלום מקור · ')}<a href="${photoCredits[l.image]}" target="_blank" rel="noopener">${L('Provenance and credits ↗', 'מקור וקרדיט ↗')}</a></figcaption></figure>` : ''}
      <div class="field__evidence"><h4>${L('Examine the evidence', 'בחינת התיעוד')}</h4>${l.evidence.map(p => `<p>${p}</p>`).join('')}</div>${sourceBlock(l)}
      ${view === 'investigate' ? `<fieldset class="field__challenge"><legend>${l.prompt}</legend>${l.answers.map((a, i) => `<button class="field__answer" data-answer="${i}" aria-pressed="false"><span>${String.fromCharCode(65 + i)}</span>${a}</button>`).join('')}<div id="field-feedback" class="field__feedback" role="status">${state.solved.includes(selected) ? L('✓ This insight is saved in your journal. You can examine it again.', '✓ התובנה הזו שמורה ביומן. אפשר לבחון אותה שוב.') : ''}</div></fieldset>` : `<p class="field__note">${L('This view works without walking or interacting with the 3D world. Use the chapter list to read at your own pace.', 'תצוגה זו פועלת ללא הליכה או אינטראקציה עם עולם התלת ממד. השתמשו ברשימת הפרקים לקריאה בקצב שלכם.')}</p>`}
      <div class="field__actions"><button class="field__primary" data-explore>${t.explore} ${HE ? '←' : '→'}</button><button class="field__secondary" data-next>${selected < 4 ? L('Next investigation', 'לחקירה הבאה') : t.journal}</button></div>
      <p class="field__note">${L('The 3D environments and animated cover are illustrations. Photographs and documented testimony are historical sources.', 'סביבות התלת ממד והכריכה המונפשת הן המחשות. תצלומים ועדויות מתועדות הם מקורות היסטוריים.')}</p>`;
  }
  const title = content.querySelector('h3');
  title.tabIndex = -1;
  if (focus) title.focus({preventScroll:true});
  content.scrollTop = 0;
}

function open(v = 'investigate', index = selected) {
  opener = document.activeElement;
  view = v; selected = index;
  // Stop existing auto-walk; opening the guide must hold the visitor's place.
  const walk = document.querySelector('#walk');
  if (walk?.getAttribute('aria-pressed') === 'true') walk.click();
  root.classList.add('field-open');
  document.dispatchEvent(new Event('days28-guide-open'));
  render(); dialog.showModal();
}
function navigate(id) {
  const index = CHAPTERS.findIndex(c => c.id === id);
  dialog.close();
  const pin = document.querySelector(`.mini__pin[data-go="${index}"]`);
  if (pin && !root.classList.contains('no-gl')) pin.click();
  else open('read', Math.max(0, lessons.findIndex(l => l.ids.includes(id))));
}

const launcher = document.createElement('button');
launcher.type = 'button'; launcher.className = 'field-launcher'; launcher.setAttribute('aria-haspopup', 'dialog'); launcher.setAttribute('aria-controls', dialog.id);
launcher.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 5v15M3 4c4-1 7 0 9 1 2-1 5-2 9-1v15c-4-1-7 0-9 1-2-1-5-2-9-1z"/></svg><span>${t.guide}</span>`;
document.body.append(launcher);
launcher.addEventListener('click', () => open());
dialog.querySelector('.field__close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { root.classList.remove('field-open'); document.dispatchEvent(new Event('days28-guide-close')); if (opener?.isConnected) opener.focus({preventScroll:true}); });
dialog.addEventListener('click', e => {
  const button = e.target.closest('button');
  if (!button) return;
  if (button.dataset.view) { view = button.dataset.view; render(); }
  if (button.dataset.lesson !== undefined) { selected = Number(button.dataset.lesson); if (view === 'journal') view = 'investigate'; render(true); }
  if (button.hasAttribute('data-explore')) navigate(lessons[selected].start);
  if (button.hasAttribute('data-next')) { if (selected < 4) selected++; else view = 'journal'; render(true); }
  if (button.hasAttribute('data-reset')) {
    content.querySelector('#field-reset').innerHTML = `<p class="field__note">${L('Clear completed investigations and your reflection from this device?', 'לנקות את החקירות שהושלמו ואת המחשבה שכתבתם מהמכשיר הזה?')}</p><button class="field__secondary" data-confirm-reset>${L('Yes, clear journal', 'כן, ניקוי היומן')}</button> <button class="field__secondary" data-cancel-reset>${L('Keep journal', 'שמירת היומן')}</button>`;
    content.querySelector('[data-confirm-reset]').focus();
  }
  if (button.hasAttribute('data-cancel-reset')) { content.querySelector('#field-reset').replaceChildren(); content.querySelector('[data-reset]').focus(); }
  if (button.hasAttribute('data-confirm-reset')) { state.solved = []; state.reflection = ''; state.last = 'wall'; save(); render(true); }
  if (button.dataset.answer !== undefined) {
    const l = lessons[selected];
    const correct = Number(button.dataset.answer) === l.correct;
    dialog.querySelectorAll('[data-answer]').forEach(b => { b.setAttribute('aria-pressed', String(b === button)); b.classList.remove('is-correct','is-retry'); });
    button.classList.add(correct ? 'is-correct' : 'is-retry');
    const feedback = content.querySelector('#field-feedback');
    feedback.textContent = `${correct ? L('Insight recorded. ', 'התובנה נשמרה. ') : L('Look again. ', 'בחנו שוב. ')}${l.explanation}`;
    if (correct && !state.solved.includes(selected)) { state.solved.push(selected); save(); updateProgress(); }
  }
});
dialog.addEventListener('input', e => {
  if (e.target.id !== 'field-reflection') return;
  state.reflection = e.target.value; save();
  content.querySelector('#field-save').textContent = storageOK ? L('Reflection saved on this device.', 'המחשבה נשמרה במכשיר הזה.') : L('Device storage is unavailable. Your journal lasts for this visit.', 'האחסון במכשיר אינו זמין. היומן נשמר למשך הביקור הזה.');
});

const intro = document.createElement('div'); intro.className = 'field-intro';
intro.innerHTML = `<p class="field-intro__label">${L('THE WARSAW GHETTO UPRISING', 'מרד גטו ורשה')}</p><p class="field-intro__dates">${L('19 April — 16 May 1943', '19 באפריל — 16 במאי 1943')}</p>`;
const cover = document.querySelector('.cover');
cover.querySelector('.cover__title').before(intro);
const start = document.createElement('button'); start.type = 'button'; start.className = 'btn btn--solid field-start'; start.textContent = t.begin;
start.addEventListener('click', () => document.querySelector('#enter-quiet').click());
const read = document.createElement('button'); read.type = 'button'; read.className = 'field-read'; read.textContent = L('Prefer to read? Open the field guide →', 'מעדיפים לקרוא? פתחו את המדריך ←');
read.addEventListener('click', () => open('read', 0));
cover.querySelector('.cover__go').before(start);
cover.querySelector('.cover__hint').replaceWith(read);
if (stored.last && stored.last !== 'cover') {
  const resume = document.createElement('button'); resume.type = 'button'; resume.className = 'field-read'; resume.textContent = t.resume;
  resume.addEventListener('click', () => navigate(state.last)); read.after(resume);
}
const observer = new MutationObserver(() => {
  const chapter = root.dataset.chapter;
  if (!chapter || chapter === 'cover') return;
  const i = lessons.findIndex(l => l.ids.includes(chapter));
  if (i < 0) return;
  state.last = chapter; save();
  if (!dialog.open) selected = i;
});
observer.observe(root, { attributes:true, attributeFilter:['data-chapter'] });
updateProgress();


