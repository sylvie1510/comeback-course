/* ============================================================
   מפת הדרך חזרה · מרכיבה את חמש ההסכמות לעמוד אחד
   ============================================================ */
(function(){
'use strict';
const get = k => { try{ return JSON.parse(localStorage.getItem(k)||'{}'); }catch(e){ return {}; } };
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const START = { he:'למה אנחנו כאן', field:'goal', line:'חשוב לי ללמוד לתקן, כדי שהזוגיות שלנו תרגיש יותר…' };

const ROWS = [
  {num:'01', en:'STOP',      he:'לעצור',
   line:'אני יודע/ת מתי לעצור, לפני שאנחנו עושים עוד נזק.',
   items:[{label:'מילת הקוד', field:'code'},{label:'אורך ההפסקה', field:'duration'},{label:'מי מחזיר לשיחה', field:'whoreturns'}]},
  {num:'02', en:'SPACE',     he:'הזמן שאחרי',
   line:'אני יודע/ת להירגע בזמן הזה, במקום להמשיך את הריב בראש.',
   items:[{label:'מה אנחנו לא עושים', field:'notdoing'}]},
  {num:'03', en:'RETURN',    he:'מי בא ראשון',
   line:'אני יודע/ת לשלוח יד, ולזהות כשמושיטים לי אחת.',
   items:[{label:'מי יוזם אצלנו', field:'initiator'}]},
  {num:'04', en:'REPAIR',    he:'שיחת התיקון',
   line:'אני יודע/ת לעבור לסקרנות, לקחת אחריות ולדבר את הצרכים שלי.',
   items:[{label:'כשהשיחה מתפוצצת', field:'blowup'}]},
  {num:'05', en:'RECONNECT', he:'לחזור אחד לשנייה',
   line:'אני יודע/ת איך לחזור אלייך, גם אם לא פתרנו הכול.',
   items:[{label:'הסימן שלנו', field:'sign'},{label:'המשפט שסוגר', field:'closure'}]},
];

function render(){
  const el = document.getElementById('map'); if(!el) return;
  const couple = get('comeback.couple');
  const names = (couple.p||[]).map(p=>p.name).filter(Boolean).join(' & ');
  let any = false;

  const body = ROWS.map(r=>{
    const A = get('comeback.st'+r.num);
    const items = r.items.map(it=>{
      const v = A[it.field];
      if(v) any = true;
      return `<div class="row"><span>${esc(it.label)}</span><b>${esc(v||'·')}</b></div>`;
    }).join('');
    return `<div class="person">
      <div class="hd"><b>${esc(r.he)}</b><span>${r.num} · ${r.en}</span></div>
      <p>${esc(r.line)}</p>
      ${items}
    </div>`;
  }).join('');

  const S0 = get('comeback.st00');
  const goals = (S0[START.field] || ['','']);
  const startItems = (couple.p||[]).map((p,i)=>{
    const v = goals[i]; if(v) any = true;
    return `<div class="row"><span>${esc(p.name||'·')}</span><b>${esc(v||'·')}</b></div>`;
  }).join('');
  const startBlock = `<div class="person"><div class="hd"><b>${esc(START.he)}</b><span>00</span></div>
    <p>${esc(START.line)}</p>${startItems}</div>`;

  el.innerHTML = `<div class="cardhead"><b>הדרך חזרה שלנו</b><span>${esc(names)}</span></div>
    ${startBlock}${body}
    <div class="agreement">
      <p class="full">זוגיות בריאה היא לא זוגיות שלא רבים בה.<br>
      זוגיות בריאה היא זוגיות ששני אנשים יודעים איך לתקן, ולחזור לחיבור מחודש.</p>
    </div>`;

  const hint = document.getElementById('maphint');
  if(hint) hint.textContent = any ? '' : 'המפה תתמלא מעצמה ככל שתעברו את התחנות.';
}

/* ---------- תזכורת ליומן, שבוע קדימה ---------- */
function pad(n){ return String(n).padStart(2,'0'); }
function icsDate(d){
  return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(d.getHours())+pad(d.getMinutes())+'00';
}
function addReminder(){
  const couple = get('comeback.couple');
  const names = (couple.p||[]).map(p=>p.name).filter(Boolean).join(' ו');
  const code = (get('comeback.st01')||{}).code || '';
  const start = new Date(); start.setDate(start.getDate()+7); start.setHours(20,0,0,0);
  const end = new Date(start.getTime()+15*60000);
  const desc = 'בדיקה קצרה (שלוש פעמים, פעם בשבוע): עברנו את הקאמבק.'
    + (code ? ' השתמשנו במילת הקוד ״'+code+'״ בפועל?' : ' זכרנו להשתמש במה שהסכמנו עליו?')
    + ' חמש דקות שיחה - מה עבד, מה לא, ומה כדאי לרענן.';
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//הקאמבק//תזכורת//HE','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:'+Date.now()+'@comeback-course',
    'DTSTAMP:'+icsDate(new Date()),
    'DTSTART:'+icsDate(start),
    'DTEND:'+icsDate(end),
    'SUMMARY:בדיקת קאמבק' + (names?' - '+names:''),
    'DESCRIPTION:'+desc.replace(/,/g,'\\,'),
    'RRULE:FREQ=WEEKLY;COUNT=3',
    'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'תזכורת-קאמבק.ics';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
document.addEventListener('click', e=>{
  if(e.target && e.target.id === 'remindbtn') addReminder();
});

document.readyState==='loading' ? addEventListener('DOMContentLoaded', render) : render();
})();
