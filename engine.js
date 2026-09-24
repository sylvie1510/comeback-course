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
function touch(){ try{ localStorage.setItem('comeback.lastAt', String(Date.now())); }catch(e){} }
function saveCouple(){ try{ localStorage.setItem(COUPLE_KEY, JSON.stringify(C)); touch(); }catch(e){} }
function saveAnswers(){ try{ localStorage.setItem(STATION_KEY(), JSON.stringify(A)); touch(); }catch(e){} }

function progress(){
  try{ return JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}'); }catch(e){ return {}; }
}
function markProgress(){
  if(!window.STATION || !CARD.requires) return;
  const need = CARD.requires;
  const ok = (need.pair||[]).every(f => IDX().every(i => keys(f,i).length))
          && (need.shared||[]).every(f => A[f]);
  const p = progress(); p[STATION.num] = !!ok;
  try{ localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }catch(e){}
}

/* ---------- helpers ---------- */
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ============================================================
   זיכרון בין תחנות
   {01.code}  = תשובה משותפת או שלי מתחנה 01
   {01.mode!} = התשובה של בן/בת הזוג
   ============================================================ */
function stAns(num){
  if(window.STATION && num === STATION.num) return A;
  try{ return JSON.parse(localStorage.getItem('comeback.st'+num) || '{}'); }catch(e){ return {}; }
}

/* תוויות לשדות בחירה, כדי שאפשר יהיה לצטט אותם מתחנה אחרת */
var XLABELS = {
  mode:       {fight:'תוקפנות', flight:'בריחה', freeze:'קיפאון', fawn:'ריצוי'},
  interp:     {abandon:'נטישה', silence:'סתימת פיות', steamroll:'דורסנות', punish:'עונש', relief:'הקלה'},
  distortion: {mindread:'קריאת מחשבות', future:'ניבוי עתידות', assume:'הנחת הנחות',
               general:'הכללה', intent:'ייחוס כוונות', allnone:'הכל או כלום'},
  belief:     {right:'שאם תבואי, ייצא שהוא צדק', admit:'שלהשלים זה להודות שטעית',
               blame:'שלהתנצל זה לקחת את כל האשמה', hurt:'שלהתקרב זה לוותר על מה שכאב'},
  pace:       {fast:'מתעצבן ונרגע מהר', slow:'לוקח זמן להתעצבן ולהירגע'},
  righteous:  {notsaid:'״זה לא מה שאמרתי״', nothappened:'״זה לא מה שהיה״',
               context:'״אתה מוציא את זה מהקשר״', meant:'״לא לזה התכוונתי״', youtoo:'״אבל גם אתה״'},
  half:       {attack:'הדרך שבה דיברתי', shut:'הדרך שבה נסגרתי', listen:'הדרך שבה הקשבתי',
               assume:'הדרך שבה פירשתי', trigger:'הדרך שבה הגבתי'},
  rung:       {room:'להיות באותו חדר', touch:'מגע קצר', humor:'משהו מצחיק',
               talk:'שיחה על משהו אחר', close:'קרבה'},
};

function xval(num, field, i){
  const A2 = stAns(num);
  const v = A2[field];
  const raw = Array.isArray(v) ? v[i] : v;
  const one = Array.isArray(raw) ? raw[0] : raw;
  if(!one) return '';
  const map = XLABELS[field];
  return (map && map[one]) ? map[one] : String(one);
}

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
  out = out.replace(/\{(\d\d)\.(\w+)(!?)\}/g,
    (_, num, f, bang) => xval(num, f, bang ? 1 - i : i));
  const vars = window.VARS || {};
  Object.keys(vars).forEach(k => {
    out = out.split('{'+k+'}').join(A[vars[k].field] || vars[k].fallback || '___');
  });
  return out;
}

const val  = (f,i) => (A[f]||[])[i] || '';
const me_v = (i,m,f2) => (C.p[i].g === 'm' ? m : f2);
const list = (f,i) => ((A[f]||[])[i]) || [];
/* ---------- מצב: ביחד או לבד ---------- */
function tx(o,k){ if(!o) return ''; const sk='solo'+k[0].toUpperCase()+k.slice(1);
  return (C.solo && o[sk]) ? o[sk] : (o[k]||''); }
function IDX(){ return C.solo ? [C.me === 1 ? 1 : 0] : [0,1]; }
function PP(){ return IDX().map(i => [C.p[i], i]); }
function DUO(){ return IDX().length === 2; }

function keys(f,i){ const v = val(f,i); return Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []); }
function setPair(f,i,v){ if(!Array.isArray(A[f])) A[f]=['','']; A[f][i]=v; saveAnswers(); }

/* ============================================================
   רכיבים
   ============================================================ */
const W = {};

/* בחירה מרובה, טור לכל אחד */
W.multi = (el) => {
  el.classList.add('pair2');
  const f = el.dataset.field, opts = window[el.dataset.options] || [];
  el.innerHTML = PP().map(([p,i])=>`
    <div>
      <div class="pname">${esc(p.name)||'·'}</div>
      <div class="opts multi">
        ${opts.map(o=>`<button type="button" class="opt" data-act="mselect" data-f="${f}" data-i="${i}" data-v="${esc(o.id)}"
           aria-pressed="${keys(f,i).includes(o.id)}">${esc(rz(o.label,i))}${
           o.sub?`<small>${esc(rz(o.sub,i))}</small>`:''}</button>`).join('')}
      </div>
    </div>`).join('');
};

