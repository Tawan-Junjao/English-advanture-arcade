(()=>{
"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const preventIOSMenu=(event)=>event.preventDefault();
["contextmenu","selectstart","dragstart"].forEach(type=>{
  document.addEventListener(type,preventIOSMenu,{passive:false});
});
document.addEventListener("touchmove",(event)=>{
  if(document.body.classList.contains("game-active"))event.preventDefault();
},{passive:false});
document.addEventListener("gesturestart",preventIOSMenu,{passive:false});
document.addEventListener("gesturechange",preventIOSMenu,{passive:false});
document.addEventListener("gestureend",preventIOSMenu,{passive:false});

function bindHoldButton(element,onStart,onEnd){
  const start=(event)=>{
    event.preventDefault();
    if(event.pointerId!==undefined && element.setPointerCapture){
      try{element.setPointerCapture(event.pointerId)}catch{}
    }
    onStart();
  };
  const end=(event)=>{
    event.preventDefault();
    if(event.pointerId!==undefined && element.releasePointerCapture){
      try{element.releasePointerCapture(event.pointerId)}catch{}
    }
    onEnd();
  };
  element.addEventListener("pointerdown",start,{passive:false});
  ["pointerup","pointercancel","lostpointercapture"].forEach(type=>{
    element.addEventListener(type,end,{passive:false});
  });
  element.addEventListener("touchstart",event=>event.preventDefault(),{passive:false});
  element.addEventListener("touchend",event=>event.preventDefault(),{passive:false});
}

const SAVE="englishAdventureV11";
const WORDS=[{word:"cat",pic:"🐱"},{word:"dog",pic:"🐶"},{word:"fish",pic:"🐟"},{word:"apple",pic:"🍎"}];
const LETTER={A:"ay",B:"bee",C:"see",D:"dee",E:"ee",F:"eff",G:"gee",H:"aitch",I:"eye",J:"jay",K:"kay",L:"ell",M:"em",N:"en",O:"oh",P:"pee",Q:"cue",R:"are",S:"ess",T:"tee"};
let state;try{state=Object.assign({coins:0,stars:0,words:0,character:"boy",unlocked:[]},JSON.parse(localStorage.getItem(SAVE)||"{}"))}catch{state={coins:0,stars:0,words:0,character:"boy",unlocked:[]}}
let game=null,scene=null,voiceName="",voiceRate=.78,built=[];
function save(){localStorage.setItem(SAVE,JSON.stringify(state));updateHud()}
function show(id){
  $$(".screen").forEach(x=>x.classList.remove("active"));
  $("#"+id).classList.add("active");
  document.body.classList.toggle("game-active",id==="gameScreen"||id==="monsterScreen");
  if(id==="parentsScreen")renderParents();
  if(id==="settingsScreen")loadVoices();
}
function updateHud(){$("#coins").textContent=state.coins;$("#stars").textContent=state.stars}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function voices(){return speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)||/English/i.test(v.name))}
function loadVoices(){const v=voices();$("#voiceSelect").innerHTML=v.map(x=>`<option>${x.name}</option>`).join("");if(v.length){voiceName=voiceName||v[0].name;$("#voiceSelect").value=voiceName}}
function speak(t,r=voiceRate){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(t).toLowerCase()),v=voices().find(x=>x.name===voiceName)||voices()[0];if(v)u.voice=v;u.lang=v?.lang||"en-US";u.rate=r;speechSynthesis.speak(u)}
function spell(w){speak(w.toUpperCase().split("").map(x=>LETTER[x]).join(", "),Math.max(.62,voiceRate-.08))}
function drawPreview(canvas,row){const c=canvas.getContext("2d"),im=new Image();im.onload=()=>{c.fillStyle="#dff6ff";c.fillRect(0,0,220,230);c.drawImage(im,0,row*128,128,128,35,25,150,150)};im.src="heroes.png"}
function renderBook(){$("#bookGrid").innerHTML=WORDS.map(w=>state.unlocked.includes(w.word)?`<div>${w.pic} <b>${w.word.toUpperCase()}</b></div>`:`<div class="locked">🔒 ยังไม่ปลดล็อก</div>`).join("")}
function renderParents(){$("#pCoins").textContent=state.coins;$("#pStars").textContent=state.stars;$("#pWords").textContent=state.words}


