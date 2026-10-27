import {ecgPoints,paperRollState} from './ecg-core.mjs';
import {drawPaperRoll,drawWoundInk} from './paper-rolls.js';
export const ecgNames={ecgGlass:'EKG • Cam',ecgPaper:'EKG • Kâğıt',ecgVintage:'EKG • Vintage'};
const specs={
 ecgGlass:{file:'glass',w:1774,h:887,masks:[[167,239,1440,365]],x:220,end:1580,ys:[343,529],amplitude:73,colors:['#9bf278','#ffc465']},
 ecgPaper:{file:'paper',w:1774,h:887,masks:[[329,261,1157,365],[1330,269,256,145],[1330,489,256,137]],x:390,end:1350,ys:[373,568],amplitude:56,colors:['#37271c','#37271c']},
 ecgVintage:{file:'vintage',w:1536,h:1024,masks:[[315,240,910,290]],x:372,end:1208,ys:[323,467],amplitude:53,colors:['#8e190e','#8e190e'],gauge:{x:762,y:734,r:111}}
};
const skins=new Map();let timeline=0,history=[],current=[0,0],paperTime=0;
function image(url){return new Promise((resolve,reject)=>{const value=new Image();value.onload=()=>resolve(value);value.onerror=reject;value.src=url;});}
async function load(name){
 const spec=specs[name],entry={ready:false};skins.set(name,entry);
 try{
  const [original,clean]=await Promise.all([image(`assets/ecg/${spec.file}-original.png`),image(`assets/ecg/${spec.file}-clean.png`)]);
  const base=document.createElement('canvas');base.width=spec.w;base.height=spec.h;const c=base.getContext('2d');c.drawImage(original,0,0,spec.w,spec.h);
  for(const [x,y,w,h]of spec.masks)c.drawImage(clean,x/spec.w*clean.width,y/spec.h*clean.height,w/spec.w*clean.width,h/spec.h*clean.height,x,y,w,h);
  if(spec.gauge){const {x,y,r}=spec.gauge;c.save();c.beginPath();c.arc(x,y,r,0,7);c.clip();c.drawImage(clean,0,0,spec.w,spec.h);c.restore();}
  Object.assign(entry,{base,original,clean});
  if(name==='ecgPaper'){
   const cavity=await image('assets/ecg/paper-cavity.png');entry.cavity=cavity;
   c.drawImage(cavity,88/spec.w*cavity.width,202/spec.h*cavity.height,1598/spec.w*cavity.width,475/spec.h*cavity.height,88,202,1598,475);
   const tile=document.createElement('canvas');tile.width=180;tile.height=365;tile.getContext('2d').drawImage(clean,540,261,180,365,0,0,180,365);entry.paperTile=tile;
   c.save();c.beginPath();c.rect(291,261,1195,365);c.clip();for(let xx=291;xx<1486;xx+=180)c.drawImage(tile,xx,261);c.restore();
  }
  entry.ready=true;
 }catch{entry.error=true;}
}
export function ingestECG(frame,playing,paperActive=false){
 if(!playing)return;
 const points=ecgPoints(frame);if(!points.length)return;
 const start=timeline;
 for(const point of points)history.push({time:start+point.offset,values:point.values});
 timeline+=points[0].duration;if(paperActive)paperTime+=points[0].duration;current=points.at(-1).values;
 while(history.length&&history[0].time<timeline-12)history.shift();
}
function trace(c,spec,channel,now,light){
 const y=spec.ys[channel],speed=spec.file==='paper'?165:190,x0=spec.x,end=spec.end;
 c.save();c.beginPath();c.rect(x0,y-spec.amplitude-4,end-x0,spec.amplitude*2+8);c.clip();
 c.beginPath();let first=true;
 for(const point of history){const x=end-(now-point.time)*speed;if(x<x0||x>end+.001)continue;const py=y-point.values[channel]*spec.amplitude;if(first){c.moveTo(x,py);first=false;}else c.lineTo(x,py);}
 if(first){c.moveTo(x0,y);c.lineTo(end,y);}else c.lineTo(end,y-current[channel]*spec.amplitude);
 c.strokeStyle=spec.colors[channel];c.lineWidth=spec.file==='glass'?1.35:1.25;c.lineJoin='round';c.lineCap='round';
 if(spec.file==='glass'){c.shadowColor=spec.colors[channel];c.shadowBlur=4*light;}
 c.stroke();c.shadowBlur=0;
 if(spec.file==='glass'){
  const tip=y-current[channel]*spec.amplitude;c.beginPath();c.arc(end,tip,3,0,7);c.fillStyle=spec.colors[channel];c.shadowColor=spec.colors[channel];c.shadowBlur=13*light;c.fill();c.shadowBlur=0;
  const fade=c.createLinearGradient(x0,0,end,0);fade.addColorStop(0,'#050a0760');fade.addColorStop(.8,'#050a0700');c.fillStyle=fade;c.fillRect(x0,y-spec.amplitude-4,end-x0,spec.amplitude*2+8);
 }
 c.restore();
}
function stylus(c,root,tip){
 const dx=tip[0]-root[0],dy=tip[1]-root[1],length=Math.hypot(dx,dy);
 c.save();c.translate(...root);c.rotate(Math.atan2(dy,dx));
 c.shadowColor='#0009';c.shadowBlur=7;c.shadowOffsetY=8;
 const barrel=c.createLinearGradient(0,-8,0,8);barrel.addColorStop(0,'#36291b');barrel.addColorStop(.25,'#b9aa8e');barrel.addColorStop(.44,'#fbf5db');barrel.addColorStop(.58,'#7a756a');barrel.addColorStop(1,'#302b23');
 c.fillStyle=barrel;c.beginPath();c.roundRect(0,-7,length-44,14,3);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
 for(const x of [13,36,length-70,length-49]){c.fillStyle='#342c20';c.fillRect(x,-8,3,16);c.fillStyle='#dcc9a0';c.fillRect(x+3,-8,1,16);}
 c.beginPath();c.moveTo(length-44,-5);c.lineTo(length-22,-4);c.lineTo(length,0);c.lineTo(length-22,4);c.lineTo(length-44,5);c.closePath();c.fillStyle='#161817';c.fill();
 c.beginPath();c.moveTo(length-40,-3);c.lineTo(length-14,-1);c.strokeStyle='#c5b594';c.lineWidth=.8;c.stroke();c.restore();
}
function paper(c,entry,spec){
 const model=paperRollState(paperTime),left=209+model.leftRadius,right=1584-model.rightRadius;
 const y=261,h=365,w=right-left,travel=timeline*165;
 c.save();c.globalAlpha=model.opacity;
 c.save();c.beginPath();c.rect(left,y,w,h);c.clip();
 const shift=(travel+left)%180;
 for(let at=left-shift;at<right;at+=180)c.drawImage(entry.paperTile,at,y);
 const shade=c.createLinearGradient(0,y,0,y+h);shade.addColorStop(0,'#5f310b2e');shade.addColorStop(.2,'#ffffff06');shade.addColorStop(.65,'#ffffff00');shade.addColorStop(1,'#64350c2b');c.fillStyle=shade;c.fillRect(left,y,w,h);
 c.restore();
 const movingSpec={...spec,x:left+1};
 for(let ch=0;ch<2;ch++)trace(c,movingSpec,ch,timeline,1);
 drawPaperRoll(c,entry,209,model.leftRadius,model.leftAngle,travel,true,(cx,r)=>drawWoundInk(c,cx,r,spec,history,timeline));
 drawPaperRoll(c,entry,1584,model.rightRadius,model.rightAngle,travel,false);
 c.restore();
 // Fixed pen mounting blocks stay in front of the changing supply roll.
 for(const yy of [280,488]){
  c.save();c.beginPath();c.roundRect(1588,yy,57,70,4);c.rect(1643,yy+9,24,49);c.clip();
  c.drawImage(entry.cavity,0,0,1774,887);c.restore();
 }
 for(let ch=0;ch<2;ch++){
  const root=[1616,ch?525:312];stylus(c,root,[spec.end,spec.ys[ch]-current[ch]*spec.amplitude]);
  // A bolted bearing block embeds the pen pivot into the original fixed mount.
  c.save();const plate=c.createLinearGradient(root[0]-13,0,root[0]+16,0);plate.addColorStop(0,'#372e22');plate.addColorStop(.3,'#b8a480');plate.addColorStop(.55,'#e1cfa6');plate.addColorStop(1,'#615039');
  c.shadowColor='#0008';c.shadowBlur=3;c.shadowOffsetY=2;c.beginPath();c.roundRect(root[0]-12,root[1]-23,29,46,5);c.fillStyle=plate;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
  c.beginPath();c.ellipse(root[0],root[1],10,13,0,0,7);c.fillStyle='#352e25';c.fill();c.strokeStyle='#d1ba8f';c.lineWidth=2;c.stroke();
  for(const y of [root[1]-17,root[1]+17]){c.beginPath();c.arc(root[0]+3,y,3,0,7);c.fillStyle='#5b4a32';c.fill();c.strokeStyle='#e1c69b';c.lineWidth=.7;c.stroke();c.beginPath();c.moveTo(root[0]+1,y);c.lineTo(root[0]+5,y);c.moveTo(root[0]+3,y-2);c.lineTo(root[0]+3,y+2);c.strokeStyle='#251d12';c.stroke();}
  c.restore();
 }
 c.fillStyle='#beaa87';c.textAlign='center';c.font='18px Georgia';c.fillText('STEREO CHART RECORDER',887,158);
}
function powerJewel(c,on){
 const x=339,y=704,r=18;c.save();
 const lens=c.createRadialGradient(x-5,y-7,1,x,y,r);lens.addColorStop(0,on?'#ffb088':'#542c20');lens.addColorStop(.32,on?'#f74520':'#26100c');lens.addColorStop(1,on?'#600604':'#0d0908');
 c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=lens;if(on){c.shadowColor='#ff260c';c.shadowBlur=15;}c.fill();c.shadowBlur=0;
 c.beginPath();c.ellipse(x-6,y-7,4,2,-.5,0,7);c.fillStyle=on?'#fff2d999':'#ffffff22';c.fill();c.restore();
}
export function renderECG(c,name,frame,fresh,dt,light,powered=fresh){
 const spec=specs[name];if(!spec)return;
 if(!skins.has(name))load(name);
 const entry=skins.get(name);
 c.save();c.fillStyle='#0d0e0b';c.fillRect(0,0,1000,500);
 // Preserve the original near-square vintage proportions instead of stretching it.
 const scale=Math.min(1000/spec.w,500/spec.h),ox=(1000-spec.w*scale)/2,oy=(500-spec.h*scale)/2;c.translate(ox,oy);c.scale(scale,scale);
 if(!entry.ready){c.fillStyle='#c7b58e';c.font='20px Arial';c.textAlign='center';c.fillText(entry.error?'Görsel yüklenemedi':'Görünüm hazırlanıyor…',spec.w/2,spec.h/2);c.restore();return;}
 c.drawImage(entry.base,0,0);
 if(name==='ecgPaper')paper(c,entry,spec);
 else for(let ch=0;ch<2;ch++)trace(c,spec,ch,timeline,light);
 if(spec.gauge){
  powerJewel(c,powered);
  const {x,y}=spec.gauge,signal=fresh?Math.max(...frame.rms):0,angle=(-225+Math.min(1,Math.sqrt(signal)*1.4)*270)*Math.PI/180;
  c.save();c.translate(x,y);c.rotate(angle);c.shadowColor='#5b3c18';c.shadowBlur=3;c.shadowOffsetY=2;
  c.beginPath();c.moveTo(-39,-6);c.lineTo(100,-1);c.lineTo(107,0);c.lineTo(100,1);c.lineTo(-39,6);c.closePath();c.fillStyle='#29271d';c.fill();c.shadowBlur=0;
  c.beginPath();c.arc(0,0,10,0,7);c.fillStyle='#796138';c.fill();c.beginPath();c.arc(0,0,4,0,7);c.fillStyle='#2b291d';c.fill();c.restore();
 }
 c.restore();
}
