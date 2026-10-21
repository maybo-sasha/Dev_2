/* ============================================================
   The story, and the walk that tells it.

   Every position here is a place in the walk: so far into a named
   chapter, 0 at its start and 1 at its end. at('april', 0.3) is a
   third of the way through 19 April. The camera, the light, the
   fires and the words are all keyed on that one number, so the
   telling and the place can never drift apart, and a chapter can
   be added without moving anything else.

   Sources for every figure and date here:
   United States Holocaust Memorial Museum, Holocaust Encyclopedia
   Yad Vashem, Shoah Resource Center
   POLIN Museum of the History of Polish Jews, calendar of the uprising
   The Stroop Report, May 1943
   The Declaration of the Establishment of the State of Israel, 14 May 1948
   The Ghetto Fighters' House, Kibbutz Lohamei HaGeta'ot
   Hirsh Berliński's diary, in J. Kermish (ed.), To Live with Honor
   and Die with Honor!, Yad Vashem 1986
   ============================================================ */

import { HE } from './lang.js';
import { CHAPTERS_HE, BEATS_HE, SLATES_HE, PLATES_HE, NOTES_HE } from './story.he.js';

export const CHAPTERS = [
  { id: 'cover',   len: 1.3, label: 'Cover',             year: '' },
  { id: 'wall',    len: 1.6, label: 'The wall',          year: '1940' },
  { id: 'inside',  len: 1.7, label: 'Inside',            year: '1941' },
  { id: 'bridge',  len: 1.5, label: 'The bridge',        year: '1942' },
  { id: 'trains',  len: 2.3, label: 'Umschlagplatz',     year: '1942' },
  { id: 'two',     len: 2.7, label: 'Two undergrounds',  year: '1942' },
  { id: 'zzw',     len: 2.0, label: 'The ŻZW',           year: '1943' },
  { id: 'january', len: 1.5, label: 'The first shots',   year: '1943' },
  { id: 'map',     len: 3.0, label: 'Where they fought', year: 'April 1943' },
  { id: 'april',   len: 3.2, label: 'Miła Street',       year: '19 April' },
  { id: 'flags',   len: 2.9, label: 'Muranowski Square', year: '19 April' },
  { id: 'brush',   len: 2.6, label: 'The brushmakers',   year: '20 April' },
  { id: 'burning', len: 2.1, label: 'Block by block',    year: '21 April' },
  { id: 'mila',    len: 1.8, label: '18 Miła Street',    year: '8 May' },
  { id: 'sewers',  len: 2.2, label: 'The sewers',        year: '10 May' },
  { id: 'raid',    len: 1.6, label: 'Bombers',           year: '13 May' },
  { id: 'lastday', len: 1.7, label: 'The last day',      year: '16 May' },
  { id: 'after',   len: 2.6, label: 'After',             year: '' },
  { id: 'israel',  len: 2.4, label: '1948',              year: '14 May' },
];

const INDEX = Object.fromEntries(CHAPTERS.map((c, i) => [c.id, i]));
/* a place in the walk: f of the way into a chapter */
export const at = (id, f = 0) => {
  if (!(id in INDEX)) throw new Error('no chapter ' + id);
  return INDEX[id] + f;
};
export const chapterIndex = (id) => INDEX[id];

