/* ============================================================
   People you may ask.

   Nine people stand in the walk under their own names. Each can
   be asked three things. What they answer is not written for
   them: it is either their own words, as they wrote or said them
   and as the source named beside them records, or it is what the
   record says of them, told in the third person and marked so.

   Nobody here says anything they did not say.

   Sources: United States Holocaust Memorial Museum, Holocaust
   Encyclopedia. Yad Vashem, Documents on the Holocaust (1981).
   The Ringelblum Archive, Jewish Historical Institute, Warsaw.
   The record of the Eichmann trial, Jerusalem, 1961. Claude
   Lanzmann, Shoah (1985). Kazimierz Moczarski, Conversations
   with an Executioner. Janusz Korczak, Ghetto Diary.
   ============================================================ */

import { HE } from './lang.js';

const L = (en, he) => (HE ? he : en);

export const ASK = {
  who: (f) => L('Who are you?', f ? 'מי את?' : 'מי אתה?'),
  words: () => L('In your own words', 'במילים שלך'),
  fate: () => L('What became of you?', 'מה עלה בגורלך?'),
  record: L('From the record.', 'מתוך התיעוד.'),
  own: L('Their own words.', 'במילותיהם.'),
  tag: L('Ask', 'לשאול'),
  hear: L('Hear the story', 'לשמוע את הסיפור'),
  stop: L('Stop', 'עצירה'),
  read: L('Read aloud by your browser.', 'מוקרא בקול בידי הדפדפן שלכם.'),
  recordSrc: L('United States Holocaust Memorial Museum; Yad Vashem.', 'מוזיאון השואה של ארצות הברית; יד ושם.'),
};

/* at: where the person stands [x, y, z] and the way they face. chapter, from, to: when their name is shown.
   asks: [question, answer, the source of a quotation (none: the answer is the record's, not theirs),
          false where the quotation is someone else's words and its source line says whose] */
/* The voices of the street: people who were nobody in particular, and wrote down the days as they came.
   The same rule holds: their own words with the source, or the record. */
