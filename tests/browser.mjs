import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.AMBER_PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../extension/',import.meta.url)),results=fileURLToPath(new URL('../test-results/',import.meta.url));
await mkdir(results,{recursive:true});
const server=createServer(async(req,res)=>{
 try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,''),file=path.resolve(root,name);if(!file.startsWith(root)){res.writeHead(403).end();return;}
 const data=await readFile(file);res.setHeader('Content-Type',/\.(js|mjs)$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(data);}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;const errors=[],report={platform:process.platform,release:os.release(),node:process.version,windowsLiveYouTubeTest:'PENDING'};
try{
 browser=await chromium.launch({headless:true,...(process.env.AMBER_CHROME_EXECUTABLE?{executablePath:process.env.AMBER_CHROME_EXECUTABLE}:{})});report.browser=browser.version();
 const page=await browser.newPage({viewport:{width:1080,height:820},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.listeners=[];window.views=[];window.chrome={storage:{local:{get:async()=>({}),set:async()=>{}},session:{get:async()=>({sourceTab:1,listening:true})}},runtime:{onMessage:{addListener:fn=>window.listeners.push(fn)},sendMessage:async()=>({ok:true})}};
  const bus=new BroadcastChannel('amber-vu-audio');bus.onmessage=({data})=>{if(data.type==='VIEW')window.views.push(data.waves);};let t=0;
  window.audioTimer=setInterval(()=>{t++;const l=Float32Array.from({length:2048},(_,i)=>.3*Math.sin(i*.13)),r=Float32Array.from({length:2048},(_,i)=>.2*Math.sin(i*.16+1));bus.postMessage({type:'FRAME',rms:[.23,.15],peak:[.3,.2],waves:[l,r],sampleRate:48000});for(const fn of window.listeners)fn({type:'TIME',current:154,duration:500,paused:false,title:'Stereo CI fixture'});},43);
 });
 await page.goto(`http://127.0.0.1:${server.address().port}/visualizer.html`);
 assert.equal(await page.locator('.creator-name').textContent(),'by Kahraman MELEK®');assert.equal(await page.locator('.creator a[href^="mailto:"]').getAttribute('href'),'mailto:kahraman.melek@gmail.com');
 const themes=await page.locator('#theme option').evaluateAll(options=>options.map(x=>x.value));assert.equal(themes.length,15);
 for(const theme of themes){await page.selectOption('#theme',theme);await page.waitForTimeout(['nixie','cassette','ecgGlass','ecgPaper','ecgVintage'].includes(theme)?1400:500);await page.locator('.stage').screenshot({path:path.join(results,theme+'.png')});}
 report.themes=themes;
 const details=await page.evaluate(async()=>{
  const {renderNixie}=await import('./nixie-art.js'),{renderEffect}=await import('./effects.js'),{renderECG}=await import('./ecg.js');const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=500;const c=canvas.getContext('2d'),frame={rms:[.23,.15],peak:[.3,.2],waves:[[],[]]};let texts=[];const original=c.fillText.bind(c);c.fillText=(...args)=>{texts.push(args[0]);original(...args);};
  for(const theme of ['smoke','laser','lightning']){texts=[];renderEffect(c,theme,frame,true,1/30,.85);if(texts.length)throw Error('Unexpected effect captions');}
  texts=[];renderECG(c,'ecgPaper',frame,true,1/30,.85,true);if(texts.join('|')!=='STEREO CHART RECORDER')throw Error('Paper title');
  const display=renderNixie(c,'elapsed',{current:154,duration:500},true,[-12,-18],.85);if(display.digits.join('')!=='0234')throw Error('Nixie digit layout');
  function lamp(on){c.clearRect(0,0,1000,500);renderECG(c,'ecgVintage',frame,false,1/30,.85,on);const bytes=c.getImageData(289,343,4,4).data;let red=0;for(let i=0;i<bytes.length;i+=4)red+=bytes[i];return red/(bytes.length/4);}
  return {nixie:display.digits,powerOn:lamp(true),powerOff:lamp(false)};
 });assert(details.powerOn>details.powerOff+50);report.visualChecks=details;
 // Real browser Web Audio processing, separate from the mocked tab-capture UI.
 report.audioWorklet=await page.evaluate(async()=>{
  const ctx=new OfflineAudioContext(2,48000,48000);await ctx.audioWorklet.addModule('stereo-worklet.js');
  const node=new AudioWorkletNode(ctx,'stereo-collector',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:'explicit'}),frames=[];node.port.onmessage=({data})=>frames.push(data);node.port.postMessage({waves:true});
  const buffer=ctx.createBuffer(2,48000,48000);buffer.getChannelData(0).fill(.25);const source=ctx.createBufferSource();source.buffer=buffer;source.connect(node);node.connect(ctx.destination);source.start();await ctx.startRendering();await new Promise(r=>setTimeout(r,150));
  const frame=frames.find(x=>x.waves?.[0]?.length===2048);if(!frame)throw Error('No real worklet frame');if(Math.abs(frame.rms[0]-.25)>1e-6||frame.rms[1]!==0)throw Error('Worklet channel mismatch');return {frames:frames.length,leftRms:frame.rms[0],rightRms:frame.rms[1]};
 });
 await page.click('#stop');await page.getByRole('button',{name:'Yeniden başlat',exact:true}).waitFor();await page.waitForFunction(()=>document.getElementById('live').textContent.includes('DİNLEME DURDURULDU'));await page.click('#stop');await page.getByRole('button',{name:'Dinlemeyi durdur',exact:true}).waitFor();
 await page.setViewportSize({width:600,height:700});await page.selectOption('#theme','nixie');await page.waitForTimeout(150);await page.screenshot({path:path.join(results,'narrow-branding.png')});const creator=await page.locator('.creator').boundingBox();assert(creator&&creator.x>=0&&creator.x+creator.width<=600);
 assert(errors.length===0,errors.join('\n'));report.status='passed';console.log(JSON.stringify(report));
}catch(error){report.status='failed';report.error=error.message;throw error;}
finally{await writeFile(path.join(results,'report.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(resolve=>server.close(resolve));}
