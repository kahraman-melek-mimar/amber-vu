import {radialResponse} from './core.mjs';
export const effectNames={matrix:'RADIAL STEREO',smoke:'NEBULA / GLASS CHAMBER',laser:'PHOTON / LASER ROOM',lightning:'TESLA / ELECTRIC FIELD'};
const state={time:0,energy:0,peak:0,hold:0,lastEnergy:0,flash:0,boltAge:0,bolts:[],lastTheme:'',radial:[{level:0,peak:0,hold:0},{level:0,peak:0,hold:0}]};
const layer=document.createElement('canvas');layer.width=840;layer.height=320;const p=layer.getContext('2d');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function path(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));}
function label(c,s,x,y,color='#97b6b6',size=10){c.fillStyle=color;c.font=`${size}px monospace`;c.textAlign='center';c.fillText(s,x,y);}
function panel(c){
 c.save();c.shadowColor='#000';c.shadowBlur=18;c.shadowOffsetY=8;
 let g=c.createLinearGradient(70,96,920,425);g.addColorStop(0,'#9aaba4');g.addColorStop(.02,'#192824');g.addColorStop(.5,'#070e11');g.addColorStop(.98,'#54615d');g.addColorStop(1,'#afbab1');
 c.beginPath();c.roundRect(67,91,866,335,19);c.fillStyle=g;c.fill();c.restore();
 c.beginPath();c.roundRect(80,100,840,320,13);c.fillStyle='#020609';c.fill();
}
function glass(c,theme){
 c.save();c.beginPath();c.roundRect(80,100,840,320,13);c.clip();
 const g=c.createLinearGradient(80,100,920,420);g.addColorStop(0,'#ffffff17');g.addColorStop(.18,'#ffffff03');g.addColorStop(.4,'#ffffff00');g.addColorStop(.7,'#ffffff00');g.addColorStop(1,'#6ddfff0b');c.fillStyle=g;c.fillRect(80,100,840,320);
 c.beginPath();c.moveTo(100,105);c.lineTo(455,105);c.lineTo(278,161);c.lineTo(94,177);c.closePath();c.fillStyle='#e7ffff08';c.fill();
 c.strokeStyle='#caffff33';c.lineWidth=1;c.beginPath();c.moveTo(97,121);c.quadraticCurveTo(98,106,115,106);c.lineTo(884,106);c.stroke();
 c.restore();

}
let ledSprites=null,ledBase=null;
const ledPositions=Array.from({length:25*25},(_,i)=>{const dx=i%25-12,dy=Math.floor(i/25)-12;return {dx,dy,d:Math.hypot(dx,dy)};});
function prepareLEDs(){
 ledSprites=document.createElement('canvas');ledSprites.width=48*32;ledSprites.height=32;
 const sc=ledSprites.getContext('2d');
 for(let i=0;i<48;i++){
  const x=i*32+16,hue=i*360/48;
  sc.save();sc.beginPath();sc.rect(i*32,0,32,32);sc.clip();sc.shadowColor=`hsl(${hue} 100% 60%)`;sc.shadowBlur=9;
  sc.beginPath();sc.arc(x,16,3.25,0,7);sc.fillStyle=`hsl(${hue} 96% 70%)`;sc.fill();sc.shadowBlur=0;
  const lens=sc.createRadialGradient(x-1.1,14.6,.1,x,16,4.1);lens.addColorStop(0,'#ecfff8d0');lens.addColorStop(.35,'#c0fff540');lens.addColorStop(1,'#00000030');sc.beginPath();sc.arc(x,16,4.1,0,7);sc.fillStyle=lens;sc.fill();sc.restore();
 }
 ledBase=document.createElement('canvas');ledBase.width=840;ledBase.height=320;const bc=ledBase.getContext('2d');
 for(const center of [215,625])for(const {dx,dy}of ledPositions){
  const x=center+dx*11.7,y=160+dy*11.7;
  bc.beginPath();bc.arc(x,y,4.2,0,7);bc.fillStyle='#172221';bc.fill();
  const lens=bc.createRadialGradient(x-1.1,y-1.4,.1,x,y,4.1);lens.addColorStop(0,'#e8fff81f');lens.addColorStop(.35,'#c0fff517');lens.addColorStop(1,'#00000070');bc.beginPath();bc.arc(x,y,4.1,0,7);bc.fillStyle=lens;bc.fill();
 }
}
function matrix(c,frame,fresh,dt,light){
 if(!ledSprites)prepareLEDs();
 c.drawImage(ledBase,80,100);
 for(let channel=0;channel<2;channel++){
  const cx=channel?705:295;
  const response=state.radial[channel]=radialResponse(state.radial[channel],fresh?frame.rms[channel]:0,fresh?frame.peak[channel]:0,dt);
  const energy=response.level,radius=energy*17;
  for(const {dx,dy,d}of ledPositions){
   const body=clamp((radius-d)*.6+.55)*energy;
   const ring=energy>.001||response.peak>.1?Math.exp(-Math.pow((d-response.peak)/.58,2))*.95:0;
   const value=Math.max(body*.65,ring);if(value<.015)continue;
   const hue=((185-d*9.2+state.time*12)%360+360)%360,index=Math.round(hue/360*48)%48;
   c.globalAlpha=value*(.55+light*.45);
   c.drawImage(ledSprites,index*32,0,32,32,cx+dx*11.7-16,260+dy*11.7-16,32,32);
  }
 }
 c.globalAlpha=1;
}
function fade(alpha){p.globalCompositeOperation='source-over';p.fillStyle=`rgba(2,5,10,${alpha})`;p.fillRect(0,0,840,320);}
function smoke(e,dt,light){
 fade(1-Math.exp(-dt*2.2));p.globalCompositeOperation='lighter';
 if(e<.002)return;
 const t=state.time;
 for(let i=0;i<54;i++){
  const q=i/53,a=q*Math.PI*3+t*.28;
  const x=420+Math.sin(a*1.25+t*.7)*(175+90*q)+Math.sin(q*17-t*.9)*35;
  const y=168+Math.cos(a+t*.45)*70+Math.sin(q*11+t*.6)*32;
  const radius=(22+Math.sin(a*.7)**2*42)*(0.45+e*.9),hue=190+Math.sin(a*.4+t*.1)*110+q*75;
  const g=p.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,`hsla(${hue} 95% 66% / ${e*.055*light})`);g.addColorStop(.4,`hsla(${hue+20} 90% 50% / ${e*.027*light})`);g.addColorStop(1,`hsla(${hue} 90% 40% / 0)`);p.fillStyle=g;p.fillRect(x-radius,y-radius,radius*2,radius*2);
 }
 // Thin curl filaments give the volume a smoky surface, rather than solid blobs.
 for(let j=0;j<7;j++){
  p.beginPath();for(let i=0;i<=90;i++){const q=i/90,x=160+q*520,y=160+Math.sin(q*8+t*.6+j*.18)*60+Math.sin(q*17-t*.4)*22;if(i)p.lineTo(x,y);else p.moveTo(x,y);}
  p.strokeStyle=`hsla(${230+j*17+t*4} 90% 70% / ${e*.025*light})`;p.lineWidth=1.5;p.stroke();
 }
}
function laser(e,dt,light,frame){
 fade(1-Math.exp(-dt*5));if(e<.002)return;p.globalCompositeOperation='lighter';
 const t=state.time,spread=40+e*120;
 for(let beam=0;beam<7;beam++){
  const a=t*(.35+beam*.04)+beam*.9,hue=(beam*44+t*15)%360;
  const points=[];for(let i=0;i<6;i++){const q=i/5;points.push([30+q*780,160+Math.sin(a+q*6)*(spread*(.3+.7*Math.sin(q*Math.PI))) ]);}
  p.shadowColor=`hsl(${hue} 100% 60%)`;p.shadowBlur=14*light;path(p,points);p.strokeStyle=`hsla(${hue} 100% 62% / ${e*.65})`;p.lineWidth=1.5;p.stroke();p.shadowBlur=0;
  path(p,points);p.strokeStyle=`rgba(235,255,255,${e*.4})`;p.lineWidth=.45;p.stroke();
  for(const [x,y]of [points[0],points[5]]){p.beginPath();p.arc(x,y,2+e*2,0,7);p.fillStyle=`hsl(${hue} 100% 75%)`;p.fill();}
 }
 // Synchronized stereo trace runs through the center of the laser chamber.
 const l=frame.waves[0]||[],r=frame.waves[1]||[];if(l.length){p.beginPath();for(let i=0;i<l.length;i+=2){const x=30+i/l.length*780,y=160+(l[i]-(r[i]||0))*100;if(i)p.lineTo(x,y);else p.moveTo(x,y);}p.lineWidth=.7;p.strokeStyle=`rgba(165,250,255,${e*.4})`;p.stroke();}
}
function bolt(x1,y1,x2,y2,depth=5,seed=0){
 if(depth===0)return [[x1,y1],[x2,y2]];
 const jitter=Math.hypot(x2-x1,y2-y1)*.17,theta=Math.sin(seed*12.9898+state.time*24.17)*43758.5453,noise=(theta-Math.floor(theta))-.5;
 const mx=(x1+x2)/2+noise*jitter,my=(y1+y2)/2+noise*jitter;
 return [...bolt(x1,y1,mx,my,depth-1,seed+1).slice(0,-1),...bolt(mx,my,x2,y2,depth-1,seed+43)];
}
const boltSprite=document.createElement('canvas');boltSprite.width=boltSprite.height=300;
function lightning(e,dt,light){
 fade(1-Math.exp(-dt*12));state.boltAge-=dt;if(e<.002)return;
 p.globalCompositeOperation='lighter';
 if(state.boltAge<=0){state.boltAge=.06+(.15*(1-e));state.bolts=[];state.contacts=[];
  for(let i=0;i<3;i++){const angle=state.time*(i%2?-.45:.4)+i*2.1,tx=420+Math.cos(angle)*137,ty=160+Math.sin(angle)*137;state.contacts.push(angle);const trunk=bolt(420,160,tx,ty,5,i*53);state.bolts.push(trunk);for(let branch=1;branch<4;branch++){const point=trunk[branch*7];state.bolts.push(bolt(point[0],point[1],point[0]+Math.sin(i+branch+state.time)*85,point[1]+Math.cos(branch-state.time)*65,3,i+branch*9));}}
  const ink=boltSprite.getContext('2d');ink.setTransform(1,0,0,1,0,0);ink.clearRect(0,0,300,300);ink.save();ink.translate(-270,-10);ink.globalCompositeOperation='lighter';paintBolt(ink,1,light);ink.restore();
 }
 p.globalAlpha=e;p.drawImage(boltSprite,270,10);p.globalAlpha=1;
}
function paintBolt(ctx,e,light){
 // Batch all arcs into one glow pass instead of blurring every branch separately.
 ctx.beginPath();for(const points of state.bolts)points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.shadowColor='#9166ff';ctx.shadowBlur=14*light;ctx.lineWidth=2.4;ctx.strokeStyle=`rgba(133,112,255,${e*.7})`;ctx.stroke();ctx.shadowBlur=0;
 ctx.lineWidth=.65;ctx.strokeStyle=`rgba(235,248,255,${e*.85})`;ctx.stroke();
 ctx.beginPath();
 for(const a of state.contacts||[])for(let strand=0;strand<6;strand++)for(let j=0;j<=8;j++){
  const t=j/8,angle=a+(t-.5)*(.09+strand*.027),radius=137+Math.sin(j*2.3+strand+state.time*20)*2,x=420+Math.cos(angle)*radius,y=160+Math.sin(angle)*radius;
  if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);
 }
 ctx.lineWidth=.45;ctx.strokeStyle=`rgba(218,215,255,${e*.75})`;ctx.shadowColor='#be94ff';ctx.shadowBlur=4*light;ctx.stroke();ctx.shadowBlur=0;
 for(const a of state.contacts||[]){const x=420+Math.cos(a)*137,y=160+Math.sin(a)*137,g=ctx.createRadialGradient(x,y,0,x,y,14);g.addColorStop(0,`rgba(230,220,255,${e*.7})`);g.addColorStop(1,'#b287ff00');ctx.fillStyle=g;ctx.fillRect(x-14,y-14,28,28);}
 const halo=ctx.createRadialGradient(420,160,1,420,160,32+e*35);halo.addColorStop(0,`rgba(215,230,255,${e*.65})`);halo.addColorStop(.15,`rgba(162,114,255,${e*.35})`);halo.addColorStop(1,'#563bff00');ctx.fillStyle=halo;ctx.fillRect(350,90,140,140);
}
function globe(c,reflection=false){
 c.save();c.beginPath();c.arc(500,260,145,0,7);c.clip();
 const body=c.createRadialGradient(456,205,15,500,260,145);
 if(!reflection){body.addColorStop(0,'#4e668215');body.addColorStop(.7,'#293e5710');body.addColorStop(1,'#a7b4df35');c.fillStyle=body;c.fillRect(350,110,300,300);}
 else{const shine=c.createRadialGradient(432,173,1,432,173,73);shine.addColorStop(0,'#f5f7ff38');shine.addColorStop(.4,'#dce9ff13');shine.addColorStop(1,'#ffffff00');c.fillStyle=shine;c.fillRect(355,115,230,240);c.beginPath();c.ellipse(423,192,12,45,.58,0,7);c.fillStyle='#e8efff28';c.fill();}
 c.restore();c.beginPath();c.arc(500,260,145,0,7);c.strokeStyle=reflection?'#d1dafa66':'#3e536f';c.lineWidth=reflection?.8:2;c.stroke();
 if(reflection){c.beginPath();c.arc(500,260,138,Math.PI*1.08,Math.PI*1.38);c.strokeStyle='#e5edff99';c.lineWidth=1.3;c.stroke();}
}
export function renderEffect(c,theme,frame,fresh,dt,light){
 if(state.lastTheme!==theme){p.clearRect(0,0,840,320);state.lastTheme=theme;state.peak=0;state.radial=[{level:0,peak:0,hold:0},{level:0,peak:0,hold:0}];state.bolts=[];state.boltAge=0;}
 const rms=fresh?Math.max(...frame.rms):0;
 const target=rms>.001?clamp((20*Math.log10(rms)+54)/48):0;
 state.energy+=(target-state.energy)*(1-Math.exp(-dt*(target>state.energy?14:2.8)));
 state.time+=dt*(.12+state.energy*1.1);panel(c);
 c.save();c.beginPath();c.roundRect(80,100,840,320,13);c.clip();
 if(theme==='matrix')matrix(c,frame,fresh,dt,light);
 else{if(theme==='smoke')smoke(state.energy,dt,light);if(theme==='laser')laser(state.energy,dt,light,frame);if(theme==='lightning'){globe(c);p.save();p.beginPath();p.arc(420,160,140,0,7);p.clip();lightning(state.energy,dt,light);p.restore();}c.drawImage(layer,80,100);if(theme==='lightning')globe(c,true);}
 c.restore();glass(c,theme);
}
