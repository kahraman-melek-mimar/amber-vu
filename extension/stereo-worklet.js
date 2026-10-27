class StereoCollector extends AudioWorkletProcessor {
 constructor(){
  super();this.left=new Float32Array(2048);this.right=new Float32Array(2048);this.offset=0;
  this.sums=[0,0];this.peaks=[0,0];this.includeWaves=false;this.requestedWaves=false;
  this.port.onmessage=({data})=>{this.requestedWaves=!!data.waves;};
 }
 process(inputs){
  const channels=inputs[0];if(!channels?.length)return true;
  const left=channels[0],right=channels[1]||left;
  for(let i=0;i<left.length;i++){
   if(this.offset===0)this.includeWaves=this.requestedWaves;
   const l=left[i],r=right[i];
   if(this.includeWaves){this.left[this.offset]=l;this.right[this.offset]=r;}
   this.sums[0]+=l*l;this.sums[1]+=r*r;this.peaks[0]=Math.max(this.peaks[0],Math.abs(l));this.peaks[1]=Math.max(this.peaks[1],Math.abs(r));this.offset++;
   if(this.offset===2048){
    const message={rms:[Math.sqrt(this.sums[0]/2048),Math.sqrt(this.sums[1]/2048)],peak:[...this.peaks],waves:[[],[]]};
    if(this.includeWaves){message.waves=[this.left,this.right];this.port.postMessage(message,[this.left.buffer,this.right.buffer]);this.left=new Float32Array(2048);this.right=new Float32Array(2048);}
    else this.port.postMessage(message);
    this.offset=0;this.sums[0]=this.sums[1]=this.peaks[0]=this.peaks[1]=0;
   }
  }return true;
 }
}
registerProcessor('stereo-collector',StereoCollector);