let monsterState={round:0,total:6,time:16,progress:0,lives:3,timer:null,built:[],word:null,locked:false};

function resetMonsterPositions(){
  const hero=$("#escapeHero"),mon=$("#escapeMonster");
  hero.classList.remove("shake");
  hero.style.left="8%";
  mon.style.left="78%";
  $("#dangerFill").style.width="0%";
}

function applyHeroSprite(){
  const hero=$("#escapeHero");
  const row=state.character==="girl"?1:0;
  hero.style.backgroundPosition=`0px ${-row*96}px`;
}

function startMonsterEscape(){
  if(game){game.destroy(true);game=null}
  monsterState.round=0;
  show("monsterScreen");
  applyHeroSprite();
  nextMonsterRound();
}

function nextMonsterRound(){
  clearInterval(monsterState.timer);
  monsterState.round++;
  monsterState.time=16;
  monsterState.progress=0;
  monsterState.lives=3;
  monsterState.built=[];
  monsterState.locked=false;
  monsterState.word=WORDS[(state.words+monsterState.round-1)%WORDS.length];
  resetMonsterPositions();

  $("#monsterRound").textContent=`รอบ ${monsterState.round}/${monsterState.total}`;
  $("#monsterLives").textContent="❤️❤️❤️";
  $("#monsterTimer").textContent="⏱️ 16";
  $("#monsterPic").textContent=monsterState.word.pic;
  $("#monsterMessage").textContent="สัตว์ประหลาดกำลังมา!";
  $("#monsterSlots").innerHTML=monsterState.word.word.split("").map(()=>'<span class="slot"></span>').join("");
  $("#monsterLetters").innerHTML=shuffle(monsterState.word.word.toUpperCase().split("")).map(l=>`<button class="monster-letter" data-l="${l}">${l}</button>`).join("");
  $$(".monster-letter").forEach(b=>b.onclick=()=>monsterPress(b));

  setTimeout(()=>speak(monsterState.word.word),250);
  monsterState.timer=setInterval(()=>{
    if(monsterState.locked)return;
    monsterState.time--;
    monsterState.progress+=6;
    updateMonsterHud();
    if(monsterState.time<=0||monsterState.progress>=70)monsterCaught();
  },1000);
}

function updateMonsterHud(){
  $("#monsterTimer").textContent=`⏱️ ${monsterState.time}`;
  $("#monsterLives").textContent="❤️".repeat(Math.max(0,monsterState.lives));
  $("#escapeMonster").style.left=`${Math.max(18,78-monsterState.progress)}%`;
  $("#dangerFill").style.width=`${Math.min(100,monsterState.progress/70*100)}%`;
}

function monsterPress(btn){
  if(monsterState.locked||btn.disabled)return;
  const target=monsterState.word.word.toUpperCase();
  const expected=target[monsterState.built.length];
  const chosen=btn.dataset.l;

  if(chosen===expected){
    btn.disabled=true;
    monsterState.built.push(chosen);
    $$("#monsterSlots .slot")[monsterState.built.length-1].textContent=chosen;
    monsterState.progress=Math.max(0,monsterState.progress-5);
    $("#escapeHero").style.left=`${Math.min(54,8+monsterState.built.length*7)}%`;
    updateMonsterHud();
    if(monsterState.built.length===target.length)monsterEscaped();
  }else{
    monsterState.lives--;
    monsterState.progress+=10;
    $("#monsterMessage").textContent="เกือบแล้ว ลองอีกครั้งนะ";
    $("#escapeHero").classList.remove("shake");
    void $("#escapeHero").offsetWidth;
    $("#escapeHero").classList.add("shake");
    updateMonsterHud();
    if(monsterState.lives<=0||monsterState.progress>=70)monsterCaught();
  }
}

