(function(){
'use strict';
var $=function(i){return document.getElementById(i)};
var store={
  get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},
  set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},
  del:function(k){try{localStorage.removeItem(k)}catch(e){}}
};

/* ---------- لینکی بەرنامە ---------- */
var FILE_NAME='زیندەزانی پۆلی 12.apk';
var DEFAULT_URL='https://www.dropbox.com/scl/fi/fghrzfbhfakaxjv3flxdk/12.apk?rlkey=funqbl5xqvf18g45a4vigxnnj&st=y2fxhq0s&dl=1';
var cfg={url:DEFAULT_URL,version:'',notes:'',updated:''};

function normalize(u){
  u=(u||'').trim();
  if(/^https?:\/\/(www\.)?dropbox\.com\//.test(u)){
    u=/([?&])dl=\d/.test(u)?u.replace(/([?&])dl=\d/,'$1dl=1'):u+(u.indexOf('?')<0?'?':'&')+'dl=1';
  }
  return u;
}
function directUrl(u){return u.replace('://www.dropbox.com','://dl.dropboxusercontent.com')}

function applyCfg(){
  if(cfg.version){$('verChip').textContent='وەشان '+cfg.version+(cfg.notes?' · '+cfg.notes:'');$('verChip').hidden=false}
  else $('verChip').hidden=true;
}
function loadCfg(){
  return fetch('link.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null})
    .then(function(j){if(j&&j.url){cfg=j;} applyCfg();}).catch(function(){applyCfg();});
}
var ready=loadCfg();

/* ---------- داگرتن لە ناو هەمان لاپەڕە ---------- */
var busy=false;
function saveBlob(b){
  var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=FILE_NAME;
  document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},60000);
}
function frameDownload(u){
  var f=document.createElement('iframe');f.style.display='none';f.src=u;document.body.appendChild(f);
  $('pt').textContent='داگرتن دەستی پێکرد...';
}
function startDownload(e){
  if(e&&e.preventDefault)e.preventDefault();
  if(busy)return;busy=true;
  ready.then(function(){
    var u=normalize(cfg.url);
    $('pb').hidden=false;$('bar').style.width='0';$('pt').textContent='خەریکی داگرتنە...';
    return fetch(directUrl(u)).then(function(r){
      if(!r.ok)throw 0;
      var total=+r.headers.get('content-length')||0;
      if(!r.body||!r.body.getReader)return r.blob();
      var rd=r.body.getReader(),parts=[],got=0;
      return (function pump(){return rd.read().then(function(x){
        if(x.done)return new Blob(parts,{type:'application/vnd.android.package-archive'});
        parts.push(x.value);got+=x.value.length;
        if(total){var p=Math.round(got/total*100);$('bar').style.width=p+'%';$('pt').textContent=p+'%'}
        else $('pt').textContent=(got/1048576).toFixed(1)+' MB';
        return pump();
      })})();
    }).then(function(b){
      $('bar').style.width='100%';$('pt').textContent='تەواو بوو ✓ — فایلەکە بکەرەوە بۆ دامەزراندن';
      saveBlob(b);busy=false;
    }).catch(function(){busy=false;frameDownload(u);});
  });
}
$('mainDownloadBtn').onclick=startDownload;

/* ---------- بانگێشتی گروپ ---------- */
var q=new URLSearchParams(location.search);
var code=(q.get('join')||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
var base=location.href.split('#')[0].split('?')[0];
if(code.length==8){
  $('join').hidden=false;
  $('joinCode').textContent=code.slice(0,4)+'-'+code.slice(4);
  var intent='intent://join/'+code+'#Intent;scheme=biology12;package=com.biology.class12;S.browser_fallback_url='+encodeURIComponent(base+'?dl=1')+';end';
  $('joinOpen').href=intent;
  if(/Android/i.test(navigator.userAgent)&&q.get('dl')!=='1'){setTimeout(function(){location.href=intent},300)}
}
if(q.get('dl')==='1'){startDownload();}

/* ---------- بەشی شاراوەی خاوەن ---------- */
var modal=$('adminModal');
function msg(t,type){var m=$('aMsg');m.textContent=t;m.style.color=type==='ok'?'#4dd0b0':'#ff7a7a';m.hidden=!t}
function openAdmin(){
  $('aTok').value=store.get('gh_tok')||'';
  $('aRepo').value=store.get('gh_repo')||'';
  $('aUrl').value=cfg.url||'';$('aVer').value=cfg.version||'';$('aNotes').value=cfg.notes||'';
  msg('');modal.style.display='flex';
}
function closeAdmin(){modal.style.display='none'}
$('lockBtn').onclick=openAdmin;$('aX').onclick=closeAdmin;
if(location.hash==='#admin')openAdmin();
$('aForget').onclick=function(){store.del('gh_tok');$('aTok').value='';msg('Token لابرا لەسەر ئەم ئامێرە.','ok')};

function b64(s){return btoa(unescape(encodeURIComponent(s)))}
$('aSave').onclick=function(){
  var tok=$('aTok').value.trim(),repo=$('aRepo').value.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\/$/,'');
  var url=normalize($('aUrl').value);
  if(!tok||!/^[^\/\s]+\/[^\/\s]+$/.test(repo))return msg('Token و ڕیپۆ (owner/repo) پڕبکەرەوە.','err');
  if(!/^https:\/\//.test(url))return msg('لینکەکە دەبێت بە https:// دەست پێبکات.','err');
  var body={url:url,version:$('aVer').value.trim(),notes:$('aNotes').value.trim(),updated:new Date().toISOString()};
  var api='https://api.github.com/repos/'+repo+'/contents/link.json';
  var h={'Authorization':'Bearer '+tok,'Accept':'application/vnd.github+json'};
  $('aSave').disabled=true;msg('...خەریکی تۆمارکردنە','ok');
  fetch(api,{headers:h,cache:'no-store'}).then(function(r){
    if(r.status===404)return null;
    if(!r.ok)throw new Error(r.status===401||r.status===403?'Token هەڵەیە یان مۆڵەتی Contents: write نییە.':'هەڵە '+r.status);
    return r.json();
  }).then(function(cur){
    var p={message:'update app link',content:b64(JSON.stringify(body,null,2)+'\n')};
    if(cur&&cur.sha)p.sha=cur.sha;
    return fetch(api,{method:'PUT',headers:h,body:JSON.stringify(p)});
  }).then(function(r){
    if(!r.ok)throw new Error(r.status===404?'ڕیپۆ نەدۆزرایەوە (یان Token مۆڵەتی نییە).':'هەڵە '+r.status);
    store.set('gh_tok',tok);store.set('gh_repo',repo);
    cfg=body;applyCfg();
    msg('تۆمار کرا ✓ — دوای نزیکەی ١ خولەک بۆ هەموو کەس دەگۆڕێت.','ok');
  }).catch(function(e){msg(e.message||'هەڵەیەک ڕوویدا.','err')})
    .then(function(){$('aSave').disabled=false});
};

/* ---------- وێنەی مۆبایلەکە: گۆڕینی خۆکار ---------- */
var shots=['hero','start','daily','pick','level','leaders','home','timer','medals'],si=0,pi=$('phoneImg');
setInterval(function(){
  si=(si+1)%shots.length;pi.style.opacity=0;
  setTimeout(function(){pi.src='img/'+shots[si]+'.jpg';pi.style.opacity=1},400);
},3500);
})();
