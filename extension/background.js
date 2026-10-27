let starting = false;
async function stop(clear = true) {
  await chrome.offscreen.closeDocument().catch(() => {});
  if(clear) await chrome.storage.session.remove(['sourceTab', 'visualWindow']);
  await chrome.storage.session.set({listening:false});
}
chrome.action.onClicked.addListener(async tab => {
  if (starting || !tab.id) return;
  starting = true;
  try {
    const state = await chrome.storage.session.get(['sourceTab', 'visualWindow']);
    if (state.visualWindow) {
      try { await chrome.windows.update(state.visualWindow, {focused:true}); return; }
      catch { await stop(); }
    }
    const contexts = await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']});
    if (contexts.length) await stop();
    await chrome.offscreen.createDocument({url:'offscreen.html', reasons:['USER_MEDIA'], justification:'Seçilen sekmenin ses seviyesini ve frekanslarını yerelde görselleştir.'});
    const streamId = await chrome.tabCapture.getMediaStreamId({targetTabId:tab.id});
    const response = await chrome.runtime.sendMessage({target:'audio', type:'START', streamId});
    if (!response?.ok) throw new Error(response?.error || 'Ses yakalama başlatılamadı.');
    await chrome.storage.session.set({sourceTab:tab.id,listening:true});
    // Injection is limited to the tab explicitly selected by the user.
    await chrome.scripting.executeScript({target:{tabId:tab.id}, files:['track-time.js']}).catch(() => {});
    const win = await chrome.windows.create({url:'visualizer.html', type:'popup', width:1080, height:780});
    await chrome.storage.session.set({visualWindow:win.id});
    await chrome.action.setBadgeText({text:'ON'});
    await chrome.action.setBadgeBackgroundColor({color:'#bd812d'});
    await chrome.storage.session.remove('lastError');
  } catch (error) {
    await stop();
    await chrome.storage.session.set({lastError:error.message});
    await chrome.windows.create({url:'visualizer.html',type:'popup',width:920,height:700});
  } finally { starting = false; }
});
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.type === 'STOP' && sender.url === chrome.runtime.getURL('visualizer.html')) {
    stop(false).then(async () => {await chrome.action.setBadgeText({text:''}); reply({ok:true});});
    return true;
  }
  if(message.type==='RESTART' && sender.url===chrome.runtime.getURL('visualizer.html')) {
    (async()=>{
      if(starting)throw new Error('Başlatma sürüyor.');
      starting=true;
      try {
        const {sourceTab}=await chrome.storage.session.get('sourceTab');
        if(!sourceTab)throw new Error('Önce müzik sekmesinde eklenti simgesine tıkla.');
        await chrome.tabs.get(sourceTab);
        await stop(false);
        await chrome.offscreen.createDocument({url:'offscreen.html',reasons:['USER_MEDIA'],justification:'Seçili sekmenin ses göstergesini yeniden başlat.'});
        const streamId=await chrome.tabCapture.getMediaStreamId({targetTabId:sourceTab});
        const result=await chrome.runtime.sendMessage({target:'audio',type:'START',streamId});
        if(!result?.ok)throw new Error(result?.error||'Ses başlatılamadı.');
        await chrome.scripting.executeScript({target:{tabId:sourceTab},files:['track-time.js']}).catch(()=>{});
        await chrome.storage.session.set({listening:true});
        await chrome.action.setBadgeText({text:'ON'});
        return {ok:true};
      }catch(error){await stop(false);return {ok:false,error:error.message};}
      finally{starting=false;}
    })().then(reply);return true;
  }
  if (message.type === 'TRACK' && sender.tab) {
    chrome.storage.session.get('sourceTab').then(state => {
      if (state.sourceTab === sender.tab.id) chrome.runtime.sendMessage({type:'TIME',current:message.current,duration:message.duration,title:message.title,paused:message.paused}).catch(()=>{});
    });
  }
  if (message.type === 'AUDIO_ENDED') stop(false).then(()=>chrome.action.setBadgeText({text:''}));
});
chrome.windows.onRemoved.addListener(async id => {
  const state = await chrome.storage.session.get('visualWindow');
  if (state.visualWindow === id) {await stop(); await chrome.action.setBadgeText({text:''});}
});
chrome.tabs.onRemoved.addListener(async id => {
  const state = await chrome.storage.session.get('sourceTab');
  if (state.sourceTab === id) {await stop(); await chrome.action.setBadgeText({text:''});}
});