/* בחירה יחידה, טור לכל אחד */
W.select = (el) => {
  el.classList.add('pair2');
  const f = el.dataset.field, opts = window[el.dataset.options] || [];
  el.innerHTML = PP().map(([p,i])=>`
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
  el.classList.add('pair2');
  const f = el.dataset.field, opts = window[el.dataset.options] || [], label = el.dataset.label||'';
  const ph = el.dataset.ph||'ומשהו משלי…';
  el.innerHTML = PP().map(([p,i])=>`
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
  el.innerHTML = PP().map(([p,i])=>`
    <div>
      ${el.dataset.noname==='1'?'':`<div class="pname">${esc(p.name)||'·'}</div>`}
      <div class="field" style="margin-bottom:0">
        ${el.dataset.label?`<label class="${el.dataset.stem?'stem':''}">${esc(rz(el.dataset.label,i).replace('{שני}', C.p[1-i].name||'·'))}</label>`:''}
        ${el.dataset.hint?`<p class="tiny" style="margin-bottom:.6rem">${esc(rz(el.dataset.hint,i))}</p>`:''}
        ${el.dataset.picks?`<div class="picks">${(window[el.dataset.picks]||[]).map(t=>{
          const v = rz(t,i);
          return `<button type="button" class="pick" data-act="pick" data-f="${f}" data-i="${i}"
            data-v="${esc(v)}" aria-pressed="${val(f,i)===v}">${esc(v)}</button>`;}).join('')}</div>`:''}
        <textarea rows="${rows}" data-act="free" data-f="${f}" data-i="${i}"
          placeholder="${esc(rz(el.dataset.ph||'',i))}">${esc(val(f,i))}</textarea>
      </div>
    </div>`).join('');
};

/* שדה טקסט שמגיע עם הצעה לפי תשובה קודמת */
W.suggest = (el) => {
  const f = el.dataset.field, bank = window[el.dataset.bank]||{}, key = el.dataset.key;
  const opts = window[el.dataset.options] || [];
  el.innerHTML = PP().map(([p,i])=>{
    const k = val(key,i);
    const touched = (A[f+'_t']||[])[i];
    const v = touched ? val(f,i) : (k ? rz(bank[k], i) : '');
    const o = opts.find(o => o.id === k);
    const tpl = el.dataset.basis || 'בחרת ב{}';
    const basis = k
      ? `<p class="basis">${tpl.replace('{}', '<b>'+esc(rz((o&&o.label)||'',i))+'</b>')}, ועל בסיס זה בנינו לך את ההצעה הבאה.
           ${me_v(i,'שנה','שני')} אותה למילים שלך:</p>`
      : '<p class="tiny">בחרו קודם תשובה בשאלה שלמעלה, וההצעה תיבנה כאן.</p>';
    return `<div>
      <div class="pname">${esc(p.name)||'·'}</div>
      <div class="field" style="margin-bottom:0">
        ${el.dataset.label?`<label>${esc(rz(el.dataset.label,i))}</label>`:''}
        ${basis}
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
    <label class="slabel">${el.dataset.label?esc(el.dataset.label)+' ':''}<span class="fillhint">${C.solo?'(ההצעה שלך)':'(תשלימו)'}</span></label>
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

/* סולם 1–10 · נחשף רק כששניכם סימנתם */
W.scale = (el) => {
  el.classList.add('pair2');
  const f = el.dataset.field, label = el.dataset.label || '';
  const lock = el.dataset.lock === '1' && DUO();
  const both = DUO() && val(f,0) && val(f,1);
  const show = !lock || both;
  el.innerHTML = PP().map(([p,i])=>{
    const v = val(f,i);
    const body = (show || !v)
      ? `<div class="scale">${Array.from({length:10},(_,k)=>{
           const n = String(k+1);
           return `<button type="button" class="sc${v===n?' on':''}" data-act="select"
             data-f="${f}" data-i="${i}" data-v="${n}" aria-pressed="${v===n}">${n}</button>`;
         }).join('')}</div>`
      : `<div class="scalelock">
           <b>✓ ${me_v(i,'סימנת','סימנת')}</b>
           <span>מחכים ל${esc(C.p[1-i].name||'שני')}. המספרים ייחשפו כששניכם תסמנו.</span>
           <button type="button" class="relink" data-act="select" data-f="${f}" data-i="${i}"
             data-v="${esc(v)}">לשנות</button>
         </div>`;
    return `<div>
      <div class="pname">${esc(p.name)||'·'}</div>
      <div class="field" style="margin-bottom:0">
        ${label?`<label>${esc(rz(label,i))}</label>`:''}
        ${body}
      </div></div>`;
  }).join('');
};

/* קריאת הפער בין שני המספרים */
W.gapnote = (el) => {
  const f = el.dataset.field, nf = el.dataset.need || '';
  const a = parseInt(val(f,0),10), b = parseInt(val(f,1),10);
  const bank = window[el.dataset.bank] || {};
  if(!DUO()){ el.innerHTML = `<p class="tiny">${esc(bank.solo||'')}</p>`; return; }
  if(!a || !b){
    el.innerHTML = `<p class="tiny">${esc(bank.wait||'כששניכם תסמנו מספר, תופיע כאן הקריאה של הפער.')}</p>`;
    return;
  }
  const diff = Math.abs(a-b);
  const hi = a >= b ? 0 : 1, lo = 1 - hi;
  let key;
  if(a >= 8 && b >= 8)       key = 'bothHigh';
  else if(a <= 4 && b <= 4)  key = 'bothLow';
  else if(diff >= 3)         key = 'far';
  else                       key = 'near';
  const t = bank[key] || {};
  const nm = n => esc(C.p[n].name || '·');
  const need = n => esc(nf ? (val(nf,n) || (list(nf+'_c',n)[0]||'')) : '');
  const fill = str => String(str||'')
    .split('{גבוה}').join(nm(hi)).split('{נמוך}').join(nm(lo))
    .split('{צורך_גבוה}').join(need(hi)).split('{צורך_נמוך}').join(need(lo))
    .split('{א}').join(String(a)).split('{ב}').join(String(b));
  el.className = 'gapnote';
  el.innerHTML = `<div class="gaphd"><span>${nm(0)} · ${a}</span><i></i><span>${nm(1)} · ${b}</span></div>
    <p class="gaplead">${fill(t.lead)}</p>
    ${t.do?`<p class="gapdo">${fill(t.do)}</p>`:''}`;
};

/* משפט שנבנה מהתשובות, מגדרי לכל אחד */
W.assembled = (el) => {
  const t = window[el.dataset.template] || '';
  el.className = 'assembled';
  el.innerHTML = PP().map(([p,i])=>{
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
    <figcaption>${esc(tx(v,'title'))}</figcaption>
    <p class="hint">${esc(msg)}</p>
    <button type="button" class="cbtn" data-field-go="${esc(v.field)}">לשאלה החסרה ←</button>
  </figure>`;
}

function visMatrix(v){
  const opts = window[v.options] || [];
  if(!IDX().every(i=>val(v.field,i)))
    return visHint(v, C.solo ? rz('מפת הדפוס תיבנה כאן ברגע ש[תבחר/תבחרי] את דפוס ההישרדות שלך.', C.me===1?1:0)
                             : 'מפת הדפוס תיבנה כאן ברגע ששניכם תבחרו את דפוס ההישרדות שלכם.');
  const pins = {};
  PP().forEach(([p,i])=>{ const k = val(v.field,i); if(k){ (pins[k] = pins[k] || []).push(p.name || '·'); } });
  const cell = id => {
    const o = opts.find(o=>o.id===id) || {};
    const mine = (pins[id]||[]).map(n=>`<em>${esc(n)}</em>`).join('');
    return `<div class="qd${mine?' on':''}">
      <span class="en">${esc(o.en||'')}</span><b>${esc(rz(o.label||'',0))}</b>
      <div class="pins">${mine}</div></div>`;
  };
  const a = val(v.field,0), b = val(v.field,1);
  let combo = '';
  if(DUO() && a && b){
    const key = [a,b].sort().join('|');
    const c = (window[v.combos]||{})[key];
    if(c) combo = `<p class="combo"><b>${esc(c.name)}</b> ${esc(c.line)}</p>`;
  }
  return `<figure class="vis">
    <figcaption>${esc(tx(v,'title'))}</figcaption>
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
  if(!IDX().every(i=>val(v.field,i)))
    return visHint(v, 'מד הריחוק ייבנה כאן ברגע ששניכם תסמנו איפה אתם נתקעים בסולם.');
  const idx = i => opts.findIndex(o => o.id === val(v.field,i));
  const i0 = idx(0), i1 = idx(1);
  const rows = opts.map((o,k)=>{
    const who = PP().map(([p,i])=> (idx(i)===k ? `<em>${esc(p.name||'·')}</em>` : '')).join('');
    return `<li class="${who?'on':''}"><span class="n">${String(k+1).padStart(2,'0')}</span>
      <span class="lbl">${esc(rz(o.label||'',0))}</span><span class="pins">${who}</span></li>`;
  }).join('');
  let combo = '';
  if(DUO() && i0 > -1 && i1 > -1){
    const gap = Math.abs(i0 - i1);
    combo = gap === 0
      ? '<p class="combo"><b>אתם באותו שלב.</b> זה אומר שאתם נתקעים יחד, ושהצעד הבא הוא משותף.</p>'
      : `<p class="combo"><b>${gap===1?'אתם שלב אחד זה מזה.':'אתם '+gap+' שלבים זה מזה.'}</b> ` +
        'מי שנמצא גבוה יותר צריך לרדת אל השלב של השני, ולא להפך. ההתקרבות תמיד מתחילה מהמקום האיטי יותר.</p>';
  }
  return `<figure class="vis"><figcaption>${esc(tx(v,'title'))}</figcaption>
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
  return `<figure class="vis"><figcaption>${esc(tx(v,'title'))}</figcaption>
    <div class="scale">${steps}</div>${note}</figure>`;
}

function visMarks(v){
  const opts = window[v.options] || [];
  if(!IDX().every(i=>val(v.field,i)))
    return visHint(v, tx(v,'hint') || 'המיפוי ייבנה כאן ברגע ששניכם תענו.');
  const rows = opts.map(o=>{
    const who = PP().map(([p,i])=> (val(v.field,i)===o.id ? `<em>${esc(p.name||'·')}</em>` : '')).join('');
    return `<li class="${who?'on':''}"><span class="lbl">${esc(rz(o.label||'',0))}</span><span class="pins">${who}</span></li>`;
  }).join('');
  const note = !DUO() ? '' : (val(v.field,0) === val(v.field,1) ? (v.sameNote||'') : (v.diffNote||''));
  return `<figure class="vis"><figcaption>${esc(tx(v,'title'))}</figcaption>
    <ol class="ladderv nonum">${rows}</ol>${note?`<p class="combo">${esc(note)}</p>`:''}</figure>`;
}

function visDoors(v){
  const ok = PP().some(([p,i])=> val(v.a,i) || val(v.b,i));
  if(!ok) return visHint(v, tx(v,'hint') || 'שתי הדלתות ייבנו כאן ממה שתכתבו למעלה.');
  const cols = PP().map(([p,i])=>`
    <div class="dcol">
      <div class="who">${esc(p.name||'·')}</div>
      ${val(v.field,i)?`<p class="ev">${esc(val(v.field,i))}</p>`:''}
      <div class="door d1"><span>הדלת הראשונה</span><p>${esc(val(v.a,i)||'—')}</p><b>↓ ריחוק, או ריב נוסף</b></div>
      <div class="door d2"><span>הדלת השנייה</span><p>${esc(val(v.b,i)||'—')}</p><b>↓ פנייה מרוככת</b></div>
    </div>`).join('');
  return `<figure class="vis"><figcaption>${esc(tx(v,'title'))}</figcaption>
    <div class="doors">${cols}</div>
    <p class="combo">שתיהן אפשריות. ההבדל ביניהן הוא לא באמת, אלא במה שקורה אחריהן.</p></figure>`;
}

function buildSteps(){
  const st = (window.CARD||{}).steps; if(!st) return '';
  const bank = window[st.bank] || {};
  const any = PP().some(([p,i])=> keys(st.key,i).length);
  if(!any) return '';
  const cols = PP().map(([p,i])=>{
    const ks = keys(st.key,i);
    const lead = st.lead ? `<p>${esc(rz(window[st.lead]||'', i))}</p>` : '';
    let body;
    if(!ks.length)            body = lead || '<p>—</p>';
    else if(ks.length === 1)  body = lead + `<p>${esc(rz(bank[ks[0]], i))}</p>`;
    else                      body = lead + (st.more?`<p class="more">${esc(rz(st.more,i))}</p>`:'') +
      `<ul class="steplist">${ks.map(k=>`<li>${esc(rz(bank[k], i))}</li>`).join('')}</ul>`;
    return `<div class="step">
      <div class="who">${esc(p.name||'·')}</div>
      ${body}</div>`;
  }).join('');
  return `<div class="steps"><div class="hd">${esc(tx(st,'label')||'הצעדים שלכם')}</div>${cols}</div>`;
}

function buildVisual(){
  const v = (window.CARD||{}).visual; if(!v) return '';
  if(v.kind === 'matrix') return visMatrix(v);
  if(v.kind === 'ladder') return visLadder(v);
  if(v.kind === 'scale')  return visScale(v);
  if(v.kind === 'marks')  return visMarks(v);
  if(v.kind === 'doors')  return visDoors(v);
  return '';
}

/* ============================================================
   הכרטיס
   ============================================================ */
function buildCard(){
  const el = document.getElementById('card'); if(!el) return;
  const badgeOpts = CARD.badge ? (window[CARD.badge.options]||[]) : [];

  const people = PP().map(([p,i])=>{
    const you = C.p[1-i];
    let badge = '';
    if(CARD.badge){
      badge = keys(CARD.badge.field,i).map(id=>{
        const o = badgeOpts.find(o=>o.id===id);
        return o ? (o.en?o.en+' · ':'') + rz(o.label||'', i) : '';
      }).filter(Boolean).join(' · ');
    }
    const blocks = (CARD.blocks||[]).map(b=>{
      if(b.type==='combo'){
        const ka = keys(b.a, i)[0], kb = keys(b.b, i)[0];
        if(!ka || !kb) return '';
        const map = window[b.map] || {};
        const t = map[[ka,kb].sort().join('|')] || map[ka+'|'+kb];
        return t ? `<p>${esc(rz(t,i))}</p>` : '';
      }
      if(b.type==='comboPair'){
        if(!DUO()) return '';
        const ka = keys(b.field, i)[0], kb = keys(b.field, 1-i)[0];
        if(!ka || !kb) return '';
        const map = window[b.map] || {};
        const t = map[[ka,kb].sort().join('|')] || map[ka+'|'+kb];
        return t ? `<p>${esc(rz(t,i))}</p>` : '';
      }
      if(b.type==='bank'){
        return keys(b.key,i).map(k=>`<p>${esc(rz(window[b.bank][k], i))}</p>`).join('');
      }
      if(b.type==='bankPartner'){
        return keys(b.key,1-i).map(k=>`<p>${esc(rz(window[b.bank][k], i))}</p>`).join('');
      }
      if(b.type==='do'){
        return keys(b.key,i).map(k=>
          `<div class="do"><strong>${esc(rz(b.label,i))}</strong>${esc(rz(window[b.bank][k], i))}</div>`).join('');
      }
      if(b.type==='note'){
        const v = val(b.field,i); if(!v) return '';
        return `<p class="early-p"><strong>${esc(rz(b.label,i))}</strong>${esc(v)}</p>`;
      }
      if(b.type==='notePartner'){
        const v = val(b.field,1-i); if(!v) return '';
        const lab = rz(b.label,1-i).replace('{שני}', you.name||'·');
        return `<p class="early-p"><strong>${esc(lab)}</strong>${esc(v)}</p>`;
      }
      if(b.type==='chips'){
        const sel = list(b.field,i).map(c=>rz(c,i));
        const free = val(b.field+'_free',i); if(free) sel.push(free);
        if(!sel.length) return '';
        return `<p class="early-p"><strong>${esc(rz(b.label,i))}</strong>${esc(sel.join(' · '))}</p>`;
      }
      if(b.type==='needrate'){
        const sel = list(b.field,i).map(c=>rz(c,i));
        const free = val(b.field+'_free',i); if(free) sel.push(free);
        const r = val(b.rate,i);
        if(!sel.length && !r) return '';
        const txt = sel.join(' · ') + (r ? '  ·  ' + r + '/10' : '');
        return `<p class="early-p"><strong>${esc(rz(b.label,i))}</strong>${esc(txt)}</p>`;
      }
      if(b.type==='quote'){
        const touched = (A[b.field+'_t']||[])[i];
        const k = b.key ? val(b.key,i) : null;
        const v = touched ? val(b.field,i) : (k && window[b.bank] ? rz(window[b.bank][k],i) : val(b.field,i));
        return v ? `<p class="says">״${esc(v)}״</p>` : '';
      }
      if(b.type==='plain'){
        if(b.need){
          const mm = /^(\d\d)\.(\w+)(!?)$/.exec(b.need);
          if(mm && !xval(mm[1], mm[2], mm[3] ? 1-i : i)) return '';
        }
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
    const soloNote = C.solo
      ? `<p class="full solonote">${esc(rz('אלה ההצעות שלך, ולא הסכם עדיין. כש[תביא/תביאי] אותן, תוכלו להסכים עליהן יחד.', C.me===1?1:0))}</p>`
      : '';
    agr = `<div class="agreement"><h4>${esc(tx(CARD.agreement,'title'))}</h4>${rows}${soloNote}
      ${CARD.agreement.note?`<p class="full">${CARD.agreement.note}</p>`:''}</div>`;
  }

  el.innerHTML = `<div class="cardhead"><b>${esc(CARD.title)}</b>
      <span>${esc(PP().map(([p])=>p.name).filter(Boolean).join(' & '))}</span></div>
    ${buildVisual()}${buildSteps()}${people}${agr}`;
  markProgress();
  buildPact();
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
function renderMode(){
  const el = document.getElementById('modepick'); if(!el) return;
  const solo = !!C.solo;
  el.innerHTML = `<p class="modelbl">איך אתם עוברים את זה?</p>
    <div class="opts modepick">
      <button type="button" class="opt" data-act="mode" data-v="duo" aria-pressed="${!solo}">
        ביחד<small>מסך אחד, שניכם</small></button>
      <button type="button" class="opt" data-act="mode" data-v="solo" aria-pressed="${solo}">
        לבד<small>ואביא את זה איתי לשיחה</small></button>
    </div>`;
}

function renderNames(){
  const el = document.getElementById('names'); if(!el) return;
  el.className = 'namesbox';
  const solo = !!C.solo, me = C.me === 1 ? 1 : 0;

  const field = (i, lbl, ph) => `
    <div>
      <div class="field" style="margin-bottom:0">
        <label>${esc(lbl)}</label>
        <input type="text" data-act="name" data-i="${i}" value="${esc(C.p[i].name)}"
          placeholder="${esc(ph)}" autocomplete="off">
      </div>
    </div>`;

  el.innerHTML = !solo
    ? `<div class="pair">${field(0,'היא','השם שלה')}${field(1,'הוא','השם שלו')}</div>`
    : `<div class="opts whopick">
         <button type="button" class="opt" data-act="who" data-v="0" aria-pressed="${me===0}">אני האישה</button>
         <button type="button" class="opt" data-act="who" data-v="1" aria-pressed="${me===1}">אני הגבר</button>
       </div>
       <div class="pair">${field(me,'השם שלי','איך קוראים לך')}${
         field(1-me, me===0?'ובן הזוג':'ובת הזוג', me===0?'השם שלו':'השם שלה')}</div>`;

  const h = el.closest('.q') && el.closest('.q').querySelector('h3');
  if(h){
    if(h.dataset.duo === undefined) h.dataset.duo = h.textContent.trim();
    h.textContent = solo ? (me === 0 ? 'איך קוראים לך, ולבן הזוג?' : 'איך קוראים לך, ולבת הזוג?')
                         : h.dataset.duo;
  }
}

/* ---------- התאמת הניסוחים למצב ---------- */
const SOLO_EYEBROWS = {
  'מסכימים יחד':'ההצעה שלך', 'קובעים מראש':'ההצעה שלך',
  'מגדירים תפקידים':'ההצעה שלך', 'רגע ביניכם':'רגע איתך',
};
function applyMode(){
  const solo = !!C.solo, me = C.me === 1 ? 1 : 0;
  document.body.classList.toggle('solo', solo);
  document.querySelectorAll('.eyebrow').forEach(el=>{
    if(el.dataset.duo === undefined) el.dataset.duo = el.textContent.trim();
    const t = el.dataset.duo;
    if(SOLO_EYEBROWS[t]) el.textContent = solo ? SOLO_EYEBROWS[t] : t;
  });
  document.querySelectorAll('.willread').forEach(el=>{
    if(el.dataset.tpl === undefined) el.dataset.tpl = el.textContent.trim();
    el.textContent = C.solo
      ? rz('וזה ייכנס לכרטיס שלך, כדי ש[תוכל/תוכלי] להראות <לו/לה> את זה.', C.me===1?1:0)
      : el.dataset.tpl;
  });
  const th = document.querySelector('.timehint');
  if(th) th.textContent = solo
    ? rz('[תפנה/תפני] לעצמך 20 דקות לבנות זוגיות שיודעת לחזור.', me)
    : 'תפנו לכם 20 דקות לבנות זוגיות שיודעת לחזור.';
  document.querySelectorAll('[data-audio]').forEach(h=>{
    if(!h._audio || !h._pick) return;
    const want = h._pick();
    if(h._audio.getAttribute('src') === want) return;
    h._audio.pause();
    h._audio.setAttribute('src', want);
    h._audio.src = want;
    const bx = h.querySelector('.listen'); if(bx) bx.classList.remove('on');
    const br = h.querySelector('.lbar i'); if(br) br.style.width = '0%';
  });
  const sh = document.querySelector('.scroll-hint');
  if(sh) sh.textContent = solo ? 'גללו' : 'גללו · שבו יחד';
}



/* ============================================================
   ״שבו רגע״ · נגן קולי. מופיע רק אם קובץ האודיו קיים.
   ============================================================ */
function initAudio(){
  document.querySelectorAll('[data-audio]').forEach(host => {
    const pick = () => (C.solo && host.dataset.audioSolo) ? host.dataset.audioSolo : host.dataset.audio;
    const a = new Audio();
    a.preload = 'metadata';
    a.src = pick();
    host._audio = a; host._pick = pick;
    const box  = host.querySelector('.listen');
    const btn  = host.querySelector('.playbtn');
    const bar  = host.querySelector('.lbar i');
    if(!box || !btn) return;
    const time = host.querySelector('.ltime');
    const mmss = t => { t = Math.max(0, Math.round(t||0)); return Math.floor(t/60) + ':' + String(t%60).padStart(2,'0'); };
    a.addEventListener('loadedmetadata', () => {
      host.hidden = false;
      if(time) time.textContent = mmss(a.duration);
    });
    a.addEventListener('error', () => { host.hidden = true; });
    a.addEventListener('timeupdate', () => {
      if(bar && a.duration) bar.style.width = (a.currentTime / a.duration * 100) + '%';
      if(time) time.textContent = mmss(a.duration - a.currentTime);
    });
    a.addEventListener('ended', () => {
      box.classList.remove('on');
      if(bar) bar.style.width = '0%';
      if(time) time.textContent = mmss(a.duration);
    });
    btn.addEventListener('click', () => {
      if(a.paused){ a.play().then(()=>box.classList.add('on')).catch(()=>{}); }
      else { a.pause(); box.classList.remove('on'); }
    });
  });
}

/* ============================================================
   דגל לבן · פותח וואטסאפ עם ההודעה מוכנה
   ============================================================ */
function initWhatsapp(){
  document.querySelectorAll('[data-wa]').forEach(a => {
    const msg = window[a.dataset.wa];
    if(!msg){ a.hidden = true; return; }
    a.href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

function initClimb(){
  document.querySelectorAll('.climb').forEach(box=>{
    const rungs = box.querySelectorAll('.rung input');
    const done  = box.querySelector('.climb-done');
    if(!rungs.length || !done) return;
    const sync = () => { done.hidden = [...rungs].some(b => !b.checked); };
    rungs.forEach(b => b.addEventListener('change', sync));
    sync();
  });
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
  g.classList.toggle('locked', !IDX().every(i => C.p[i].name.trim()));
}
function renderAll(){ renderWidgets(); buildCard(); updateGate(); }

/* ============================================================
   אירועים
   ============================================================ */
document.addEventListener('input', e=>{
  const d = e.target.dataset, v = e.target.value;
  if(d.act==='name'){ C.p[+d.i].name = v; saveCouple();
    const ix = IDX();
    document.querySelectorAll('.pname').forEach((el,k)=>{ el.textContent = C.p[ix[k%ix.length]].name || '·'; });
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
  if(d.act==='mode'){
    C.solo = (d.v === 'solo');
    if(C.solo && C.me === undefined) C.me = 0;
    saveCouple(); renderMode(); renderNames(); applyMode(); renderAll(); return; }
  if(d.act==='who'){
    C.me = +d.v; saveCouple(); renderMode(); renderNames(); applyMode(); renderAll(); return; }
  if(d.act==='pick'){
    setPair(d.f, +d.i, val(d.f,+d.i)===d.v ? '' : d.v);
    const host = b.closest('[data-widget]'); if(host) W[host.dataset.widget](host);
    buildCard(); return; }
  if(d.act==='mselect'){
    if(!Array.isArray(A[d.f])) A[d.f]=[[],[]];
    if(!Array.isArray(A[d.f][+d.i])) A[d.f][+d.i]=[];
    const arr = A[d.f][+d.i], k = arr.indexOf(d.v);
    k>-1 ? arr.splice(k,1) : arr.push(d.v);
    saveAnswers(); b.setAttribute('aria-pressed', k===-1); buildCard(); return; }
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
   חוזה שעת חירום · כרטיס לשמירה בטלפון
   ============================================================ */
const PACT_FOOT = ['אנחנו לא עוצרים כדי לברוח.', 'אנחנו עוצרים כדי לחזור.'];

function buildPact(){
  const box = document.getElementById('pactwrap'); if(!box) return;
  const code = (A.code || '').trim();
  box.hidden = !code;
  if(!code) return;

  const names = PP().map(([p]) => p.name).filter(Boolean).join(' & ');
  const dur = (A.duration || '').trim();
  const who = (A.whoreturns || '').trim();
  const put = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
  put('pactNames', names || '·');
  put('pactCode', code);
  put('pactDur', dur || '—');
  put('pactWho', who || '—');

  const wa = document.getElementById('pactWa');
  if(wa){
    const msg = 'חוזה שעת החירום שלנו' + (names ? ' · ' + names : '') + '\n\n' +
      'מילת הקוד: ' + code + '\n' +
      (dur ? 'אורך ההפסקה: ' + dur + '\n' : '') +
      (who ? 'מי מחזיר לשיחה: ' + who + '\n' : '') +
      '\n' + PACT_FOOT.join(' ');
    wa.href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    wa.target = '_blank';
    wa.rel = 'noopener';
  }
}

function pactCanvas(){
  const W = 1080, H = 1920, cx = W/2;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.direction = 'rtl';
  c.textAlign = 'center';
  c.fillStyle = '#141010'; c.fillRect(0,0,W,H);

  c.strokeStyle = 'rgba(244,237,228,.16)'; c.lineWidth = 2;
  c.strokeRect(56, 56, W-112, H-112);

  const names = PP().map(([p]) => p.name).filter(Boolean).join(' & ');
  const code = (A.code || '').trim();
  const dur  = (A.duration || '').trim();
  const who  = (A.whoreturns || '').trim();

  const F = (w,sz) => w + ' ' + sz + 'px Polin, Arial, sans-serif';

  c.fillStyle = '#C4564B'; c.font = F(900, 30);
  c.letterSpacing = '10px';
  c.fillText('חוזה שעת חירום', cx, 300);
  c.letterSpacing = '0px';

  if(names){ c.fillStyle = '#9C8F87'; c.font = F(300, 40); c.fillText(names, cx, 372); }

  c.fillStyle = '#9C8F87'; c.font = F(900, 28);
  c.letterSpacing = '8px';
  c.fillText('מילת הקוד שלנו', cx, 760);
  c.letterSpacing = '0px';

  c.fillStyle = '#F4EDE4';
  let sz = 150;
  do { c.font = F(900, sz); sz -= 6; } while(c.measureText(code).width > W-220 && sz > 40);
  c.fillText(code, cx, 900);

  const rows = [['אורך ההפסקה', dur || '—'], ['מי מחזיר לשיחה', who || '—']];
  let y = 1130;
  rows.forEach(([k,v]) => {
    c.strokeStyle = 'rgba(244,237,228,.14)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(150, y); c.lineTo(W-150, y); c.stroke();
    c.textAlign = 'right';
    c.fillStyle = '#9C8F87'; c.font = F(300, 34); c.fillText(k, W-150, y+68);
    c.textAlign = 'left';
    c.fillStyle = '#F4EDE4'; c.font = F(900, 40); c.fillText(v, 150, y+68);
    c.textAlign = 'center';
    y += 150;
  });

  c.fillStyle = '#C4564B'; c.font = F(900, 38);
  PACT_FOOT.forEach((line,k) => c.fillText(line, cx, 1600 + k*58));

  return cv;
}

function initPact(){
  const btn = document.getElementById('pactPng'); if(!btn) return;
  btn.addEventListener('click', () => {
    btn.disabled = true;
    const go = () => {
      pactCanvas().toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const img = document.getElementById('pactImg');
        const dl  = document.getElementById('pactDl');
        const out = document.getElementById('pactOut');
        if(img) img.src = url;
        if(dl) dl.href = url;
        if(out){ out.hidden = false; out.scrollIntoView({behavior:'smooth', block:'center'}); }
        btn.disabled = false;
      }, 'image/png');
    };
    (document.fonts && document.fonts.ready) ? document.fonts.ready.then(go) : go();
  });
}

/* ============================================================
   הגלויה · לרדת מהעץ
   ============================================================ */
const PHOTO_KEY = 'comeback.photo';
const PC_LINES = [
  ['04', 'אנחנו כאן לטווח ארוך.'],
  ['03', 'מה שאני באמת רוצה זה להרגיש קרוב/ה.'],
  ['02', 'הצדקנות משאירה אותי לבד.'],
  ['01', 'אני בוחר/ת בנו עכשיו.'],
];

function photoGet(){ try{ return localStorage.getItem(PHOTO_KEY) || ''; }catch(e){ return ''; } }

function loadImg(src){
  return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
}

function shrink(file){
  return new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => loadImg(fr.result).then(im => {
      if(!im) return res('');
      const max = 1200, r = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.75));
    });
    fr.onerror = () => res('');
    fr.readAsDataURL(file);
  });
}

async function pcCanvas(){
  const W = 1080, H = 1350, cx = W/2;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.direction = 'rtl'; c.textAlign = 'center';

  const F = (w,sz) => w + ' ' + sz + 'px Polin, Arial, sans-serif';
  const photo = photoGet();
  c.fillStyle = '#141010'; c.fillRect(0,0,W,H);
  if(photo){
    const im = await loadImg(photo);
    if(im){
      const r = Math.max(W/im.width, H/im.height);
      const w = im.width*r, h = im.height*r;
      c.drawImage(im, (W-w)/2, (H-h)/2, w, h);
      c.fillStyle = 'rgba(16,12,11,.74)'; c.fillRect(0,0,W,H);
    }
  }
  c.strokeStyle = 'rgba(244,237,228,.2)'; c.lineWidth = 2;
  c.strokeRect(52,52,W-104,H-104);

  c.fillStyle = '#C4564B'; c.font = F(900,30); c.letterSpacing = '12px';
  c.fillText('לרדת מהעץ', cx, 176);
  c.letterSpacing = '0px';

  const names = PP().map(([p]) => p.name).filter(Boolean).join(' & ');
  if(names){ c.fillStyle = '#9C8F87'; c.font = F(300,36); c.fillText(names, cx, 236); }

  let y = 486;
  PC_LINES.forEach(([n,line]) => {
    c.textAlign = 'right';
    c.fillStyle = '#7C6F68'; c.font = F(900,28); c.fillText(n, W-120, y);
    c.fillStyle = '#F4EDE4'; c.font = F(900,46);
    let sz = 46;
    while(c.measureText(line).width > W-320 && sz > 26){ sz -= 2; c.font = F(900,sz); }
    c.fillText(line, W-180, y);
    c.textAlign = 'center';
    y += 122;
  });

  const note = (A.climbNote || '').trim();
  if(note){
    c.strokeStyle = 'rgba(244,237,228,.18)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(220, y+40); c.lineTo(W-220, y+40); c.stroke();
    c.fillStyle = '#C4564B';
    let sz = 44; c.font = F(900,sz);
    while(c.measureText(note).width > W-280 && sz > 24){ sz -= 2; c.font = F(900,sz); }
    c.fillText(note, cx, y+130);
  }
  return cv;
}

function initPostcard(){
  const make = document.getElementById('pcmake'); if(!make) return;
  const file = document.getElementById('pcphoto');
  const clear = document.getElementById('pcclear');
  const msg = document.getElementById('pcmsg');
  const sync = () => { if(clear) clear.hidden = !photoGet(); };
  sync();

  if(file) file.addEventListener('change', async () => {
    const f = file.files && file.files[0]; if(!f) return;
    if(msg) msg.textContent = 'רגע, מכינה את התמונה…';
    const data = await shrink(f);
    file.value = '';
    if(!data){ if(msg) msg.textContent = 'לא הצלחתי לקרוא את התמונה. נסו אחת אחרת.'; return; }
    try{ localStorage.setItem(PHOTO_KEY, data); if(msg) msg.textContent = 'התמונה נשמרת אצלכם במכשיר בלבד.'; }
    catch(e){ if(msg) msg.textContent = 'התמונה גדולה מדי לשמירה, אבל היא תיכנס לגלויה עכשיו.'; }
    sync();
  });

  if(clear) clear.addEventListener('click', () => {
    try{ localStorage.removeItem(PHOTO_KEY); }catch(e){}
    if(msg) msg.textContent = '';
    sync();
  });

  make.addEventListener('click', async () => {
    make.disabled = true;
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    const cv = await pcCanvas();
    cv.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const img = document.getElementById('pcimg');
      const dl  = document.getElementById('pcdl');
      const out = document.getElementById('pcout');
      if(img) img.src = url;
      if(dl) dl.href = url;
      if(out){ out.hidden = false; out.scrollIntoView({behavior:'smooth', block:'center'}); }
      make.disabled = false;
    }, 'image/png');
  });
}

/* ============================================================
   התקדמות, גלילה, הפעלה
   ============================================================ */
function jumpToField(){
  const m = /[#&]f=([^&]+)/.exec(location.hash || '');
  if(!m) return;
  const name = decodeURIComponent(m[1]);
  const el = document.querySelector('[data-field="'+name+'"]');
  if(!el) return;
  const ch = el.closest('.chapter');
  if(ch && CHAPTERS.length) goChapter(CHAPTERS.indexOf(ch));
  setTimeout(()=>{
    const host = el.closest('.q') || el;
    const bar = document.getElementById('chapbar');
    const y = host.getBoundingClientRect().top + scrollY - (bar ? bar.offsetHeight : 0) - 14;
    scrollTo({top: Math.max(0, y), behavior: 'smooth'});
    host.classList.add('flash');
    setTimeout(()=>host.classList.remove('flash'), 2400);
    const inp = el.querySelector('input,textarea,button');
    if(inp && inp.tagName !== 'BUTTON') inp.focus({preventScroll:true});
  }, 260);
}

function boot(){
  load();
  renderMode();
  renderNames();
  renderAll();

  document.querySelectorAll('a.station').forEach(a=>{
    const n = a.dataset.num; if(!n) return;
    const done = progress()[n];
    a.classList.toggle('done', !!done);
    const st = a.querySelector('.st'); if(st) st.textContent = done ? 'הושלמה' : '';
  });

  applyMode();
  initAudio();
  initWhatsapp();
  initClimb();
  initPostcard();
  initPact();
  const hasChapters = chapterize();

  const io = new IntersectionObserver(es=>es.forEach(en=>{
    if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }}),
    {rootMargin:'0px 0px -12% 0px'});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));

  jumpToField();

  const rail = document.querySelector('#rail i');
  if(rail) addEventListener('scroll', ()=>{
    const h = document.documentElement.scrollHeight - innerHeight;
    rail.style.width = (h>0 ? (scrollY/h)*100 : 0) + '%';
  }, {passive:true});
}

window.Comeback = {rz, esc, get couple(){return C;}, get answers(){return A;}, progress};
document.readyState==='loading' ? addEventListener('DOMContentLoaded', boot) : boot();
})();
