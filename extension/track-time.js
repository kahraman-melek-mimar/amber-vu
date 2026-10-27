(() => {
  if (window.__amberTime) return;
  window.__amberTime = setInterval(() => {
    const media = [...document.querySelectorAll('video,audio')];
    const player = media.find(m=>!m.paused) || media[0];
    if (!player) return;
    try {
      chrome.runtime.sendMessage({type:'TRACK',current:player.currentTime,duration:Number.isFinite(player.duration)?player.duration:null,paused:player.paused,title:document.title}).catch(()=>{clearInterval(window.__amberTime);delete window.__amberTime;});
    } catch { clearInterval(window.__amberTime);delete window.__amberTime; }
  },500);
})();
