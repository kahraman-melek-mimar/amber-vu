import {renderNixie} from './nixie-art.js';
import {renderECG,ingestECG,ecgNames} from './ecg.js';
import {drawCassetteArt} from './cassette-art.js';
import {renderEffect, effectNames} from './effects.js';
import {db,digitsFor,retroLEDColor} from './core.mjs';
const $=id=>document.getElementById(id),canvas=$('screen'),c=canvas.getContext('2d');
let theme='vintage',mode='elapsed',light=.85,frame={rms:[0,0],peak:[0,0],waves:[[],[]],freq:[]},track={},lastFrame=0,lastTime=0,active=true;
let smooth=[-60,-60],peaks=[-60,-60],lastTick=performance.now(),phase=0,nixieText='';
let lastPaint=0,averageCost=0;
const audioBus=new BroadcastChannel('amber-vu-audio');
const needsWaves=()=>['scope','vector','laser',...Object.keys(ecgNames)].includes(theme);
const tubeArtwork=new Image();tubeArtwork.src='assets/lambali-amfi-reference.png';
const names={...effectNames,vintage:'VINTAGE HI-FI',studio:'STUDIO REFERENCE',cassette:'STEREO CASSETTE',tubes:'VALVE AMPLIFIER',led:'STEREO LEVEL DISPLAY',nixie:'NIXIE TIME MACHINE',scope:'OSCILLOSCOPE',vector:'STEREO VECTORSCOPE'};
function rect(x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
function text(s,x,y,size=12,color='#c4bba8',font='Arial'){c.fillStyle=color;c.font=`${size}px ${font}`;c.textAlign='center';c.fillText(s,x,y);}
function line(x,y,X,Y,color,width=1){c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function glow(color,blur=12){c.shadowColor=color;c.shadowBlur=blur*light;}
function screw(x,y){
 const type=['smoke','laser','lightning'].includes(theme)?'hex':theme==='led'?'pz':theme==='matrix'?'star':'slot';
 c.save();c.shadowColor='#000';c.shadowBlur=7;c.shadowOffsetY=3;
 const g=c.createRadialGradient(x-3,y-3,1,x,y,9);g.addColorStop(0,'#e0d9c5');g.addColorStop(.35,'#969082');g.addColorStop(.75,'#44453e');g.addColorStop(1,'#161815');
 c.beginPath();c.arc(x,y,9,0,7);c.fillStyle=g;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
 c.strokeStyle='#b7ae95';c.lineWidth=.7;c.stroke();
 if(type==='hex'){
  c.beginPath();for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;const px=x+Math.cos(a)*4.8,py=y+Math.sin(a)*4.8;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.closePath();c.fillStyle='#111915';c.fill();c.strokeStyle='#4b5249';c.stroke();line(x-3,y+3,x+2,y+3,'#bfc2a8',.7);
 }else if(type==='pz'){
  c.save();c.translate(x,y);c.rotate(Math.PI/12);
  line(-4.7,0,4.7,0,'#172019',2.5);line(0,-4.7,0,4.7,'#172019',2.5);
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;line(Math.cos(a)*3.3,Math.sin(a)*3.3,Math.cos(a)*6.4,Math.sin(a)*6.4,'#283026',.9);}line(-4,1,4,1,'#cbc7ad',.5);c.restore();
 }else if(type==='star'){
  c.beginPath();for(let i=0;i<=96;i++){const a=i*Math.PI/48,r=4.1+.9*Math.cos(a*6),px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.closePath();c.fillStyle='#121a15';c.fill();c.strokeStyle='#767e6a';c.lineWidth=.6;c.stroke();
 }else{line(x-4,y+4,x+4,y-4,'#171914',3);line(x-4,y+5,x+4,y-3,'#b6ae96',.6);}
 c.restore();
}
let walnut=null;
function woodGrain(){
 if(walnut)return walnut;
 walnut=document.createElement('canvas');walnut.width=90;walnut.height=460;const wc=walnut.getContext('2d');
 const base=wc.createLinearGradient(0,0,90,0);base.addColorStop(0,'#291308');base.addColorStop(.12,'#6e3d20');base.addColorStop(.45,'#92572f');base.addColorStop(.8,'#5a2c14');base.addColorStop(1,'#211006');wc.fillStyle=base;wc.fillRect(0,0,90,460);
 for(let i=0;i<120;i++){
  const origin=i*.79;wc.beginPath();for(let y=0;y<=460;y+=4){const bend=Math.sin(y*.018+i*.13)*2+Math.sin(y*.055+i*.61)*.8+Math.sin(y*.007)*5;if(y)wc.lineTo(origin+bend,y);else wc.moveTo(origin+bend,y);}
  wc.strokeStyle=i%3?'#26100569':'#e3ad6755';wc.lineWidth=i%5===0?1.1:.5;wc.stroke();
 }
 for(let ring=0;ring<7;ring++){wc.beginPath();wc.ellipse(48,277,5+ring*3,17+ring*11,.1,0,7);wc.strokeStyle='#2f160b3a';wc.lineWidth=.9;wc.stroke();}
 return walnut;
}
function housing(){
 c.clearRect(0,0,1000,500);
 const wood=['vintage','tubes'].includes(theme),g=c.createLinearGradient(0,0,0,500);
 g.addColorStop(0,theme==='vintage'?'#a1906d':'#3a3b37');g.addColorStop(.2,theme==='vintage'?'#796b50':'#20211e');g.addColorStop(1,'#141511');
 rect(8,15,984,470,20,wood?'#56331e':'#11120f','#493f30');
 if(theme==='vintage'){c.save();c.beginPath();c.roundRect(8,15,984,470,20);c.clip();c.drawImage(woodGrain(),8,16,31,468);c.drawImage(woodGrain(),961,16,31,468);c.restore();}else if(wood){for(let i=0;i<24;i++)line(14+i,30,14+i,470,`rgba(12,4,0,${.08+(i%4)*.04})`);}
 rect(wood?38:20,25,wood?924:960,450,12,g,'#777263');
 for(const x of [55,945])for(const y of [42,458])screw(x,y);
 if(theme!=='matrix')text(names[theme],500,63,13,theme==='vintage'?'#231e14':'#a89e8a');
}
function dial(x,y,w,h,value,index,dark=false){
 c.save();c.shadowColor='#000';c.shadowBlur=12;c.shadowOffsetY=5;rect(x-9,y-9,w+18,h+18,13,'#171712','#9f8b66');c.restore();
 const g=c.createRadialGradient(x+w*.5,y+h*.8,5,x+w*.5,y+h*.4,w*.7);
 g.addColorStop(0,dark?'#2c2b21':`rgb(${190+light*55},${130+light*75},${55+light*65})`);g.addColorStop(1,dark?'#080b08':'#856034');
 rect(x,y,w,h,7,g,'#d0b47e');
 const cx=x+w/2,cy=y+h*.87,r=Math.min(w*.44,h*.60),small=w<200;
 const angle=v=>Math.PI*1.17+((v+60)/60)*Math.PI*.66;
 c.save();c.beginPath();c.roundRect(x+2,y+2,w-4,h-4,6);c.clip();
 for(let i=0;i<=30;i++){
  const a=angle(-60+i*2),len=i%5===0?r*.15:r*.08;
  line(cx+Math.cos(a)*r,cy+Math.sin(a)*r,cx+Math.cos(a)*(r-len),cy+Math.sin(a)*(r-len),i>25?'#b92d20':dark?'#e8e0cc':'#302515',i%5===0?1.7:1);
 }
 for(const v of (small?[-60,-20,0]:[-60,-40,-20,-10,0])){const a=angle(v);text(String(v),cx+Math.cos(a)*(r+12),cy+Math.sin(a)*(r+12),small?8:10,dark?'#e5dcc8':'#382710');}
 text('VU',cx,y+h*.71,small?14:20,dark?'#e8dcc1':'#493015','Georgia');
 const a=angle(value);c.save();c.shadowColor='#0007';c.shadowBlur=3;c.shadowOffsetX=2;line(cx,cy,cx+Math.cos(a)*(r-6),cy+Math.sin(a)*(r-6),dark?'#fff4d5':'#352815',2);c.restore();
 c.beginPath();c.arc(cx,cy,small?6:10,0,7);c.fillStyle='#30291b';c.fill();
 const shine=c.createLinearGradient(x,y,x+w,y+h);shine.addColorStop(0,'#ffffff24');shine.addColorStop(.3,'#ffffff00');shine.addColorStop(1,'#ffffff0a');rect(x,y,w,h,7,shine);c.restore();
 text(index===0?'SOL / L':'SAĞ / R',cx,y+h+28,10,'#c6b798');
}
function studio(){
 for(let ch=0;ch<2;ch++){
  const x=ch?735:265,y=263,r=173;
  for(const [rad,color] of [[r+12,'#0a0c0b'],[r+9,'#777970'],[r+5,'#252b27'],[r,'#070a08']]){c.beginPath();c.arc(x,y,rad,0,7);c.fillStyle=color;c.fill();}
  const g=c.createRadialGradient(x,y+95,0,x,y,r);g.addColorStop(0,'#433322');g.addColorStop(.7,'#0c100e');g.addColorStop(1,'#020605');c.beginPath();c.arc(x,y,r-4,0,7);c.fillStyle=g;c.fill();
  const cy=y+98,rr=205,angle=v=>Math.PI*1.23+(v+60)/60*Math.PI*.54;
  for(let i=0;i<=30;i++){const a=angle(-60+i*2);line(x+Math.cos(a)*rr,cy+Math.sin(a)*rr,x+Math.cos(a)*(rr-(i%5?9:18)),cy+Math.sin(a)*(rr-(i%5?9:18)),i>26?'#e9523e':'#e8e0cd',i%5?1:2);}
  for(const v of [-60,-40,-20,-10,0]){const a=angle(v);text(String(v),x+Math.cos(a)*(rr+18),cy+Math.sin(a)*(rr+18),12,'#e9dfc9');}
  text('VU',x,y+28,27,'#e4dbc6','Georgia');
  const a=angle(smooth[ch]);glow('#fff1ca',3);line(x,cy,x+Math.cos(a)*(rr-9),cy+Math.sin(a)*(rr-9),'#fff7df',3);c.shadowBlur=0;
  c.beginPath();c.arc(x,cy,17,0,7);c.fillStyle='#9a8860';c.fill();c.beginPath();c.arc(x,cy,10,0,7);c.fillStyle='#252721';c.fill();
  c.save();c.beginPath();c.arc(x,y,r-3,0,7);c.clip();const shine=c.createLinearGradient(x-r,y-r,x+r,y+r);shine.addColorStop(0,'#ffffff2f');shine.addColorStop(.32,'#ffffff03');shine.addColorStop(.7,'#ffffff00');shine.addColorStop(1,'#ffffff12');rect(x-r,y-r,r*2,r*2,0,shine);c.restore();
  glow('#ff3b24',peaks[ch]>-1?14:0);c.beginPath();c.arc(x+96,y-92,6,0,7);c.fillStyle=peaks[ch]>-1?'#ff5537':'#531f15';c.fill();c.shadowBlur=0;
  text(ch?'SAĞ / R':'SOL / L',x,465,10);
 }
 for(let i=0;i<6;i++)rect(477+i*9,171,4,184,2,'#090d0a','#34382f');
}
function led(x,y,w,h,vertical=false){
 rect(x-10,y-12,w+20,h+24,8,'#080c09','#4e5142');
 const count=40;
 for(let ch=0;ch<2;ch++)for(let i=0;i<count;i++){
 const on=i/40<(smooth[ch]+60)/60,color=retroLEDColor(i);
 const bx=vertical?x+ch*w*.55:x+i*w/count,by=vertical?y+h-(i+1)*h/count:y+ch*h*.57;
 if(on)glow(color,8);rect(bx,by,vertical?w*.35:w/count-4,vertical?h/count-3:h*.33,2,on?color:'#20251b');c.shadowBlur=0;
 }
}
const knobCache=new Map();
function knob(x,y,r=24){
 const key=r;
 if(!knobCache.has(key)){
  // Draw once with a translated context, then retain the pixels.
  const extent=r+18,snapshot=document.createElement('canvas');snapshot.width=snapshot.height=extent*2;
  // A dedicated drawing context keeps the live canvas untouched.
  const sc=snapshot.getContext('2d');drawKnob(sc,extent,extent,r);knobCache.set(key,snapshot);
 }
 const image=knobCache.get(key),extent=r+18;c.drawImage(image,x-extent,y-extent);
}
function drawKnob(c,x,y,r=24){
 const line=(x,y,X,Y,color,width=1)=>{c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=color;c.lineWidth=width;c.stroke();};
 c.save();c.shadowColor='#000c';c.shadowBlur=r*.4;c.shadowOffsetY=r*.2;
 const rim=c.createLinearGradient(x-r,y-r,x+r,y+r);rim.addColorStop(0,'#d7d2c4');rim.addColorStop(.18,'#77796f');rim.addColorStop(.5,'#171b18');rim.addColorStop(.8,'#989c90');rim.addColorStop(1,'#343b34');
 c.beginPath();c.arc(x,y,r+3,0,7);c.fillStyle=rim;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
 // Machined knurling on the outer rim.
 for(let i=0;i<100;i++){const a=i*Math.PI/50;line(x+Math.cos(a)*(r-.5),y+Math.sin(a)*(r-.5),x+Math.cos(a)*(r+2.7),y+Math.sin(a)*(r+2.7),i%3?'#1b201c':'#a3a899',.7);}
 const face=c.createConicGradient(-Math.PI/2,x,y);
 for(const [at,color] of [[0,'#b7b9ad'],[.12,'#565e55'],[.27,'#d0d0c0'],[.42,'#333c34'],[.57,'#adb2a3'],[.73,'#434d43'],[.88,'#d2d2c1'],[1,'#b7b9ad']])face.addColorStop(at,color);
 c.beginPath();c.arc(x,y,r-2,0,7);c.fillStyle=face;c.fill();
 for(let rr=3;rr<r-3;rr+=.8){c.beginPath();c.arc(x,y,rr,0,7);c.strokeStyle=(Math.floor(rr*10)%3)?'#050e0824':'#ffffff23';c.lineWidth=.45;c.stroke();}
 c.beginPath();c.arc(x-1,y-1,r-3,Math.PI,Math.PI*1.6);c.strokeStyle='#f5f1d080';c.lineWidth=1;c.stroke();
 line(x+1,y-r+6,x+1,y-r*.43,'#17251b',3);line(x,y-r+5,x,y-r*.43,'#f2e5b4',1.8);
 for(let i=0;i<=10;i++){const a=Math.PI*.75+i*Math.PI*1.5/10;line(x+Math.cos(a)*(r+9),y+Math.sin(a)*(r+9),x+Math.cos(a)*(r+12),y+Math.sin(a)*(r+12),'#ac9f7c',.9);}
 c.restore();
}
function tubes(){
 rect(75,86,850,177,22,'#120f0b','#97764c');
 const positions=[145,287,429,571,713,855];
 positions.forEach((x,i)=>{
  const h=[152,130,110,110,130,152][i],y=246-h,w=[76,67,58,58,67,76][i];
  const aura=c.createRadialGradient(x,223,2,x,202,86);aura.addColorStop(0,'#ff82004a');aura.addColorStop(1,'#ff820000');rect(x-85,90,170,166,0,aura);
  c.save();c.shadowColor='#000';c.shadowBlur=10;c.shadowOffsetY=4;
  const glass=c.createLinearGradient(x-w/2,0,x+w/2,0);glass.addColorStop(0,'#54321c');glass.addColorStop(.12,'#c19b6870');glass.addColorStop(.3,'#28170b');glass.addColorStop(.72,'#4c2a12');glass.addColorStop(.9,'#d9b17e50');glass.addColorStop(1,'#321d11');rect(x-w/2,y,w,h,w*.44,glass,'#b18d5b');c.restore();
  rect(x-w*.29,y+35,w*.58,h-51,3,'#272720','#866c48');
  for(let k=0;k<9;k++)line(x-w*.26,y+43+k*(h-64)/9,x+w*.26,y+43+k*(h-64)/9,'#987346',.8);
  glow('#ff8d1d',22);for(const dx of [-w*.18,w*.18]){line(x+dx,y+26,x+dx,236,'#ff9c39',2);line(x+dx+2,y+30,x+dx+2,232,'#ffd799',.7);}line(x-w*.28,230,x+w*.28,230,'#ffb74c',4);c.shadowBlur=0;
  line(x-w*.3,y+22,x-w*.3,220,'#ffe6bb55',3);rect(x-w*.6,238,w*1.2,20,5,'#443626','#94764e');
 });
 // Use the original concept artwork for the tube chamber; gauges remain live.
 if(tubeArtwork.complete&&tubeArtwork.naturalWidth){c.save();c.beginPath();c.roundRect(72,85,856,176,18);c.clip();c.drawImage(tubeArtwork,80,180,1380,370,72,85,856,176);c.restore();}
 // Protective cover, metal front and wood cheeks match the reference layout.
 const shine=c.createLinearGradient(70,80,900,265);shine.addColorStop(0,'#ffffff19');shine.addColorStop(.3,'#ffffff00');shine.addColorStop(1,'#ffffff09');rect(69,81,862,185,24,shine,'#d6c1a54f');
 rect(66,278,868,169,12,'#1c1c17','#665b48');dial(252,303,215,105,smooth[0],0);dial(533,303,215,105,smooth[1],1);
 knob(152,362,43);knob(850,362,43);text('SEVİYE',152,428,10);text('ÇIKIŞ',850,428,10);
}
function crt(){
 rect(68,100,864,325,25,'#030b08','#6b7460');c.save();c.beginPath();c.roundRect(80,110,840,300,18);c.clip();
 for(let x=80;x<=920;x+=42)line(x,110,x,410,'#244837',.7);for(let y=110;y<=410;y+=30)line(80,y,920,y,'#244837',.7);
 const fresh=active&&performance.now()-lastFrame<1500;
 if(theme==='scope'){
  for(let ch=0;ch<2;ch++){
   const center=ch?335:185,color=ch?'#f3bc58':'#8df58a';line(80,center,920,center,'#4e6d53',1);
   if(fresh){const wave=frame.waves[ch];c.beginPath();for(let i=0;i<wave.length;i++){const x=80+i*840/(wave.length-1),y=center-wave[i]*60;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.strokeStyle=color;c.lineWidth=1.1;glow(color,6);c.stroke();c.shadowBlur=0;}
   text(ch?'R':'L',96,center-58,11,color);text('+1 FS',887,center-58,9,color);text('0',887,center-3,9,color);text('−1 FS',887,center+62,9,color);
  }
 }else{
  const cx=500,cy=260,r=137;line(cx-r,cy-r,cx+r,cy+r,'#5b9088');line(cx-r,cy+r,cx+r,cy-r,'#5b9088');line(cx,115,cx,405,'#5b908877');
  if(fresh){const l=frame.waves[0],r=frame.waves[1];c.beginPath();for(let i=0;i<Math.min(l.length,r.length);i++){const x=cx+(l[i]-r[i])*137/Math.SQRT2,y=cy-(l[i]+r[i])*137/Math.SQRT2;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.strokeStyle='#69e9d0';c.lineWidth=.8;glow('#69e9d0',5);c.stroke();c.shadowBlur=0;}
  text('L',350,124,12,'#6cdbcc');text('R',650,124,12,'#6cdbcc');text('MONO +1',500,125,9);text('TERS FAZ −1',789,265,9);
 }
 c.restore();
 if(theme==='scope'){
 const duration=2048/(frame.sampleRate||48000)*1000;for(let i=0;i<=4;i++)text(`${(duration*i/4).toFixed(1)} ms`,90+i*205,442,10);
 text('SOL / L  YEŞİL     •     SAĞ / R  AMBER     |     GENLİK: ±1 FS',500,464,10);
 }else{const l=frame.waves[0],r=frame.waves[1];let xy=0,xx=0,yy=0;for(let i=0;i<l.length;i++){xy+=l[i]*(r[i]||0);xx+=l[i]*l[i];yy+=(r[i]||0)**2;}const cor=xx*yy>1e-12?xy/Math.sqrt(xx*yy):null;text('KORELASYON  '+(fresh&&cor!==null?cor.toFixed(2):'—')+'   |   X: (L−R)/√2    Y: (L+R)/√2',500,453,11);}
}
function draw(now){
 requestAnimationFrame(draw);
 if(document.hidden)return;
 const interval=averageCost>14?50:1000/30;
 if(now-lastPaint<interval-1)return;
 lastPaint=now;const started=performance.now();
 const dt=Math.min(.1,(now-lastTick)/1000);lastTick=now;
 const fresh=active&&now-lastFrame<1500;
 for(let i=0;i<2;i++){const target=fresh?db(frame.rms[i]):-60;smooth[i]+=(target-smooth[i])*(1-Math.exp(-dt*(target>smooth[i]?12:3)));peaks[i]=Math.max(fresh?db(frame.peak[i]):-60,peaks[i]-dt*12);}
 if(fresh&&(now-lastTime<2500?track.paused===false:frame.rms.some(v=>v>.002)))phase+=dt*.9;
 const dpr=Math.min(window.devicePixelRatio||1,1.25,1200/Math.max(1,canvas.clientWidth)),w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 c.setTransform(canvas.width/1000,0,0,canvas.height/500,0,0);housing();
 if(theme==='vintage'){dial(95,135,365,245,smooth[0],0);dial(540,135,365,245,smooth[1],1);}if(theme==='studio')studio();
 if(theme==='cassette')drawCassetteArt(c,phase,smooth);if(theme==='tubes')tubes();
 if(theme==='led'){led(105,170,790,180);text('LEFT',125,145,11);text('RIGHT',125,384,11);for(let i=0;i<=6;i++)text(String(-60+i*10),110+i*130,415,12);}
 if(theme==='scope'||theme==='vector')crt();
 if(ecgNames[theme])renderECG(c,theme,frame,fresh,dt,light,active);
 if(effectNames[theme])renderEffect(c,theme,frame,fresh,dt,light);
 if(theme==='nixie')renderNixie(c,mode,track,performance.now()-lastTime<2500,smooth,light);
 $('levels').textContent=`L ${Math.round(smooth[0])} · R ${Math.round(smooth[1])} dBFS`;
 $('live').textContent=!active?'○ DİNLEME DURDURULDU':!fresh?'○ SES BAĞLANTISI BEKLENİYOR':frame.rms.some(v=>v>.002)?'● CANLI / STEREO':'● BAĞLI / SESSİZ';
 averageCost=averageCost*.9+(performance.now()-started)*.1;
}
function receive(message){
 if(message.type==='FRAME'){frame=message;lastFrame=performance.now();if(ecgNames[theme])ingestECG(message,active&&(performance.now()-lastTime<2500?track.paused!==true:frame.rms.some(v=>v>.001)),theme==='ecgPaper');}
 if(message.type==='TIME'){track=message;lastTime=performance.now();$('track').textContent=message.title||'Seçilen sekme';}
}
audioBus.onmessage=({data})=>receive(data);
chrome.runtime.onMessage.addListener(receive);
document.addEventListener('visibilitychange',()=>{lastTick=performance.now();audioBus.postMessage({type:'VIEW',waves:!document.hidden&&needsWaves()});});
function apply(){theme=$('theme').value;mode=$('mode').value;light=Number($('brightness').value)/100;$('nixie').hidden=true;$('modeLabel').hidden=theme!=='nixie';$('nixie').style.filter=`brightness(${light+.25})`;nixieText='';audioBus.postMessage({type:'VIEW',waves:needsWaves()});chrome.storage.local.set({theme,mode,brightness:$('brightness').value});}
for(const id of ['theme','mode','brightness'])$(id).addEventListener('input',apply);
$('stop').addEventListener('click',async()=>{
 const button=$('stop');button.disabled=true;
 try{
  const response=await chrome.runtime.sendMessage({type:active?'STOP':'RESTART'});
  if(!response?.ok)throw new Error(response?.error||'İşlem tamamlanamadı.');
  active=!active;if(active)audioBus.postMessage({type:'VIEW',waves:needsWaves()});lastFrame=0;frame={rms:[0,0],peak:[0,0],waves:[[],[]]};
  button.textContent=active?'Dinlemeyi durdur':'Yeniden başlat';
  $('notice').textContent=active?'Ses yalnızca bu cihazda işlenir. Pencereyi kapatınca dinleme sona erer.':'Dinleme durduruldu. Aynı sekmeye bağlanmak için Yeniden başlat düğmesine bas.';
 }catch(error){$('notice').textContent=error.message+' Gerekirse müzik sekmesindeki eklenti simgesine tıkla.';}
 finally{button.disabled=false;}
});
const settings=await chrome.storage.local.get(['theme','mode','brightness']);
if(settings.theme)$('theme').value=settings.theme;if(settings.mode)$('mode').value=settings.mode;if(settings.brightness)$('brightness').value=settings.brightness;
apply();const state=await chrome.storage.session.get(['lastError','sourceTab','listening']);if(state.lastError){active=false;$('notice').textContent=`Başlatılamadı: ${state.lastError} Müziğin açık olduğu normal bir web sayfasında eklenti simgesine tekrar tıkla.`;}else if(!state.sourceTab||state.listening===false)active=false;
$('stop').textContent=active?'Dinlemeyi durdur':'Yeniden başlat';
requestAnimationFrame(draw);