const VOICES = [
  {
    id: 'lazowert', voice: true, f: true, chapter: 'inside', from: 0.0, to: 0.34, at: [-4.3, 0, -88.5], ry: 1.2, kind: 'woman2', dress: 'lilac',
    name: L('Henryka Łazowertówna', 'הנריקה לזוברטובנה'), role: L('A voice of the street · poet', 'קול מהרחוב · משוררת'), life: L('1909 to 1942', '1909 עד 1942'),
    asks: [
      [ASK.who(true), L('A poet. In the ghetto she worked for the society that fed its refugees and its children, and wrote for the secret archive.',
        'משוררת. בגטו עבדה באגודה שהאכילה את הפליטים ואת הילדים, וכתבה בשביל הארכיון החשאי.')],
      [L('What do you see every day?', 'מה את רואה כל יום?'), L('Through walls, through holes, through sentry points, through wires, through rubble, through fences: hungry, daring, stubborn, I flee, dart like a cat.',
        'דרך חומות, דרך פרצות, דרך משמרות, דרך גדרות תיל, דרך הריסות, דרך גדרות: רעב, נועז, עקשן, אני חומק, מזנק כמו חתול.'),
        L('From her poem The Little Smuggler, written in the ghetto about 1941 in the voice of a child who feeds his family. Translated by Patricia Heberer.', 'מתוך שירה ״המבריח הקטן״, שנכתב בגטו בסביבות 1941 בקולו של ילד המפרנס את משפחתו (בתרגום).')],
      [ASK.fate(), L('In the summer of 1942 she went to the Umschlagplatz with her mother, whom she would not leave. Both were murdered at Treblinka. Her poem is carved on the memorial to the children in the Jewish cemetery in Warsaw.',
        'בקיץ 1942 הלכה לאומשלגפלאץ עם אמה, שלא הסכימה לעזוב אותה. שתיהן נרצחו בטרבלינקה. שירה חקוק על האנדרטה לזכר הילדים בבית הקברות היהודי בוורשה.')],
    ],
  },
  {
    id: 'berg', voice: true, f: true, chapter: 'inside', from: 0.3, to: 0.66, at: [4.5, 0, -110], ry: -1.3, kind: 'woman3', dress: 'lilac',
    name: L('Mary Berg', 'מרי ברג'), role: L('A voice of the street · schoolgirl', 'קול מהרחוב · תלמידה'), life: L('1924 to 2013', '1924 עד 2013'),
    asks: [
      [ASK.who(true), L('Miriam Wattenberg, from Łódź. She was sixteen when the ghetto was sealed, and kept a diary all through it.',
        'מרים וטנברג, מלודז׳. הייתה בת שש עשרה כשנסגר הגטו, וכתבה יומן לכל אורך הזמן.')],
      [L('What is a day here?', 'איך נראה כאן יום?'), L('The ghetto is becoming more and more crowded; there is a constant stream of new refugees.',
        'הגטו נעשה צפוף יותר ויותר; זרם הפליטים החדשים אינו פוסק.'),
        L('Her diary, 12 June 1941. Published in New York in 1945.', 'יומנה, 12 ביוני 1941. ראה אור בניו יורק ב־1945 (בתרגום).')],
      [L('What do you want known?', 'מה את רוצה שיידעו?'), L('Where are you, foreign correspondents? Why don’t you come here and describe the sensational scenes of the ghetto?',
        'היכן אתם, כתבי החוץ? מדוע אינכם באים לכאן לתאר את המראות המרעישים של הגטו?'),
        L('Her diary, 29 July 1941.', 'יומנה, 29 ביולי 1941 (בתרגום).')],
      [ASK.fate(), L('Her mother was an American citizen. In July 1942 the family was held in the Pawiak prison, and from its windows she watched the deportations. They were exchanged for German prisoners and reached New York in March 1944. She died in 2013.',
        'אמה הייתה אזרחית אמריקאית. ביולי 1942 הוחזקה המשפחה בכלא פאביאק, ומחלונותיו ראתה את הגירושים. הם הוחלפו בשבויים גרמנים והגיעו לניו יורק במרס 1944. היא מתה ב־2013.')],
    ],
  },
  {
    id: 'rubinstein', voice: true, chapter: 'inside', from: 0.56, to: 0.96, at: [-3.9, 0, -128.5], ry: 1.1, kind: 'wJester', dress: 'lilac',
    name: L('Rubinstein', 'רובינשטיין'), role: L('A voice of the street · the jester of the ghetto', 'קול מהרחוב · ליצן הגטו'), life: L('dates not known', 'התאריכים אינם ידועים'),
    asks: [
      [ASK.who(), L('Nobody is sure of his first name. A refugee, it was said, from Łódź. He ran through the streets in rags, sang, pulled faces at the guards, and begged. Everyone in the ghetto knew him.',
        'איש אינו בטוח בשמו הפרטי. פליט, כך אמרו, מלודז׳. הוא רץ ברחובות בבלויים, שר, עיווה את פניו מול השומרים, וקיבץ נדבות. כל הגטו הכיר אותו.')],
      [L('What do you shout?', 'מה אתה צועק?'), L('Ale glaykh! All are equal!', 'אַלע גלײַך! כולם שווים!'),
        L('His cry, set down by Emanuel Ringelblum and by others who heard it. It became a saying of the ghetto: in the face of hunger and death, rich and poor were the same.', 'קריאתו, שרשמו עמנואל רינגלבלום ואחרים ששמעו אותה. היא הפכה לאמרה של הגטו: מול הרעב והמוות, עשיר ועני שווים.')],
      [ASK.fate(), L('It is not known. Some who were there say he died in the deportations of 1942. Others say he did not.',
        'לא ידוע. יש מי שהיו שם ואומרים שמת בגירושים של 1942. אחרים אומרים שלא.')],
    ],
  },
  {
    id: 'kaplan', voice: true, chapter: 'trains', from: -0.2, to: 0.12, at: [4.4, 0, -214], ry: -1.3, kind: 'old', dress: 'lilac',
    name: L('Chaim Kaplan', 'חיים קפלן'), role: L('A voice of the street · teacher', 'קול מהרחוב · מורה'), life: L('1880 to 1942 or 1943', '1880 עד 1942 או 1943'),
    asks: [
      [ASK.who(), L('A teacher, and for forty years the head of a Hebrew school in Warsaw. He wrote his diary in Hebrew, day after day, and called it his scroll of agony.',
        'מורה, ובמשך ארבעים שנה מנהל בית ספר עברי בוורשה. את יומנו כתב בעברית, יום אחר יום, וקרא לו מגילת ייסורים.')],
      [ASK.words(), L('If my life ends, what will become of my diary?', 'אם יבוא קץ לחיי, מה יהיה על יומני?'),
        L('The last line of his diary, 4 August 1942. Published as Scroll of Agony.', 'השורה האחרונה ביומנו, 4 באוגוסט 1942. ראה אור כ״מגילת ייסורים״.')],
      [ASK.fate(), L('He gave the notebooks to a friend, who smuggled them out of the ghetto. He and his wife are believed to have been murdered at Treblinka at the end of 1942 or the start of 1943.',
        'הוא מסר את המחברות לידיד, שהבריח אותן אל מחוץ לגטו. ככל הידוע נרצחו הוא ואשתו בטרבלינקה בסוף 1942 או בתחילת 1943.')],
    ],
  },
  {
    id: 'lewin', voice: true, chapter: 'trains', from: 0.1, to: 0.34, at: [4.6, 0, -241], ry: -1.4, kind: 'man2', dress: 'lilac',
    name: L('Abraham Lewin', 'אברהם לוין'), role: L('A voice of the street · teacher', 'קול מהרחוב · מורה'), life: L('1893 to 1943', '1893 עד 1943'),
    asks: [
      [ASK.who(), L('A teacher at a school for girls, and one of the writers of the secret archive. He kept a diary, at first in Yiddish and then in Hebrew.',
        'מורה בבית ספר לבנות, ואחד מכותבי הארכיון החשאי. הוא כתב יומן, תחילה ביידיש ואחר כך בעברית.')],
      [ASK.words(), L('Eclipse of the sun, universal blackness. My Luba was taken away during a blockade on 30 Gęsia Street. There is still a glimmer of hope in front of me.',
        'ליקוי חמה, חושך על פני כול. לובה שלי נלקחה בזמן מצור ברחוב גנשה 30. עוד יש לפניי זיק של תקווה.'),
        L('His diary, 12 August 1942. Published as A Cup of Tears.', 'יומנו, 12 באוגוסט 1942. ראה אור כ״כוס הדמעות״ (בתרגום חוזר).')],
      [ASK.fate(), L('His wife Luba was murdered at Treblinka. His diary stops on 16 January 1943, two days before the Germans came back. He and his daughter Ora did not survive.',
        'אשתו לובה נרצחה בטרבלינקה. יומנו נפסק ב־16 בינואר 1943, יומיים לפני שהגרמנים חזרו. הוא ובתו אורה לא שרדו.')],
    ],
  },
  {
    id: 'frenkel', chapter: 'zzw', from: 0.08, to: 0.62, at: [72.5, -3.4, -380.4], ry: -1.75, kind: 'wFighter', dress: 'lilac',
    name: L('Paweł Frenkel', 'פאוול פרנקל'), role: L('Commander of the ŻZW', 'מפקד אצ״י'), life: L('dates not certain · killed in 1943', 'התאריכים אינם ודאיים · נהרג ב־1943'),
    asks: [
      [ASK.who(), L('The military commander of the ŻZW. He is said to have been a member of Betar and an officer of the Polish army. In 2023 researchers named him as Yaakov Frenkiel, born in Białystok in 1911. Others dispute it. No words of his are known to have come down, so he says none here.',
        'המפקד הצבאי של אצ״י. מסופר שהיה חבר בית״ר וקצין בצבא הפולני. ב־2023 זיהו אותו חוקרים כיעקב פרנקל, יליד ביאליסטוק, 1911. אחרים חולקים על כך. לא ידוע על מילים שלו שהגיעו אלינו, ולכן אינו אומר כאן דבר.')],
      [L('What did you do here?', 'מה עשית כאן?'), L('On 19 April 1943 the ŻZW fought on Muranowski Square under his command. They held the houses round it until 22 April, against attack after attack, with the two flags over them.',
        'ב־19 באפריל 1943 לחם אצ״י בכיכר מורנובסקי בפיקודו. הם החזיקו בבתים שסביבה עד 22 באפריל, מול התקפה אחר התקפה, ושני הדגלים מעליהם.')],
      [ASK.fate(), L('It is not known for certain. By one account he was killed defending the headquarters on the square. By another he got out, and was killed with his staff in June 1943 in a hiding place on Grzybowska Street, on the other side of the wall.',
        'לא ידוע בוודאות. לפי גרסה אחת נהרג בהגנה על המפקדה שבכיכר. לפי אחרת יצא משם, ונהרג עם מטהו ביוני 1943 במחבוא ברחוב גז׳יבובסקה, מעבר לחומה.')],
    ],
  },
];

