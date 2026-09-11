/* ============================================================
   הקאמבק · המנוע
   ------------------------------------------------------------
   לא לערוך את הקובץ הזה. כל התוכן נמצא ב-content-01.js … content-05.js
   ובקבצי ה-HTML של התחנות.

   המנוע סורק את ה-HTML ומחפש רכיבים עם data-widget,
   ומייצר אותם לפי מה שמוגדר בקובץ התוכן של אותה תחנה.
   ============================================================ */

(function(){
'use strict';

const COUPLE_KEY   = 'comeback.couple';
const PROGRESS_KEY = 'comeback.progress';
const STATION_KEY  = () => 'comeback.st' + (window.STATION ? STATION.num : '00');

/* ---------- state ---------- */
let C = {p:[{name:'',g:'f'},{name:'',g:'m'}]};   // עמודה 0 = היא · עמודה 1 = הוא
let A = {};                                      // התשובות של התחנה הנוכחית

function load(){
  try{ const r = localStorage.getItem(COUPLE_KEY); if(r) C = JSON.parse(r); }catch(e){}
  C.p[0].g = 'f'; C.p[1].g = 'm';   // קבוע. העמודה הראשונה שלה, השנייה שלו.
  try{ const r = localStorage.getItem(STATION_KEY()); if(r) A = JSON.parse(r); }catch(e){}
}
function saveCouple(){ try{ localStorage.setItem(COUPLE_KEY, JSON.stringify(C)); }catch(e){} }
function saveAnswers(){ try{ localStorage.setItem(STATION_KEY(), JSON.stringify(A)); }catch(e){} }

function progress(){
  try{ return JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}'); }catch(e){ return {}; }
}
function markProgress(){
  if(!window.STATION || !CARD.requires) return;
  const need = CARD.requires;
  const ok = (need.pair||[]).every(f => (A[f]||[])[0] && (A[f]||[])[1])
          && (need.shared||[]).every(f => A[f]);
  const p = progress(); p[STATION.num] = !!ok;
  try{ localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }catch(e){}
}

/* ---------- helpers ---------- */
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* [זכר/נקבה] לפי מי שמדברים אליו · <זכר/נקבה> לפי בן/בת הזוג · {משתנים} */
function rz(txt, i){
  if(!txt) return '';
  const me = C.p[i], you = C.p[1-i];
  let out = String(txt)
    .replace(/\[([^\[\]]*?)\/([^\[\]]*?)\]/g, (_,m,f) => me.g === 'm' ? m : f)
    .replace(/<([^<>]*?)\/([^<>]*?)>/g,      (_,m,f) => you.g === 'm' ? m : f)
    .replace(/\{שם\}/g,     me.name  || '·')
    .replace(/\{בן_זוג\}/g, you.name || '·');
  // כל שדה משותף זמין כמשתנה: {קוד} {זמן} וכו׳, לפי VARS בקובץ התוכן
  const vars = window.VARS || {};
  Object.keys(vars).forEach(k => {
    out = out.split('{'+k+'}').join(A[vars[k].field] || vars[k].fallback || '___');
  });
  return out;
}

const val  = (f,i) => (A[f]||[])[i] || '';
const list = (f,i) => ((A[f]||[])[i]) || [];
function setPair(f,i,v){ if(!Array.isArray(A[f])) A[f]=['','']; A[f][i]=v; saveAnswers(); }

/* ============================================================
   רכיבים
   ============================================================ */
const W = {};

/* בחירה יחידה, טור לכל אחד */
W.select = (el) => {
  const f = el.dataset.field, opts = window[el.dataset.options] || [];
  el.innerHTML = C.p.map((p,i)=>`
    <div>
      <div class="pname">${esc(p.name)||'·'}</div>
      <div class="opts">
        ${opts.map(o=>`<button type="button" class="opt" data-act="select" data-f="${f}" data-i="${i}" data-v="${esc(o.id)}"
           aria-pressed="${val(f,i)===o.id}">${esc(rz(o.label,i))}${o.en?`<span class="en">${esc(o.en)}</span>`:''}${
           o.sub?`<small>${esc(rz(o.sub,i))}</small>`:''}</button>`).join('')}
      </div>
    </div>`).join('');
};

/* צ׳יפים לבחירה מרובה + שדה חופשי, טור לכל אחד */
W.chips = (el) => {
  const f = el.dataset.field, opts = window[el.dataset.options] || [], label = el.dataset.label||'';
  const ph = el.dataset.ph||'ומשהו משלי…';
  el.innerHTML = C.p.map((p,i)=>`
    <div>
      ${el.dataset.noname==='1'?'':`<div class="pname">${esc(p.name)||'·'}</div>`}
      <div class="field" style="margin-bottom:0">
        <label>${esc(rz(label,i))}</label>
        <div class="chips">
          ${opts.map(c=>`<button type="button" class="chip" data-act="chip" data-f="${f}" data-i="${i}" data-v="${esc(c)}"
             aria-pressed="${list(f,i).includes(c)}">${esc(rz(c,i))}</button>`).join('')}
        </div>
        <input type="text" data-act="free" data-f="${f}_free" data-i="${i}"
          value="${esc(val(f+'_free',i))}" placeholder="${esc(rz(ph,i))}" autocomplete="off">
      </div>
    </div>`).join('');
};

/* שדה טקסט חופשי, טור לכל אחד */
W.text = (el) => {
  const f = el.dataset.field, rows = el.dataset.rows||'3';
  el.innerHTML = C.p.map((p,i)=>`
    <div>
      ${el.dataset.noname==='1'?'':`<div class="pname">${esc(p.name)||'·'}</div>`}
      <div class="field" style="margin-bottom:0">
        ${el.dataset.label?`<label class="${el.dataset.stem?'stem':''}">${esc(rz(el.dataset.label,i).replace('{שני}', C.p[1-i].name||'·'))}</label>`:''}
        ${el.dataset.hint?`<p class="tiny" style="margin-bottom:.6rem">${esc(rz(el.dataset.hint,i))}</p>`:''}
        <textarea rows="${rows}" data-act="free" data-f="${f}" data-i="${i}"
          placeholder="${esc(rz(el.dataset.ph||'',i))}">${esc(val(f,i))}</textarea>
      </div>
    </div>`).join('');
};

/* שדה טקסט שמגיע עם הצעה לפי תשובה קודמת */
W.suggest = (el) => {
  const f = el.dataset.field, bank = window[el.dataset.bank]||{}, key = el.dataset.key;
  el.innerHTML = C.p.map((p,i)=>{
    const k = val(key,i);
    const touched = (A[f+'_t']||[])[i];
    const v = touched ? val(f,i) : (k ? rz(bank[k], i) : '');
    return `<div>
      <div class="pname">${esc(p.name)||'·'}</div>
      <div class="field" style="margin-bottom:0">
        ${el.dataset.label?`<label>${esc(rz(el.dataset.label,i))}</label>`:''}
        ${k?'':'<p class="tiny">בחרו קודם תשובה בשאלה שלמעלה.</p>'}
        <textarea rows="${el.dataset.rows||'3'}" data-act="suggest" data-f="${f}" data-i="${i}"
          placeholder="${esc(rz(el.dataset.ph||'במילים שלי…',i))}">${esc(v)}</textarea>
      </div>
    </div>`;
  }).join('');
};

/* שדה טקסט אחד, משותף לשניהם */
W.stext = (el) => {
  const f = el.dataset.field;
  el.innerHTML = `<div class="shared" style="margin-inline:auto">
    <input type="text" class="${el.dataset.big==='1'?'big':''}" data-act="shared" data-f="${f}"
      value="${esc(A[f]||'')}" placeholder="${esc(el.dataset.ph||'')}" autocomplete="off"></div>`;
};

/* בחירה אחת, משותפת לשניהם */
W.schoice = (el) => {
  const f = el.dataset.field, opts = window[el.dataset.options] || [];
  el.className = 'opts durations';
  el.innerHTML = opts.map(o=>`<button type="button" class="opt" data-act="sselect" data-f="${f}" data-v="${esc(o)}"
      aria-pressed="${A[f]===o}">${esc(o)}</button>`).join('');
};

/* משפט שנבנה מהתשובות, מגדרי לכל אחד */
W.assembled = (el) => {
  const t = window[el.dataset.template] || '';
  el.className = 'assembled';
  el.innerHTML = C.p.map((p,i)=>{
    let line = esc(rz(t,i));
    Object.keys(window.VARS||{}).forEach(k=>{
      const v = A[VARS[k].field] || VARS[k].fallback; if(!v) return;
      line = line.split(esc(v)).join(`<mark>${esc(v)}</mark>`);
    });
    return `<div class="fl"><span class="who">${esc(p.name)||'·'}</span>״${line}״</div>`;
  }).join('');
};


/* ============================================================
   ויזואליזציות · תמונה אחת של הדפוס בסוף כל תחנה
   ============================================================ */
function visHint(v, msg){
  return `<figure class="vis empty">
    <figcaption>${esc(v.title)}</figcaption>
    <p class="hint">${esc(msg)}</p>
    <button type="button" class="cbtn" data-field-go="${esc(v.field)}">לשאלה החסרה ←</button>
  </figure>`;
}

function visMatrix(v){
  const opts = window[v.options] || [];
  if(!(val(v.field,0) && val(v.field,1)))
    return visHint(v, 'מפת הדפוס תיבנה כאן ברגע ששניכם תבחרו את דפוס ההישרדות שלכם.');
  const pins = {};
  C.p.forEach((p,i)=>{ const k = val(v.field,i); if(k){ (pins[k] = pins[k] || []).push(p.name || '·'); } });
  const cell = id => {
    const o = opts.find(o=>o.id===id) || {};
    const mine = (pins[id]||[]).map(n=>`<em>${esc(n)}</em>`).join('');
    return `<div class="qd${mine?' on':''}">
      <span class="en">${esc(o.en||'')}</span><b>${esc(rz(o.label||'',0))}</b>
      <div class="pins">${mine}</div></div>`;
  };
  const a = val(v.field,0), b = val(v.field,1);
  let combo = '';
  if(a && b){
    const key = [a,b].sort().join('|');
    const c = (window[v.combos]||{})[key];
    if(c) combo = `<p class="combo"><b>${esc(c.name)}</b> ${esc(c.line)}</p>`;
  }
  return `<figure class="vis">
    <figcaption>${esc(v.title)}</figcaption>
    <div class="mx">
      <div class="ax t">${esc(v.axes[0])}</div>
      <div class="ax r">${esc(v.axes[2])}</div>
      <div class="grid">${cell(v.cells[0])}${cell(v.cells[1])}${cell(v.cells[3])}${cell(v.cells[2])}</div>
      <div class="ax l">${esc(v.axes[3])}</div>
      <div class="ax b">${esc(v.axes[1])}</div>
    </div>${combo}</figure>`;
}

function visLadder(v){
  const opts = window[v.options] || [];
  if(!(val(v.field,0) && val(v.field,1)))
    return visHint(v, 'מד הריחוק ייבנה כאן ברגע ששניכם תסמנו איפה אתם נתקעים בסולם.');
  const idx = i => opts.findIndex(o => o.id === val(v.field,i));
  const i0 = idx(0), i1 = idx(1);
  const rows = opts.map((o,k)=>{
    const who = C.p.map((p,i)=> (idx(i)===k ? `<em>${esc(p.name||'·')}</em>` : '')).join('');
    return `<li class="${who?'on':''}"><span class="n">${String(k+1).padStart(2,'0')}</span>
      <span class="lbl">${esc(rz(o.label||'',0))}</span><span class="pins">${who}</span></li>`;
  }).join('');
  let combo = '';
  if(i0 > -1 && i1 > -1){
    const gap = Math.abs(i0 - i1);
    combo = gap === 0
      ? '<p class="combo"><b>אתם באותו שלב.</b> זה אומר שאתם נתקעים יחד, ושהצעד הבא הוא משותף.</p>'
      : `<p class="combo"><b>${gap===1?'אתם שלב אחד זה מזה.':'אתם '+gap+' שלבים זה מזה.'}</b> ` +
        'מי שנמצא גבוה יותר צריך לרדת אל השלב של השני, ולא להפך. ההתקרבות תמיד מתחילה מהמקום האיטי יותר.</p>';
  }
  return `<figure class="vis"><figcaption>${esc(v.title)}</figcaption>
    <ol class="ladderv">${rows}</ol>${combo}</figure>`;
}

function visScale(v){
  const opts = window[v.options] || [];
  const cur = A[v.field];
  if(!cur) return visHint(v, 'המד ייבנה כאן ברגע שתסכימו על התשובה יחד.');
  const k = opts.indexOf(cur);
  const steps = opts.map((o,i)=>
    `<div class="st${i===k?' on':''}${(k>-1&&i<k)?' pre':''}"><i></i><span>${esc(o)}</span></div>`).join('');
  const note = (k > -1 && v.notes && v.notes[k]) ? `<p class="combo">${esc(v.notes[k])}</p>` : '';
  return `<figure class="vis"><figcaption>${esc(v.title)}</figcaption>
    <div class="scale">${steps}</div>${note}</figure>`;
}

function buildVisual(){
  const v = (window.CARD||{}).visual; if(!v) return '';
  if(v.kind === 'matrix') return visMatrix(v);
  if(v.kind === 'ladder') return visLadder(v);
  if(v.kind === 'scale')  return visScale(v);
  return '';
}

/* ============================================================
   הכרטיס
   ============================================================ */
function buildCard(){
  const el = document.getElementById('card'); if(!el) return;
  const badgeOpts = CARD.badge ? (window[CARD.badge.options]||[]) : [];

  const people = C.p.map((p,i)=>{
    const you = C.p[1-i];
    let badge = '';
    if(CARD.badge){
      const o = badgeOpts.find(o=>o.id===val(CARD.badge.field,i));
      if(o) badge = (o.en?o.en+' · ':'') + rz(o.label||'', i);
    }
    const blocks = (CARD.blocks||[]).map(b=>{
      if(b.type==='bank'){
        const k = val(b.key,i); return k ? `<p>${esc(rz(window[b.bank][k], i))}</p>` : '';
      }
      if(b.type==='bankPartner'){
        const k = val(b.key,1-i); return k ? `<p>${esc(rz(window[b.bank][k], i))}</p>` : '';
      }
      if(b.type==='do'){
        const k = val(b.key,i); if(!k) return '';
        return `<div class="do"><strong>${esc(rz(b.label,i))}</strong>${esc(rz(window[b.bank][k], i))}</div>`;
      }
      if(b.type==='note'){
        const v = val(b.field,i); if(!v) return '';
        return `<p class="early-p"><strong>${esc(rz(b.label,i))}</strong>${esc(v)}</p>`;
      }
      if(b.type==='notePartner'){
        const v = val(b.field,i); if(!v) return '';
        return `<p class="early-p"><strong>${esc(rz(b.label,i))} ${esc(you.name||'·')}</strong>${esc(v)}</p>`;
      }
      if(b.type==='chips'){
        const sel = list(b.field,i).map(c=>rz(c,i));
        const free = val(b.field+'_free',i); if(free) sel.push(free);
        if(!sel.length) return '';
        return `<p class="early-p"><strong>${esc(rz(b.label,i))}</strong>${esc(sel.join(' · '))}</p>`;
      }
      if(b.type==='quote'){
        const touched = (A[b.field+'_t']||[])[i];
        const k = b.key ? val(b.key,i) : null;
        const v = touched ? val(b.field,i) : (k && window[b.bank] ? rz(window[b.bank][k],i) : val(b.field,i));
        return v ? `<p class="says">״${esc(v)}״</p>` : '';
      }
      if(b.type==='plain'){
        const t = window[b.template]; if(!t) return '';
        return `<p class="fullline-p">${b.quote?'״':''}${esc(rz(t,i))}${b.quote?'״':''}</p>`;
      }
      return '';
    }).join('');

    return `<div class="person">
      <div class="hd"><b>${esc(p.name)||'·'}</b>${badge?`<span>${esc(badge)}</span>`:''}</div>
      ${blocks}
    </div>`;
  }).join('');

  let agr = '';
  if(CARD.agreement){
    const rows = (CARD.agreement.rows||[]).map(r=>
      `<div class="row"><span>${esc(r.label)}</span><b>${esc(A[r.field]||'·')}</b></div>`).join('');
    agr = `<div class="agreement"><h4>${esc(CARD.agreement.title)}</h4>${rows}
      ${CARD.agreement.note?`<p class="full">${CARD.agreement.note}</p>`:''}</div>`;
  }

  el.innerHTML = `<div class="cardhead"><b>${esc(CARD.title)}</b>
      <span>${esc(C.p[0].name||'')}${C.p[1].name?' & '+esc(C.p[1].name):''}</span></div>
    ${buildVisual()}${people}${agr}`;
  markProgress();
}


/* ============================================================
   פרקים · גלילה רציפה, עם מד התקדמות שמראה איפה אתם
   ============================================================ */
let CHAPTERS = [], chapIdx = -1;

function chapTitle(sec){
  if(sec.id === 'cardsec') return 'הכרטיס שלכם';
  const eb = sec.querySelector('.eyebrow');
  let t = eb ? eb.textContent.trim().replace(/^\d+\s*·\s*/, '') : '';
  if(!t || /^שאלה|^הסכמה/.test(t)){
    const hd = sec.querySelector('h2, h3');
    if(hd) t = hd.textContent.trim().replace(/\s+/g,' ');
  }
  return t || 'פרק';
}

function setActiveChapter(k){
  if(k === chapIdx) return;
  chapIdx = k;
  const bar = document.getElementById('chapbar'); if(!bar) return;
  bar.querySelector('.t').textContent = CHAPTERS[k].dataset.title;
  bar.querySelector('.c').textContent = `פרק ${k+1} מתוך ${CHAPTERS.length}`;
  bar.querySelectorAll('.seg').forEach((sg,i)=>{
    sg.classList.toggle('done', i < k);
    sg.classList.toggle('now', i === k);
  });
}

function goChapter(k){
  if(!CHAPTERS.length) return;
  k = Math.max(0, Math.min(CHAPTERS.length-1, k));
  const bar = document.getElementById('chapbar');
  const bh = bar ? bar.offsetHeight : 0;
  const y = CHAPTERS[k].getBoundingClientRect().top + scrollY - bh - 10;
  setActiveChapter(k);
  scrollTo({top: Math.max(0, y), behavior: 'smooth'});
}

function chapterize(){
  const gate = document.getElementById('gate'); if(!gate) return false;
  const secs = [...gate.children].filter(el => el.tagName === 'SECTION');
  if(secs.length < 4) return false;

  const isQ = el => !!el.querySelector('.q');
  const groups = []; let cur = [];
  secs.forEach((el, i) => {
    if(el.id === 'cardsec'){ if(cur.length) groups.push(cur); groups.push([el]); cur = []; return; }
    cur.push(el);
    const nxt = secs[i+1];
    if(isQ(el) && (!nxt || !isQ(nxt) || nxt.id === 'cardsec')){ groups.push(cur); cur = []; }
  });
  if(cur.length) groups.push(cur);
  if(groups.length < 3) return false;

  const bar = document.createElement('div');
  bar.id = 'chapbar';
  bar.innerHTML = `<div class="segs"></div>
    <div class="meta"><b class="t"></b><span class="c"></span></div>`;
  const rail = document.getElementById('rail');
  document.body.insertBefore(bar, rail ? rail.nextSibling : document.body.firstChild);

  groups.forEach(g => {
    const wrap = document.createElement('div');
    wrap.className = 'chapter';
    wrap.dataset.title = chapTitle(g[0]);
    g.forEach(sec => wrap.appendChild(sec));
    gate.appendChild(wrap);
  });

  CHAPTERS = [...gate.querySelectorAll('.chapter')];
  bar.querySelector('.segs').innerHTML = CHAPTERS.map((c,k)=>
    `<button type="button" class="seg" data-go="${k}" title="${esc(c.dataset.title)}"><i></i></button>`).join('');

  const sync = () => {
    const bh = bar.offsetHeight;
    let k = 0;
    CHAPTERS.forEach((c,i)=>{ if(c.getBoundingClientRect().top - bh - 40 <= 0) k = i; });
    setActiveChapter(k);
  };
  addEventListener('scroll', sync, {passive:true});
  addEventListener('resize', sync, {passive:true});
  setActiveChapter(0);
  setTimeout(sync, 60);
  return true;
}

/* ============================================================
   שמות
   ============================================================ */
function renderNames(){
  const el = document.getElementById('names'); if(!el) return;
  el.innerHTML = C.p.map((p,i)=>`
    <div>
      <div class="field" style="margin-bottom:0">
        <label>${i===0?'היא':'הוא'}</label>
        <input type="text" data-act="name" data-i="${i}" value="${esc(p.name)}"
          placeholder="${i===0?'השם שלה':'השם שלו'}" autocomplete="off">
      </div>
    </div>`).join('');
}

/* ============================================================
   רינדור כללי
   ============================================================ */
function renderAssembled(){
  document.querySelectorAll('[data-widget="assembled"]').forEach(el=>W.assembled(el));
}
function renderWidgets(){
  document.querySelectorAll('[data-widget]').forEach(el=>{
    const fn = W[el.dataset.widget]; if(fn) fn(el);
  });
}
function updateGate(){
  const g = document.getElementById('gate'); if(!g) return;
  g.classList.toggle('locked', !(C.p[0].name.trim() && C.p[1].name.trim()));
}
function renderAll(){ renderWidgets(); buildCard(); updateGate(); }

/* ============================================================
   אירועים
   ============================================================ */
document.addEventListener('input', e=>{
  const d = e.target.dataset, v = e.target.value;
  if(d.act==='name'){ C.p[+d.i].name = v; saveCouple();
    document.querySelectorAll('.pname').forEach((el,k)=>{ el.textContent = C.p[k%2].name || '·'; });
    buildCard(); updateGate(); return; }
  if(d.act==='free'){ setPair(d.f, +d.i, v); buildCard(); return; }
  if(d.act==='suggest'){ setPair(d.f, +d.i, v);
    if(!Array.isArray(A[d.f+'_t'])) A[d.f+'_t']=[false,false];
    A[d.f+'_t'][+d.i]=true; saveAnswers(); buildCard(); return; }
  if(d.act==='shared'){ A[d.f]=v; saveAnswers(); renderAssembled(); buildCard(); return; }
});

document.addEventListener('change', e=>{
  if(e.target.dataset.act==='name'){ renderWidgets(); buildCard(); }
});

document.addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  const d = b.dataset;
  if(d.act==='select'){
    setPair(d.f, +d.i, val(d.f,+d.i)===d.v ? '' : d.v);
    renderWidgets(); buildCard(); return; }
  if(d.act==='chip'){
    if(!Array.isArray(A[d.f])) A[d.f]=[[],[]];
    if(!Array.isArray(A[d.f][+d.i])) A[d.f][+d.i]=[];
    const arr = A[d.f][+d.i], k = arr.indexOf(d.v);
    k>-1 ? arr.splice(k,1) : arr.push(d.v);
    saveAnswers(); b.setAttribute('aria-pressed', k===-1); buildCard(); return; }
  if(d.act==='sselect'){ A[d.f] = (A[d.f]===d.v ? '' : d.v); saveAnswers();
    const host = b.closest('[data-widget="schoice"]'); if(host) W.schoice(host);
    renderAssembled(); buildCard(); return; }
  if(d.fieldGo){
    const el = document.querySelector('[data-field="'+d.fieldGo+'"]');
    const ch = el && el.closest('.chapter');
    if(ch && CHAPTERS.length) goChapter(CHAPTERS.indexOf(ch));
    return; }
  if(d.go !== undefined){ goChapter(+d.go); return; }
  if(b.id==='resetbtn'){
    if(confirm('למחוק את התשובות של התחנה הזאת ולהתחיל אותה מחדש?')){
      localStorage.removeItem(STATION_KEY()); location.reload(); } }
});

/* ============================================================
   התקדמות, גלילה, הפעלה
   ============================================================ */
function boot(){
  load();
  renderNames();
  renderAll();

  document.querySelectorAll('a.station').forEach(a=>{
    const n = a.dataset.num; if(!n) return;
    const done = progress()[n];
    a.classList.toggle('done', !!done);
    const st = a.querySelector('.st'); if(st) st.textContent = done ? 'הושלמה' : '';
  });

  const hasChapters = chapterize();

  const io = new IntersectionObserver(es=>es.forEach(en=>{
    if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }}),
    {rootMargin:'0px 0px -12% 0px'});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));

  const rail = document.querySelector('#rail i');
  if(rail) addEventListener('scroll', ()=>{
    const h = document.documentElement.scrollHeight - innerHeight;
    rail.style.width = (h>0 ? (scrollY/h)*100 : 0) + '%';
  }, {passive:true});
}

window.Comeback = {rz, esc, get couple(){return C;}, get answers(){return A;}, progress};
document.readyState==='loading' ? addEventListener('DOMContentLoaded', boot) : boot();
})();