/* The words. at: [chapter, from, to]. side: where on the screen they sit. */
export const BEATS = [
  { at: ['wall', 0.08, 0.52], side: 'left', kicker: 'October 1940', title: 'A city inside a wall',
    body: ['In October 1940 the Germans ordered every Jew in Warsaw into one district. On 16 November they sealed it.'] },
  { at: ['wall', 0.58, 0.95], side: 'right', kicker: 'The wall',
    body: ['Three metres of brick, eighteen kilometres long, with broken glass and barbed wire along the top.', 'The Jewish council was made to pay for it.'] },

  { at: ['inside', 0.05, 0.48], side: 'left', kicker: '1941', title: 'Four hundred thousand people',
    body: ['More than 400,000 people were packed into a little over three square kilometres. Seven to a room, on average.', 'The official ration was about 180 calories a day.'] },
  { at: ['inside', 0.54, 0.95], side: 'right', kicker: 'Hunger',
    body: ['By the summer of 1942, hunger and typhus had killed more than 80,000.', 'Children slipped through gaps in the wall to bring back food. Teachers taught in secret. A historian, Emanuel Ringelblum, buried the record of it all in milk cans and metal boxes, so that someone would know.'] },

  { at: ['bridge', 0.16, 0.86], side: 'left', kicker: 'January 1942', title: 'The bridge over Chłodna Street',
    body: ['Chłodna Street stayed outside the ghetto and cut it in two. A wooden bridge carried people over it.', 'From the top you could see the other Warsaw. Trams. A church. People who could walk where they liked.'] },

  { at: ['trains', 0.04, 0.36], side: 'left', kicker: '22 July 1942', title: 'Umschlagplatz',
    body: ['On 22 July 1942 the trains began. Every day thousands were marched to this yard beside the railway and loaded into freight wagons.'] },
  { at: ['trains', 0.42, 0.7], side: 'left', kicker: 'Two months',
    body: ['About 265,000 people were taken from here to the gas chambers of Treblinka. Some 35,000 more were killed inside the ghetto.'] },
  { at: ['trains', 0.76, 0.98], side: 'left', kicker: 'September 1942',
    body: ['When the trains stopped, about 60,000 were left.', 'The empty streets were white with feathers from torn bedding.'] },

  { at: ['two', 0.02, 0.15], side: 'left', kicker: '28 July 1942', title: 'Two undergrounds',
    body: ['Those who were left knew where the trains went. They decided to fight.'] },
  { at: ['two', 0.19, 0.38], side: 'right', kicker: 'ŻOB', title: 'Jewish Combat Organization', small: true,
    body: ['Żydowska Organizacja Bojowa. Founded on 28 July 1942, in the middle of the deportations, by the pioneer youth movements: Hashomer Hatzair, Dror and Akiva. By October the Bund had joined, and others.', 'In November Mordechai Anielewicz of Hashomer Hatzair took command. He was 23.'] },
  { at: ['two', 0.42, 0.6], side: 'right', kicker: 'In the cellars',
    body: ['They filled bottles with petrol, cleaned the few pistols they had, and taught one another to use them. Most had never held a weapon.', 'And they dug: bunkers under the cellars, and ways from one to the next.'] },
  { at: ['two', 0.64, 0.79], side: 'left', kicker: 'Side by side',
    body: ['They came from opposite ends of Jewish politics, the left and the right, and they never merged.', 'They agreed to fight side by side, and divided the ghetto between them.'] },
  { at: ['two', 0.83, 0.97], side: 'right', kicker: 'What they had',
    body: ['Pistols, grenades, a few rifles, home made bombs. The Polish Home Army gave the ŻOB a small number of pistols and explosives. More were bought on the other side of the wall, at great cost.'] },

  { at: ['zzw', 0.05, 0.26], side: 'left', kicker: 'ŻZW · 7 Muranowska Street', title: 'The other underground',
    body: ['Żydowski Związek Wojskowy, the Jewish Military Union. It was formed by members of Betar and the Revisionist Zionists, and its headquarters was in the cellars of this house on Muranowski Square.'] },
  { at: ['zzw', 0.3, 0.46], side: 'left', kicker: 'Paweł Frenkel',
    body: ['Its military commander was Paweł Frenkel, and its political leader Dawid Wdowiński.', 'Almost nothing about Frenkel is certain: not his age, not his face, not how he died. No photograph is known to be his.'] },
  { at: ['zzw', 0.5, 0.7], side: 'right', kicker: 'The tunnel',
    body: ['A tunnel ran from this cellar under the street and under the ghetto wall, to the cellar of number 6 on the other side. Weapons came in through it.', 'On 22 April 1943 a group of the fighters went out through it.'] },
  { at: ['zzw', 0.74, 0.95], side: 'right', kicker: 'Why so little is known',
    body: ['About 250 fighters. Most of them were killed, and Frenkel with them. For decades the uprising was told almost without them.'] },

  { at: ['january', 0.04, 0.44], side: 'right', kicker: '18 January 1943', title: 'The first shots',
    body: ['On 18 January the Germans came back for more. A group led by Mordechai Anielewicz let itself be marched off in a column, and at the corner of Zamenhofa and Niska Streets they attacked the guards.', 'After four days the Germans stopped. They had taken about 5,000.'] },
  { at: ['january', 0.5, 0.84], side: 'right', kicker: 'Three months',
    body: ['Then the ghetto dug in. Bunkers under the cellars. Passages through the attics. Pistols bought on the other side of the wall, and bottles filled with petrol.'] },

  /* the map: each card names a place as the camera reaches it */
  { at: ['map', 0.03, 0.17], side: 'left', kicker: '19 April 1943', title: 'Where they fought',
    body: ['What was left of the ghetto on the eve of the uprising. Tens of thousands were still inside, most of them in hiding.'] },
  { at: ['map', 0.21, 0.34], side: 'left', kicker: 'The central ghetto · ŻOB', map: 'central',
    body: ['Most of the ŻOB groups, under Anielewicz himself. On the first morning they met the Germans at 33 Nalewki Street, and at the corner of Zamenhofa and Miła.'] },
  { at: ['map', 0.38, 0.51], side: 'left', kicker: 'Muranowski Square · ŻZW', map: 'square',
    body: ['The ŻZW held the houses on the square, with a machine gun, and raised two flags on a roof. Its tunnel ran under the wall to 6 Muranowska.'] },
  { at: ['map', 0.55, 0.68], side: 'left', kicker: 'The brushmakers · ŻOB', map: 'brush',
    body: ['Five ŻOB groups under Marek Edelman, in the workshop blocks between Świętojerska, Wałowa, Franciszkańska and Bonifraterska Streets.'] },
  { at: ['map', 0.72, 0.84], side: 'left', kicker: 'Többens and Schultz · ŻOB and ŻZW', map: 'shops',
    body: ['To the south west, the big workshops. Eight ŻOB groups were there, and a ŻZW unit. Eliezer Geller was one of their commanders.'] },
  { at: ['map', 0.87, 0.98], side: 'left', kicker: 'Under the streets', map: 'bunkers',
    body: ['Hundreds of bunkers. The command of the ŻOB was at 18 Miła Street.'] },

  { at: ['april', 0.04, 0.16], side: 'left', kicker: '19 April 1943', title: 'The eve of Passover',
    body: ['Before dawn the ghetto was surrounded. Early in the morning two columns of SS and police marched in to empty it. It was meant to take three days.'] },
  { at: ['april', 0.19, 0.3], side: 'left', kicker: 'Zamenhofa and Miła',
    body: ['About 750 fighters were waiting, most of them in their teens and twenties, with pistols, a few rifles, grenades and bottles of petrol.', 'One column was let into the crossing of Zamenhofa and Miła Streets. Then the corner houses opened fire.'] },
  { at: ['april', 0.36, 0.55], side: 'right', kicker: 'One moment, held still', held: true,
    body: ['Bottles from the balconies. Pistols from the windows. An armoured vehicle burning in the crossing, and the column breaking.'] },
  { at: ['april', 0.59, 0.76], side: 'left', kicker: 'From above', held: true,
    body: ['This is what the fighters of the ŻOB saw from the corner houses. Most of them had never fired a weapon before that morning.'] },
  { at: ['april', 0.8, 0.88], side: 'right', kicker: 'That morning',
    body: ['The Germans pulled back. The officer who had led them in, Ferdinand von Sammern-Frankenegg, was replaced the same morning by Jürgen Stroop.', 'Stroop had an average of 2,090 men a day: SS, police, Trawniki guards and soldiers, with tanks, armoured cars and artillery.'] },
  { at: ['april', 0.9, 0.98], side: 'right', kicker: 'Seven in the evening',
    body: ['A Home Army unit under Captain Józef Pszenny tried to blow a hole in the ghetto wall at Bonifraterska Street, to open a way out for the fighters. It failed.'] },

  { at: ['flags', 0.02, 0.15], side: 'right', kicker: 'Muranowski Square', title: 'Two flags',
    body: ['In the afternoon the battle reached Muranowski Square, where the fighters of the ŻZW held the houses, with a machine gun. Paweł Frenkel commanded them.'] },
  { at: ['flags', 0.19, 0.33], side: 'left', kicker: 'One moment, held still', held: true,
    body: ['The Germans came across the open square again and again, and brought up a gun. They could not take it.'] },
  { at: ['flags', 0.38, 0.55], side: 'left', kicker: 'The gun', held: true,
    body: ['Stroop answered rifles with artillery. The shell is in the wall. The wall has not yet fallen.'] },
  { at: ['flags', 0.62, 0.8], side: 'right', kicker: 'On the roof', held: true,
    body: ['Two flags: the white and red of Poland, and the blue and white. They could be seen from the streets outside the wall.'] },
  { at: ['flags', 0.84, 0.97], side: 'left', kicker: 'Jürgen Stroop, after the war', quote: 'Those flags had tremendous political and psychological importance.',
    body: ['He said Himmler had ordered them taken down, whatever the cost. The square held until 22 April. That day a group of ŻZW fighters left through the tunnel, and some reached Michalin, outside Warsaw.'] },

  { at: ['brush', 0.03, 0.17], side: 'left', kicker: '20 April 1943', title: 'The brushmakers',
    body: ['The brush workshops filled a block between Świętojerska, Wałowa, Franciszkańska and Bonifraterska Streets. Five ŻOB groups were waiting there, under Marek Edelman.', 'The Germans called on the workers to come out. Almost nobody came.'] },
  { at: ['brush', 0.2, 0.3], side: 'left', kicker: 'Three in the afternoon',
    body: ['Stroop led the attack himself. As his men came in, the fighters set off a mine. It was the signal to open fire.'] },
  { at: ['brush', 0.38, 0.56], side: 'right', kicker: 'One moment, held still', held: true,
    body: ['The mine, the instant it goes off. The fighters in the windows above, with pistols and grenades.'] },
  { at: ['brush', 0.6, 0.76], side: 'right', kicker: 'Hirsh Berliński, of his comrade Abram Diamant, at 32 Świętojerska Street', quote: 'May the moment come, when instead of words the gun speaks. Then we shall see who is old and who young.', held: true,
    body: ['Diamant was an older worker, whom some thought too old to fight. He held his post that day.'] },
  { at: ['brush', 0.84, 0.97], side: 'left', kicker: 'Until dark',
    body: ['The Germans brought up artillery and fired into the houses. The fighters moved from post to post. The attack stopped only when it grew dark.'] },

  { at: ['burning', 0.03, 0.3], side: 'left', kicker: '21 April 1943', title: 'Block by block',
    body: ['Stroop could not take the brushmakers’ block, so he burned it. That night the fighters broke out through the burning houses to the central ghetto, to a bunker at 30 Franciszkańska Street.'] },
  { at: ['burning', 0.35, 0.62], side: 'right', kicker: 'The fire',
    body: ['From then on, fire was the method. One building at a time, then gas and explosives into the bunkers underneath. On 23 April Stroop divided the ghetto into 24 sectors, to be searched one by one.', 'Marek Edelman, who survived, said it was the flames that beat them, not the Germans.'] },
  { at: ['burning', 0.67, 0.95], side: 'left', kicker: '30 April',
    body: ['People fought from the cellars, and then from the rubble. From the Többens and Schultz workshops, 40 fighters under Eliezer Geller went down into the sewer on Leszno Street, and came up outside the ghetto many hours later.'] },

  { at: ['mila', 0.03, 0.28], side: 'left', kicker: '8 May 1943', title: '18 Miła Street',
    body: ['The command bunker of the ŻOB lay under this house. More than a hundred fighters were inside.'] },
  { at: ['mila', 0.34, 0.64], side: 'right', kicker: 'The command bunker',
    body: ['On the morning of 8 May the Germans blocked the entrances and forced gas inside. Mordechai Anielewicz died here with about a hundred of his fighters. He was 24.', 'A few got out, by a passage the Germans had not found.'] },

  { at: ['sewers', 0.04, 0.24], side: 'left', kicker: '9 May 1943', title: 'The sewers',
    body: ['Simcha Rotem, whom the fighters called Kazik, came back for them under the city, with Polish guides. He found the survivors of 18 Miła Street.'] },
  { at: ['sewers', 0.3, 0.52], side: 'right', kicker: 'Under Warsaw',
    body: ['They went through the sewers of the city, in the dark, in the water, under the streets where the Germans were.'] },
  { at: ['sewers', 0.58, 0.78], side: 'left', kicker: '10 May, five in the morning',
    body: ['About fifty fighters came up through a manhole on Prosta Street, outside the ghetto, in daylight. A truck took them to the forest near Łomianki. Among them were Marek Edelman and Zivia Lubetkin.'] },
  { at: ['sewers', 0.8, 0.9], side: 'left', kicker: 'Left behind',
    body: ['About a dozen were still in the sewers when the truck left.'] },

  { at: ['raid', 0.08, 0.4], side: 'left', kicker: 'The night of 13 May 1943', title: 'Bombers',
    body: ['Soviet bombers raided Warsaw. They were aiming at the railway and the airfield. Bombs fell on the city, and some near the ghetto and on the Pawiak prison inside it.'] },
  { at: ['raid', 0.46, 0.8], side: 'right', kicker: 'The only planes',
    body: ['The Germans never bombed the ghetto from the air. On the first day Stroop had turned down a proposal to call in bombers from Kraków.', 'In the ruins below, people were still hiding, and still fighting at night.'] },

  { at: ['lastday', 0.04, 0.26], side: 'right', kicker: '16 May 1943', title: 'The last day',
    body: ['At 8.15 in the evening Stroop blew up the Great Synagogue on Tłomackie Street and declared the operation finished.'] },
  { at: ['lastday', 0.5, 0.94], side: 'right', kicker: 'His report to Himmler', quote: 'The Jewish quarter of Warsaw is no more.',
    body: ['By his own count 56,065 people had been captured or killed. Those who were not shot were sent to Treblinka, to Majdanek and to the labour camps.'] },

  { at: ['after', 0.04, 0.22], side: 'left', kicker: 'After', title: 'What it meant',
    body: ['It was the first uprising in a city in German-occupied Europe, and the largest Jewish revolt of the war.'] },
  { at: ['after', 0.25, 0.4], side: 'left', kicker: 'November 1943',
    body: ['Many of those sent to the labour camps at Trawniki and Poniatowa were shot there on 3 and 4 November 1943, with the Jews of Majdanek. The Germans called it Harvest Festival. About 42,000 people were killed in two days.'] },
  { at: ['after', 0.43, 0.56], side: 'left', kicker: '28 days',
    body: ['A few hundred people with pistols held an army for 28 days. They did not expect to win. They chose how they would meet what was coming, and they made sure it would be known.', 'In August 1944 some of the survivors fought again, in the Warsaw Uprising.'] },
  { at: ['after', 0.6, 0.82], side: 'center', kicker: 'Mordechai Anielewicz, in his last letter, 23 April 1943',
    quote: 'The dream of my life has risen to become fact. Self-defense in the ghetto will have been a reality. Jewish armed resistance and revenge are facts.', body: [] },
  { at: ['after', 0.86, 0.97], side: 'left', kicker: 'The mound at 18 Miła Street',
    body: ['Twenty eight candles on the mound. One for each day.'] },

  { at: ['israel', 0.06, 0.3], side: 'left', kicker: '14 May 1948', title: 'A state',
    body: ['Five years after the ghetto was destroyed, almost to the day, David Ben-Gurion read out the declaration of the State of Israel in Tel Aviv.', 'Its flag was blue and white: the colours the fighters had raised on a roof on Muranowski Square.'] },
  { at: ['israel', 0.36, 0.56], side: 'left', kicker: 'The Declaration of the Establishment of the State of Israel, 14 May 1948',
    quote: 'Survivors of the Nazi holocaust in Europe, as well as Jews from other parts of the world, continued to migrate to Eretz-Israel, undaunted by difficulties, restrictions and dangers, and never ceased to assert their right to a life of dignity, freedom and honest toil in their national homeland.', body: [] },
  { at: ['israel', 0.6, 0.78], side: 'left', kicker: '19 April 1949', title: 'Lohamei HaGeta’ot',
    body: ['On the sixth anniversary of the uprising, survivors founded a kibbutz in the Western Galilee and named it for the ghetto fighters. Zivia Lubetkin and Yitzhak Zuckerman were among them.', 'The museum they opened there, the Ghetto Fighters’ House, was the first Holocaust museum in the world.'] },
  { at: ['israel', 0.8, 0.9], side: 'right', kicker: '27 Nisan',
    body: ['In 1951 the Knesset set a day of remembrance and named it for both: the Holocaust, and the ghetto uprising.', 'Each year on that day a siren sounds across Israel, and people stop where they are and stand.'] },
];

