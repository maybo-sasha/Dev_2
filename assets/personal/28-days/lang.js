/* ============================================================
   Which language the page speaks.

   English, or Hebrew, the language of the book. The choice comes
   from the address (?lang=he), then from what was chosen last
   time, then from the browser. The head of the page has already
   put it on <html lang>, before anything was drawn.

   The words of the walk itself are in story.js and story.he.js.
   Here: the words of the page around it.
   ============================================================ */

const pick = () => {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'he' || q === 'en') return q;
  let saved = null;
  try { saved = localStorage.getItem('days28-lang'); } catch (e) { /* private window */ }
  if (saved === 'he' || saved === 'en') return saved;
  return /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en';
};
const tag = document.documentElement.lang;
export const LANG = tag === 'he' || tag === 'en' ? tag : pick();
export const HE = LANG === 'he';
document.documentElement.lang = LANG;

/* change language: the words are placed when the page is built, so it is built again, at the same place in the walk */
export function setLang(lang, u = 0) {
  try { localStorage.setItem('days28-lang', lang); } catch (e) { /* private window */ }
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  if (u > 0.3) url.searchParams.set('u', u.toFixed(3)); else url.searchParams.delete('u');
  location.href = url.toString();
}

const en = {
  walk: 'Walk for me', walking: 'Walking',
  soundOff: 'Sound off', soundOn: 'Sound on',
  other: 'עברית', otherLang: 'he', otherLabel: 'לעברית',
  first: 'This is a photograph from the record. Behind it, the place has been rebuilt. Continue, and you walk into it.',
  hint: 'Click, or press Enter.',
  hintFirst: 'Click, or press Enter. Then walk with W and S, or scroll. Step aside with A and D. Drag to look round.',
  nudge: 'Press Continue to walk on.',
  modeRecord: 'The record. A photograph.', modeBuilt: 'A reconstruction, built from the record.',
  perpetrators: 'Taken by the perpetrators, for the Stroop Report.',
  unknown: 'Photographer unknown.',
  by: (who) => `By ${who}.`,
  commons: 'Wikimedia Commons',
  date: (d) => (d <= 12 ? `${18 + d} April 1943` : `${d - 12} May 1943`),
  choiceNote: 'They fought on the same day, in two places. Both are on the map. Touch one to go there.',
  choiceOther: 'You have seen one of the two fights of the first day. The other is on the map.',
};

