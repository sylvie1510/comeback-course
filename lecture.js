/* ============================================================
   ההרצאה · פרקים, שמירת מיקום, קישור עמוק מהתחנות
   ============================================================ */
(function(){
'use strict';

/* חשיפה בגלילה — כאן אין engine.js */
(function(){
  var els = document.querySelectorAll('.rv');
  if(!('IntersectionObserver' in window)){
    for(var i=0;i<els.length;i++) els[i].classList.add('in');
    return;
  }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, {rootMargin:'0px 0px -8% 0px', threshold:.08});
  for(var j=0;j<els.length;j++) io.observe(els[j]);
})();

var CHAPS = [
  {t:0,    lb:'פתיחה'},
  {t:330,  lb:'מה מנבא אושר בזוגיות'},
  {t:420,  lb:'התמונה ההפוכה'},
  {t:570,  lb:'המחקר'},
  {t:980,  lb:'המפה · חמש התחנות'},
  {t:1090, lb:'תחנה 01 · STOP', sub:'לעצור', big:1},
  {t:1820, lb:'תחנה 02 · SPACE', sub:'מרחב', big:1},
  {t:2400, lb:'תחנה 03 · RETURN', sub:'חזרה', big:1},
  {t:3230, lb:'תחנה 04 · REPAIR', sub:'תיקון', big:1},
  {t:4400, lb:'תחנה 05 · RECONNECT', sub:'חיבור מחדש', big:1},
  {t:4550, lb:'סיכום'}
];

var KEY = 'comeback.lecture.t';
var v = document.getElementById('lec');
var list = document.getElementById('chaps');
if(!v || !list) return;

function mmss(s){
  s = Math.max(0, Math.round(s));
  var m = Math.floor(s/60), r = s%60;
  return m + ':' + (r<10?'0':'') + r;
}

/* בניית רשימת הפרקים */
CHAPS.forEach(function(c, i){
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'chap' + (c.big ? ' big' : '');
  b.dataset.i = i;
  b.innerHTML = '<span class="tm">' + mmss(c.t) + '</span>' +
    '<span class="lb">' + c.lb + (c.sub ? ' <i>· ' + c.sub + '</i>' : '') + '</span>';
  b.addEventListener('click', function(){ go(c.t); });
  list.appendChild(b);
});
var btns = list.querySelectorAll('.chap');

function go(t){
  v.currentTime = t;
  v.play().catch(function(){});
  try{ v.scrollIntoView({behavior:'smooth', block:'center'}); }catch(e){}
}

function mark(at){
  var t = (typeof at === 'number') ? at : v.currentTime, cur = 0;
  for(var i=0;i<CHAPS.length;i++){ if(t >= CHAPS[i].t - 1) cur = i; }
  for(var j=0;j<btns.length;j++) btns[j].classList.toggle('on', j===cur);
}

/* שמירת המיקום, וחזרה אליו */
var saved = 0;
try{ saved = parseFloat(localStorage.getItem(KEY) || '0') || 0; }catch(e){}

var deep = 0;
var m = location.hash.match(/t=(\d+)/) || location.search.match(/t=(\d+)/);
if(m) deep = parseInt(m[1], 10);

function initPos(){
  if(initPos.done) return; initPos.done = true;
  var start = deep || (saved > 20 && saved < v.duration - 20 ? saved : 0);
  if(start){ v.currentTime = start; }
  if(deep){ v.play().catch(function(){}); }
  mark(start);
}
/* המטא־דאטה עשויה להיטען עוד לפני שהסקריפט רץ */
if(v.readyState >= 1) initPos();
v.addEventListener('loadedmetadata', initPos);
v.addEventListener('seeked', function(){ mark(); });

var last = 0;
v.addEventListener('timeupdate', function(){
  mark();
  var now = Date.now();
  if(now - last > 4000){
    last = now;
    try{ localStorage.setItem(KEY, String(Math.floor(v.currentTime))); }catch(e){}
  }
});
v.addEventListener('pause', function(){
  try{ localStorage.setItem(KEY, String(Math.floor(v.currentTime))); }catch(e){}
});

/* רמז חזרה, אם יש מאיפה להמשיך */
if(!deep && saved > 60){
  var n = document.createElement('p');
  n.className = 'tiny';
  n.style.marginTop = '.6rem';
  n.innerHTML = 'עצרתם ב־<b>' + mmss(saved) + '</b>. ' +
    '<a href="#" id="fromstart" style="color:var(--crimson);font-weight:900">להתחיל מההתחלה</a>';
  v.parentNode.parentNode.appendChild(n);
  n.querySelector('#fromstart').addEventListener('click', function(e){
    e.preventDefault(); go(0); n.remove();
  });
}
})();