function monsterEscaped(){
  if(monsterState.locked)return;
  monsterState.locked=true;
  clearInterval(monsterState.timer);
  state.stars++;
  state.words++;
  if(!state.unlocked.includes(monsterState.word.word))state.unlocked.push(monsterState.word.word);
  save();
  $("#escapeHero").style.left="72%";
  $("#escapeMonster").style.left="92%";
  $("#monsterMessage").textContent="หนีสำเร็จ! เก่งมาก ⭐";
  speak("great job",.82);
  setTimeout(()=>{
    resetMonsterPositions();
    if(monsterState.round>=monsterState.total){
      $("#monsterMessage").textContent=`จบด่าน! หนีสำเร็จ ${monsterState.total} รอบ`;
      $("#monsterLetters").innerHTML='<button class="monster-letter" id="monsterAgain">เล่นอีกครั้ง</button>';
      $("#monsterSlots").innerHTML="";
      $("#monsterAgain").onclick=startMonsterEscape;
    }else{
      nextMonsterRound();
    }
  },1100);
}

function monsterCaught(){
  if(monsterState.locked)return;
  monsterState.locked=true;
  clearInterval(monsterState.timer);
  $("#escapeMonster").style.left="18%";
  $("#monsterMessage").textContent="ถูกจับแล้ว ลองคำนี้อีกครั้ง";
  speak("try again",.82);
  $("#monsterLetters").insertAdjacentHTML("beforeend",'<button class="monster-letter" id="monsterRetry">ลองใหม่</button>');
  $("#monsterRetry").onclick=()=>{monsterState.round--;nextMonsterRound()};
}