/* Where and when, typed in at the head of a chapter, as a film puts it on the screen. */
export const SLATES = {
  wall: 'Warsaw · 1940',
  inside: 'Inside the ghetto · 1941',
  bridge: 'Chłodna Street · 1942',
  trains: 'Stawki Street · July 1942',
  two: 'Under the ghetto · 1942',
  zzw: '7 Muranowska Street · 1943',
  january: 'Warsaw · January 1943',
  map: 'The ghetto · April 1943',
  april: 'Zamenhofa and Miła Streets · 19 April 1943',
  flags: 'Muranowski Square · 19 April 1943',
  brush: 'Świętojerska Street · 20 April 1943',
  burning: 'The ghetto · from 21 April 1943',
  mila: '18 Miła Street · 8 May 1943',
  sewers: 'Under Warsaw · 9 May 1943',
  raid: 'Warsaw · 13 May 1943, night',
  lastday: 'Tłomackie Street · 16 May 1943',
  after: 'Warsaw · after',
  israel: 'Israel · 1948',
};

/* The camera. [place in the walk, x, y, z]. Where two keys share nearly the same place,
   the film cuts. */
const CUT = 0.0004;
export const CAM = {
  pos: [
    [at('cover', 0), 0, 5.2, 13.6],
    [at('cover', 0.22), 0, 5.2, 12.7],
    [at('cover', 0.6), 0, 4.5, 8.8],
    [at('cover', 0.85), 0, 2.7, 5.3],
    [at('wall', 0), 0, 1.75, 3.6],
    [at('wall', 0.6), 0, 1.7, -44],
    /* up the ladder the smugglers left against the wall, over the top where the wire is cut, and down */
    [at('wall', 0.74), 0.9, 1.7, -58.86],
    [at('wall', 0.86), 0.9, 4.0, -59.5],
    [at('wall', 0.9), 0.9, 4.05, -60.35],
    [at('wall', 0.912), 0.9, 1.75, -61.1],
    [at('inside', 0), 0, 1.75, -74],
    [at('bridge', 0), 0, 1.7, -144.5],
    [at('bridge', 0.04), 0, 1.75, -147.2],
    [at('bridge', 0.26), 0, 7.3, -159.4],
    [at('bridge', 0.5), 0.3, 7.34, -175],
    [at('bridge', 0.74), 0, 7.3, -190.6],
    [at('bridge', 0.96), 0, 1.75, -202.8],
    [at('trains', 0), 0, 1.7, -206],
    [at('trains', 0.3), 0, 1.7, -252],
    [at('trains', 0.62), -1.4, 1.7, -300],
    [at('trains', 0.78), 0, 1.7, -326],
    [at('two', 0), 0, 1.7, -351],
    [at('two', 0.12), -6.5, 1.7, -361.6],
    [at('two', 0.3), -6.5, -1.78, -372.6],
    [at('two', 0.65), -6.7, -1.8, -384.5],
    [at('two', 1.0) - CUT, -6.6, -1.8, -391],
    /* cut: the cellars of 7 Muranowska, and out through the tunnel under the wall */
    [at('zzw', 0), 70.6, -1.8, -372.6],
    [at('zzw', 0.28), 70.2, -1.8, -377.5],
    [at('zzw', 0.48), 70.6, -1.8, -383.2],
    [at('zzw', 0.6), 70.6, -1.85, -387],
    [at('zzw', 0.92), 70.6, -1.85, -407.5],
    [at('zzw', 1.0) - CUT, 71.0, -1.8, -411.2],
    /* cut: back under the street */
    [at('january', 0), -6.5, -1.8, -397],
    [at('january', 0.68), -6.5, -1.8, -435.6],
    [at('january', 0.88), -6.5, 1.72, -446.6],
    /* (the map is a scene of its own; the street waits) */
    [at('april', 0), -1.6, 1.7, -457],
    [at('april', 0.18), -1.2, 1.7, -476],
    [at('april', 0.32), -1.6, 1.7, -491.5],
    [at('april', 0.45), -2.6, 1.75, -499.5],
    [at('april', 0.56), -4.2, 1.8, -506.5],
    [at('april', 0.66), -0.5, 3.6, -511.5],
    [at('april', 0.78), -1.5, 8.6, -518.5],
    [at('april', 0.84), -2.4, 6.4, -523],
    [at('april', 0.9), -3.0, 3.4, -529],
    [at('flags', 0), -2.3, 1.7, -541],
    [at('flags', 0.12), -1.5, 1.7, -550.5],
    [at('flags', 0.25), -3.0, 1.7, -560],
    [at('flags', 0.38), 8.6, 1.75, -574.5],
    [at('flags', 0.5), 17.0, 1.8, -586.5],
    // Stay with the walker in the square; see the flags from below.
    [at('flags', 0.62), 10, 1.7, -587.5],
    [at('flags', 0.74), 3, 1.7, -591],
    [at('flags', 0.84), -2, 1.7, -595],
    [at('flags', 0.93), -2, 1.7, -601],
    /* Świętojerska: up to the gate of the workshops, and through the moment the mine goes off */
    [at('brush', 0), 0, 1.7, -609],
    [at('brush', 0.2), 0.6, 1.7, -616],
    [at('brush', 0.34), 1.2, 1.7, -621],
    [at('brush', 0.48), -2.2, 1.75, -626.5],
    [at('brush', 0.62), 3.4, 1.7, -632],
    [at('brush', 0.78), 1.2, 3.4, -639],
    [at('brush', 0.9), 0, 1.7, -646],
    [at('burning', 0), 0, 1.7, -650],
    [at('burning', 0.9), 0, 1.7, -690],
    [at('burning', 1.0), -3, 1.7, -696],
    [at('mila', 0.12), -6.5, 1.7, -701.6],
    [at('mila', 0.3), -6.5, -1.98, -712.6],
    [at('mila', 0.62), -6.8, -2.0, -726],
    [at('mila', 0.8), -6.5, -2.0, -737.6],
    [at('mila', 1.0) - CUT, -6.5, -2.0, -738.4],
    /* cut: the sewer, deep under the street */
    [at('sewers', 0), 0, -5.45, -702],
    [at('sewers', 0.25), 0.05, -5.42, -716],
    [at('sewers', 0.5), -0.05, -5.45, -731],
    [at('sewers', 0.72), 0, -5.42, -744],
    [at('sewers', 0.8), 0, -5.4, -750.25],
    [at('sewers', 0.84), 0, -5.3, -750.3],
    [at('sewers', 0.93), 0, -2.6, -750.35],
    [at('sewers', 1.0) - CUT, 0, -1.0, -750.35],
    /* cut: the ruins at night */
    [at('raid', 0), -1.5, 1.7, -752],
    [at('raid', 0.5), 0.5, 1.7, -759],
    [at('raid', 0.9), 1.2, 1.7, -765],
    [at('lastday', 0), 2, 1.7, -772],
    [at('lastday', 0.43), 4, 1.8, -791],
    [at('after', 0), 2, 1.7, -846],
    [at('after', 0.4), 0, 1.7, -905],
    [at('after', 0.75), 0, 1.7, -955],
    [at('after', 1.0) - CUT, 0, 1.5, -962],
    /* cut, through white: a hill above the sea. Behind the people as the flag goes up, then round it, to look out to sea */
    [at('israel', 0), 0.8, 8.2, -1392],
    [at('israel', 0.3), 0.6, 8.5, -1397],
    [at('israel', 0.55), -9, 10.5, -1408],
    [at('israel', 0.8), -8, 12, -1425],
    [at('israel', 1.0), -5, 13, -1431],
  ],
  look: [
    [at('cover', 0), 0, 5.2, 6],
    [at('cover', 0.3), 0, 5.15, 6],
    [at('cover', 0.6), 0, 3.9, 0],
    [at('cover', 0.85), 0, 2.4, -14],
    [at('wall', 0), 0, 2.2, -40],
    [at('wall', 0.6), 0, 2.7, -60],
    [at('wall', 0.74), 0.9, 1.95, -60.2],
    [at('wall', 0.8), 0.9, 3.05, -60.6],
    [at('wall', 0.86), 0.9, 4.15, -62.5],
    [at('wall', 0.9), 0.9, 2.6, -80],
    [at('wall', 0.93), 0.6, 1.7, -90],
    [at('inside', 0), 0, 1.9, -112],
    [at('bridge', 0), 0, 3.6, -166],
    [at('bridge', 0.26), 0, 6.6, -181],
    [at('bridge', 0.5), 46, 3.2, -176.5],
    [at('bridge', 0.74), 0, 4.6, -216],
    [at('trains', 0), 0, 1.7, -242],
    [at('trains', 0.3), 15, 1.9, -286],
    [at('trains', 0.62), 21, 2.2, -322],
    [at('trains', 0.78), 0, 1.7, -360],
    [at('two', 0), -3, 1.5, -372],
    [at('two', 0.12), -6.5, -1.0, -375],
    [at('two', 0.3), -8, -2.0, -386],
    [at('two', 0.65), -11.6, -1.9, -386.4],
    [at('two', 1.0) - CUT, -6.5, -1.9, -410],
    [at('zzw', 0), 67.6, -2.3, -379],
    [at('zzw', 0.16), 67.2, -2.4, -381],
    [at('zzw', 0.32), 73.0, -1.9, -381],
    [at('zzw', 0.48), 70.6, -2.0, -392],
    [at('zzw', 0.92), 70.6, -1.8, -416],
    [at('zzw', 1.0) - CUT, 70.6, -1.5, -416],
    [at('january', 0), -6.5, -1.9, -420],
    [at('january', 0.68), -6.5, -0.4, -446],
    [at('january', 0.88), -3, 2.0, -472],
    [at('april', 0), 0, 3.0, -500],
    [at('april', 0.18), 1, 2.6, -505],
    [at('april', 0.32), 1.4, 2.4, -505],
    [at('april', 0.45), 1.6, 1.9, -505.5],
    [at('april', 0.56), 8, 6.5, -493],
    [at('april', 0.66), 3, 2.0, -505],
    [at('april', 0.78), 0, 1.0, -503],
    [at('april', 0.84), 16, 3, -512],
    [at('april', 0.9), 9, 2.5, -536],
    [at('flags', 0), -12, 6.5, -571],
    [at('flags', 0.12), -20, 8, -572],
    [at('flags', 0.25), -38, 13, -577],
    [at('flags', 0.38), 18, 1.4, -590],
    [at('flags', 0.5), 20.5, 1.2, -591.3],
    [at('flags', 0.62), -40, 15, -579],
    [at('flags', 0.74), -40, 22, -580],
    [at('flags', 0.84), -40, 26, -580],
    [at('flags', 0.93), 0, 3, -640],
    [at('brush', 0), 0, 2.6, -642],
    [at('brush', 0.2), 3, 3.2, -640],
    [at('brush', 0.34), 1, 2.2, -628],
    [at('brush', 0.48), 6, 4.5, -628],
    [at('brush', 0.62), -3, 3.4, -624],
    [at('brush', 0.78), 0.5, 2.6, -626],
    [at('brush', 0.9), 0, 2.6, -680],
    [at('burning', 0), 0, 2.8, -686],
    [at('burning', 0.9), 0, 3, -722],
    [at('burning', 1.0), -6.5, 0.2, -706],
    [at('mila', 0.12), -6.5, -1.5, -714],
    [at('mila', 0.3), -9, -2.2, -724],
    [at('mila', 0.62), -12.4, -2.3, -727],
    [at('mila', 0.8), -6.5, -1.4, -748],
    [at('mila', 1.0) - CUT, -6.5, -1.4, -749],
    [at('sewers', 0), 0, -5.5, -722],
    [at('sewers', 0.72), 0, -5.4, -770],
    [at('sewers', 0.8), 0, -4.2, -752.5],
    [at('sewers', 0.84), 0, -4.75, -751.7],
    [at('sewers', 0.93), 0, -1.9, -751.7],
    [at('sewers', 0.975), 0.02, 2.5, -751.0],
    [at('sewers', 1.0) - CUT, 0.02, 6, -750.8],
    [at('raid', 0), -5, 11, -800],
    [at('raid', 0.5), 9, 15.5, -805],
    [at('raid', 0.9), 4, 13, -806],
    [at('lastday', 0), -30, 10, -800],
    [at('lastday', 0.43), -56, 13, -806],
    [at('after', 0), 0, 2.2, -882],
    [at('after', 0.4), 30, 7, -942],
    [at('after', 0.75), 0, 2.4, -986],
    [at('after', 1.0) - CUT, 0, 5.3, -986],
    [at('israel', 0), 0, 9.6, -1412],
    [at('israel', 0.3), 0.6, 14.2, -1412],
    [at('israel', 0.55), 1.5, 16, -1412],
    [at('israel', 0.8), 2, 15, -1410],
    [at('israel', 1.0), 2.2, 14, -1406],
  ],
};

