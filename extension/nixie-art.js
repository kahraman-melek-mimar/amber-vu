import {nixieDisplay} from './core.mjs';
let art=null,loading=false;const glyphs=new Map();
const shapes={
 '0':'M50 8 C12 8 10 35 10 90 C10 145 12 172 50 172 C88 172 90 145 90 90 C90 35 88 8 50 8 Z',
 '1':'M28 35 L54 10 L54 172',
 '2':'M12 43 C12 0 87 -3 88 42 C88 77 59 94 13 168 L90 168',
 '3':'M12 25 C40 -2 88 7 87 46 C87 75 64 89 42 88 C70 85 92 103 89 135 C85 176 39 183 12 155',
 '4':'M74 173 L74 9 L10 119 L94 119',
 '5':'M87 10 L18 10 L15 81 C47 66 89 78 89 124 C89 170 43 187 11 158',
 '6':'M84 17 C54 -5 13 19 11 95 C7 153 23 176 52 174 C86 173 95 143 84 112 C74 82 36 79 12 110',
 '7':'M10 10 L91 10 L33 173',
 '8':'M50 88 C-5 69 7 7 50 8 C94 7 106 69 50 88 C-7 106 1 173 50 173 C99 173 107 106 50 88',
 '9':'M16 162 C47 190 86 158 89 86 C92 28 73 6 47 8 C13 7 3 39 15 69 C26 99 66 102 89 71'
};
function glyph(char){
 if(glyphs.has(char))return glyphs.get(char);
 const canvas=document.createElement('canvas');canvas.width=160;canvas.height=230;const c=canvas.getContext('2d');c.translate(30,23);
 const path=new Path2D(shapes[char]||shapes['0']);c.lineCap='round';c.lineJoin='round';c.strokeStyle='#ff780c';c.lineWidth=3.8;c.shadowColor='#ff6900';c.shadowBlur=14;c.stroke(path);c.shadowBlur=5;c.lineWidth=2.1;c.strokeStyle='#ffb55e';c.stroke(path);c.shadowBlur=0;c.lineWidth=.7;c.strokeStyle='#ffe5ac';c.stroke(path);glyphs.set(char,canvas);return canvas;
}
export function renderNixie(c,mode,track,fresh,levels,light){
 if(!loading){loading=true;const image=new Image();image.onload=()=>art=image;image.src='assets/nixie/clean-ph.png';}
 c.save();c.fillStyle='#0d0d0b';c.fillRect(0,0,1000,500);if(!art){c.restore();return;}
 const scale=Math.min(1000/art.width,500/art.height),oy=(500-art.height*scale)/2;c.translate(0,oy);c.scale(scale,scale);c.drawImage(art,0,0);
 const display=nixieDisplay(mode,track,fresh);
 [303,556,1438,1690].forEach((x,index)=>{c.save();c.globalAlpha=.6+light*.4;c.drawImage(glyph(display.digits[index]),x-80,315);c.restore();});
 c.fillStyle='#d7a665';c.font='25px Georgia';c.textAlign='center';c.fillText(display.leftLabel,435,215);c.fillText(display.rightLabel,1550,215);
 if(display.minus){c.fillStyle='#ffae50';c.font='44px monospace';c.fillText('−',160,440);}
 for(let channel=0;channel<2;channel++){
  const x=channel?1081:850,n=21,filled=Math.round(Math.max(0,Math.min(1,(levels[channel]+24)/24))*n);
  for(let i=0;i<filled;i++){
   const y=592-i*18.6,fill=c.createLinearGradient(x,y,x,y+13);fill.addColorStop(0,'#ffdf74');fill.addColorStop(.45,'#ffae25');fill.addColorStop(1,'#ff7c06');c.fillStyle=fill;c.shadowColor='#ff8c0d';c.shadowBlur=5*light;c.beginPath();c.roundRect(x,y,40,13,2);c.fill();
  }
 }
 c.shadowBlur=0;c.font='19px monospace';c.fillStyle='#bd986a';c.fillText(display.caption,art.width/2,735);c.restore();
 return display;
}
