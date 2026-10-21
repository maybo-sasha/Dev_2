import { z } from 'zod';

export const beatSchema = z.object({ id:z.string(), prompt:z.string(), text:z.string(), view:z.number().int().min(0), variant:z.string(), next:z.string(), checkpoint:z.string() });
export const chapterSchema = z.object({ id:z.string(), order:z.number().int().min(0).max(20), title:z.string(), date:z.string(), question:z.string(), scene:z.enum(['street','station','room','shelter','square','passage','sewer','archive']), variant:z.string(), sourceIds:z.array(z.string()).min(1), reviewStatus:z.literal('needs-review'), beats:z.array(beatSchema).min(1), takeaway:z.string(), reconstruction:z.string() });
export type Chapter = z.infer<typeof chapterSchema>;
export const sourceSchema = z.object({id:z.string(),title:z.string(),institution:z.string(),url:z.string().url(),locator:z.string(),rights:z.literal('link-only'),reviewStatus:z.literal('needs-review')});
const yad = 'https://wwv.yadvashem.org/YV/en/exhibitions/warsaw_ghetto_testimonies/';
export const sources = z.array(sourceSchema).parse([
  {id:'warsaw',title:'Warsaw: history and daily life',institution:'United States Holocaust Memorial Museum',url:'https://encyclopedia.ushmm.org/content/en/article/warsaw',locator:'The Warsaw Ghetto; Deportations and the Warsaw Ghetto Uprising'},
  {id:'uprising',title:'Warsaw Ghetto Uprising',institution:'United States Holocaust Memorial Museum',url:'https://encyclopedia.ushmm.org/content/en/article/warsaw-ghetto-uprising',locator:'The Jewish Underground (ŻOB and ŻZW); April 19, 1943–May 16, 1943'},
  {id:'january',title:'The January resistance',institution:'Yad Vashem',url:yad+'resistance.asp',locator:'January 1943 resistance; testimony context'},
  {id:'prepare',title:'Preparing for the uprising',institution:'Yad Vashem',url:yad+'preparing_uprising.asp',locator:'Preparations and hiding places'},
  {id:'passover',title:'The last Passover',institution:'Yad Vashem',url:yad+'last_passover.asp',locator:'April 19, 1943 / Passover eve'},
  {id:'fighters',title:'Fighters in the Warsaw Ghetto',institution:'Yad Vashem',url:yad+'fighters.asp',locator:'ŻOB and ŻZW; Muranowski and the brush-workshop area'},
  {id:'bunkers',title:'Life in the bunkers',institution:'Yad Vashem',url:yad+'bunkers.asp',locator:'Civilian accounts of hiding'},
  {id:'calendar',title:'Timeline of the Warsaw Ghetto Uprising',institution:'POLIN Museum',url:'https://polin.pl/system/files/attachments/Timeline%20of%20the%20events%20of%20the%20Warsaw%20Ghetto%20Uprising.pdf',locator:'Page 9: May 8 and May 10'},
  {id:'liquidation',title:'The liquidation of the ghetto',institution:'Yad Vashem',url:yad+'liquidation.asp',locator:'May 16 and the Great Synagogue'},
  {id:'ruins',title:'Life among the ruins',institution:'Yad Vashem',url:yad+'ruins.asp',locator:'Hiding and survival after the uprising'},
].map(s=>({...s,rights:'link-only',reviewStatus:'needs-review'})));

