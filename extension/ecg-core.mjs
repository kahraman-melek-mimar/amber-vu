// Real audio extrema grouped in time; no fabricated heartbeats or cross-channel mix.
export function ecgPoints(frame, groups=2){
 const waves=frame.waves||[[],[]],length=Math.min(waves[0]?.length||0,waves[1]?.length||0);
 if(!length)return [];
 const count=Math.min(groups,length),duration=length/(frame.sampleRate||48000);
 return Array.from({length:count},(_,i)=>{
  const start=Math.floor(i*length/count),end=Math.floor((i+1)*length/count);
  const values=waves.map(w=>{let value=0;for(let k=start;k<end;k++)if(Math.abs(w[k])>Math.abs(value))value=w[k];return Math.max(-1,Math.min(1,value));});
  return {offset:(i+1)*duration/count,values,duration};
 });
}

// Paper area is conserved: r_take² + r_supply² is constant.
// A short fade replaces the finished roll set, without reversing paper travel.
export function paperRollState(seconds){
 const cycle=182,phase=Math.max(0,Number.isFinite(seconds)?seconds:0)%cycle;
 const elapsed=phase<=180?phase:phase<181?180:0;
 const progress=elapsed/180,small=34,large=108,delta=(large*large-small*small)/180,speed=165;
 const leftRadius=Math.sqrt(small*small+delta*elapsed),rightRadius=Math.sqrt(large*large-delta*elapsed);
 return {progress,leftRadius,rightRadius,
  leftAngle:-2*speed/delta*(leftRadius-small),rightAngle:-2*speed/delta*(large-rightRadius),
  opacity:phase<=180?1:phase<181?181-phase:phase-181};
}
