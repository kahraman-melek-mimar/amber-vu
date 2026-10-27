// The supplied artwork is immutable. Only the two reel rings and needle strokes move.
const art=new Image();art.src='assets/kasetcalar-original.png';
const clean=document.createElement('canvas');clean.width=1774;clean.height=887;
const g=clean.getContext('2d',{willReadFrequently:true});
const meters=[{pivot:[1208,414],tip:[1265,301]},{pivot:[1512,414],tip:[1566,301]}];
let ready=false;
art.onload=()=>{
 g.drawImage(art,0,0);
 // Restore the tiny background under the baked-in needles at runtime, within
 // their stroke masks only; the original file is never modified or regenerated.
 const source=g.getImageData(0,0,1774,887),result=g.getImageData(0,0,1774,887);
 for(const {pivot,tip} of meters){
  const dx=tip[0]-pivot[0],dy=tip[1]-pivot[1],len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
  for(let y=299;y<=414;y++)for(let x=Math.floor(pivot[0]-6);x<tip[0]+9;x++){
   const t=((x-pivot[0])*dx+(y-pivot[1])*dy)/(len*len);
   const distance=(x-pivot[0])*nx+(y-pivot[1])*ny;
   if(t<0||t>1.01||distance< -3.5||distance>6)continue;
   const left=-5.5,right=8.5;
   const px=x-distance*nx,py=y-distance*ny;
   const sample=offset=>4*(Math.max(0,Math.min(886,Math.round(py+ny*offset)))*1774+Math.max(0,Math.min(1773,Math.round(px+nx*offset))));
   const a=sample(left),b=sample(right),weight=(distance-left)/(right-left),at=(y*1774+x)*4;
   for(let ch=0;ch<3;ch++)result.data[at+ch]=source.data[a+ch]*(1-weight)+source.data[b+ch]*weight;
  }
 }
 g.putImageData(result,0,0);ready=true;
};
export function drawCassetteArt(c,phase,levels){
 if(!ready)return false;
 c.save();c.scale(1000/1774,500/887);c.drawImage(clean,0,0);
 for(const [cx,cy]of [[414,424],[728,424]]){
  c.save();c.beginPath();c.arc(cx,cy,81,0,Math.PI*2);c.arc(cx,cy,32,0,Math.PI*2,true);c.clip('evenodd');
  c.translate(cx,cy);c.rotate(-phase);c.drawImage(art,-cx,-cy);c.restore();
 }
 meters.forEach(({pivot,tip},index)=>{
  // Same pivot, needle length, material and meter face as the original artwork.
  const length=Math.hypot(tip[0]-pivot[0],tip[1]-pivot[1]);
  const angle=(-153+(levels[index]+60)/60*89)*Math.PI/180;
  const end=[pivot[0]+Math.cos(angle)*length,pivot[1]+Math.sin(angle)*length];
  c.save();c.beginPath();c.rect(index?1375:1065,254,index?250:258,161);c.clip();
  c.beginPath();c.moveTo(...pivot);c.lineTo(...end);c.shadowColor='#783e12b3';c.shadowBlur=2;c.shadowOffsetX=2;c.lineWidth=2.1;c.strokeStyle='#3a230d';c.stroke();
  c.shadowBlur=0;c.shadowOffsetX=0;c.beginPath();c.moveTo(pivot[0]-.6,pivot[1]);c.lineTo(end[0]-.6,end[1]);c.lineWidth=.7;c.strokeStyle='#efd397';c.stroke();c.restore();
 });
 c.restore();return true;
}