type Draft = [string,string,string,string,Chapter['scene'],string,string[],string, [string,string][]];
const drafts: Draft[] = [
['opening','28 DAYS','Warsaw · 1940–1943','How did resistance take shape inside a place built to prevent it?','street','ruined',['uprising'],'Begin with the neighborhood before the uprising.',[
 ['A place, before and after','You are an observer. The people in these reconstructed spaces are not characters whose fates you control.'],
 ['Return to 1940','A change from ruins to an earlier street is a visual transition through time, not a literal rebuilding. The story begins with enclosure.']]],
['wall','The Wall','November 1940','How did a neighborhood become a place of confinement?','street','enclosure',['warsaw'],'The wall separated people from the city around them.',[
 ['Follow the group','Families carry belongings along a street toward the barrier. These anonymous figures and their route are a reconstruction.'],
 ['Observe the wall','German authorities ordered the Warsaw ghetto in October 1940. It was sealed in November.'],
 ['Look toward the gate','The barrier cuts through a neighborhood. Warsaw beyond it remains physically close.'],
 ['Pause beside the group','Waiting and carrying are part of this scene. Continuing does not depend on keeping pace with anyone.'],
 ['Look toward the other side','The view beyond the barrier emphasizes separation. This is not a surveyed reconstruction of a particular gate.'],
 ['Observe the closure','The gate closes in this illustrative sequence. The wall separated people from the city around them.'],
 ['Examine the historical context','Compare the reconstructed composition with the institutional history. A verified photograph for this viewpoint is still awaiting selection.']]],
['inside','Inside','1941','What lives and community responses existed within confinement?','street','inhabited',['warsaw'],'Community life and mutual support continued under imposed deprivation.',[
 ['Recognize the street','The same entrances and windows now frame daily routines under confinement.'],
 ['Observe the food queue','Overcrowding and deprivation shaped daily life. This queue is an illustrative composition, not a reenactment of identified people.'],
 ['Enter the courtyard','Households, neighbors and community organizations responded to urgent needs.'],
 ['Consider shelter','A doorway, a room and a shared meal belong to the history of the people who lived here.'],
 ['Read about community support','The history of this place includes mutual aid and efforts to sustain community, before and alongside armed resistance.']]],
['deportation','The Great Deportation','Summer 1942','What did German “resettlement” conceal?','station','inhabited',['warsaw','uprising'],'The deportations led to Treblinka, a killing center.',[
 ['Observe the platform','The space evokes the Umschlagplatz. Its layout is interpretive; the visitor does not board a deportation train.'],
 ['Examine the suitcase','This suitcase is an illustrative prop. No owner or farewell story has been invented for it.'],
 ['Read the context','German authorities described the deportations as “resettlement.” The destination was Treblinka, a killing center.'],
 ['Trace the destination','Warsaw → Treblinka. This textual route is schematic, not a period map or a reconstruction of the railway alignment.']]],
['realization','The Realization','After summer 1942','How did information change decisions?','room','inhabited',['uprising'],'Knowledge reached different people at different times.',[
 ['Examine the reports','A generic table provides a place to consider information. It does not represent a documented meeting.'],
 ['Consider news from outside','Reports about Treblinka changed understandings of deportation. Individual documents need separate provenance.'],
 ['Consider the absence','Earlier deportees had not returned. This absence formed part of the context in which decisions were made.'],
 ['Connect the evidence','There was no single moment in which every resident received or understood the same information.'],
 ['Continue toward organization','Understanding mass murder shaped resistance organization. The following chapter introduces two distinct underground organizations.']]],
['two-undergrounds','Two Undergrounds','ŻOB + ŻZW','Who organized armed resistance?','room','inhabited',['uprising','fighters'],'ŻOB and ŻZW were distinct organizations resisting German destruction.',[
 ['Meet both organizations','ŻOB and ŻZW had different political backgrounds. They must not be depicted as one unified command.'],
 ['Read about ŻOB','Żydowska Organizacja Bojowa — Jewish Combat Organization. Several Jewish underground groups formed this organization in 1942.'],
 ['Read about ŻZW','Żydowski Związek Wojskowy — Jewish Military Union. Its origins lay in Revisionist Zionist circles, including Betar.'],
 ['Compare the records','The organizations receive equal attention here. Differences in surviving documentation are not evidence of insignificance.'],
 ['Consider shared resistance','The two stations are an interpretive comparison, not a reconstruction of a shared headquarters. There is no faction to choose.']]],
['contacts','Weapons & Contacts','1942–early 1943','How did people obtain scarce weapons and maintain contacts?','passage','inhabited',['uprising','fighters'],'Contacts and deliveries were difficult, dangerous and uneven.',[
 ['Observe a delivery','An anonymous courier carries a package along an illustrative route. The visitor accompanies the demonstration.'],
 ['Follow the route','The route represents logistical difficulty; it is not a documented itinerary or a stealth challenge.'],
 ['Pause at the checkpoint','A pause provides context for restrictions on movement. It has no suspicion meter or success condition.'],
 ['Examine the supplies','The package is opened in a quiet interior. Weapons remain historical objects, not equipment for the visitor.'],
 ['Compare the contacts','Contacts and supplies differed between organizations. No identical network or exact arsenal is assumed.']]],
['january','January 18, 1943','January 18, 1943','How did January’s resistance change expectations?','street','uprising',['january'],'Armed action and civilian refusal changed expectations, without a simple single-cause explanation.',[
 ['Observe the street','A sheltered viewpoint frames the January deportation operation.'],
 ['Consider what residents understood','Many residents believed a final liquidation had begun. Later historical accounts distinguish that belief from the operation’s intended limited scope.'],
 ['Observe resistance','Armed resistance and refusal to assemble disrupted deportation. The visitor does not initiate an attack.'],
 ['Continue through the passage','The perspective changes through an illustrative interior route.'],
 ['Read the interpretation','The experience of January encouraged preparation. It does not establish that armed action alone prevented a planned total deportation.']]],
['prepare','Prepare','January–April 1943','What did preparation mean for civilians and fighters?','shelter','prepared',['prepare'],'Shelters required air, water, concealment and routes, for families as well as fighters.',[
 ['Inspect ventilation','The interpretive cutaway makes ventilation visible. It is not a surveyed bunker.'],
 ['Examine water and food','Stored supplies show the practical demands of sheltering below ground.'],
 ['Observe the concealed entrance','Concealment is explained through a reversible view, not a construction task.'],
 ['Reveal the secondary exit','Remember the passage beside the water containers. This same interpretive route returns in Beneath the Fire.'],
 ['Observe people moving below','Preparation involved civilians and families, not only armed groups.']]],
['network','The Network','Before the uprising','How did resistance depend on many places and connections?','room','prepared',['fighters','prepare'],'Connections mattered; incomplete records must remain visibly incomplete.',[
 ['Read the schematic','The map is an interpretive index of this experience, not a geographic plan of the ghetto.'],
 ['Explore ŻOB','Open the organization context and its linked chapters.'],
 ['Explore ŻZW','Muranowski and the organization’s later records remain part of the route.'],
 ['Consider civilian shelters','Hiding and support cannot be reduced to armed positions.'],
 ['Consider contacts and routes','Exact positions and physical connections are not shown without reviewed evidence. Unknown connections remain unknown.']]],
['night-before','The Night Before','April 18, 1943','What did anticipation and preparation look like?','room','night',['passover'],'April 19 was Passover eve.',[
 ['Follow the preparations','Messages, packing and waiting frame this interpretive interior. No invented historical dialogue is spoken.'],
 ['Observe supplies being divided','People prepared in different ways and with different information.'],
 ['Look toward the shelter','The shelter entrance links preparations above and below ground.'],
 ['Return upstairs','The light dims. This scene does not invent a Passover Seder on April 18.'],
 ['Read the date','April 19, 1943. Passover eve.']]],
['day-one','Day 1','April 19, 1943','How did the uprising begin?','street','uprising',['uprising','fighters'],'Armed resistance and civilian hiding confronted the German operation.',[
 ['Enter the upper-floor viewpoint','The familiar street is now conspicuously empty above ground.'],
 ['Observe German entry','German forces entered the ghetto for the final deportation operation.'],
 ['Observe the response','Resistance is considered from a sheltered viewpoint. No visitor targeting or firing is involved.'],
 ['Change perspective','A second composition shows the surrounding built environment. It does not assert simultaneous action at every position.'],
 ['Read the resistance overview','Both ŻOB and ŻZW belong in this history, alongside civilians hiding and refusing to assemble.']]],
['muranowski','Muranowski','April 1943 · ŻZW','What was ŻZW’s role, and how is it documented?','square','uprising',['fighters'],'ŻZW is central to this chapter; disputed details remain open to examination.',[
 ['Observe the square','The street-level composition introduces the Muranowski context. The architecture is an interpretive model.'],
 ['Change to the upper floor','A second viewpoint considers the buildings around the square. It does not assign every building to one organization.'],
 ['Look from the roof','A third perspective shows how the built environment shaped observation and movement.'],
 ['Compare the accounts','What sources support: ŻZW activity around Muranowski. Where accounts differ: exact chronology, leadership details and the flags narrative require specific review.'],
 ['Consider what remains unknown','This reconstruction does not stage disputed flags or named commanders in action. Precise choreography has not been established here.'],
 ['Follow the records onward','ŻZW remains present in the network, aftermath context and archive. Gaps in evidence do not erase its role.']]],
['districts','Fighting Districts','April 1943','How did resistance use buildings, passages and local knowledge?','passage','uprising',['fighters'],'Local routes must be distinguished from reconstructed shortcuts.',[
 ['Observe a position','Buildings provided observation and passage. This interior is generic.'],
 ['Follow the inner passage','A connected sequence makes spatial relationships legible without presenting a tactical challenge.'],
 ['Enter the courtyard','Courtyards and passages connected interior spaces.'],
 ['Change to the next interior','The route is illustrative. Exact layouts need location-specific evidence.'],
 ['Read the local attribution','No entire district is assigned exclusively to one organization. The brush-workshop area includes evidence of ŻZW activity.']]],
['fire','Fire','Late April–May 1943','How did systematic burning change resistance?','street','burned',['fighters'],'German burning and destruction forced people deeper into shelter.',[
 ['Recognize the street','The same street landmarks return in a damaged state.'],
 ['Observe the destruction','German forces systematically burned and destroyed buildings.'],
 ['Consider the method','Destruction put hiding places and the people within them under pressure. This is not an explosion spectacle.'],
 ['Continue toward the shelter','The route below remains available without a race against fire.']]],
['beneath-fire','Beneath the Fire','Civilians underground','What did hiding and maintaining a shelter mean?','shelter','blocked',['bunkers'],'Shelter life involved waiting, sharing and uncertainty.',[
 ['Enter the shelter','The interpretive space from Prepare returns with changed conditions.'],
 ['Consider air and water','Air and water are historical context, not depleting meters or resources for choosing who survives.'],
 ['Observe the blocked route','Destruction above affected routes below. This doorway is staged, not a record of a specific bunker.'],
 ['Recall the secondary exit','The passage beside the water containers returns from Chapter 08. It explains preparation without claiming that the visitor saved anyone.'],
 ['Continue through the passage','Different accounts describe different shelter experiences. No single reconstruction stands for everyone.']]],
['mila','Miła 18','May 8, 1943 · ŻOB','What happened to ŻOB’s central leadership?','shelter','mila',['calendar'],'The destruction of the command bunker did not end all resistance.',[
 ['Read the location context','Miła 18 is identified separately from the generic civilian shelter. It was a ŻOB command bunker.'],
 ['Consider the command space','This still interpretive view is not a surveyed interior. Named figures are not assigned to anonymous models.'],
 ['Examine the documented account','German forces attacked the bunker on May 8. Anielewicz and many of those inside died.'],
 ['Pause with the record','The deaths are addressed through text. There is no reenacted death or suicide sequence.'],
 ['Continue beyond the center','The loss of ŻOB’s central leadership was not the end of all resistance, hiding or survival.']]],
['without-center','Resistance Without a Center','After May 8, 1943','How did resistance persist as connections broke apart?','passage','ruined',['ruins','fighters'],'Fragmentation did not mean that every person or connection disappeared.',[
 ['Observe the ruined passage','The built environment has changed; knowledge of surviving connections is incomplete.'],
 ['Consider the fragmented network','Lost contact, destruction and unknown status are different things.'],
 ['Read the aftermath context','ŻZW aftermath records belong here without inventing participation in the May 10 evacuation.'],
 ['Continue toward the evacuation','The next chapter concerns a documented evacuation, not an escape shared by everyone.']]],
['sewers','The Sewers','May 10, 1943','How did some fighters leave the destroyed ghetto?','sewer','intact',['calendar'],'Some fighters left through the sewers; escape did not mean safety for everyone.',[
 ['Stay with the group','The May 10 evacuation anchors this chapter. Tunnel layout and walking order are reconstruction.'],
 ['Continue along the route','The visitor follows guided viewpoints. There is no oxygen limit or abandonment condition.'],
 ['Pause at the junction','Orientation marks are interpretive aids, not asserted period markings.'],
 ['Follow the guide','The group continues through the corridor. Pausing cannot change the historical outcome.'],
 ['Continue to the exit','The ladder is an observation point. A still transition replaces climbing when preferred.'],
 ['Look toward the smoke','Emergence did not mean that all fighters had escaped, or that those who left were safe.']]],
['may-sixteen','May 16','May 16, 1943 · Day 28','What did the German endpoint mean—and what continued?','street','ruined',['liquidation','ruins'],'The German declaration was not the end of all hiding, resistance or survival.',[
 ['Return to the opening view','The composition recalls the opening. You may pause here or continue immediately.'],
 ['Read the date','April 19 through May 16 contains 28 calendar dates when counted inclusively; it is 27 elapsed days.'],
 ['Examine the declaration','German authorities declared the operation complete. The destruction of the Great Synagogue marked this endpoint.'],
 ['Look beyond the endpoint','People continued hiding in the ruins. May 16 is not a declaration that all people or resistance had disappeared.']]],
['epilogue','They Did Not Disappear','People, memory and evidence','Who were the people, and what can their records tell us?','archive','intact',['uprising','fighters','bunkers','ruins'],'Remember the people. Examine the evidence. Continue learning.',[
 ['Enter the archive','The reconstructed world gives way to sources. Historical people require documented identities, affiliations and life histories.'],
 ['Follow ŻOB and ŻZW','Both organizations have paths through the chapter index and institutional records.'],
 ['Follow civilian perspectives','Civilian, courier and organizer perspectives remain integral to the history.'],
 ['Examine the evidence','This prototype links to institutional records. Individual biographies and documentary images await historical and rights review; no synthetic portrait replaces them.']]],
];