/* The hour: light, air, and how the picture is printed. Each key holds
   from its `at` to the next key, blending on the way. */
const base = {
  fog: [0.2, 0.2, 0.2], den: 0.012, skyTop: [0.1, 0.1, 0.12], sun: [0.4, 0.4, 0.4], sunDir: [0.3, 0.7, 0.4],
  sky: [0.25, 0.25, 0.25], gnd: [0.06, 0.055, 0.05], lit: 0, wet: 0.5, cloud: 0.5, glow: 0,
  exposure: 1.05, bloom: 0.45, wash: 0.42, grain: 0.04, haze: 0, vignette: 0.66, sepia: 0.56, soft: 0.2,
  embers: 0, ash: 0, feathers: 0, lamps: 0, b1: 0, b2: 0, book: 0, sewer: 0,
  fBattle: 0, fSquare: 0, fBurn: 0, fFar: 0, sBattle: 0, sSquare: 0, sBurn: 0, sFar: 0, fBrush: 0, sBrush: 0,
  fov: 44, bars: 1, focus: 0, aperture: 0.25,
  aWind: 0.4, aFire: 0, aBattle: 0, aDrone: 0.4, aMusic: 0.8, aMuffle: 0, aCrowd: 0, aSing: 0, aPlanes: 0, aDrip: 0, aHope: 0,
  sunShow: 0, rays: 0,          // the sun itself in the sky, and the shafts it throws past what stands before it
};
const m = (o) => ({ ...base, ...o });

