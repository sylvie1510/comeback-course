/* ============================================================
   העברת תשובות בין מכשירים · ייצוא/ייבוא גיבוי JSON
   נועד בעיקר לכשכל אחד מבני הזוג ממלא ממכשיר אחר,
   ולגיבוי לפני ניקוי מטמון/דפדפן.
   ============================================================ */
(function(){
'use strict';
const KEYS = ['comeback.couple','comeback.progress',
  'comeback.st00','comeback.st01','comeback.st02','comeback.st03','comeback.st04','comeback.st05'];

function exportData(){
  const data = {};
  KEYS.forEach(k=>{ const v = localStorage.getItem(k); if(v!=null) data[k]=v; });
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'הקאמבק-גיבוי.json';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function importData(file, msgEl){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      let n = 0;
      Object.keys(data).forEach(k=>{ if(KEYS.includes(k)){ localStorage.setItem(k, data[k]); n++; } });
      if(!n) throw new Error('empty');
      if(msgEl) msgEl.textContent = 'יובא בהצלחה. טוענים מחדש…';
      setTimeout(()=>location.reload(), 700);
    }catch(e){
      if(msgEl) msgEl.textContent = 'הקובץ לא נראה כמו גיבוי תקין של הקאמבק. נסו לייצא שוב מהמכשיר המקורי.';
    }
  };
  reader.readAsText(file);
}

/* ---------- קישור שיתוף - דרך קלה יותר מקובץ, לשליחה בוואטסאפ ---------- */
function b64encode(obj){
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function b64decode(str){
  return JSON.parse(decodeURIComponent(escape(atob(str))));
}
function shareLink(msgEl){
  const data = {};
  KEYS.forEach(k=>{ const v = localStorage.getItem(k); if(v!=null) data[k]=v; });
  if(!Object.keys(data).length){
    if(msgEl) msgEl.textContent = 'אין עדיין תשובות לשתף. מלאו קודם משהו באחת התחנות.';
    return;
  }
  const encoded = b64encode(data);
  const base = location.href.split('?')[0].split('#')[0].replace(/index\.html$/,'');
  const url = base + 'index.html?d=' + encoded;
  if(url.length > 7000){
    if(msgEl) msgEl.textContent = 'יש כבר הרבה תשובות, והקישור יוצא ארוך מדי. עדיף להשתמש בקובץ גיבוי (למעלה).';
    return;
  }
  const done = () => { if(msgEl) msgEl.textContent = 'הקישור הועתק. אפשר לשלוח אותו לבן/בת הזוג בוואטסאפ - כשהם יפתחו אותו, יוצע להם לייבא.'; };
  const fail = () => { if(msgEl) msgEl.innerHTML = 'לא הצלחנו להעתיק אוטומטית. הקישור: <br><code style="word-break:break-all">'+url+'</code>'; };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(done).catch(fail);
  } else fail();
}
function checkIncomingLink(){
  const params = new URLSearchParams(location.search);
  const d = params.get('d');
  if(!d) return;
  try{
    const data = b64decode(d);
    const known = Object.keys(data).filter(k=>KEYS.includes(k));
    if(!known.length) return;
    if(confirm('התקבל קישור עם תשובות של הקאמבק. לייבא אותן? זה יחליף את התשובות שכבר יש במכשיר הזה.')){
      known.forEach(k=> localStorage.setItem(k, data[k]));
      history.replaceState(null, '', location.pathname);
      location.reload();
      return;
    }
  }catch(e){}
  history.replaceState(null, '', location.pathname);
}
checkIncomingLink();

/* ---------- תזכורת קצרה לחזור ולהמשיך, אם לא סיימתם עכשיו ---------- */
function pad(n){ return String(n).padStart(2,'0'); }
function icsDate(d){
  return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(d.getHours())+pad(d.getMinutes())+'00';
}
function addReturnReminder(btn){
  const next = btn.dataset.next || 'index.html';
  const label = btn.dataset.nextlabel || '';
  const start = new Date(); start.setDate(start.getDate()+1); start.setHours(20,0,0,0);
  const end = new Date(start.getTime()+15*60000);
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//הקאמבק//תזכורת//HE','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:'+Date.now()+'@comeback-course',
    'DTSTAMP:'+icsDate(new Date()),
    'DTSTART:'+icsDate(start),
    'DTEND:'+icsDate(end),
    'SUMMARY:להמשיך בקאמבק' + (label?' - '+label:''),
    'DESCRIPTION:עצרתם באמצע. התשובות שמורות אצלכם במכשיר\\, אפשר פשוט להמשיך מאיפה שעצרתם.',
    'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'תזכורת-קאמבק.ics';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ---------- באנר "זמן לבדוק" - מופיע בעמוד הבית כמה ימים אחרי שסיימתם ---------- */
function getProgress(){
  try{ return JSON.parse(localStorage.getItem('comeback.progress')||'{}'); }catch(e){ return {}; }
}
function ensureCompletedAt(){
  const p = getProgress();
  const allDone = ['01','02','03','04','05'].every(n=>p[n]);
  if(allDone && !localStorage.getItem('comeback.completedAt')){
    try{ localStorage.setItem('comeback.completedAt', String(Date.now())); }catch(e){}
  }
}
function maybeShowCheckinBanner(){
  const el = document.getElementById('checkinBanner');
  if(!el) return; // קיים רק בעמוד הבית
  ensureCompletedAt();
  const completedAt = +localStorage.getItem('comeback.completedAt') || 0;
  if(!completedAt) return;
  const days = Math.floor((Date.now()-completedAt)/86400000);
  if(days < 5) return;
  const lastSeen = +localStorage.getItem('comeback.checkinSeenAt') || 0;
  if(Date.now() - lastSeen < 12*86400000) return; // לא מציקים יותר מפעם בשבועיים בערך
  const daysEl = el.querySelector('.days');
  if(daysEl) daysEl.textContent = String(days);
  el.hidden = false;
  try{ localStorage.setItem('comeback.checkinSeenAt', String(Date.now())); }catch(e){}
}
document.addEventListener('DOMContentLoaded', ()=>setTimeout(()=>{
  ensureCompletedAt();
  maybeShowCheckinBanner();
}, 150));

document.addEventListener('click', e=>{
  if(e.target && e.target.id === 'exportbtn') exportData();
  if(e.target && e.target.id === 'remindreturn') addReturnReminder(e.target);
  if(e.target && e.target.id === 'checkinDismiss'){
    const el = document.getElementById('checkinBanner');
    if(el) el.hidden = true;
  }
  if(e.target && e.target.id === 'sharelinkbtn') shareLink(document.getElementById('syncmsg'));
});
document.addEventListener('change', e=>{
  if(e.target && e.target.id === 'importfile' && e.target.files && e.target.files[0]){
    importData(e.target.files[0], document.getElementById('syncmsg'));
  }
});
})();
