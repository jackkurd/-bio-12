(function(){
'use strict';
var $=function(i){return document.getElementById(i)};
var store={
  get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},
  set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},
  del:function(k){try{localStorage.removeItem(k)}catch(e){}}
};

try{
/* ---------- ئاشکراکردن لە کاتی سکڕۆڵ ---------- */
var rv=document.querySelectorAll('.rv');
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{threshold:.12});
  rv.forEach(function(el,i){el.style.transitionDelay=(i%4)*70+'ms';io.observe(el)});
}else rv.forEach(function(el){el.classList.add('on')});

/* ---------- درەوشانەوەی کارتەکان ---------- */
document.querySelectorAll('.card').forEach(function(c){
  c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')});
});

/* ---------- DNA ---------- */
(function(){
  var svg=$('dna'),NS='http://www.w3.org/2000/svg',N=26,els=[],t=0;
  for(var i=0;i<N;i++){
    var l=document.createElementNS(NS,'line'),a=document.createElementNS(NS,'circle'),b=document.createElementNS(NS,'circle');
    l.setAttribute('stroke','#2fd1a2');l.setAttribute('stroke-opacity','.35');l.setAttribute('stroke-width','2');
    a.setAttribute('fill','#7bf5d2');b.setAttribute('fill','#2fd1a2');
    svg.appendChild(l);svg.appendChild(a);svg.appendChild(b);els.push([l,a,b]);
  }
  function draw(){
    t+=.018;
    for(var i=0;i<N;i++){
      var y=20+i*(580/(N-1)),s=Math.sin(t+i*.42),x1=100+s*70,x2=100-s*70,z=Math.cos(t+i*.42),e=els[i];
      e[0].setAttribute('x1',x1);e[0].setAttribute('x2',x2);e[0].setAttribute('y1',y);e[0].setAttribute('y2',y);
      e[1].setAttribute('cx',x1);e[1].setAttribute('cy',y);e[1].setAttribute('r',5+z*2.5);
      e[2].setAttribute('cx',x2);e[2].setAttribute('cy',y);e[2].setAttribute('r',5-z*2.5);
    }
    if(!matchMedia('(prefers-reduced-motion:reduce)').matches)requestAnimationFrame(draw);
  }
  draw();
})();

}catch(e){}

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
var ready=fetch('link.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null})
  .then(function(j){if(j&&j.url)cfg=j;applyCfg()}).catch(applyCfg);

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
      $('bar').style.width='100%';$('pt').textContent='تەواو بوو — فایلەکە بکەرەوە بۆ دامەزراندن';
      saveBlob(b);busy=false;
    }).catch(function(){busy=false;frameDownload(u)});
  });
}
$('dlBtn').onclick=startDownload;$('dlBtn2').onclick=startDownload;

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
if(q.get('dl')==='1'){startDownload()}

})();