export const WITNESSES = [
  ...VOICES,
  {
    id: 'korczak', chapter: 'inside', from: 0.08, to: 0.62, at: [4.7, 0, -98], ry: -1.3, kind: 'wOld', dress: 'lilac',
    with: [{ kind: 'child', dx: 0.75, dz: 0.5 }, { kind: 'girl', dx: -0.2, dz: -0.85 }, { kind: 'child2', dx: 0.9, dz: -0.6 }],
    name: L('Janusz Korczak', 'יאנוש קורצ׳אק'), role: L('Doctor, writer, teacher', 'רופא, סופר ומחנך'), life: L('1878 or 1879 to 1942', '1878 או 1879 עד 1942'),
    asks: [
      [ASK.who(), L('Henryk Goldszmit, a doctor and writer known as Janusz Korczak. He ran an orphanage for Jewish children in Warsaw for thirty years. When the ghetto was sealed, the orphanage was moved inside it.',
        'הנריק גולדשמיט, רופא וסופר שנודע בשם יאנוש קורצ׳אק. שלושים שנה ניהל בוורשה בית יתומים לילדים יהודים. כשנסגר הגטו, הועבר בית היתומים לתוכו.')],
      [ASK.words(), L('I am watering the flowers. My bald head in the window. What a splendid target. He has a rifle. Why is he standing and looking on calmly? No orders.',
        'אני משקה את הפרחים. הקרחת שלי בחלון. איזו מטרה נהדרת. יש לו רובה. למה הוא עומד ומביט בשלווה? אין פקודה.'),
        L('Ghetto Diary, the last entry, 4 August 1942.', 'יומן הגטו, הרישום האחרון, 4 באוגוסט 1942 (בתרגום).')],
      [ASK.fate(), L('On 5 or 6 August 1942 he was marched to the Umschlagplatz with about two hundred children and the staff of the orphanage. He had been offered a way out for himself, and refused it. All were murdered at Treblinka.',
        'ב־5 או ב־6 באוגוסט 1942 הוצעד לאומשלגפלאץ עם כמאתיים ילדים ועם צוות בית היתומים. הוצעה לו דרך להינצל בעצמו, והוא סירב. כולם נרצחו בטרבלינקה.')],
    ],
  },
  {
    id: 'ringelblum', face: true, chapter: 'inside', from: 0.4, to: 0.92, at: [-4.4, 0, -119], ry: 1.35, kind: 'hat2', dress: 'lilac',
    name: L('Emanuel Ringelblum', 'עמנואל רינגלבלום'), role: L('Historian', 'היסטוריון'), life: L('1900 to 1944', '1900 עד 1944'),
    asks: [
      [ASK.who(), L('A historian. In the ghetto he gathered a secret group, Oneg Shabbat, to collect diaries, reports, posters, ration cards, children’s essays: everything that showed how people lived and died here.',
        'היסטוריון. בגטו כינס קבוצה חשאית, עונג שבת, שאספה יומנים, דוחות, כרזות, תלושי מזון, חיבורים של ילדים: כל מה שמראה איך חיו ומתו כאן.')],
      [L('What did you bury?', 'מה טמנתם?'), L('What we were unable to cry and shriek out to the world we buried in the ground. I would love to see the moment in which the great treasure will be dug up and scream the truth at the world.',
        'את מה שלא יכולנו לזעוק ולצעוק אל העולם, טמנו באדמה. הייתי רוצה לראות את הרגע שבו יוצא האוצר הגדול מן האדמה ויצעק את האמת לעולם.'),
        L('These are the words of Dawid Graber, aged 19, one of those who buried the first ten boxes of the archive on 3 August 1942. His testament was in the boxes. Ringelblum Archive, Jewish Historical Institute, Warsaw.',
          'אלה מילותיו של דוד גרבר בן ה־19, מטומני עשר התיבות הראשונות של הארכיון ב־3 באוגוסט 1942. צוואתו נמצאה בתיבות. ארכיון רינגלבלום, המכון ההיסטורי היהודי בוורשה (בתרגום).'), false],
      [ASK.fate(), L('He was hidden outside the ghetto with his wife Yehudit and their son Uri. In March 1944 the hiding place was betrayed, and they were shot in the ruins of the ghetto. The ten boxes were dug out in 1946, and two milk cans in 1950.',
        'הוא הוסתר מחוץ לגטו עם אשתו יהודית ובנם אורי. במרס 1944 הוסגר המחבוא, והם נורו בהריסות הגטו. עשר התיבות נחפרו ב־1946, ושני כדי חלב ב־1950.')],
    ],
  },
  {
    id: 'czerniakow', chapter: 'trains', from: -0.3, to: 0.2, at: [-4.3, 0, -232], ry: 1.3, kind: 'hat', dress: 'lilac',
    name: L('Adam Czerniaków', 'אדם צ׳רניאקוב'), role: L('Chairman of the Jewish council', 'ראש היודנראט'), life: L('1880 to 1942', '1880 עד 1942'),
    asks: [
      [ASK.who(), L('An engineer, and chairman of the Jewish council the Germans set up to carry out their orders in the ghetto. He kept a diary every day from 1939.',
        'מהנדס, וראש המועצה היהודית שהקימו הגרמנים כדי שתבצע את פקודותיהם בגטו. מ־1939 כתב יומן, יום יום.')],
      [ASK.words(), L('They demand me to kill children of my nation with my own hands. I have nothing to do but to die.',
        'דורשים ממני להרוג במו ידיי את ילדי עמי. לא נותר לי אלא למות.'),
        L('A note to his wife, 23 July 1942.', 'פתק לאשתו, 23 ביולי 1942 (בתרגום).')],
      [ASK.fate(), L('On 22 July 1942 he was ordered to deliver 6,000 people a day for deportation. The next day, when he could not get the orphans exempted, he took poison in his office.',
        'ב־22 ביולי 1942 נצטווה למסור 6,000 איש ביום לגירוש. למחרת, כשלא הצליח להשיג פטור ליתומים, נטל רעל במשרדו.')],
    ],
  },
  {
    id: 'anielewicz', face: true, chapter: 'two', from: 0.3, to: 0.99, at: [-9.0, -3.4, -384.2], ry: 1.2, kind: 'wFighter', dress: 'lilac',
    name: L('Mordechai Anielewicz', 'מרדכי אנילביץ׳'), role: L('Commander of the ŻOB', 'מפקד אי״ל'), life: L('1919 to 1943', '1919 עד 1943'),
    asks: [
      [ASK.who(), L('Born in Wyszków, raised in a poor quarter of Warsaw, a leader of the Hashomer Hatzair youth movement. From November 1942 he commanded the ŻOB. He was 24 when the uprising began.',
        'נולד בווישקוב, גדל בשכונה ענייה בוורשה, ממנהיגי השומר הצעיר. מנובמבר 1942 פיקד על אי״ל. כשפרץ המרד היה בן 24.')],
      [ASK.words(), L('It is impossible to put into words what we have been through. One thing is clear, what happened exceeded our boldest dreams. The Germans ran twice from the ghetto.',
        'אי אפשר לתאר במילים את מה שעבר עלינו. דבר אחד ברור: מה שקרה עלה על החלומות הנועזים ביותר שלנו. הגרמנים ברחו פעמיים מהגטו.'),
        L('Letter to Yitzhak Zuckerman, 23 April 1943. Yad Vashem, Documents on the Holocaust, no. 145.', 'מכתב ליצחק צוקרמן, 23 באפריל 1943. יד ושם, תיעוד השואה, מסמך 145 (בתרגום).')],
      [ASK.fate(), L('He died on 8 May 1943 in the command bunker at 18 Miła Street, with about a hundred of his fighters, when the Germans found the bunker and forced gas into it.',
        'הוא מת ב־8 במאי 1943 בבונקר המפקדה ברחוב מילא 18, עם כמאה מלוחמיו, כשהגרמנים מצאו את הבונקר והזרימו לתוכו גז.')],
    ],
  },
  {
    id: 'lubetkin', face: true, f: true, chapter: 'april', from: 0.02, to: 0.5, at: [-5.0, 0, -473], ry: 1.2, kind: 'wFighterW', dress: 'lilac',
    name: L('Zivia Lubetkin', 'צביה לובטקין'), role: L('A founder of the ŻOB', 'ממייסדי אי״ל'), life: L('1914 to 1978', '1914 עד 1978'),
    asks: [
      [ASK.who(true), L('One of the founders of the ŻOB, and the only woman in its command. She had come back into occupied Warsaw in 1940 to work in the underground.',
        'ממייסדי אי״ל, והאישה היחידה במפקדתו. ב־1940 חזרה לוורשה הכבושה כדי לפעול במחתרת.')],
      [ASK.words(), L('When the Germans came up to our posts and marched by and we threw those hand grenades and bombs and saw German blood pouring over the streets of Warsaw ... there was much rejoicing. The tomorrow did not worry us.',
        'כשהגרמנים התקרבו לעמדות שלנו וצעדו על פניהן, וזרקנו את הרימונים והפצצות, וראינו דם גרמני נשפך ברחובות ורשה ... הייתה שמחה גדולה. המחר לא הדאיג אותנו.'),
        L('Her evidence at the trial of Adolf Eichmann, Jerusalem, session 25, 3 May 1961.', 'עדותה במשפט אייכמן, ירושלים, ישיבה 25, 3 במאי 1961 (בתרגום חוזר מאנגלית).')],
      [ASK.fate(), L('She left the ghetto through the sewers on 10 May 1943, fought again in the Warsaw Uprising of 1944, and reached Palestine in 1946. On 19 April 1949 she and Yitzhak Zuckerman were among the founders of Kibbutz Lohamei HaGeta’ot, the kibbutz of the ghetto fighters. She died there in 1978.',
        'היא יצאה מהגטו דרך תעלות הביוב ב־10 במאי 1943, לחמה שוב במרד ורשה ב־1944, והגיעה לארץ ישראל ב־1946. ב־19 באפריל 1949 הייתה עם יצחק צוקרמן בין מייסדי קיבוץ לוחמי הגטאות. שם מתה ב־1978.')],
    ],
  },
  {
    id: 'edelman', face: true, chapter: 'brush', from: 0.02, to: 0.33, at: [-2.9, 0, -620.5], ry: 1.2, kind: 'wFighter', dress: 'lilac',
    name: L('Marek Edelman', 'מארק אדלמן'), role: L('A commander of the ŻOB', 'ממפקדי אי״ל'), life: L('1919 or 1922 to 2009', '1919 או 1922 עד 2009'),
    asks: [
      [ASK.who(), L('A member of the Bund, and one of the commanders of the ŻOB. On 20 April he commanded the five groups in the brushmakers’ block. After Anielewicz died he was the last commander.',
        'חבר הבונד, ואחד ממפקדי אי״ל. ב־20 באפריל פיקד על חמש הקבוצות בשטח המברשתנים. אחרי מות אנילביץ׳ היה המפקד האחרון.')],
      [ASK.words(), L('We were beaten by the flames, not the Germans.', 'הלהבות ניצחו אותנו, לא הגרמנים.'),
        L('He said it of the burning of the ghetto for the rest of his life. Quoted in his obituaries, October 2009.', 'כך אמר על שריפת הגטו כל חייו. צוטט בהספדים עליו, אוקטובר 2009 (בתרגום).')],
      [ASK.fate(), L('He came out through the sewers on 10 May 1943, fought in the Warsaw Uprising of 1944, and stayed in Poland. He became a cardiologist in Łódź, and in the 1980s a member of Solidarity. He died in Warsaw in 2009.',
        'הוא יצא דרך תעלות הביוב ב־10 במאי 1943, לחם במרד ורשה ב־1944, ונשאר בפולין. היה קרדיולוג בלודז׳, ובשנות השמונים חבר בסולידריות. מת בוורשה ב־2009.')],
    ],
  },
  {
    id: 'rotem', face: true, chapter: 'sewers', from: 0.03, to: 0.6, at: 'guide',
    name: L('Simcha Rotem, “Kazik”', 'שמחה רותם, ״קאז׳יק״'), role: L('Courier of the ŻOB', 'קשר של אי״ל'), life: L('1924 to 2018', '1924 עד 2018'),
    asks: [
      [ASK.who(), L('Born Szymon Ratajzer in Warsaw, and called Kazik. He was 19, a courier of the ŻOB between the ghetto and the other side of the wall.',
        'נולד בוורשה בשם שימון רטייזר, וכונה קאז׳יק. בן 19, קשר של אי״ל בין הגטו לבין הצד השני של החומה.')],
      [ASK.words(), L('I said to myself: I am the last Jew. I will wait for morning, and for the Germans.', 'אמרתי לעצמי: אני היהודי האחרון. אחכה לבוקר, ולגרמנים.'),
        L('Of the night he came back into the burnt ghetto and found no one. To Claude Lanzmann, in the film Shoah, 1985: they are its last words.', 'על הלילה שבו חזר אל הגטו השרוף ולא מצא איש. לקלוד לנצמן, בסרט שואה, 1985: אלה מילותיו האחרונות של הסרט (בתרגום).')],
      [L('What did you do here?', 'מה עשית כאן?'), L('At the start of May he went out of the ghetto to find a way of escape. A week later he came back through the sewers with Polish sewer workers as guides, found the last fighters, and on 10 May brought them up through a manhole on Prosta Street, where a truck was waiting.',
        'בתחילת מאי יצא מהגטו לחפש דרך מילוט. כעבור שבוע חזר דרך תעלות הביוב עם פועלי ביוב פולנים כמורי דרך, מצא את אחרוני הלוחמים, וב־10 במאי העלה אותם דרך פתח ביוב ברחוב פרוסטה, שם חיכתה משאית.')],
      [ASK.fate(), L('He fought in the Warsaw Uprising of 1944, settled in Israel after the war, and died in Jerusalem in December 2018: the last of the fighters known to be living.',
        'הוא לחם במרד ורשה ב־1944, התיישב בישראל אחרי המלחמה, ומת בירושלים בדצמבר 2018: האחרון מהלוחמים שנודע כי נותר בחיים.')],
    ],
  },
  {
    id: 'stroop', chapter: 'lastday', from: 0.03, to: 0.5, at: [-3.6, 0, -783.5], ry: -2.1, kind: 'wOfficer', dress: 'grey',
    name: L('Jürgen Stroop', 'יירגן שטרופ'), role: L('SS and police general', 'גנרל באס־אס ובמשטרה'), life: L('1895 to 1952', '1895 עד 1952'),
    asks: [
      [ASK.who(), L('An SS and police general, sent to Warsaw on 19 April 1943 to take over the destruction of the ghetto after the first attack was thrown back. He reported to Himmler every day.',
        'גנרל באס־אס ובמשטרה. נשלח לוורשה ב־19 באפריל 1943 לקבל את הפיקוד על חיסול הגטו, אחרי שההתקפה הראשונה נהדפה. דיווח להימלר מדי יום.')],
      [ASK.words(), L('What a marvelous sight it was. A fantastic piece of theater. [...] After prolonging the suspense for a moment, I shouted: Heil Hitler and pressed the button.',
        'איזה מראה נפלא זה היה. הצגה פנטסטית. [...] אחרי שמשכתי עוד רגע את המתח, קראתי: הייל היטלר, ולחצתי על הכפתור.'),
        L('Of the blowing up of the Great Synagogue. Said in his prison cell to Kazimierz Moczarski, who set it down in Conversations with an Executioner.', 'על פיצוץ בית הכנסת הגדול. כך סיפר בתאו בכלא לקז׳ימייז׳ מוצ׳רסקי, שרשם זאת בספרו שיחות עם תליין (בתרגום).')],
      [ASK.fate(), L('An American military court sentenced him to death in 1947 for the murder of prisoners of war. He was handed over to Poland, tried in Warsaw for the destruction of the ghetto, and hanged there on 6 March 1952.',
        'בית דין צבאי אמריקאי דן אותו למוות ב־1947 על רצח שבויי מלחמה. הוא הוסגר לפולין, נשפט בוורשה על חיסול הגטו, ונתלה שם ב־6 במרס 1952.')],
    ],
  },
  {
    id: 'zuckerman', face: true, chapter: 'after', from: 0.3, to: 0.72, at: [3.7, 0, -936.5], ry: -1.35, kind: 'man2', dress: 'lilac',
    name: L('Yitzhak Zuckerman, “Antek”', 'יצחק צוקרמן, ״אנטק״'), role: L('Deputy commander of the ŻOB', 'סגן מפקד אי״ל'), life: L('1915 to 1981', '1915 עד 1981'),
    asks: [
      [ASK.who(), L('Deputy commander of the ŻOB. During the uprising he was on the other side of the wall, as the fighters’ envoy to the Polish underground, trying to get them arms.',
        'סגן מפקד אי״ל. בימי המרד היה מעבר לחומה, כנציג הלוחמים אצל המחתרת הפולנית, וניסה להשיג להם נשק.')],
      [ASK.words(), L('If you could lick my heart, it would poison you.', 'אילו יכולת ללקק את לבי, היית מורעל.'),
        L('To Claude Lanzmann, in the film Shoah, 1985.', 'לקלוד לנצמן, בסרט שואה, 1985 (בתרגום חוזר).')],
      [ASK.fate(), L('He led a group of ghetto fighters in the Warsaw Uprising of 1944, reached Palestine in 1947, and with Zivia Lubetkin founded Kibbutz Lohamei HaGeta’ot and the Ghetto Fighters’ House. He gave evidence at the Eichmann trial in 1961, and died in 1981.',
        'הוא הוביל קבוצת לוחמי גטו במרד ורשה ב־1944, הגיע לארץ ישראל ב־1947, ועם צביה לובטקין ייסד את קיבוץ לוחמי הגטאות ואת בית לוחמי הגטאות. ב־1961 העיד במשפט אייכמן. מת ב־1981.')],
    ],
  },
];
