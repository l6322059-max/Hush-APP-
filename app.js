const $=s=>document.querySelector(s);
const S=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
const F=p=>'<svg viewBox="0 0 24 24" fill="currentColor"><path d="'+p+'"/></svg>';
const IC={
 play:F('M8 5v14l11-7z'),pause:F('M7 5h4v14H7zM13 5h4v14h-4z'),
 prev:F('M6 6h2v12H6zM9.5 12 18 6v12z'),next:F('M16 6h2v12h-2zM6 18V6l8.5 6z'),
 shuf:S('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
 rep:S('<path d="m17 1 4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>'),
 heart:S('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>'),
 plus:S('<path d="M12 5v14M5 12h14"/>'),check:S('<path d="m5 12 5 5 9-10"/>'),search:S('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),lib:S('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),down:S('<path d="m6 9 6 6 6-6"/>'),spot:S('<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>')
};
$('#shuf').innerHTML=IC.shuf;$('#prev').innerHTML=IC.prev;$('#next').innerHTML=IC.next;$('#rep').innerHTML=IC.rep;$('#pp').innerHTML=IC.play;document.querySelectorAll('[data-ic]').forEach(e=>e.innerHTML=IC[e.dataset.ic]);

const LS='hush:lib';
let tracks=[],results=[],cur=null,shuffle=false,rep=0,tab='all',q='',nid=1,msg='';
try{tracks=JSON.parse(localStorage.getItem(LS)||'[]')}catch(e){}
const save=()=>{try{localStorage.setItem(LS,JSON.stringify(tracks.filter(t=>t.online)))}catch(e){}};
const au=new Audio();au.preload='auto';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=s=>{if(s==null||!isFinite(s))return '–:––';s=Math.floor(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const hue=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h};
const PAL=[['#3B2F5E','#FF8A7A'],['#1F4E4A','#F2C879'],['#5B2A3C','#F4A6B8'],['#26364F','#8FB8F0'],['#4A3B22','#E8D08A']];
const art=t=>{const [b,c]=PAL[hue(t.title+t.artist)%5],g=`radial-gradient(circle at 68% 34%,${c} 0 24%,transparent 25%),linear-gradient(transparent 64%,rgba(0,0,0,.22) 64%),${b}`;return t.img?`url('${t.img}') center/cover,${g}`:g};
const EQ='<span class="eq"><i></i><i></i><i></i></span>';
const vis=()=>tab==='find'?results:tab==='sp'?spItems.filter(x=>!x.col):tracks.filter(t=>(tab==='all'||t.liked)&&(t.title+' '+t.artist).toLowerCase().includes(q));
const byId=id=>tracks.concat(results,spItems,spPool).find(t=>t.id===id);
const EMPTY={
 sp:'<h2>Connect Spotify</h2><div>See your liked songs and playlists, and play them through the Spotify app on this phone. Needs Spotify Premium.</div><input class="search" id="cid" placeholder="Paste your Client ID" autocomplete="off" style="margin-top:18px"><button class="add" id="spgo">Connect Spotify</button><div style="font-size:12px;margin-top:18px">Redirect URI to register in your Spotify app: com.hush.player://callback</div>',
 all:'<h2>Add songs to start listening</h2><div>Pick audio files from your device, or open Find online to search for music.</div><button class="add" id="add2">Choose files</button>',
 liked:'<h2>No liked songs yet</h2><div>Tap the heart on a song to add it here.</div>',
 find:'<h2>Find music online</h2><div>Search an artist or song, then press Enter. Full tracks come from Audius. Mainstream results are 30-second previews.</div>'
};

function addFiles(files){
  for(const f of files){
    if(!(f.type.startsWith('audio/')||/\.(mp3|m4a|aac|wav|flac|ogg|opus|weba)$/i.test(f.name)))continue;
    const base=f.name.replace(/\.[^.]+$/,'').replace(/_+/g,' ').trim(),i=base.indexOf(' - ');
    const t={id:'l'+nid++,title:i>0?base.slice(i+3):base,artist:i>0?base.slice(0,i):'',url:URL.createObjectURL(f),dur:null,liked:false};
    tracks.push(t);
    const a=new Audio();a.preload='metadata';a.src=t.url;
    a.onloadedmetadata=()=>{t.dur=a.duration;render()};
  }
  render();
}
function render(){
  const sp=tab==='sp',v=sp?spItems:vis(),find=tab==='find';
  $('#list').innerHTML=(sp&&spTitle?'<li class="row"><button class="pl" data-back><span class="mt"><b>‹ '+esc(spTitle)+'</b><small>Back to playlists</small></span></button></li>':'')+v.map(t=>{
    const sv=tracks.some(x=>x.id===t.id);
    const btn=sp?'':find
      ?`<button class="lk${sv?' ok':''}" data-save="${t.id}" aria-label="${sv?'Remove from library':'Save to library'}">${sv?IC.check:IC.plus}</button>`
      :`<button class="lk${t.liked?' y':''}" data-like="${t.id}" aria-label="${t.liked?'Unlike':'Like'} ${esc(t.title)}">${IC.heart}</button>`;
    return `<li class="row${t.id===cur?' on':''}"><button class="pl" ${t.col?`data-col="${t.col}"`:`data-id="${t.id}"`}><span class="art" style="background:${esc(art(t))}"></span><span class="mt"><b>${esc(t.title)}</b><small>${esc(t.artist||'Unknown artist')}${t.preview?' (30 s preview)':''}</small></span>${t.col?'<span class="dur">›</span>':t.id===cur?EQ:`<span class="dur">${fmt(t.dur)}</span>`}</button>${btn}</li>`;
  }).join('');
  const e=$('#empty');
  if(v.length){e.style.display='none';return}
  e.style.display='';
  e.innerHTML=sp?(tok?(spMsg||'<h2>Loading…</h2>'):EMPTY.sp):find?(msg||EMPTY.find):(tab==='liked'&&!q)?EMPTY.liked:tracks.length?'<h2>No matches</h2><div>Try a different search.</div>':EMPTY.all;
  const ci=$('#cid');if(ci)ci.value=cid;
}
function updatePlayer(){
  const t=byId(cur);
  document.body.classList.toggle('has',!!t);
  const e=E();document.body.classList.toggle('playing',!e.paused);document.body.classList.toggle('sp',!!(t&&t.sp));
  $('#pTitle').textContent=$('#mTitle').textContent=t?t.title:'Nothing playing';
  $('#pSub').textContent=$('#mSub').textContent=t?(t.artist||'Unknown artist'):'';
  $('#pArt').style.background=$('#mArt').style.background=t?art(t):'var(--line)';
  const ic=e.paused?IC.play:IC.pause,lb=e.paused?'Play':'Pause';
  for(const id of ['#pp','#mpp']){$(id).innerHTML=ic;$(id).setAttribute('aria-label',lb)}
  $('#pLike').classList.toggle('y',!!t&&t.liked);
}
function play(id){
  const t=byId(id);if(!t)return;
  if(t.sp){au.pause();cur=id;spStart(t);return}
  if(!SP.paused)SP.pause();
  if(cur!==id){cur=id;au.src=t.url;}
  au.play().catch(()=>{});
  if('mediaSession' in navigator)navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist||'Hush',artwork:t.img?[{src:t.img}]:[]});
  updatePlayer();render();
}
function step(dir,auto){
  if(E()===SP){spCmd('POST','/me/player/'+(dir>0?'next':'previous')).then(()=>setTimeout(spPoll,700));return}
  const v=vis();if(!v.length)return;
  const i=v.findIndex(t=>t.id===cur);let j;
  if(shuffle&&v.length>1){do{j=Math.floor(Math.random()*v.length)}while(j===i)}
  else if(i<0)j=dir>0?0:v.length-1;
  else{
    if(dir<0&&au.currentTime>3){au.currentTime=0;return}
    j=i+dir;
    if(j>=v.length){if(rep===1||!auto)j=0;else{au.pause();au.currentTime=0;return}}
    if(j<0)j=v.length-1;
  }
  cur=null;play(v[j].id);
}
async function find(term){
  msg='<h2>Searching…</h2>';results=[];render();
  const enc=encodeURIComponent(term);
  const get=async u=>{const r=await fetch(u);if(!r.ok)throw new Error(r.status);return r.json()};
  const [a,i]=await Promise.allSettled([
    get(`https://api.audius.co/v1/tracks/search?query=${enc}&limit=20&app_name=Hush`),
    get(`https://itunes.apple.com/search?term=${enc}&media=music&entity=song&limit=20`)]);
  const out=[];
  if(a.status==='fulfilled')for(const x of a.value.data||[]){
    if(x.is_streamable===false)continue;
    out.push({id:'a'+x.id,title:x.title,artist:x.user?.name||'',url:`https://api.audius.co/v1/tracks/${x.id}/stream?app_name=Hush`,dur:x.duration,img:x.artwork?.['150x150'],online:true,liked:false});
  }
  if(i.status==='fulfilled')for(const x of i.value.results||[]){
    if(!x.previewUrl)continue;
    out.push({id:'i'+x.trackId,title:x.trackName,artist:x.artistName,url:x.previewUrl,dur:30,img:x.artworkUrl100,preview:true,online:true,liked:false});
  }
  results=out;
  msg=out.length?'':(a.status==='rejected'&&i.status==='rejected')
    ?'<h2>Couldn’t reach the music services</h2><div>Check your connection and try again. Online search works in the Android app, not in a plain preview page.</div>'
    :'<h2>No results</h2><div>Try a different spelling or artist.</div>';
  render();
}
$('#pp').onclick=()=>{
  if(!cur){const v=vis();if(v.length)play(v[0].id);return}
  const x=E();x.paused?x.play().catch(()=>{}):x.pause();
};
$('#next').onclick=()=>step(1,false);
$('#prev').onclick=()=>step(-1,false);
$('#shuf').onclick=e=>{shuffle=!shuffle;e.currentTarget.classList.toggle('on',shuffle);e.currentTarget.setAttribute('aria-pressed',shuffle);if(E()===SP)spCmd('PUT','/me/player/shuffle?state='+shuffle)};
$('#rep').onclick=e=>{rep=(rep+1)%3;const b=e.currentTarget;b.dataset.m=rep;b.classList.toggle('on',rep>0);b.setAttribute('aria-label',['Repeat off','Repeat all','Repeat one'][rep]);if(E()===SP)spCmd('PUT','/me/player/repeat?state='+['off','context','track'][rep])};
$('#list').onclick=e=>{
  const c=e.target.closest('[data-col]');if(c){spOpen(c.dataset.col);return}
  if(e.target.closest('[data-back]')){spHome();return}
  const l=e.target.closest('[data-like]');
  if(l){const t=byId(l.dataset.like);t.liked=!t.liked;save();render();return}
  const s=e.target.closest('[data-save]');
  if(s){const t=byId(s.dataset.save),i=tracks.findIndex(x=>x.id===t.id);i<0?tracks.push({...t}):tracks.splice(i,1);save();render();return}
  const p=e.target.closest('[data-id]');
  if(p){p.dataset.id===cur?$('#pp').click():play(p.dataset.id)}
};
const sbox=$('#sbox');
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{
  tab=b.dataset.tab;q='';msg='';
  document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.tab===tab));
  $('#ttl').textContent={all:'Library',liked:'Liked',find:'Find online',sp:'Spotify'}[tab];
  const i=$('#q');i.value='';i.placeholder=tab==='find'?'Search artists or songs, then press Enter':'Search your songs';
  sbox.classList.toggle('open',tab==='find');
  $('#lib').scrollTop=0;if(tab==='sp'&&tok)spHome();render();
});
$('#sbtn').onclick=()=>{const o=sbox.classList.toggle('open');if(o)$('#q').focus()};
$('#q').oninput=e=>{if(tab!=='find'){q=e.target.value.trim().toLowerCase();render()}};
$('#q').onkeydown=e=>{if(e.key==='Enter'&&tab==='find'){const v=e.target.value.trim();if(v){e.target.blur();find(v)}}};
const pick=()=>$('#file').click();
$('#add').onclick=pick;
document.addEventListener('click',e=>{if(e.target.id==='add2')pick();if(e.target.id==='spgo')spLogin()});
$('#file').onchange=e=>{addFiles(e.target.files);e.target.value=''};
$('#seek').oninput=e=>{const x=E();if(x.duration)x.currentTime=e.target.value/100*x.duration};
const tick=()=>{const e=E();
  if(e.duration){$('#mBar').style.width=e.currentTime/e.duration*100+'%';$('#seek').value=e.currentTime/e.duration*100;$('#tDur').textContent=fmt(e.duration)}
  $('#tCur').textContent=fmt(e.currentTime);
};
au.ontimeupdate=tick;setInterval(()=>{if(E()===SP)tick()},500);
au.onplay=au.onpause=updatePlayer;
au.onended=()=>{if(rep===2){au.currentTime=0;au.play()}else step(1,true)};
au.onerror=()=>{$('#pSub').textContent=$('#mSub').textContent='This song couldn’t be played'};
if('mediaSession' in navigator){
  const m=navigator.mediaSession;
  m.setActionHandler('play',()=>au.play());m.setActionHandler('pause',()=>au.pause());
  m.setActionHandler('nexttrack',()=>step(1,false));m.setActionHandler('previoustrack',()=>step(-1,false));
}
const SK='hush:sp',CK='hush:cid',RURI='com.hush.player://callback',SCOPES='user-library-read playlist-read-private playlist-read-collaborative user-read-playback-state user-modify-playback-state';
let spItems=[],spPool=[],spMsg='',spTitle='',cid='',tok=null;
try{cid=localStorage.getItem(CK)||'';tok=JSON.parse(localStorage.getItem(SK))}catch(e){}
const toast=t=>{const x=$('#toast');x.textContent=t;x.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>x.classList.remove('on'),5000)};
const SP={paused:true,t:0,d:0,ts:0,
  get currentTime(){return this.paused?this.t:Math.min(this.d,this.t+(Date.now()-this.ts)/1000)},
  set currentTime(v){this.t=v;this.ts=Date.now();clearTimeout(this.h);this.h=setTimeout(()=>spCmd('PUT','/me/player/seek?position_ms='+Math.round(v*1000)),300)},
  get duration(){return this.d},
  play(){this.t=this.currentTime;this.paused=false;this.ts=Date.now();spCmd('PUT','/me/player/play');updatePlayer();return Promise.resolve()},
  pause(){this.t=this.currentTime;this.paused=true;spCmd('PUT','/me/player/pause');updatePlayer()}};
