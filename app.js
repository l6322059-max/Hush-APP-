const $=s=>document.querySelector(s);
const S=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
const F=p=>'<svg viewBox="0 0 24 24" fill="currentColor"><path d="'+p+'"/></svg>';
const IC={
 play:F('M8 5v14l11-7z'),pause:F('M7 5h4v14H7zM13 5h4v14h-4z'),
 prev:F('M6 6h2v12H6zM9.5 12 18 6v12z'),next:F('M16 6h2v12h-2zM6 18V6l8.5 6z'),
 shuf:S('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
 rep:S('<path d="m17 1 4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>'),
 heart:S('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>'),
 plus:S('<path d="M12 5v14M5 12h14"/>'),check:S('<path d="m5 12 5 5 9-10"/>'),search:S('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),lib:S('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),down:S('<path d="m6 9 6 6 6-6"/>')
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
const vis=()=>tab==='find'?results:tracks.filter(t=>(tab==='all'||t.liked)&&(t.title+' '+t.artist).toLowerCase().includes(q));
const byId=id=>tracks.concat(results).find(t=>t.id===id);
const EMPTY={
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
  const v=vis(),find=tab==='find';
  $('#list').innerHTML=v.map(t=>{
    const sv=tracks.some(x=>x.id===t.id);
    const btn=find
      ?`<button class="lk${sv?' ok':''}" data-save="${t.id}" aria-label="${sv?'Remove from library':'Save to library'}">${sv?IC.check:IC.plus}</button>`
      :`<button class="lk${t.liked?' y':''}" data-like="${t.id}" aria-label="${t.liked?'Unlike':'Like'} ${esc(t.title)}">${IC.heart}</button>`;
    return `<li class="row${t.id===cur?' on':''}"><button class="pl" data-id="${t.id}"><span class="art" style="background:${esc(art(t))}"></span><span class="mt"><b>${esc(t.title)}</b><small>${esc(t.artist||'Unknown artist')}${t.preview?' (30 s preview)':''}</small></span>${t.id===cur?EQ:`<span class="dur">${fmt(t.dur)}</span>`}</button>${btn}</li>`;
  }).join('');
  const e=$('#empty');
  if(v.length){e.style.display='none';return}
  e.style.display='';
  e.innerHTML=find?(msg||EMPTY.find):(tab==='liked'&&!q)?EMPTY.liked:tracks.length?'<h2>No matches</h2><div>Try a different search.</div>':EMPTY.all;
}
function updatePlayer(){
  const t=byId(cur);
  document.body.classList.toggle('has',!!t);
  document.body.classList.toggle('playing',!au.paused);
  $('#pTitle').textContent=$('#mTitle').textContent=t?t.title:'Nothing playing';
  $('#pSub').textContent=$('#mSub').textContent=t?(t.artist||'Unknown artist'):'';
  $('#pArt').style.background=$('#mArt').style.background=t?art(t):'var(--line)';
  const ic=au.paused?IC.play:IC.pause,lb=au.paused?'Play':'Pause';
  for(const id of ['#pp','#mpp']){$(id).innerHTML=ic;$(id).setAttribute('aria-label',lb)}
  $('#pLike').classList.toggle('y',!!t&&t.liked);
}
function play(id){
  const t=byId(id);if(!t)return;
  if(cur!==id){cur=id;au.src=t.url;}
  au.play().catch(()=>{});
  if('mediaSession' in navigator)navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist||'Hush',artwork:t.img?[{src:t.img}]:[]});
  updatePlayer();render();
}
function step(dir,auto){
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
  au.paused?au.play().catch(()=>{}):au.pause();
};
$('#next').onclick=()=>step(1,false);
$('#prev').onclick=()=>step(-1,false);
$('#shuf').onclick=e=>{shuffle=!shuffle;e.currentTarget.classList.toggle('on',shuffle);e.currentTarget.setAttribute('aria-pressed',shuffle)};
$('#rep').onclick=e=>{rep=(rep+1)%3;const b=e.currentTarget;b.dataset.m=rep;b.classList.toggle('on',rep>0);b.setAttribute('aria-label',['Repeat off','Repeat all','Repeat one'][rep])};
$('#list').onclick=e=>{
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
  $('#ttl').textContent={all:'Library',liked:'Liked',find:'Find online'}[tab];
  const i=$('#q');i.value='';i.placeholder=tab==='find'?'Search artists or songs, then press Enter':'Search your songs';
  sbox.classList.toggle('open',tab==='find');
  $('#lib').scrollTop=0;render();
});
$('#sbtn').onclick=()=>{const o=sbox.classList.toggle('open');if(o)$('#q').focus()};
$('#q').oninput=e=>{if(tab!=='find'){q=e.target.value.trim().toLowerCase();render()}};
$('#q').onkeydown=e=>{if(e.key==='Enter'&&tab==='find'){const v=e.target.value.trim();if(v){e.target.blur();find(v)}}};
const pick=()=>$('#file').click();
$('#add').onclick=pick;
document.addEventListener('click',e=>{if(e.target.id==='add2')pick()});
$('#file').onchange=e=>{addFiles(e.target.files);e.target.value=''};
$('#seek').oninput=e=>{if(au.duration)au.currentTime=e.target.value/100*au.duration};
au.ontimeupdate=()=>{
  if(au.duration){$('#mBar').style.width=au.currentTime/au.duration*100+'%';$('#seek').value=au.currentTime/au.duration*100;$('#tDur').textContent=fmt(au.duration)}
  $('#tCur').textContent=fmt(au.currentTime);
};
au.onplay=au.onpause=updatePlayer;
au.onended=()=>{if(rep===2){au.currentTime=0;au.play()}else step(1,true)};
au.onerror=()=>{$('#pSub').textContent=$('#mSub').textContent='This song couldn’t be played'};
if('mediaSession' in navigator){
  const m=navigator.mediaSession;
  m.setActionHandler('play',()=>au.play());m.setActionHandler('pause',()=>au.pause());
  m.setActionHandler('nexttrack',()=>step(1,false));m.setActionHandler('previoustrack',()=>step(-1,false));
}
const openNP=on=>$('#np').classList.toggle('open',on);
$('#mini').onclick=e=>{if(!e.target.closest('#mpp'))openNP(true)};
$('#mpp').onclick=()=>$('#pp').click();
$('#close').onclick=()=>openNP(false);
$('#pLike').onclick=()=>{const t=byId(cur);if(!t)return;t.liked=!t.liked;if(t.online&&!tracks.some(x=>x.id===t.id))tracks.push({...t});save();updatePlayer();render()};
render();
