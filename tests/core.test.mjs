import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {db,digitsFor,nixieDisplay,radialResponse,retroLEDColor} from '../extension/core.mjs';
import {ecgPoints,paperRollState} from '../extension/ecg-core.mjs';
test('Nixie retains one digit per tube and full time information',()=>{
 assert.equal(digitsFor(154),'02:34');assert.equal(db(0),-60);
 assert.deepEqual(nixieDisplay('elapsed',{current:154},true).digits,['0','2','3','4']);
 assert.equal(nixieDisplay('remaining',{current:154,duration:500},true).digits.join(''),'0546');
 const clock=nixieDisplay('clock',{},false,new Date(2026,9,27,21,45,8));assert.equal(clock.digits.join(''),'2145');assert(clock.caption.includes('21:45:08'));
 assert.equal(nixieDisplay('elapsed',{current:6018},true).digits.join(''),'0140');
});
test('Radial channels remain independent and peaks retreat after silence',()=>{
 let left={level:0,peak:0,hold:0},right={...left};for(let i=0;i<6;i++){left=radialResponse(left,.2,.5,1/60);right=radialResponse(right,0,0,1/60);}
 assert(left.level>.8);assert.equal(right.level,0);assert.equal(right.peak,0);const peak=left.peak;
 for(let i=0;i<30;i++)left=radialResponse(left,0,0,1/60);assert(left.level<.001);assert(left.peak<peak-8);
});
test('Paper winding conserves area and matches paper velocity at both radii',()=>{
 for(const t of [0,10,60,90,150,180]){const a=paperRollState(t);assert(Math.abs(a.leftRadius**2+a.rightRadius**2-12820)<1e-7);}
 for(const t of [10,80,150]){const a=paperRollState(t),b=paperRollState(t+.001);assert(Math.abs((b.leftAngle-a.leftAngle)/.001+165/a.leftRadius)<.001);assert(Math.abs((b.rightAngle-a.rightAngle)/.001+165/a.rightRadius)<.001);}
 assert.equal(paperRollState(0).leftRadius,34);assert.equal(paperRollState(180).rightRadius,34);assert.equal(paperRollState(181).opacity,0);assert.equal(paperRollState(182).leftRadius,34);
});
test('ECG histories do not invent a signal in the silent channel',()=>{
 const p=ecgPoints({waves:[new Float32Array(2048).fill(.5),new Float32Array(2048)],sampleRate:48000});assert.equal(p.length,2);assert.equal(p[0].values[0],.5);assert.equal(p[0].values[1],0);
 assert.deepEqual(ecgPoints({waves:[[],[]]}),[]);
});
test('Retro LEDs reserve 20 green, 10 amber and 10 red segments',()=>{
 const colors=Array.from({length:40},(_,i)=>retroLEDColor(i));assert.equal(colors.filter(x=>x==='#8adf42').length,20);assert.equal(colors.filter(x=>x==='#ff4331').length,10);
});
test('Audio worklet streams only requested waves and preserves stereo timing',async()=>{
 let Processor;class Base{constructor(){this.messages=[];this.port={postMessage:m=>this.messages.push(m)};}}
 vm.runInNewContext(await readFile(new URL('../extension/stereo-worklet.js',import.meta.url),'utf8'),{AudioWorkletProcessor:Base,registerProcessor:(_,p)=>Processor=p,Float32Array,Math,Array});
 const p=new Processor();const feed=polarity=>{for(let block=0;block<16;block++){const left=Float32Array.from({length:128},(_,i)=>.4*Math.sin((block*128+i)*.2)),right=Float32Array.from(left,v=>v*polarity);p.process([[left,right]]);}};
 feed(1);assert.equal(p.messages[0].waves[0].length,0);assert(p.messages[0].rms[0]>.25);
 p.port.onmessage({data:{waves:true}});feed(-1);const waves=p.messages[1].waves;assert.equal(waves[0].length,2048);for(let i=0;i<2048;i++)assert.equal(waves[0][i],-waves[1][i]);
 p.port.onmessage({data:{waves:false}});feed(1);assert.equal(p.messages[2].waves[0].length,0);
});
test('Manifest exposes author contact without permanent all-sites access',async()=>{
 const m=JSON.parse(await readFile(new URL('../extension/manifest.json',import.meta.url),'utf8'));assert.equal(m.manifest_version,3);assert.equal(m.version,'0.4.3');assert(m.author.includes('kahraman.melek@gmail.com'));assert(!m.host_permissions?.length);assert(!m.permissions.includes('debugger'));
});