const cover = m({ fog: [0.004, 0.003, 0.003], den: 0.085, skyTop: [0, 0, 0], sun: [0, 0, 0], sky: [0.02, 0.016, 0.014], gnd: [0.008, 0.006, 0.005], cloud: 0, exposure: 1.05, bloom: 0.32, wash: 0.04, grain: 0.03, haze: 0.02, sepia: 0.04, soft: 0.04, vignette: 0.4, embers: 0, book: 1, fov: 30, bars: 0, aperture: 0, aWind: 0.15, aFire: 0.55, aDrone: 0.5, aMusic: 0.6, aBattle: 0.18 });
const dusk = m({ fog: [0.085, 0.095, 0.112], den: 0.014, skyTop: [0.03, 0.036, 0.052], sun: [0.1, 0.1, 0.115], sunDir: [0.3, 0.6, 0.5], sky: [0.115, 0.125, 0.145], gnd: [0.03, 0.028, 0.026], lit: 0.28, wet: 1, cloud: 0.7, exposure: 1.3, wash: 0.5, lamps: 1, aWind: 0.65 });
const inside = m({ sunShow: 1, fog: [0.36, 0.345, 0.31], den: 0.009, skyTop: [0.3, 0.3, 0.29], sun: [0.62, 0.55, 0.44], sunDir: [-0.55, 0.42, 0.34], sky: [0.27, 0.265, 0.25], gnd: [0.09, 0.08, 0.07], lit: 0.03, wet: 0.45, wash: 0.65, aCrowd: 0.7, aWind: 0.3 });
const bridge = m({ sunShow: 1, fog: [0.47, 0.455, 0.41], den: 0.0062, skyTop: [0.4, 0.4, 0.39], sun: [0.7, 0.62, 0.5], sunDir: [-0.5, 0.5, 0.36], sky: [0.33, 0.32, 0.3], gnd: [0.1, 0.09, 0.08], wet: 0.4, wash: 0.6, aCrowd: 0.4, aWind: 0.5 });
const yard = m({ sunShow: 1, rays: 0.4, fog: [0.5, 0.45, 0.36], den: 0.007, skyTop: [0.42, 0.4, 0.36], sun: [0.95, 0.82, 0.6], sunDir: [0.62, 0.45, 0.26], sky: [0.3, 0.285, 0.25], gnd: [0.11, 0.095, 0.075], wet: 0.1, cloud: 0.25, wash: 0.75, aCrowd: 0.9, aWind: 0.25, aDrone: 0.7 });
const empty = m({ fog: [0.26, 0.265, 0.27], den: 0.01, skyTop: [0.2, 0.2, 0.21], sun: [0.25, 0.25, 0.26], sky: [0.24, 0.245, 0.25], wet: 0.5, feathers: 0.85, wash: 0.3, aWind: 0.95, aMusic: 1 });
const cellar = m({ fog: [0.012, 0.009, 0.006], den: 0.03, skyTop: [0.01, 0.008, 0.006], sun: [0, 0, 0], sky: [0.013, 0.011, 0.009], gnd: [0.006, 0.005, 0.004], cloud: 0, b1: 1, exposure: 1.3, wash: 0.2, vignette: 1.05, aperture: 0.4, aWind: 0.04, aDrone: 0.75, aMuffle: 1, aMusic: 0.7 });
/* the map: a dark room, one lamp over the table */
const atlas = m({ fog: [0.012, 0.01, 0.008], den: 0.0015, skyTop: [0.004, 0.003, 0.003], sun: [0.62, 0.5, 0.36], sunDir: [-0.35, 0.82, 0.42], sky: [0.07, 0.062, 0.055], gnd: [0.02, 0.016, 0.012], cloud: 0, wet: 0, exposure: 1.12, bloom: 0.38, wash: 0.25, sepia: 0.62, vignette: 0.95, aperture: 0.7, aWind: 0.05, aDrone: 0.55, aMuffle: 0.6, aMusic: 0.9 });
const battle = m({ sunShow: 1, rays: 0.5, fog: [0.24, 0.19, 0.15], den: 0.0105, skyTop: [0.13, 0.13, 0.16], sun: [0.5, 0.31, 0.17], sunDir: [0.25, 0.3, -0.92], sky: [0.2, 0.18, 0.17], gnd: [0.06, 0.045, 0.035], wet: 0.7, cloud: 0.8, glow: 0.35, exposure: 1.1, haze: 0.3, wash: 0.5, embers: 0.3, fBattle: 1, sBattle: 1, sFar: 0.4, aperture: 0.45, aBattle: 1, aFire: 0.6, aWind: 0.4, aMusic: 0.55 });
const flags = m({ sunShow: 1, rays: 0.35, fog: [0.33, 0.27, 0.21], den: 0.006, skyTop: [0.2, 0.2, 0.24], sun: [0.95, 0.74, 0.5], sunDir: [0.62, 0.5, 0.3], sky: [0.27, 0.25, 0.24], gnd: [0.08, 0.06, 0.045], wet: 0.5, cloud: 0.85, glow: 0.4, haze: 0.2, wash: 0.45, embers: 0.3, fBattle: 0.6, sBattle: 0.6, fSquare: 1, sSquare: 1, sFar: 1, fFar: 0.4, aBattle: 0.6, aFire: 0.5, aMusic: 1 });
/* three in the afternoon, under smoke from the square */
const brush = m({ sunShow: 1, rays: 0.35, fog: [0.3, 0.24, 0.18], den: 0.0085, skyTop: [0.16, 0.15, 0.17], sun: [0.86, 0.62, 0.4], sunDir: [-0.45, 0.48, -0.4], sky: [0.24, 0.215, 0.2], gnd: [0.075, 0.055, 0.04], wet: 0.4, cloud: 0.9, glow: 0.25, haze: 0.25, wash: 0.5, embers: 0.35, ash: 0.15, fSquare: 0.3, sSquare: 0.6, sFar: 1, fFar: 0.5, fBrush: 1, sBrush: 1, aperture: 0.4, aBattle: 0.9, aFire: 0.45, aMusic: 0.8 });
const burn = m({ fog: [0.1, 0.042, 0.018], den: 0.012, skyTop: [0.03, 0.012, 0.008], sun: [0, 0, 0], sky: [0.07, 0.035, 0.02], gnd: [0.05, 0.02, 0.008], wet: 0.8, cloud: 1, glow: 1, exposure: 1.0, bloom: 0.7, haze: 0.8, sepia: 0.5, wash: 0.3, embers: 1, ash: 0.3, fBurn: 1, sBurn: 1, fSquare: 0.6, sFar: 1, fFar: 1, fBrush: 0.6, sBrush: 0.6, aFire: 1, aBattle: 0.35, aWind: 0.5, aMusic: 0.8 });
const mila = m({ ...cellar, b1: 0, b2: 1, aMusic: 0.5, aSing: 0.6 });
/* the sewer: black, wet, a carbide lamp ahead */
const sewer = m({ fog: [0.008, 0.009, 0.007], den: 0.045, skyTop: [0, 0, 0], sun: [0, 0, 0], sky: [0.006, 0.007, 0.006], gnd: [0.004, 0.004, 0.003], cloud: 0, wet: 1, sewer: 1, exposure: 1.4, wash: 0.15, vignette: 1.15, aperture: 0.5, focus: 6.5, bloom: 0.6, aWind: 0, aDrone: 0.65, aMuffle: 0.85, aMusic: 0.6, aDrip: 1 });
/* the manhole lid comes off: daylight, from above */
const manhole = m({ ...sewer, fog: [0.5, 0.53, 0.56], den: 0.008, sky: [0.07, 0.075, 0.08], gnd: [0.01, 0.01, 0.01], skyTop: [0.95, 1.0, 1.06], cloud: 0.2, exposure: 1.3, bloom: 0.6, focus: 4, sewer: 0.4, aDrip: 0.3, aWind: 0.4, aMuffle: 0.4 });
/* a night with searchlights in it */
const raid = m({ fog: [0.035, 0.034, 0.045], den: 0.0055, skyTop: [0.012, 0.013, 0.022], sun: [0.05, 0.05, 0.06], sunDir: [0.3, 0.5, 0.5], sky: [0.06, 0.058, 0.068], gnd: [0.02, 0.016, 0.014], wet: 0.2, cloud: 0.75, glow: 0.3, exposure: 1.3, haze: 0.25, wash: 0.35, sepia: 0.6, embers: 0.2, ash: 0.35, fFar: 1, sFar: 0.6, sBurn: 0.3, aperture: 0.2, fov: 50, bloom: 0.55, aFire: 0.25, aWind: 0.5, aMusic: 0.6, aBattle: 0.45, aPlanes: 1, aSing: 0.2 });
const night = m({ fog: [0.075, 0.062, 0.06], den: 0.007, skyTop: [0.035, 0.035, 0.05], sun: [0.08, 0.07, 0.07], sunDir: [0.3, 0.5, 0.5], sky: [0.1, 0.09, 0.09], gnd: [0.03, 0.022, 0.018], wet: 0.3, cloud: 0.9, glow: 0.45, exposure: 1.2, wash: 0.4, embers: 0.25, ash: 0.4, fFar: 1, sFar: 1, sBurn: 0.4, aFire: 0.35, aWind: 0.7, aMusic: 0.9, aSing: 0.5 });
const after = m({ fog: [0.4, 0.405, 0.41], den: 0.0055, skyTop: [0.33, 0.34, 0.36], sun: [0.4, 0.4, 0.4], sunDir: [0.2, 0.8, 0.5], sky: [0.33, 0.335, 0.34], gnd: [0.1, 0.1, 0.1], wet: 0, cloud: 0.6, wash: 0.25, ash: 1, sFar: 0.25, aWind: 1, aMusic: 1, aDrone: 0.3, aSing: 0.8 });
/* the first light. The sky is the page the book prints its logo on: amber at the foot, rising to a
   pale grey green. Here the sepia lifts: this is not the memory any more, it is the morning after it. */
