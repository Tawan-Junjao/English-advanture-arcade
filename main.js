(()=>{"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],SAVE="englishAdventureV10_1";
const LETTER={A:"ay",B:"bee",C:"see",D:"dee",E:"ee",F:"eff",G:"gee",H:"aitch",I:"eye",J:"jay",K:"kay",L:"ell",M:"em",N:"en",O:"oh",P:"pee",Q:"cue",R:"are",S:"ess",T:"tee"};
const WORDS=[{word:"cat",pic:"🐱"},{word:"dog",pic:"🐶"},{word:"fish",pic:"🐟"},{word:"apple",pic:"🍎"}];
let state;try{state=Object.assign({coins:0,stars:0,words:0,lastX:90,character:"boy",unlocked:[]},JSON.parse(localStorage.getItem(SAVE)||"{}"))}catch{state={coins:0,stars:0,words:0,lastX:90,character:"boy",unlocked:[]}}
let voiceName="",voiceRate=.78,activeGame=null,built=[];
const heroSheet=new Image();
heroSheet.src="assets/heroes.png";

function save(){localStorage.setItem(SAVE,JSON.stringify(state));hud()}function hud(){$("#coinCount").textContent=state.coins;$("#starCount").textContent=state.stars}function show(id){$$(".screen").forEach(x=>x.classList.remove("active"));$("#"+id).classList.add("active");if(id==="parents"){$("#pCoins").textContent=state.coins;$("#pStars").textContent=state.stars;$("#pWords").textContent=state.words}if(id==="settings")voices()}function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function getVoices(){return speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)||/English/i.test(v.name))}function voices(){const v=getVoices();$("#voiceSelect").innerHTML=v.map(x=>`<option>${x.name}</option>`).join("");if(v.length){voiceName=voiceName||v[0].name;$("#voiceSelect").value=voiceName}}function speak(t,r=voiceRate){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(t).toLowerCase()),v=getVoices().find(x=>x.name===voiceName)||getVoices()[0];if(v)u.voice=v;u.lang=v?.lang||"en-US";u.rate=r;speechSynthesis.speak(u)}function spell(w){speak(w.toUpperCase().split("").map(x=>LETTER[x]).join(", "),Math.max(.62,voiceRate-.08))}
function drawHero(c,x,y,type,moving,time){
  const row=type==="girl"?1:0;
  const frame=moving?1+Math.floor(time/140)%2:0;
  if(heroSheet.complete&&heroSheet.naturalWidth){
    c.drawImage(heroSheet,frame*128,row*128,128,128,x-22,y-18,96,96);
    return;
  }
  c.fillStyle=type==="girl"?"#ef5f94":"#3f78e8";
  c.fillRect(x+8,y+32,28,28);
  c.fillStyle="#f4b978";
  c.beginPath();c.arc(x+22,y+18,17,0,Math.PI*2);c.fill();
}
function preview(canvas,type){
  const c=canvas.getContext("2d");
  const draw=()=>{
    const g=c.createLinearGradient(0,0,0,250);
    g.addColorStop(0,"#bfeaff");g.addColorStop(1,"#e5f5c5");
    c.fillStyle=g;c.fillRect(0,0,220,250);
    const row=type==="girl"?1:0;
    if(heroSheet.complete&&heroSheet.naturalWidth){
      c.drawImage(heroSheet,0,row*128,128,128,35,25,150,150);
    }else{
      drawHero(c,80,60,type,false,0);
    }
  };
  if(heroSheet.complete)draw();else heroSheet.addEventListener("load",draw,{once:true});
}
class Game{constructor(c){this.c=c;this.x=c.getContext("2d");this.w=3000;this.p={x:90,y:330,w:42,h:62,vx:0,vy:0,g:false};this.keys={l:false,r:false};this.cam=0;this.coins=[350,530,740,980,1210,1490,1780,2100,2420,2660].map((x,i)=>({x,y:370-(i%3)*38,t:false}));this.plats=[{x:0,y:455,w:3000,h:100},{x:600,y:390,w:170,h:25},{x:1080,y:355,w:190,h:25},{x:1560,y:400,w:210,h:25},{x:2170,y:365,w:180,h:25}];this.gate={x:2800,y:335,w:88,h:120,o:false};this.run=false;this.last=0;this.bind()}bind(){const hold=(e,k)=>{e.onpointerdown=x=>{x.preventDefault();this.keys[k]=true};["onpointerup","onpointerleave","onpointercancel"].forEach(n=>e[n]=()=>this.keys[k]=false)};hold($("#leftBtn"),"l");hold($("#rightBtn"),"r");$("#jumpBtn").onpointerdown=e=>{e.preventDefault();if(this.p.g){this.p.vy=-660;this.p.g=false}}}start(cont){this.p.x=cont?Math.min(state.lastX,2700):90;this.p.y=330;this.gate.o=false;this.run=true;this.last=performance.now();requestAnimationFrame(t=>this.loop(t))}stop(){this.run=false;state.lastX=this.p.x;save()}loop(t){if(!this.run)return;const d=Math.min(.033,(t-this.last)/1000||.016);this.last=t;this.update(d);this.draw();requestAnimationFrame(n=>this.loop(n))}update(d){const p=this.p,o=p.y;p.vx=this.keys.l?-270:this.keys.r?270:0;p.vy+=1650*d;p.x+=p.vx*d;p.y+=p.vy*d;p.g=false;for(const q of this.plats)if(o+p.h<=q.y+5&&p.y+p.h>=q.y&&p.x+p.w>q.x&&p.x<q.x+q.w&&p.vy>=0){p.y=q.y-p.h;p.vy=0;p.g=true}for(const c of this.coins)if(!c.t&&Math.hypot(p.x+21-c.x,p.y+31-c.y)<40){c.t=true;state.coins++;save()}if(!this.gate.o&&p.x+p.w>this.gate.x){p.x=this.gate.x-p.w-2;this.run=false;openGate(this)}this.cam+=((p.x-250)-this.cam)*Math.min(1,5*d);this.cam=Math.max(0,Math.min(this.w-960,this.cam));state.lastX=p.x}draw(){const c=this.x,g=c.createLinearGradient(0,0,0,540);g.addColorStop(0,"#79ceff");g.addColorStop(1,"#effcff");c.fillStyle=g;c.fillRect(0,0,960,540);c.save();c.translate(-this.cam,0);for(const q of this.plats){c.fillStyle="#70c851";c.fillRect(q.x,q.y,q.w,18);c.fillStyle="#9b633d";c.fillRect(q.x,q.y+18,q.w,q.h-18)}for(const x of this.coins)if(!x.t){const s=.35+.65*Math.abs(Math.sin(performance.now()/180+x.x));c.save();c.translate(x.x,x.y);c.scale(s,1);c.fillStyle="#f5bc19";c.beginPath();c.arc(0,0,14,0,Math.PI*2);c.fill();c.restore()}c.fillStyle=this.gate.o?"#83db97":"#7655d8";c.fillRect(this.gate.x,this.gate.y,this.gate.w,this.gate.h);c.fillStyle="#fff";c.font="bold 24px system-ui";c.textAlign="center";c.fillText(this.gate.o?"GO":"ABC",this.gate.x+44,this.gate.y+64);drawHero(c,this.p.x,this.p.y,state.character,Math.abs(this.p.vx)>0,performance.now());c.restore()}}
function openGate(g){activeGame=g;built=[];const it=WORDS[state.words%WORDS.length];$("#gatePicture").textContent=it.pic;$("#slots").innerHTML=it.word.split("").map(()=>'<span class="slot"></span>').join("");$("#letters").innerHTML=shuffle(it.word.toUpperCase().split("")).map(l=>`<button class="letter" data-l="${l}">${l}</button>`).join("");$("#gateMessage").textContent="";$$(".letter").forEach(b=>b.onclick=()=>press(b,it));$("#wordGate").classList.remove("hidden");setTimeout(()=>speak(it.word),200)}function press(b,it){const e=it.word.toUpperCase()[built.length];if(b.dataset.l!==e){$("#gateMessage").textContent="ลองอีกครั้งนะ";return}b.disabled=true;built.push(e);$$(".slot")[built.length-1].textContent=e;if(built.length===it.word.length){state.stars++;state.words++;if(!state.unlocked.includes(it.word))state.unlocked.push(it.word);save();$("#gateMessage").textContent="เปิดประตูสำเร็จ! ⭐";activeGame.gate.o=true;setTimeout(()=>{$("#wordGate").classList.add("hidden");activeGame.p.x=activeGame.gate.x+120;activeGame.run=true;activeGame.last=performance.now();requestAnimationFrame(t=>activeGame.loop(t))},800)}}function renderBook(){$("#bookWords").innerHTML=WORDS.map(w=>state.unlocked.includes(w.word)?`<div>${w.pic} <b>${w.word.toUpperCase()}</b></div>`:`<div class="locked">🔒 ยังไม่ปลดล็อก</div>`).join("")}
const game=new Game($("#gameCanvas"));$("#playBtn").onclick=()=>show("characterSelect");$("#continueBtn").onclick=()=>{show("gameScreen");game.start(true)};$$("[data-character]").forEach(b=>b.onclick=()=>{state.character=b.dataset.character;save();show("gameScreen");game.start(false)});$("#bookBtn").onclick=()=>{renderBook();show("book")};$("#homeBtn").onclick=()=>{game.stop();show("menu")};$("#parentBtn").onclick=()=>show("parents");$("#settingsBtn").onclick=()=>show("settings");$$(".backBtn").forEach(b=>b.onclick=()=>show("menu"));$("#resetBtn").onclick=()=>{state={coins:0,stars:0,words:0,lastX:90,character:"boy",unlocked:[]};save();show("parents")};$("#hearWordBtn").onclick=()=>speak(WORDS[state.words%WORDS.length].word);$("#hearSpellBtn").onclick=()=>spell(WORDS[state.words%WORDS.length].word);$("#voiceSelect").onchange=e=>voiceName=e.target.value;$("#voiceRate").oninput=e=>voiceRate=Number(e.target.value);$("#testVoiceBtn").onclick=()=>speak("apple");speechSynthesis.onvoiceschanged=voices;preview($("#boyPreview"),"boy");preview($("#girlPreview"),"girl");hud();voices();
})();