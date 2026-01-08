const app=document.getElementById("app");
const passageEl=document.getElementById("passage");
const restartBtn=document.getElementById("restart-btn");
const wpmEl=document.getElementById("stat-wpm");
const accEl=document.getElementById("stat-accuracy");
const timeEl=document.getElementById("stat-time");
const pbEl=document.querySelector(".personal-best strong");
let DATA=null,mode="timed",chars=[],i=0,correct=0,errors=0,startMs=0,timer=null,timeLeft=60,started=false;

function setPBText(){
  const pb=localStorage.getItem("personalBestWpm");
  if(pb&&pbEl)pbEl.textContent=pb+" WPM";
}
function activeDifficulty(){
  const sel=document.getElementById("diff-select");
  if(sel) return sel.value;
  if(document.getElementById("diff-hard")?.classList.contains("is-active"))return "hard";
  if(document.getElementById("diff-medium")?.classList.contains("is-active"))return "medium";
  return "easy";
}
function activeMode(){
  const sel=document.getElementById("mode-select");
  if(sel) return sel.value;
  return document.getElementById("mode-passage")?.classList.contains("is-active")?"passage":"timed";
}
function pickPassage(){
  const list=DATA[activeDifficulty()];
  return list[Math.floor(Math.random()*list.length)].text;
}
function renderText(text){
  passageEl.innerHTML="";
  chars=text.split("");
  for(let k=0;k<chars.length;k++){
    const s=document.createElement("span");
    s.textContent=chars[k];
    passageEl.appendChild(s);
  }
  setCursor(0);
}
function setCursor(idx){
  const prev=passageEl.querySelector(".cursor");
  if(prev)prev.classList.remove("cursor");
  const t=passageEl.children[idx];
  if(t)t.classList.add("cursor");
}
function formatTime(sec){
  const m=Math.floor(sec/60),s=String(sec%60).padStart(2,"0");
  return m+":"+s;
}
function updateStats(){
  const elapsed=Math.max(1,Date.now()-startMs);
  const wpm=Math.floor((correct/5)/(elapsed/60000));
  wpmEl.textContent=String(Math.max(0,wpm));
  const acc=Math.floor((correct/Math.max(1,correct+errors))*100);
  accEl.textContent=acc+"%";
}
function startTest(){
  if(started)return;
  started=true;
  mode=activeMode();
  i=0;correct=0;errors=0;startMs=Date.now();
  if(mode==="timed"){timeLeft=60;timeEl.textContent=formatTime(timeLeft)}else{timeEl.textContent="0:00"}
  if(timer)clearInterval(timer);
  timer=setInterval(()=>{if(mode==="timed"){timeLeft--;timeEl.textContent=formatTime(timeLeft);if(timeLeft<=0)finish()}else{const t=Math.floor((Date.now()-startMs)/1000);timeEl.textContent=formatTime(t)}},1000);
}
function finish(){
  if(timer){clearInterval(timer);timer=null}
  document.removeEventListener("keydown",handleKey);
  const elapsed=Math.max(1,Date.now()-startMs);
  const wpm=Math.floor((correct/5)/(elapsed/60000));
  const accuracy=Math.floor((correct/Math.max(1,correct+errors))*100);
  const res={wpm,accuracy,correct,incorrect:errors,status:"complete"};
  const pb=parseInt(localStorage.getItem("personalBestWpm")||"0",10);
  if(!localStorage.getItem("personalBestWpm")){
    res.status="baseline";localStorage.setItem("personalBestWpm",String(wpm));
  }else if(wpm>pb){
    res.status="highScore";localStorage.setItem("personalBestWpm",String(wpm));
  }
  localStorage.setItem("lastResult",JSON.stringify(res));
  var target="./results.html";
  if(res.status==="baseline") target="./baseline.html";
  else if(res.status==="highScore") target="./highscore.html";
  window.location.href=target;
}
function reset(){
  started=false;i=0;correct=0;errors=0;
  renderText(pickPassage());
  setCursor(0);
  wpmEl.textContent="0";accEl.textContent="100%";
  timeEl.textContent=mode==="timed"?"0:60":"0:00";
  document.addEventListener("keydown",handleKey);
}
function handleKey(e){
  if(!started){
    if(e.key.length===1||e.key===" "||e.key==="Backspace"){startTest()}else{return}
  }
  if(e.key==="Backspace"){
    if(i>0){const s=passageEl.children[i-1];s.classList.remove("correct","error");i--;setCursor(i);updateStats()}
    e.preventDefault();return;
  }
  if(e.key.length===1||e.key===" "){
    const ch=e.key===" "?" ":e.key;
    const s=passageEl.children[i];
    if(!s){finish();return}
    if(ch===chars[i]){s.classList.add("correct");correct++}else{s.classList.add("error");errors++}
    i++;setCursor(i);updateStats();
    if(i>=chars.length){finish()}
  }
}
function bindToggles(){
  document.querySelectorAll('[role="group"]').forEach(group=>{
    group.addEventListener("click",e=>{
      const b=e.target.closest("button");if(!b)return;
      group.querySelectorAll("button").forEach(x=>x.classList.remove("is-active"));
      b.classList.add("is-active");
      mode=activeMode();
      const ds=document.getElementById("diff-select");
      const ms=document.getElementById("mode-select");
      if(ds){
        if(document.getElementById("diff-hard")?.classList.contains("is-active")) ds.value='hard';
        else if(document.getElementById("diff-medium")?.classList.contains("is-active")) ds.value='medium';
        else ds.value='easy';
      }
      if(ms){
        ms.value=mode;
      }
      reset();
    });
  });
}
function bindSelects(){
  const ds=document.getElementById("diff-select");
  const ms=document.getElementById("mode-select");
  if(ds){ds.addEventListener("change",()=>{
    document.getElementById("diff-easy")?.classList.toggle("is-active",ds.value==='easy');
    document.getElementById("diff-medium")?.classList.toggle("is-active",ds.value==='medium');
    document.getElementById("diff-hard")?.classList.toggle("is-active",ds.value==='hard');
    reset();
  });}
  if(ms){ms.addEventListener("change",()=>{
    document.getElementById("mode-timed")?.classList.toggle("is-active",ms.value==='timed');
    document.getElementById("mode-passage")?.classList.toggle("is-active",ms.value==='passage');
    mode=activeMode();
    reset();
  });}
}

fetch("./data.json").then(r=>r.json()).then(j=>{
  DATA=j;setPBText();bindToggles();bindSelects();renderText(pickPassage());document.addEventListener("keydown",handleKey);
});
restartBtn?.addEventListener("click",()=>{reset()});
passageEl?.addEventListener("click",()=>{startTest()});