const dawn = m({ fog: [0.5, 0.26, 0.115], den: 0.0052, skyTop: [0.36, 0.39, 0.27], sun: [0.62, 0.4, 0.22], sunDir: [0.1, 0.3, -0.92], sky: [0.21, 0.18, 0.14], gnd: [0.07, 0.05, 0.032], wet: 0, cloud: 0.2, glow: 0.12, exposure: 1.1, bloom: 0.3, wash: 0.16, sepia: 0.22, soft: 0.2, vignette: 0.5, aperture: 0.35, ash: 0.35, sunShow: 1, rays: 0.4, aWind: 0.6, aMusic: 1, aDrone: 0.5, aSing: 1 });
/* 1948: sunrise on a hill above the sea. The print gives way to colour: this is no longer the record of a thing destroyed. */
const sunrise = m({ fog: [0.62, 0.43, 0.3], den: 0.0019, skyTop: [0.15, 0.24, 0.46], sun: [1.0, 0.7, 0.42], sunDir: [0.05, 0.16, -0.99], sky: [0.3, 0.32, 0.4], gnd: [0.09, 0.075, 0.05], wet: 0, cloud: 0.28, glow: 0, exposure: 0.95, bloom: 0.4, wash: 0, grain: 0.03, vignette: 0.42, sepia: 0.15, soft: 0.12, fov: 40, aperture: 0.3, sunShow: 1, rays: 1, aWind: 0.5, aMusic: 0.95, aDrone: 0.15, aSing: 0.45, aHope: 1 });
const morning = m({ ...sunrise, fog: [0.7, 0.76, 0.82], skyTop: [0.1, 0.27, 0.66], sun: [1.0, 0.93, 0.82], sunDir: [0.12, 0.45, -0.88], sky: [0.34, 0.4, 0.5], sepia: 0, cloud: 0.22, rays: 0.25, exposure: 1.05 });