const he = {
  title: '28 ימי תגובה · מרד גטו ורשה',
  description: 'הליכה דרך גטו ורשה, מהחומה של 1940 ועד המרד של אפריל ומאי 1943. אתר זיכרון בתלת ממד מאת סשה מייבורודה.',
  walk: 'הוליכו אותי', walking: 'הולכים',
  soundOff: 'צליל כבוי', soundOn: 'צליל פועל',
  other: 'English', otherLang: 'en', otherLabel: 'To English',
  first: 'זהו תצלום מתוך התיעוד. מאחוריו נבנה המקום מחדש. המשיכו, ותיכנסו אליו.',
  hint: 'לחצו, או הקישו Enter.',
  hintFirst: 'לחצו, או הקישו Enter. אחר כך הולכים ב־W וב־S, או בגלילה. זזים הצדה ב־A וב־D. גוררים כדי להביט סביב.',
  nudge: 'לחצו על ״להמשיך״ כדי ללכת הלאה.',
  modeRecord: 'התיעוד. תצלום.', modeBuilt: 'שחזור, שנבנה מתוך התיעוד.',
  perpetrators: 'צולם בידי המבצעים, עבור דו״ח שטרופ.',
  unknown: 'הצלם אינו ידוע.',
  by: (who) => `צילום: ${who}.`,
  commons: 'ויקישיתוף',
  choiceOther: 'ראיתם אחד משני הקרבות של היום הראשון. השני מסומן על המפה.',
  choiceHint: 'גררו כדי לסובב את המפה. גללו כדי להתקרב.',
  shotOpen: 'על התצלום הזה',
  date: (d) => (d <= 12 ? `${18 + d} באפריל 1943` : `${d - 12} במאי 1943`),

  /* the words written into the page itself, by the name each carries in data-t */
  veil: 'בונים את הרחוב',
  markT: 'מרד גטו<br>ורשה',
  playground: 'Playground',
  day: 'יום',
  held: 'הזמן עצור. המשיכו ללכת דרכו. גררו כדי להביט סביב.',
  keysWalk: 'ללכת', keysTurn: 'לזוז הצדה', keysDrag: 'גרירה', keysLook: 'להביט סביב',
  choiceK: '19 באפריל 1943 · היום הראשון',
  choiceTitle: 'שתי מחתרות. שני קרבות.',
  choiceNote: 'הן לחמו באותו יום, בשני מקומות. שניהם על המפה. געו באחד כדי ללכת לשם.',
  choiceSeen: 'נצפה',
  orgZob: 'אי״ל', orgZobName: 'הארגון היהודי הלוחם',
  orgZzw: 'אצ״י', orgZzwName: 'האיגוד הצבאי היהודי',
  wayZobPlace: 'זמנהוף ומילא',
  wayZobText: 'בתי הפינה מחכים לטור. בקבוקים מהמרפסות, אקדחים מהחלונות.',
  wayZzwPlace: 'כיכר מורנובסקי',
  wayZzwText: 'מקלע בבתים שבכיכר, תותח שהובא מולם, ושני דגלים על גג.',
  wayGo: 'ללכת איתם',
  choiceOn: 'להמשיך ל־20 באפריל',
  coverSr: '28 ימי תגובה. אתר זיכרון למרד גטו ורשה, 19 באפריל עד 16 במאי 1943.',
  coverTitle: '28 ימי תגובה',
  coverNote: 'לכו ברחובות הגטו, הכירו את אי״ל ואצ״י ועקבו אחר ההכנות והלחימה במרד. סיפור של התנגדות, אומץ ואנשים — דרך סצנות משוחזרות ועדויות היסטוריות. כולל תצלומים שצולמו בשואה.',
  enterSound: 'כניסה עם צליל',
  enterQuiet: 'כניסה בשקט',
  coverHint: 'או גללו',
  photograph: 'תצלום',
  recordK: 'התיעוד · תצלום',
  recordTitle: 'התיעוד',
  recordGo: 'להמשיך',
  endTitle: 'מעטים מהלוחמים נשארו בחיים.',
  endP: 'ביניהם מארק אדלמן, שנשאר בפולין; וצביה לובטקין, יצחק צוקרמן ושמחה רותם, שהגיעו לכאן. את שארית חייהם הקדישו לספר על כך.',
  again: 'ללכת שוב',
  sources: 'מקורות וקרדיטים',
  back: 'חזרה ל־Playground',
  close: 'סגירה',
  srcHistory: 'ההיסטוריה',
  srcHist1: 'מוזיאון השואה של ארצות הברית, אנציקלופדיית השואה: ורשה, ומרד גטו ורשה.',
  srcHist2: 'יד ושם, מרכז המידע אודות השואה, ובו מכתבו האחרון של מרדכי אנילביץ׳.',
  srcHist3: 'מוזיאון פולין לתולדות יהודי פולין, ורשה.',
  srcHist4: 'יירגן שטרופ, דו״ח להיינריך הימלר, מאי 1943.',
  srcHist5: 'מארק אדלמן, הגטו לוחם, 1945.',
  srcHist6: 'פרוטוקול משפט אייכמן, ירושלים, 1961: עדויותיהם של צביה לובטקין ויצחק צוקרמן.',
  srcHist7: 'יאנוש קורצ׳אק, יומן הגטו. ארכיון רינגלבלום, המכון ההיסטורי היהודי בוורשה. קלוד לנצמן, שואה, 1985. קז׳ימייז׳ מוצ׳רסקי, שיחות עם תליין.',
  srcHist8: 'מגילת העצמאות, 14 במאי 1948. בית לוחמי הגטאות, קיבוץ לוחמי הגטאות.',
  srcPhotos: 'התצלומים',
  srcPhotosP: 'כולם מוויקישיתוף. רובם נחלת הכלל; האחרים מוצגים לפי רישיון Creative Commons הרשום לצדם. רבים מהם צולמו בידי המבצעים, עבור דו״ח שטרופ. הם מוצגים כאן כראיה. בעמוד הזה הם מודפסים בספיה, כפי שהספר מדפיס אותם.',
  srcMap: 'המפה',
  srcMapP: 'הועתקה מהמפה “Jewish holdouts, bunkers and areas of settlements in the Warsaw Ghetto (April to August 1943)” מאת BorysMapping, ויקישיתוף, CC BY-SA 4.0. העיבוד הזה משותף באותו רישיון.',
  srcSound: 'הצליל',
  srcSoundP: 'אין כאן שום הקלטה. הכינור, הקול, הרוח, האש והירי נוצרים בדפדפן שלכם, והקינה נכתבה לעמוד הזה. בפרק האחרון הכינור מנגן את לחן התקווה, שהוא נחלת הכלל.',
  srcPage: 'העמוד',
  srcPageP: 'עיצוב ובנייה: סשה מייבורודה, על פי הספר באותו שם. הרחוב, הבניינים והאש מעוצבים ומצוירים ב־WebGL. הקרבות הם שחזורים שנבנו מתוך העדויות הכתובות; אין תצלום שלהם. במקום שבו התמונה הופכת לתצלום, התצלום אמיתי. האנשים שאפשר לשאול עונים רק במילים שכתבו או אמרו, או במילות התיעוד, וכל תשובה אומרת איזו מהשתיים היא.',
  /* what a screen reader is told */
  ariaMark: '28 ימי תגובה, חזרה לכריכה',
  ariaControls: 'בקרה',
  ariaChapters: 'פרקים',
};

export const UI = HE ? he : en;

/* put the Hebrew into the page. In English the page already says what it says. */
export function wordPage() {
  const root = document.documentElement;
  if (HE) {
    document.querySelectorAll('[data-t]').forEach((el) => { const v = he[el.dataset.t]; if (v !== undefined) el.innerHTML = v; });
    document.querySelectorAll('[data-t-label]').forEach((el) => { const v = he[el.dataset.tLabel]; if (v) el.setAttribute('aria-label', v); });
    document.title = he.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', he.description);
  }
  const btn = document.querySelector('#lang');
  if (btn) {
    btn.querySelector('span').textContent = UI.other;
    btn.lang = UI.otherLang;
    btn.setAttribute('aria-label', UI.otherLabel);
  }
  root.classList.add('is-worded');
}