const E=()=>byId(cur)?.sp?SP:au;
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function spLogin(){
  const id=($('#cid').value||'').trim();
  if(!id){toast('Paste your Spotify Client ID first');return}
  cid=id;try{localStorage.setItem(CK,id)}catch(e){}
  const v=b64(crypto.getRandomValues(new Uint8Array(48)));
  try{localStorage.setItem('hush:ver',v)}catch(e){}
  const ch=b64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
  location.href='https://accounts.spotify.com/authorize?'+new URLSearchParams({client_id:id,response_type:'code',redirect_uri:RURI,scope:SCOPES,code_challenge_method:'S256',code_challenge:ch});
}
async function tokenReq(o){
  const r=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:cid,...o}).toString()});
  if(!r.ok)throw Object.assign(new Error('auth'),{status:401});
  const j=await r.json();
  tok={a:j.access_token,r:j.refresh_token||(tok&&tok.r),e:Date.now()+j.expires_in*1000-60000};
  try{localStorage.setItem(SK,JSON.stringify(tok))}catch(e){}
}
async function spApi(m,p,b){
  if(!tok)throw Object.assign(new Error('auth'),{status:401});
  if(Date.now()>tok.e)await tokenReq({grant_type:'refresh_token',refresh_token:tok.r});
  const r=await fetch('https://api.spotify.com/v1'+p,{method:m,headers:Object.assign({Authorization:'Bearer '+tok.a},b?{'Content-Type':'application/json'}:{}),body:b?JSON.stringify(b):undefined});
  if(!r.ok)throw Object.assign(new Error('http'),{status:r.status});
  const t=await r.text();return t?JSON.parse(t):null;
}
function spErr(e){
  const s=e&&e.status;
  if(s===401){spOut();toast('Spotify sign-in expired. Connect again.');return}
  const m=s===403?'Spotify said no. Add your account under User Management in your Spotify developer app, and check the app owner has Premium.'
    :(s===404||s==='nodev')?'Open the Spotify app on this phone once, then try again.'
    :s===429?'Spotify is busy. Wait a moment and try again.':'Couldn’t reach Spotify. Check your connection.';
  toast(m);
  if(!spItems.length){spMsg='<h2>Couldn’t load Spotify</h2><div>'+m+'</div>';render()}
}
const spCmd=(m,p,b)=>spApi(m,p,b).catch(spErr);
const spTrack=x=>x&&x.uri&&!x.is_local&&x.type!=='episode'?{id:'s'+x.id,sp:true,uri:x.uri,title:x.name,artist:(x.artists||[]).map(a=>a.name).join(', '),dur:x.duration_ms/1000,img:((x.album||{}).images||[]).slice(0,2).pop()?.url}:null;
async function spHome(){
  spTitle='';spMsg='';
  spItems=[{col:'liked',id:'c-liked',title:'Liked songs',artist:'Your saved tracks'}];render();
  try{
    const j=await spApi('GET','/me/playlists?limit=50');
    spItems=spItems.concat((j.items||[]).filter(Boolean).map(p=>({col:p.id,id:'c'+p.id,title:p.name,artist:(n=>n==null?'Playlist':n+' songs')((p.items||p.tracks||{}).total),img:((p.images||[])[0]||{}).url})));
    spItems.push({col:'out',id:'c-out',title:'Disconnect Spotify',artist:'Remove access from this phone'});
  }catch(e){spErr(e)}
  render();
}
async function spOpen(c){
  if(c==='out'){spOut();return}
  const it=spItems.find(x=>x.col===c);spTitle=it?it.title:'Songs';spMsg='';spItems=[];render();
  try{
    const j=await spApi('GET',c==='liked'?'/me/tracks?limit=50':'/playlists/'+c+'/items?limit=50');
    spItems=(j.items||[]).map(i=>spTrack(i&&(i.item||i.track))).filter(Boolean);
    if(!spItems.length)spMsg='<h2>No songs to show</h2><div>Spotify only shares songs from playlists you own.</div>';
  }catch(e){spErr(e)}
  render();
}
function spOut(){tok=null;try{localStorage.removeItem(SK)}catch(e){}spItems=[];spMsg='';spTitle='';if(E()===SP){SP.paused=true;updatePlayer()}render()}
async function spStart(t){
  if(!spPool.some(x=>x.id===t.id))spPool.push(t);
  SP.t=0;SP.d=t.dur;SP.ts=Date.now();SP.paused=false;updatePlayer();render();
  const l=vis().filter(x=>x.sp),i=l.findIndex(x=>x.id===t.id);
  const b=i<0?{uris:[t.uri]}:{uris:l.map(x=>x.uri).slice(0,100),offset:{position:i}};
  try{
    try{await spApi('PUT','/me/player/play',b)}
    catch(e){
      if(e.status!==404)throw e;
      const d=((await spApi('GET','/me/player/devices'))||{}).devices||[],dv=d.find(x=>x.is_active)||d[0];
      if(!dv)throw {status:'nodev'};
      await spApi('PUT','/me/player/play?device_id='+dv.id,b);
    }
    setTimeout(spPoll,1500);
  }catch(e){SP.paused=true;updatePlayer();spErr(e)}
}
async function spPoll(){
  if(!tok||document.hidden||E()!==SP)return;
  try{
    const s=await spApi('GET','/me/player');
    if(!s||!s.item){SP.paused=true;updatePlayer();return}
    SP.paused=!s.is_playing;SP.t=(s.progress_ms||0)/1000;SP.ts=Date.now();SP.d=s.item.duration_ms/1000;
    const t=spTrack(s.item);
    if(t&&t.id!==cur){if(!spPool.some(x=>x.id===t.id))spPool.push(t);cur=t.id;render()}
    updatePlayer();
  }catch(e){}
}
setInterval(spPoll,3000);
async function spCode(u){
  if(!u||u.indexOf(RURI)!==0)return;
  const c=new URL(u).searchParams.get('code');
  if(!c){toast('Spotify sign-in was cancelled');return}
  try{await tokenReq({grant_type:'authorization_code',code:c,redirect_uri:RURI,code_verifier:localStorage.getItem('hush:ver')});document.querySelector('.tab[data-tab="sp"]').click()}
  catch(e){toast('Couldn’t finish Spotify sign-in. Check your Client ID and redirect URI.')}
}
const CapApp=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
if(CapApp){CapApp.addListener('appUrlOpen',e=>spCode(e.url));CapApp.getLaunchUrl().then(r=>r&&spCode(r.url)).catch(()=>{})}
const openNP=on=>$('#np').classList.toggle('open',on);
$('#mini').onclick=e=>{if(!e.target.closest('#mpp'))openNP(true)};
$('#mpp').onclick=()=>$('#pp').click();
$('#close').onclick=()=>openNP(false);
$('#pLike').onclick=()=>{const t=byId(cur);if(!t||t.sp)return;t.liked=!t.liked;if(t.online&&!tracks.some(x=>x.id===t.id))tracks.push({...t});save();updatePlayer();render()};
render();
