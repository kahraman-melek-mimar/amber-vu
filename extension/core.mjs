export const db = value => Math.max(-60, Math.min(0, 20*Math.log10(Math.max(value, .001))));
export function digitsFor(seconds, clock=false) {
  const n=Math.max(0,Math.floor(Number.isFinite(seconds)?seconds:0));
  const parts=clock?[Math.floor(n/3600)%24,Math.floor(n/60)%60,n%60]:[Math.floor(n/60),n%60];
  return parts.map(p=>String(p).padStart(2,'0')).join(':');
}

// Stereo radial meters retain no shared level or peak state.
export function radialResponse(previous, rms, peak, dt) {
 const signal=Math.max(0,(rms||0)*.7+(peak||0)*.3);
 const target=signal>.001?Math.min(1,Math.max(0,(20*Math.log10(signal)+60)/60)):0;
 const seconds=Math.max(0,Math.min(.1,dt));
 const level=previous.level+(target-previous.level)*(1-Math.exp(-seconds*(target>previous.level?52:18)));
 const radius=level*17;
 let held=previous.peak,hold=previous.hold;
 if(radius>=held){held=radius;hold=.045;}
 else if(hold>0)hold=Math.max(0,hold-seconds);
 else held=Math.max(radius,held-seconds*21);
 return {level,peak:held,hold};
}

export const retroLEDColor=index=>index<20?'#8adf42':index<30?'#ffc239':'#ff4331';
export function nixieDisplay(mode,track,fresh,date=new Date()){
 const clock=mode==='clock',valid=clock||(fresh&&Number.isFinite(track.current)&&(mode!=='remaining'||Number.isFinite(track.duration)));
 let seconds=clock?date.getHours()*3600+date.getMinutes()*60+date.getSeconds():valid?Math.max(0,Math.floor(mode==='remaining'?track.duration-track.current:track.current)):0;
 const long=!clock&&seconds>=6000;
 const left=clock||long?Math.floor(seconds/3600)%100:Math.floor(seconds/60),right=clock||long?Math.floor(seconds/60)%60:seconds%60;
 const digits=(String(left).padStart(2,'0')+String(right).padStart(2,'0')).split('');
 const caption=valid?(clock?`${digitsFor(seconds,true)} · YEREL SAAT`:`${mode==='remaining'?'−':''}${digitsFor(seconds)} · ${mode==='remaining'?'KALAN SÜRE':'GEÇEN SÜRE'}`):'PARÇA SÜRESİ ALINAMADI';
 return {digits,leftLabel:clock||long?'SAAT':'DAKİKA',rightLabel:clock||long?'DAKİKA':'SANİYE',caption,minus:mode==='remaining',valid};
}
