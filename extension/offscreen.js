let context, stream, collector;
const audioBus=new BroadcastChannel('amber-vu-audio');
audioBus.onmessage=({data})=>{if(data.type==='VIEW')collector?.port.postMessage({waves:!!data.waves});};
async function start(streamId) {
  stream = await navigator.mediaDevices.getUserMedia({audio:{mandatory:{chromeMediaSource:'tab',chromeMediaSourceId:streamId}},video:false});
  context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  // tabCapture suppresses the original playback; this restores it once, unchanged.
  source.connect(context.destination);
  await context.audioWorklet.addModule('stereo-worklet.js');
  collector=new AudioWorkletNode(context,'stereo-collector',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:'explicit'});
  const mute=context.createGain();mute.gain.value=0;
  source.connect(collector);collector.connect(mute);mute.connect(context.destination);
  collector.port.onmessage=({data})=>audioBus.postMessage({type:'FRAME',...data,sampleRate:context.sampleRate});
  stream.getAudioTracks()[0].onended = () => chrome.runtime.sendMessage({type:'AUDIO_ENDED'}).catch(()=>{});
  await context.resume();

}
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
  if(msg.target!=='audio'||msg.type!=='START')return;
  start(msg.streamId).then(()=>reply({ok:true})).catch(async error=>{
    stream?.getTracks().forEach(t=>t.stop());await context?.close();reply({ok:false,error:error.message});
  });return true;
});
