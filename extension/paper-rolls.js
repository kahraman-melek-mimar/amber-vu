const tops=new Map();
function top(radius){
 const r=Math.round(radius*2)/2;if(tops.has(r))return tops.get(r);
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(r*2+8);canvas.height=60;
 const c=canvas.getContext('2d'),x=canvas.width/2,y=30;
 const g=c.createRadialGradient(x-15,y-5,15,x,y,r);g.addColorStop(0,'#67472c');g.addColorStop(.35,'#dfba88');g.addColorStop(.8,'#f5d1a1');g.addColorStop(1,'#a16b3e');
 c.beginPath();c.ellipse(x,y,r,22,0,0,7);c.fillStyle=g;c.fill();
 for(let rr=22;rr<r;rr+=1.45){c.beginPath();c.ellipse(x,y,rr,22*rr/r,0,0,7);c.strokeStyle=Math.round(rr)%2?'#774423a0':'#ffe1b788';c.lineWidth=.7;c.stroke();}
 c.beginPath();c.ellipse(x,y,20,22*20/r,0,0,7);c.fillStyle='#3c2f20';c.fill();
 tops.set(r,canvas);return canvas;
}
function outline(c,cx,r){
 c.beginPath();c.moveTo(cx-r,261);c.lineTo(cx-r,626);c.bezierCurveTo(cx-r,656,cx+r,656,cx+r,626);c.lineTo(cx+r,261);c.quadraticCurveTo(cx,303,cx-r,261);c.closePath();
}
export function drawPaperRoll(c,entry,cx,r,angle,travel,left,ink){
 c.save();outline(c,cx,r);c.clip();
 const columns=48,step=2*r/columns,tile=entry.paperTile;
 for(let i=0;i<columns;i++){
  const x=cx-r+i*step,mid=(x+step/2-cx)/r;
  const arc=r*Math.acos(Math.max(-1,Math.min(1,left?mid:-mid)));
  const flat=left?cx+r:cx-r;
  const u=((flat+travel+(left?-arc:arc))%180+180)%180;
  // Narrow strips wrap the actual paper texture around the curved surface.
  c.drawImage(tile,Math.min(177,u),0,3,365,x,261,step+.6,389);
 }
 const shade=c.createLinearGradient(cx-r,0,cx+r,0);shade.addColorStop(0,left?'#4c260c99':'#fff3d428');shade.addColorStop(.25,'#ffedd21a');shade.addColorStop(.56,'#ffffff00');shade.addColorStop(.85,'#79421d33');shade.addColorStop(1,left?'#fff1d72b':'#3a1d0aad');c.fillStyle=shade;c.fillRect(cx-r,261,2*r,389);
 if(left&&ink)ink(cx,r);
 c.restore();
 const face=top(r);c.drawImage(face,cx-face.width/2,231);
 // Fixed metal reflections, with a rotating slot on the spindle cap.
 const metal=c.createLinearGradient(cx-21,0,cx+21,0);metal.addColorStop(0,'#372719');metal.addColorStop(.18,'#c5b08b');metal.addColorStop(.4,'#faf0cf');metal.addColorStop(.56,'#645640');metal.addColorStop(.85,'#b2a17e');metal.addColorStop(1,'#302417');
 c.fillStyle=metal;c.beginPath();c.roundRect(cx-21,237,42,27,3);c.fill();
 c.beginPath();c.ellipse(cx,264,21,5,0,0,7);c.fillStyle='#4f3c25';c.fill();
 c.beginPath();c.ellipse(cx,237,21,8,0,0,7);c.fillStyle=metal;c.fill();c.strokeStyle='#ddc59c';c.lineWidth=.8;c.stroke();
 const dx=Math.cos(angle)*12,dy=Math.sin(angle)*4.2;
 c.beginPath();c.moveTo(cx-dx,237-dy);c.lineTo(cx+dx,237+dy);c.strokeStyle='#241c13';c.lineWidth=2;c.stroke();
}
export function drawWoundInk(c,cx,r,spec,history,timeline){
 const edge=cx+r;
 for(let ch=0;ch<2;ch++){
  c.beginPath();let started=false;
  for(const point of history){
   const world=spec.end-(timeline-point.time)*165,theta=(edge-world)/r;
   if(theta<0||theta>Math.PI)continue;
   const x=cx+r*Math.cos(theta),y=spec.ys[ch]-point.values[ch]*spec.amplitude;
   if(!started){c.moveTo(x,y);started=true;}else c.lineTo(x,y);
  }
  c.strokeStyle='#493022';c.lineWidth=1.15;c.lineJoin='round';c.stroke();
 }
}
