/* ============================================================
   What each photograph in the street is.

   A touch on a photograph opens it beside the picture, with what
   is known of it: what it shows, who took it and why, and what
   became of the people or the place in it.

   Sources: United States Holocaust Memorial Museum, Holocaust
   Encyclopedia and photo archives. Yad Vashem photo archive. The
   Stroop Report (the captions quoted are Stroop's own). The Jewish
   Historical Institute, Warsaw (the Ringelblum Archive). POLIN
   Museum of the History of Polish Jews.
   ============================================================ */

import { HE } from './lang.js';

const L = (en, he) => (HE ? he : en);

export const SHOT_UI = {
  k: L('The record · a photograph', 'התיעוד · תצלום'),
  open: L('About this photograph', 'על התצלום הזה'),
  close: L('Close', 'סגירה'),
};

/* id: [when and where, what is known of it] */
export const SHOTS = {
  wall: [L('Warsaw · 1940', 'ורשה · 1940'), [
    L('Building began in April 1940, months before the ghetto was announced. The Germans called the district an area threatened by epidemic.', 'הבנייה החלה באפריל 1940, חודשים לפני ההכרזה על הגטו. הגרמנים כינו את הרובע אזור מוכה מגפה.'),
    L('A German firm built the wall. Jewish workers laid the bricks, and the Jewish council was sent the bill.', 'חברה גרמנית בנתה את החומה. פועלים יהודים הניחו את הלבנים, והחשבון נשלח ליודנראט.'),
  ]],
  tram: [L('Leszno and Karmelicka Streets · May 1941', 'רחובות לשנו וקרמליצקה · מאי 1941'), [
    L('Inside the ghetto there were trams for Jews only. Where the number of the line should be, they carried a Star of David.', 'בתוך הגטו נסעו חשמליות ליהודים בלבד. במקום מספר הקו נשאו מגן דוד.'),
    L('The photographer, Ludwig Knobloch, was a soldier in a German army propaganda company.', 'הצלם, לודוויג קנובלוך, היה חייל בפלוגת תעמולה של הצבא הגרמני.'),
  ]],
  smuggle: [L('The ghetto wall · 1941', 'חומת הגטו · 1941'), [
    L('Nobody could live on the official ration. Most of what the ghetto ate was smuggled in: over the wall, through holes in it, through cellars and gates.', 'איש לא יכול היה לחיות מהמנה הרשמית. רוב מה שאכל הגטו הוברח פנימה: מעל החומה, דרך פרצות בה, דרך מרתפים ושערים.'),
    L('Much of it was carried by children, who were small enough to get through. Those who were caught were beaten or shot.', 'חלק גדול נשאו ילדים, שהיו קטנים דיים לעבור. מי שנתפס הוכה או נורה.'),
  ]],
  children: [L('Mariańska Street · 1941', 'רחוב מריאנסקה · 1941'), [
    L('By 1941 thousands of children were living on the streets of the ghetto: orphaned, or sent out to beg for families that had nothing.', 'ב־1941 חיו אלפי ילדים ברחובות הגטו: יתומים, או ילדים שנשלחו לקבץ נדבות למען משפחות שלא נותר להן דבר.'),
    L('The ghetto’s own aid societies ran kitchens and shelters for them. They could not feed them all.', 'אגודות הסעד של הגטו עצמו הפעילו למענם מטבחים ומקלטים. הן לא יכלו להאכיל את כולם.'),
  ]],
  cans: [L('The Ringelblum Archive · Warsaw', 'ארכיון רינגלבלום · ורשה'), [
    L('Ten metal boxes were buried under 68 Nowolipki Street on 3 August 1942, and two milk cans in February 1943. The boxes were found in 1946 and the cans in 1950.', 'עשר תיבות מתכת נטמנו מתחת לרחוב נובוליפקי 68 ב־3 באוגוסט 1942, ושני כדי חלב בפברואר 1943. התיבות נמצאו ב־1946 והכדים ב־1950.'),
    L('A third part, buried on the eve of the uprising, has never been found.', 'חלק שלישי, שנטמן ערב המרד, לא נמצא עד היום.'),
  ]],
  ringelblum: [L('Emanuel Ringelblum · 1900 to 1944', 'עמנואל רינגלבלום · 1900 עד 1944'), [
    L('A historian and a teacher. By day he worked in the ghetto’s self help organisation. At night he wrote down what he had seen, and gathered others to do the same.', 'היסטוריון ומורה. ביום עבד בארגון העזרה העצמית של הגטו. בלילה רשם את מה שראה, וכינס אחרים שיעשו כמוהו.'),
    L('He stands a little further up the street. You can ask him.', 'הוא עומד מעט הלאה ברחוב. אפשר לשאול אותו.'),
  ]],
  crowd: [L('Prosta Street · May 1941', 'רחוב פרוסטה · מאי 1941'), [
    L('From 1 December 1939 every Jew in Warsaw over the age of ten had to wear a white band with a blue Star of David on the right sleeve.', 'מ־1 בדצמבר 1939 חויב כל יהודי בוורשה מעל גיל עשר לענוד על השרוול הימני סרט לבן ועליו מגן דוד כחול.'),
    L('People sold them in the street. To be found without one could mean prison.', 'היו שמכרו אותם ברחוב. מי שנתפס בלעדיו היה צפוי למאסר.'),
  ]],
  pocket: [L('From the Stroop Report · April 1943', 'מתוך דוח שטרופ · אפריל 1943'), [
    L('Stroop’s caption: “Fight against a resistance pocket.” The photographs in his report were taken by his own men, to show Himmler the work being done.', 'הכיתוב של שטרופ: ״לחימה נגד קן התנגדות.״ את התצלומים בדוח צילמו אנשיו, כדי להראות להימלר את העבודה הנעשית.'),
  ]],
  squareflag: [L('7 Muranowska Street', 'רחוב מורנובסקה 7'), [
    L('The headquarters of the ŻZW was in this house. A tunnel ran from its cellar under the wall to number 6, on the other side of the street and of the wall.', 'בבית הזה שכן מטה אצ״י. מהמרתף שלו נמשכה מנהרה מתחת לחומה אל מספר 6, מעבר לרחוב ומעבר לחומה.'),
    L('Two flags were raised on a roof on the square. They could be seen from outside the ghetto.', 'שני דגלים הונפו על גג בכיכר. הם נראו מחוץ לגטו.'),
  ]],
  gun: [L('From the Stroop collection · 1943', 'מאוסף שטרופ · 1943'), [
    L('Against pistols and bottles of petrol the Germans brought field guns, anti aircraft guns and flame throwers.', 'מול אקדחים ובקבוקי בנזין הביאו הגרמנים תותחי שדה, תותחי נ״מ ולהביורים.'),
  ]],
  stroop: [L('From the Stroop Report · 1943', 'מתוך דוח שטרופ · 1943'), [
    L('He sent Himmler a report every day, and bound them into an album with the title: “The Jewish quarter of Warsaw is no more!”', 'הוא שלח להימלר דוח מדי יום, וכרך אותם לאלבום שכותרתו: ״הרובע היהודי בוורשה איננו עוד!״'),
    L('He stands in the walk, on the last day. He too can be asked.', 'הוא עומד בהמשך הדרך, ביום האחרון. גם אותו אפשר לשאול.'),
  ]],
  askaris: [L('From the Stroop Report · 1943', 'מתוך דוח שטרופ · 1943'), [
    L('They had been Soviet prisoners of war. The SS trained them as guards at Trawniki, near Lublin, and used them in the deportations and in the ghetto.', 'הם היו שבויי מלחמה סובייטים. האס־אס הכשיר אותם לשומרים בטרווניקי שליד לובלין, והשתמש בהם בגירושים ובגטו.'),
  ]],
  nalewki: [L('Nalewki Street · 1943', 'רחוב נלבקי · 1943'), [
    L('Before the war Nalewki was the busiest street of Jewish Warsaw. On 19 April one of the two German columns was stopped at its corner with Gęsia Street.', 'לפני המלחמה היה נלבקי הרחוב ההומה ביותר בוורשה היהודית. ב־19 באפריל נעצר אחד משני הטורים הגרמניים בפינת רחוב גנשה.'),
  ]],
  squad: [L('From the Stroop Report · 1943', 'מתוך דוח שטרופ · 1943'), [
    L('Stroop’s caption: “An assault squad.” They went from house to house, set each one on fire, and waited for the people inside to come out.', 'הכיתוב של שטרופ: ״חוליית הסתערות.״ הם עברו מבית לבית, הציתו כל אחד, וחיכו שהאנשים בפנים ייצאו.'),
  ]],
  armed: [L('From the Stroop Report · 1943', 'מתוך דוח שטרופ · 1943'), [
    L('Stroop’s caption: “These bandits resisted with arms.” In every one of his reports, “bandits” is his word for the fighters.', 'הכיתוב של שטרופ: ״הבנדיטים האלה התנגדו בנשק.״ בכל דוחותיו, ״בנדיטים״ היא המילה שלו ללוחמים.'),
  ]],
  fighters: [L('From the Stroop Report · 1943', 'מתוך דוח שטרופ · 1943'), [
    L('Stroop’s caption: “Women of the Hehalutz movement, captured with weapons.”', 'הכיתוב של שטרופ: ״נשים מתנועת החלוץ, שנתפסו עם נשק.״'),
    L('Yad Vashem names the woman on the right as Małka Zdrojewicz, who lived through the Majdanek camp.', 'יד ושם מזהה את האישה מימין כמלכה זדרויביץ, ששרדה את מחנה מיידנק.'),
  ]],
  boy: [L('From the Stroop Report · 1943', 'מתוך דוח שטרופ · 1943'), [
    L('Stroop’s caption: “Pulled from the bunkers by force.” It is one of the best known photographs of the Holocaust. Who the boy was has never been settled.', 'הכיתוב של שטרופ: ״הוצאו מהבונקרים בכוח.״ זהו אחד התצלומים הידועים ביותר מהשואה. זהות הילד לא נקבעה מעולם.'),
    L('The SS man with the gun is Josef Blösche. He was tried in East Germany and executed in 1969.', 'איש האס־אס עם הנשק הוא יוזף בלושה. הוא נשפט בגרמניה המזרחית והוצא להורג ב־1969.'),
  ]],
  march: [L('From the Stroop Report · 1943', 'מתוך דוח שטרופ · 1943'), [
    L('Those taken alive were marched to the Umschlagplatz and sent on: to Treblinka, to Majdanek, and to the labour camps at Poniatowa and Trawniki.', 'מי שנתפסו חיים הוצעדו לאומשלגפלאץ ונשלחו הלאה: לטרבלינקה, למיידנק, ולמחנות העבודה בפוניאטובה ובטרווניקי.'),
  ]],
  mound: [L('18 Miła Street · today', 'רחוב מילא 18 · היום'), [
    L('The bunker was never dug out. In 1946 a mound was raised over it from the rubble of the street, with a stone on top.', 'הבונקר לא נחפר מעולם. ב־1946 נערמה מעליו תלולית מהריסות הרחוב, ובראשה אבן.'),
    L('A second stone, set up in 2006, carries the names of 51 fighters known to have died there.', 'אבן שנייה, שהוצבה ב־2006, נושאת את שמותיהם של 51 לוחמים שידוע כי מתו שם.'),
  ]],
  edelman: [L('Marek Edelman', 'מארק אדלמן'), [
    L('In 1945 he wrote The Ghetto Fights, the first account of the uprising by one of its commanders.', 'ב־1945 כתב את ״הגטו לוחם״, התיאור הראשון של המרד מפי אחד ממפקדיו.'),
    L('He stands in the walk, at the brushmakers. You can ask him.', 'הוא עומד בדרך, אצל המברשתנים. אפשר לשאול אותו.'),
  ]],
  lubetkin: [L('Zivia Lubetkin', 'צביה לובטקין'), [
    L('She gave evidence at the trial of Adolf Eichmann in Jerusalem in 1961. What she says in the walk is taken from it.', 'היא העידה במשפט אייכמן בירושלים ב־1961. מה שהיא אומרת בדרך לקוח מעדותה.'),
  ]],
  zuckerman: [L('Jerusalem · 1961', 'ירושלים · 1961'), [
    L('He and Zivia Lubetkin were married. Together they founded the Ghetto Fighters’ House, in the kibbutz they helped to found.', 'הוא וצביה לובטקין היו נשואים. יחד ייסדו את בית לוחמי הגטאות, בקיבוץ שהיו ממייסדיו.'),
  ]],
  rotem: [L('Simcha Rotem · 2013', 'שמחה רותם · 2013'), [
    L('He was the last of the fighters known to be living. He died in Jerusalem in December 2018, aged 94.', 'הוא היה האחרון מהלוחמים שנודע כי נותר בחיים. הוא מת בירושלים בדצמבר 2018, בן 94.'),
  ]],
  anielewicz: [L('Mordechai Anielewicz', 'מרדכי אנילביץ׳'), [
    L('No photograph of him from the uprising is known. This one was taken before the war.', 'לא ידוע על תצלום שלו מימי המרד. התצלום הזה צולם לפני המלחמה.'),
  ]],
  bunker: [L('From the Stroop Report · 1943', 'מתוך דוח שטרופ · 1943'), [
    L('People spent months digging them: rooms under the cellars with bunks, water, food, air shafts and hidden ways in.', 'אנשים חפרו אותם במשך חודשים: חדרים מתחת למרתפים, עם דרגשים, מים, מזון, פתחי אוורור וכניסות נסתרות.'),
    L('Stroop counted 631 bunkers destroyed.', 'שטרופ מנה 631 בונקרים שהושמדו.'),
  ]],
  report: [L('May 1943', 'מאי 1943'), [
    L('Typed, bound in leather, with about fifty photographs. Three copies were made.', 'מודפס במכונת כתיבה, כרוך בעור, ובו כחמישים תצלומים. הוכנו שלושה עותקים.'),
    L('It was put in evidence at Nuremberg, and at his own trial in Warsaw.', 'הוא הוגש כראיה בנירנברג, ובמשפטו שלו בוורשה.'),
  ]],
};
