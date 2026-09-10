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
   items:[{label:'מילת הקוד', field:'code'},{label:'אורך ההפסקה', field:'duration'}]},
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

  const sec = document.getElementById('cardsec');
  const teaser = document.getElementById('mapteaser');
  if(!any){
    if(sec) sec.hidden = true;
    if(teaser) teaser.hidden = false;
  }else{
    if(sec) sec.hidden = false;
    if(teaser) teaser.hidden = true;
  }
}
document.readyState==='loading' ? addEventListener('DOMContentLoaded', render) : render();
})();