class World extends Phaser.Scene{
 constructor(){super("World")}
 preload(){this.load.image("bg","background.png");this.load.spritesheet("heroes","heroes.png",{frameWidth:128,frameHeight:128});this.load.image("coin","coin.png");this.load.image("gate","gate.png")}
 create(){
  scene=this;this.physics.world.setBounds(0,0,3200,540);this.cameras.main.setBounds(0,0,3200,540);
  this.add.image(800,270,"bg").setDisplaySize(1600,900).setScrollFactor(.15);
  this.add.image(2400,270,"bg").setDisplaySize(1600,900).setScrollFactor(.15);
  const ground=this.add.rectangle(1600,500,3200,80,0x8b5a36);this.physics.add.existing(ground,true);
  this.add.rectangle(1600,455,3200,18,0x6fc64f);
  this.platforms=this.physics.add.staticGroup();
  [[650,390,180],[1120,350,190],[1600,400,220],[2200,360,190]].forEach(([x,y,w])=>{const p=this.add.rectangle(x,y,w,28,0x6fc64f);this.physics.add.existing(p,true);this.platforms.add(p)});
  const row=state.character==="girl"?1:0;this.hero=this.physics.add.sprite(100,380,"heroes",row*4).setDisplaySize(96,96).setCollideWorldBounds(true);
  this.hero.body.setSize(56,96).setOffset(36,20);this.physics.add.collider(this.hero,ground);this.physics.add.collider(this.hero,this.platforms);
  this.anims.create({key:"walk",frames:[{key:"heroes",frame:row*4+1},{key:"heroes",frame:row*4+2}],frameRate:8,repeat:-1});
  this.coins=this.physics.add.group();[350,530,740,980,1210,1490,1780,2100,2420,2660].forEach((x,i)=>{const c=this.coins.create(x,360-(i%3)*38,"coin").setScale(.55);c.body.setAllowGravity(false);c.setData("taken",false)});
  this.physics.add.overlap(this.hero,this.coins,(h,c)=>{if(c.getData("taken"))return;c.setData("taken",true);c.disableBody(true,true);state.coins++;save()});
  this.gate=this.physics.add.staticImage(2850,380,"gate").setScale(.5);
  this.physics.add.overlap(this.hero,this.gate,()=>this.openGate());
  this.cameras.main.startFollow(this.hero,true,.08,.08,220,0);
  this.keys={left:false,right:false};
 }
 update(){
  if(this.modal)return;
  const speed=260;
  if(this.keys.left){this.hero.setVelocityX(-speed);this.hero.setFlipX(true);this.hero.anims.play("walk",true)}
  else if(this.keys.right){this.hero.setVelocityX(speed);this.hero.setFlipX(false);this.hero.anims.play("walk",true)}
  else{this.hero.setVelocityX(0);this.hero.anims.stop();this.hero.setFrame((state.character==="girl"?1:0)*4)}
 }
 openGate(){
  if(this.modal)return;this.modal=true;this.physics.pause();built=[];
  const it=WORDS[state.words%WORDS.length];$("#gatePic").textContent=it.pic;$("#slots").innerHTML=it.word.split("").map(()=>'<span class="slot"></span>').join("");$("#letters").innerHTML=shuffle(it.word.toUpperCase().split("")).map(l=>`<button class="letter" data-l="${l}">${l}</button>`).join("");$("#message").textContent="";$$(".letter").forEach(b=>b.onclick=()=>pressLetter(b,it));$("#gateModal").classList.remove("hidden");setTimeout(()=>speak(it.word),200)
 }
}
function createGame(){
 if(game){game.destroy(true);game=null}
 game=new Phaser.Game({type:Phaser.AUTO,parent:"game",width:960,height:540,backgroundColor:"#8bd2ff",physics:{default:"arcade",arcade:{gravity:{y:1400},debug:false}},scene:[World],scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:960,height:540,expandParent:true}});
}
function pressLetter(b,it){const e=it.word.toUpperCase()[built.length];if(b.dataset.l!==e){$("#message").textContent="ลองอีกครั้งนะ";return}b.disabled=true;built.push(e);$$(".slot")[built.length-1].textContent=e;if(built.length===it.word.length){state.stars++;state.words++;if(!state.unlocked.includes(it.word))state.unlocked.push(it.word);save();$("#message").textContent="เปิดประตูสำเร็จ! ⭐";setTimeout(()=>{$("#gateModal").classList.add("hidden");scene.physics.resume();scene.modal=false;scene.gate.disableBody(true,true);scene.hero.x+=120},700)}}
$("#playBtn").onclick=()=>show("characterScreen");
$("#continueBtn").onclick=()=>{show("gameScreen");createGame()};
$$("[data-character]").forEach(b=>b.onclick=()=>{state.character=b.dataset.character;save();show("gameScreen");createGame()});
$("#monsterBtn").onclick=startMonsterEscape;$("#bookBtn").onclick=()=>{renderBook();show("bookScreen")};$("#parentsBtn").onclick=()=>show("parentsScreen");$("#settingsBtn").onclick=()=>show("settingsScreen");
$("#homeBtn").onclick=()=>{if(game){game.destroy(true);game=null}show("menuScreen")};$$(".back").forEach(b=>b.onclick=()=>show("menuScreen"));
bindHoldButton($("#left"),()=>{if(scene)scene.keys.left=true},()=>{if(scene)scene.keys.left=false});
bindHoldButton($("#right"),()=>{if(scene)scene.keys.right=true},()=>{if(scene)scene.keys.right=false});
bindHoldButton($("#jump"),()=>{
  if(scene&&scene.hero&&scene.hero.body.blocked.down)scene.hero.setVelocityY(-620);
},()=>{});
$("#hearWord").onclick=()=>speak(WORDS[state.words%WORDS.length].word);$("#hearSpell").onclick=()=>spell(WORDS[state.words%WORDS.length].word);
$("#voiceSelect").onchange=e=>voiceName=e.target.value;$("#voiceRate").oninput=e=>voiceRate=Number(e.target.value);$("#testVoice").onclick=()=>speak("apple");speechSynthesis.onvoiceschanged=loadVoices;
$("#resetBtn").onclick=()=>{state={coins:0,stars:0,words:0,character:"boy",unlocked:[]};save();renderParents()};
$("#monsterHomeBtn").onclick=()=>{clearInterval(monsterState.timer);show("menuScreen")};
$("#monsterHearWord").onclick=()=>monsterState.word&&speak(monsterState.word.word);
$("#monsterHearSpell").onclick=()=>monsterState.word&&spell(monsterState.word.word);
document.querySelectorAll("button,canvas,#game,.controls").forEach(el=>{
  el.setAttribute("draggable","false");
  el.addEventListener("contextmenu",preventIOSMenu,{passive:false});
});
drawPreview($("#boyPreview"),0);drawPreview($("#girlPreview"),1);updateHud();loadVoices();
})();