export const MOODS = [
  [at('cover', 0), cover], [at('cover', 0.4), cover],
  [at('wall', 0), dusk], [at('wall', 0.9), dusk],
  [at('inside', 0.12), inside], [at('inside', 0.9), inside],
  [at('bridge', 0.25), bridge], [at('bridge', 0.8), bridge],
  [at('trains', 0.12), yard], [at('trains', 0.56), yard],
  [at('trains', 0.8), empty], [at('two', 0.08), empty],
  [at('two', 0.3), cellar], [at('january', 0.86), cellar],
  [at('january', 0.99), atlas], [at('map', 0.99), atlas],
  [at('april', 0.0), battle], [at('april', 0.96), battle],
  [at('flags', 0.14), flags], [at('flags', 0.9), flags],
  [at('brush', 0.08), brush], [at('brush', 0.92), brush],
  [at('burning', 0.12), burn], [at('mila', 0.08), burn],
  [at('mila', 0.28), mila], [at('mila', 0.99), mila],
  [at('sewers', 0.0), sewer], [at('sewers', 0.82), sewer],
  [at('sewers', 0.92), manhole], [at('sewers', 0.995), manhole],
  [at('raid', 0.0), raid], [at('raid', 0.95), raid],
  [at('lastday', 0.06), night], [at('lastday', 0.97), night],
  [at('after', 0.15), after], [at('after', 0.6), after],
  [at('after', 0.86), dawn], [at('after', 0.999), dawn],
  [at('israel', 0.0), sunrise], [at('israel', 0.34), sunrise],
  [at('israel', 0.82), morning], [at('israel', 1.0), morning],
];

/* Things that happen at one moment. [place, value]. */
export const TRACKS = {
  bookBurn:  [[at('cover', 0.24), 0], [at('cover', 0.9), 1]],
  gone:      [[at('trains', 0.3), 0], [at('trains', 0.76), 1]],                 // the yard empties
  car:       [[at('april', 0), 0.5], [at('april', 0.2), 1]],
  /* time stops in the three fights: 0 the world runs, 1 it is held */
  freeze:    [[at('april', 0.27), 0], [at('april', 0.31), 1], [at('april', 0.92), 1], [at('april', 0.96), 0],
              [at('flags', 0.2), 0], [at('flags', 0.24), 1], [at('flags', 0.88), 1], [at('flags', 0.92), 0],
              [at('brush', 0.33), 0], [at('brush', 0.345), 1], [at('brush', 0.79), 1], [at('brush', 0.83), 0]],
  /* the mine under Świętojerska: 0 not yet, 1 the instant it goes */
  mine:      [[at('brush', 0.328), 0], [at('brush', 0.34), 1]],
  gas:       [[at('mila', 0.3), 0], [at('mila', 0.4), 0.25], [at('mila', 0.66), 1], [at('mila', 0.98), 1], [at('sewers', 0.03), 0]],
  b2:        [[at('mila', 0.2), 1], [at('mila', 0.5), 1], [at('mila', 0.7), 0.06], [at('mila', 1.0), 0]],
  waiting:   [[at('mila', 0.5), 0], [at('mila', 0.74), 1]],
  /* to black, and back: where the film cuts from one place to another */
  fade:      [[at('two', 0.93), 0], [at('two', 0.995), 1], [at('zzw', 0.05), 0], [at('zzw', 0.93), 0], [at('zzw', 0.995), 1], [at('january', 0.05), 0],
              [at('january', 0.9), 0], [at('january', 0.98), 1], [at('map', 0.03), 0], [at('map', 0.95), 0], [at('map', 0.995), 1], [at('april', 0.035), 0],
              [at('mila', 0.68), 0], [at('mila', 0.78), 0.92], [at('mila', 0.97), 1], [at('sewers', 0.04), 0],
              [at('sewers', 0.993), 0], [at('sewers', 0.9995), 1], [at('raid', 0.05), 0],
              [at('after', 0.97), 0], [at('after', 1.0), 0]],
  /* the lid of the manhole lifts, and the daylight floods in */
  daylight:  [[at('sewers', 0.8), 0], [at('sewers', 0.86), 0.5], [at('sewers', 0.94), 1], [at('sewers', 0.999), 1], [at('raid', 0.0), 0]],
  /* and the eye, after a night and a day in the dark, sees nothing but white */
  white:     [[at('sewers', 0.945), 0], [at('sewers', 0.98), 0.55], [at('sewers', 0.993), 1], [at('sewers', 0.999), 1], [at('raid', 0.0), 0],
              /* and at the end the sun comes up over the mound, and the picture goes into it */
              [at('after', 0.972), 0], [at('after', 0.999), 1], [at('israel', 0.0), 1], [at('israel', 0.045), 0]],
  /* the flag goes up the pole */
  flagUp:    [[at('israel', 0.07), 0], [at('israel', 0.33), 1]],
  /* the lamp the guide carries ahead, through the sewer */
  lamp:      [[at('sewers', 0.0), 1], [at('sewers', 0.8), 1], [at('sewers', 0.9), 0.3], [at('sewers', 1.0), 0]],
  /* the bombers overhead: 0 none, 1 the stream is passing */
  bombers:   [[at('raid', 0.0), 0.2], [at('raid', 0.15), 1], [at('raid', 0.85), 1], [at('raid', 1.0), 0.3], [at('lastday', 0.06), 0]],
  /* the one you walk as: where you have his hands and feet (not where the eye leaves the ground), and when he takes up arms */
  hero:      [[at('wall', 0.05), 0], [at('wall', 0.12), 1], [at('january', 0.9), 1], [at('january', 0.97), 0],
              [at('april', 0.03), 0], [at('april', 0.09), 1], [at('april', 0.5), 1], [at('april', 0.56), 0],
              [at('flags', 0.02), 0], [at('flags', 0.08), 1], [at('flags', 0.98), 1],
              [at('brush', 0.02), 0], [at('brush', 0.07), 1], [at('brush', 0.6), 1], [at('brush', 0.66), 0], [at('brush', 0.9), 0], [at('brush', 0.96), 1],
              [at('mila', 0.9), 1], [at('mila', 0.97), 0],
              [at('sewers', 0.03), 0], [at('sewers', 0.08), 1], [at('sewers', 0.975), 1], [at('sewers', 0.995), 0],
              [at('raid', 0.03), 0], [at('raid', 0.1), 1], [at('after', 0.6), 1], [at('after', 0.7), 0]],
  rebel:     [[at('two', 0.47), 0], [at('two', 0.6), 1]],
  collapse:  [[at('lastday', 0.286), 0], [at('lastday', 0.8), 1]],
  flash:     [[at('lastday', 0.268), 0], [at('lastday', 0.293), 1], [at('lastday', 0.43), 0]],
  dust:      [[at('lastday', 0.286), 0], [at('lastday', 0.43), 1], [at('lastday', 0.857), 1], [at('after', 0.25), 0.15], [at('after', 1.0), 0]],
  synFire:   [[at('raid', 0), 0.5], [at('lastday', 0.257), 0.8], [at('lastday', 0.314), 1], [at('lastday', 0.857), 0.5], [at('after', 0.3), 0]],
  candles:   [[at('after', 0.6), 0], [at('after', 0.9), 28]],
  endLogo:   [[at('after', 0.86), 0], [at('after', 0.985), 1]],
  endFire:   [[at('after', 0.93), 0], [at('after', 1.0), 0.9]],
  day:       [[at('april', 0), 1], [at('april', 0.99), 1], [at('flags', 0), 1], [at('flags', 0.99), 1],
              [at('brush', 0), 2], [at('brush', 0.99), 2], [at('burning', 0), 3], [at('burning', 0.99), 19],
              [at('mila', 0), 20], [at('mila', 0.99), 20], [at('sewers', 0), 21], [at('sewers', 0.56), 21], [at('sewers', 0.58), 22], [at('sewers', 0.99), 22],
              [at('raid', 0), 25], [at('raid', 0.99), 25], [at('lastday', 0), 28], [at('after', 0), 28]],
};