export const chapters = drafts.map((d,order)=>chapterSchema.parse({
 id:`ch${String(order).padStart(2,'0')}_${d[0]}`,order,title:d[1],date:d[2],question:d[3],scene:d[4],variant:d[5],sourceIds:d[6],takeaway:d[7],reviewStatus:'needs-review',
 reconstruction:'Interpretive reconstruction. Generic figures and spatial arrangements are not a documented reenactment.',
 beats:d[8].map(([prompt,text],i)=>({id:`${d[0]}_${i}`,prompt,text,view:i,variant:order===1&&i>=5?'closed':d[5],next:i===d[8].length-1?'$chapterEnd':`${d[0]}_${i+1}`,checkpoint:`cp_${d[0]}_${i}`})),
}));

export function validateContent() {
 const ids=new Set(chapters.map(c=>c.id));
 if(ids.size!==21||chapters.length!==21) throw new Error('The route must contain exactly 21 unique chapters.');
 chapters.forEach((c,index)=>{if(c.order!==index) throw new Error('Chapter order mismatch');
   const beats=new Set(c.beats.map(b=>b.id)); if(beats.size!==c.beats.length) throw new Error('Duplicate beat');
   c.beats.forEach((b,i)=>{if(b.next!==(c.beats[i+1]?.id??'$chapterEnd')) throw new Error('Broken or cyclic narrative route');});
   c.sourceIds.forEach(id=>{if(!sources.some(s=>s.id===id)) throw new Error(`Missing source: ${id}`);});
 });
}
validateContent();
