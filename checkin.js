/* ============================================================
   הקאמבק · בדיקה שבועית
   ארבע דקות, שתי שאלות. נשמר אצלכם במכשיר בלבד.
   ============================================================ */
(function(){
'use strict';

const KEY = 'comeback.checkins';

const STATIONS = [
  { id:'01', en:'STOP',      he:'לעצור',          sub:'עצרנו בזמן, לפני ההסלמה' },
  { id:'02', en:'SPACE',     he:'מרחב',           sub:'לא הזנו את הריב בראש' },
  { id:'03', en:'RETURN',    he:'חזרה',           sub:'מישהו הושיט יד, והשני נענה' },
  { id:'04', en:'REPAIR',    he:'תיקון',          sub:'לקחנו אחריות וביקשנו אחרת' },
  { id:'05', en:'RECONNECT', he:'חיבור מחדש',     sub:'חזרנו גם בגוף, לא רק בדיבור' },
  { id:'no', en:'',          he:'לא הצלחנו השבוע', sub:'וגם זה מידע. לא נורא.' },
];

const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const get = k => { try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } };

function list(){ const v = get(KEY); return Array.isArray(v) ? v : []; }
function save(arr){ try{ localStorage.setItem(KEY, JSON.stringify(arr)); }catch(e){} }

let picked = '';

function fmt(iso){
  try{
    return new Date(iso).toLocaleDateString('he-IL', {day:'numeric', month:'long'});
  }catch(e){ return iso.slice(0,10); }
}

function renderForm(){
  const el = document.getElementById('cform'); if(!el) return;
  el.innerHTML = `
    <div class="field">
      <label>באיזו תחנה הצלחנו לתפוס את עצמנו השבוע?</label>
      <div class="opts">
        ${STATIONS.map(s=>`<button type="button" class="opt" data-pick="${s.id}" aria-pressed="${picked===s.id}">
          ${esc(s.he)}${s.en?`<span class="en">${s.en}</span>`:''}<small>${esc(s.sub)}</small></button>`).join('')}
      </div>
    </div>
    <div class="field">
      <label>ומה המחווה הקטנה שחיברה בינינו מחדש?</label>
      <textarea id="cgesture" rows="3" placeholder="קפה שהוא הכין · יד על הכתף · בדיחה בזמן הנכון…"></textarea>
    </div>
    <div class="btnrow" style="margin-top:1.2rem">
      <button type="button" class="cbtn solid" id="csave">לשמור את הבדיקה</button>
    </div>
    <p class="tiny" id="cmsg" style="margin-top:.7rem"></p>`;
}

function renderHistory(){
  const el = document.getElementById('chistory'); if(!el) return;
  const items = list();
  const head = document.getElementById('chead');

  if(!items.length){
    el.innerHTML = '';
    if(head) head.textContent = 'זו תהיה הבדיקה הראשונה שלכם.';
    return;
  }

  const counts = {};
  items.forEach(it => { if(it.station && it.station!=='no') counts[it.station] = (counts[it.station]||0)+1; });
  const best = Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
  const bestName = best ? (STATIONS.find(s=>s.id===best)||{}).he : '';

  if(head){
    head.innerHTML = `<b>${items.length}</b> בדיקות עד עכשיו` +
      (bestName ? ` · התחנה שהכי עובדת אצלכם היא <b>${esc(bestName)}</b>` : '');
  }

  el.innerHTML = items.map(it=>{
    const s = STATIONS.find(x=>x.id===it.station) || {};
    return `<div class="cirow${it.station==='no'?' none':''}">
      <div class="citop">
        <b>${esc(s.he||'—')}</b>
        <span>${esc(fmt(it.date))}</span>
      </div>
      ${it.gesture?`<p>${esc(it.gesture)}</p>`:''}
      <button type="button" class="cidel" data-del="${esc(it.date)}" aria-label="למחוק">×</button>
    </div>`;
  }).join('');
}

function doSave(){
  const msg = document.getElementById('cmsg');
  const g = (document.getElementById('cgesture')||{}).value || '';
  if(!picked){
    if(msg) msg.textContent = 'בחרו תחנה קודם. גם ״לא הצלחנו השבוע״ זו תשובה.';
    return;
  }
  const arr = list();
  arr.unshift({ date: new Date().toISOString(), station: picked, gesture: g.trim() });
  save(arr.slice(0, 60));
  picked = '';
  renderForm();
  renderHistory();
  const m2 = document.getElementById('cmsg');
  if(m2) m2.textContent = 'נשמר. נתראה בשבוע הבא.';
  try{ localStorage.setItem('comeback.checkinSeenAt', String(Date.now())); }catch(e){}
}

document.addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  if(b.dataset.pick !== undefined){
    picked = (picked === b.dataset.pick) ? '' : b.dataset.pick;
    const keep = (document.getElementById('cgesture')||{}).value || '';
    renderForm();
    const t = document.getElementById('cgesture'); if(t) t.value = keep;
    return;
  }
  if(b.id === 'csave'){ doSave(); return; }
  if(b.dataset.del !== undefined){
    if(!confirm('למחוק את הבדיקה הזאת?')) return;
    save(list().filter(x=>x.date !== b.dataset.del));
    renderHistory();
  }
});

function boot(){
  const names = ((get('comeback.couple')||{}).p||[]).map(p=>p.name).filter(Boolean).join(' & ');
  const who = document.getElementById('cwho');
  if(who) who.textContent = names;
  renderForm();
  renderHistory();
}
document.readyState==='loading' ? addEventListener('DOMContentLoaded', boot) : boot();
})();
