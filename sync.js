/* ============================================================
   העברת תשובות בין מכשירים · ייצוא/ייבוא גיבוי JSON
   נועד בעיקר לכשכל אחד מבני הזוג ממלא ממכשיר אחר,
   ולגיבוי לפני ניקוי מטמון/דפדפן.
   ============================================================ */
(function(){
'use strict';
const KEYS = ['comeback.couple','comeback.progress',
  'comeback.st00','comeback.st01','comeback.st02','comeback.st03','comeback.st04','comeback.st05'];


/* ---------- מיזוג · אף תשובה לא נמחקת ----------
   הכלל: תא ריק אצלי מתמלא ממה שהגיע. תא מלא אצלי נשאר כמו שהוא.
   ככה כל אחד יכול למלא בטלפון שלו, ובסוף לשני המכשירים יש את שתי העמודות. */
function isObj(v){ return v && typeof v === 'object' && !Array.isArray(v); }

function mergeVal(mine, theirs){
  if(theirs === undefined || theirs === null || theirs === '') return mine;
  if(mine === undefined || mine === null || mine === '') return theirs;
  if(typeof mine === 'boolean' || typeof theirs === 'boolean') return !!mine || !!theirs;
  if(Array.isArray(mine) && Array.isArray(theirs)){
    const out = [], n = Math.max(mine.length, theirs.length);
    for(let i = 0; i < n; i++) out[i] = mergeVal(mine[i], theirs[i]);
    return out;
  }
  if(Array.isArray(mine) && !mine.length) return theirs;
  if(isObj(mine) && isObj(theirs)) return mergeObj(mine, theirs);
  return mine;
}

function mergeObj(mine, theirs){
  const out = Object.assign({}, mine || {});
  Object.keys(theirs || {}).forEach(k => { out[k] = mergeVal(out[k], theirs[k]); });
  return out;
}

function mergeInto(key, rawIncoming){
  let incoming, existing;
  try{ incoming = JSON.parse(rawIncoming); }catch(e){ return false; }
  try{ existing = JSON.parse(localStorage.getItem(key) || 'null'); }catch(e){ existing = null; }
  if(existing === null){ localStorage.setItem(key, rawIncoming); return true; }
  const merged = (isObj(existing) || isObj(incoming)) ? mergeObj(existing, incoming) : mergeVal(existing, incoming);
  localStorage.setItem(key, JSON.stringify(merged));
  return true;
}

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
      Object.keys(data).forEach(k=>{ if(KEYS.includes(k) && mergeInto(k, data[k])) n++; });
      if(!n) throw new Error('empty');
      if(msgEl) msgEl.textContent = 'אוחד בהצלחה. שום תשובה קיימת לא נמחקה. טוענים מחדש…';
      setTimeout(()=>location.reload(), 700);
    }catch(e){
      if(msgEl) msgEl.textContent = 'הקובץ לא נראה כמו גיבוי תקין של הקאמבק. נסו לייצא שוב מהמכשיר המקורי.';
    }
  };
  reader.readAsText(file);
}

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
});
document.addEventListener('change', e=>{
  if(e.target && e.target.id === 'importfile' && e.target.files && e.target.files[0]){
    importData(e.target.files[0], document.getElementById('syncmsg'));
  }
});
})();