export const DAY_RANGE = [at('april', 0), at('after', 0)];

/* The record. A photograph held over the whole picture at the head of a chapter, until you
   step into it; then it burns away to show the reconstruction built from it.
   at: where it waits. The words beside it say what it is, and what it shows. */
export const PLATES = [
  { at: at('wall', 0.0), id: 'closed', first: true,
    title: 'A street closed by the wall', meta: 'Warsaw · 20 December 1940',
    text: ['The ghetto was sealed on 16 November 1940. Where a street ran across its border, the street was walled across. Here the tram rails run on under the wall.'] },
  { at: at('inside', 0.0), id: 'street',
    title: 'Krochmalna Street', meta: 'Inside the ghetto · about 1941',
    text: ['Numbers 11 and 13 are on the left.', 'Further down the same street, at number 92, stood the orphanage of Janusz Korczak. When the ghetto was closed it was left outside the wall, and the children were moved in.'] },
  { at: at('bridge', 0.0), id: 'bridge',
    title: 'The footbridge over Chłodna Street', meta: 'Seen from Żelazna Street · 1942',
    text: ['Chłodna Street carried traffic across the city, so it was left outside the ghetto and cut it in two: the large ghetto to the north, the small ghetto to the south. From January 1942 this wooden bridge joined them.'] },
  { at: at('trains', 0.0), id: 'umschlag',
    title: 'The Umschlagplatz', meta: 'Stawki Street · 1942',
    text: ['The transfer square beside the railway, at the northern edge of the ghetto. From here people were loaded into freight wagons for Treblinka.', 'Who took the photograph is not known. It is held by the Jewish Historical Institute in Warsaw.'] },
  { at: at('april', 0.06), id: 'sentries',
    title: 'At a gate of the ghetto', meta: 'April 1943',
    text: ['German police with a heavy machine gun. Before dawn on 19 April the ghetto was surrounded, so that no one could get out.', 'It comes from the album of the man who led the operation, Jürgen Stroop.'] },
  { at: at('flags', 0.0), id: 'square41',
    title: 'Muranowski Square', meta: 'About 1941',
    text: ['The north east corner of the square, where Sierakowska and Muranowska Streets meet.', 'In April 1943 the fighters of the Jewish Military Union held the houses here, and raised two flags on a roof.'] },
  { at: at('brush', 0.0), id: 'factory',
    title: 'Out of the workshops', meta: 'From the Stroop Report · April 1943',
    text: ['Stroop captioned it “Vacate the factory!” The Germans ordered the workers out of the workshops, to be sent to the labour camps.', 'In the brushmakers’ block on 20 April, the order went unanswered.'] },
  { at: at('burning', 0.0), id: 'burning',
    title: 'Destruction of a housing block', meta: 'From the Stroop Report · April or May 1943',
    text: ['That is Stroop’s own caption. From 21 April, when his men could not take a block, they set it on fire, and blew up the bunkers beneath.'] },
  { at: at('raid', 0.06), id: 'smoke',
    title: 'After the destruction', meta: 'From the Stroop Report · May 1943',
    text: ['Stroop’s caption: “This is how the former Jewish residential district looks after the destruction.”', 'By the middle of May most of the ghetto had burnt. People were still hiding in the ruins.'] },
  { at: at('lastday', 0.02), id: 'synagogue',
    title: 'The Great Synagogue', meta: 'Tłomackie Street · before the war',
    text: ['Opened in 1878, it was one of the largest synagogues in Europe, and the pride of Jewish Warsaw.', 'It was the last thing Stroop destroyed.'] },
  { at: at('after', 0.0), id: 'ruins',
    title: 'What was left', meta: 'Between 1945 and 1947',
    text: ['Of the whole district almost nothing stood but St Augustine’s Church. Stroop reported that all but eight buildings had been demolished.'] },
  { at: at('israel', 0.05), id: 'declaration',
    title: 'The declaration', meta: 'Tel Aviv · 14 May 1948',
    text: ['David Ben-Gurion reads out the declaration of the State of Israel in the Tel Aviv Museum, under a portrait of Theodor Herzl. It was a Friday afternoon, and the British Mandate ended at midnight.', 'The photograph is by Rudi Weissenstein.'] },
];

/* Photographs: what each one is. Where it came from, who took it and under what
   licence is read from img/credits.json, which the download script writes. */
export const PHOTO_NOTES = {
  closed: 'A street closed by the wall, 20 December 1940',
  wall: 'Workers building the ghetto wall',
  street: 'Krochmalna Street, about 1941',
  tram: 'A tram marked with the Star of David, May 1941',
  smuggle: 'Smuggling food over the ghetto wall, 1941',
  children: 'Children in the ghetto, Mariańska Street',
  cans: 'Boxes and milk cans of the Oneg Shabbat archive',
  ringelblum: 'Emanuel Ringelblum',
  crowd: 'Men wearing the armband, Prosta Street, May 1941',
  bridge: 'The footbridge over Chłodna Street',
  umschlag: 'Loading at the Umschlagplatz',
  anielewicz: 'Mordechai Anielewicz',
  bunker: 'A bunker, Stroop Report',
  sentries: 'German police with a machine gun at a gate of the ghetto, Stroop Report',
  pocket: 'Fight against a resistance pocket, Stroop Report',
  square41: 'Muranowski Square, about 1941',
  squareflag: 'The house on Muranowski Square where the flags were raised',
  gun: 'A German gun crew, Stroop collection',
  factory: 'Vacate the factory!, Stroop Report',
  burning: 'Destruction of a housing block, Stroop Report',
  smoke: 'The district after the destruction, Stroop Report',
  stroop: 'Jürgen Stroop with his men, Stroop Report',
  askaris: 'Trawniki guards at a doorway, Stroop Report',
  nalewki: 'Burning houses on Nalewki Street',
  squad: 'An assault squad, Stroop Report',
  armed: 'Captured fighters, Stroop Report',
  fighters: 'Women of the pioneer movement, Stroop Report',
  boy: 'Pulled from the bunkers by force, Stroop Report',
  march: 'Marched to the Umschlagplatz, Stroop Report',
  synagogue: 'The Great Synagogue, Tłomackie Street',
  report: 'Cover page of the Stroop Report',
  ruins: 'The ghetto after the war and St Augustine\'s Church',
  mound: 'The mound at 18 Miła Street today',
  edelman: 'Marek Edelman',
  lubetkin: 'Zivia Lubetkin',
  zuckerman: 'Yitzhak Zuckerman at the Eichmann trial, 1961',
  rotem: 'Simcha Rotem, 2013',
  declaration: 'The declaration of the State of Israel, Tel Aviv, 14 May 1948',
};

export const PHOTOS = Object.keys(PHOTO_NOTES);
export { PHOTO_NOTES as NOTES };

/* the same walk, told in Hebrew: only the words change */
if (HE) {
  for (const c of CHAPTERS) { const h = CHAPTERS_HE[c.id]; if (h) { c.label = h[0]; c.year = h[1]; } }
  for (const b of BEATS) {
    const h = BEATS_HE[`${b.at[0]}:${b.at[1]}`];
    if (h) Object.assign(b, h); else console.warn('28 days: no Hebrew for the card at', b.at.join(' '));
  }
  Object.assign(SLATES, SLATES_HE);
  for (const p of PLATES) Object.assign(p, PLATES_HE[p.id] || {});
  Object.assign(PHOTO_NOTES, NOTES_HE);
}
