/* ============================================================
   הקאמבק · דוח מסכם
   מרכיב לעמוד אחד את כל מה שנאסף בחמש התחנות.
   לא נכתב כאן שום תוכן חדש: הכל מגיע מקובצי התוכן.
   ============================================================ */
(function(){
'use strict';

const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const get = k => { try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } };

const C = get('comeback.couple') || {p:[{name:'',g:'f'},{name:'',g:'m'}]};
C.p[0].g = 'f'; C.p[1].g = 'm';
const SOLO = !!C.solo, ME = C.me === 1 ? 1 : 0;
const IDX = SOLO ? [ME] : [0,1];
const A = {};
['01','02','03','04','05'].forEach(n => A[n] = get('comeback.st'+n) || {});

function rz(txt, i){
  if(!txt) return '';
  const me = C.p[i], you = C.p[1-i];
  return String(txt)
    .replace(/\[([^\[\]]*?)\/([^\[\]]*?)\]/g, (_,m,f) => me.g === 'm' ? m : f)
    .replace(/<([^<>]*?)\/([^<>]*?)>/g,      (_,m,f) => you.g === 'm' ? m : f)
    .replace(/\{שם\}/g,     me.name  || '·')
    .replace(/\{בן_זוג\}/g, you.name || '·')
    .replace(/\{שני\}/g,    you.name || '·');
}

const val  = (n,f,i) => { const v = A[n][f]; return Array.isArray(v) ? v[i] : v; };
const keys = (n,f,i) => { const v = val(n,f,i); return Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []); };
const K    = (n,f,i) => keys(n,f,i)[0] || '';
const opt  = (n,arr,id) => ((CONTENT[n]||{})[arr]||[]).find(o => o.id === id);
const lbl  = (n,arr,id,i) => { const o = opt(n,arr,id); return o ? rz(o.label,i) : ''; };
function bank(n,b,id,i){
  const t = ((CONTENT[n]||{})[b]||{})[id];
  if(!t) return '';
  let out = rz(t,i);
  const V = (CONTENT[n]||{}).VARS || {};
  Object.keys(V).forEach(k => {
    out = out.split('{'+k+'}').join(A[n][V[k].field] || V[k].fallback || '___');
  });
  return out;
}

function person(i){ return esc(C.p[i].name || '·'); }
function two(fn){ return IDX.map(i => fn(i)).join(''); }

/* ---------- אבני בניין ---------- */
function block(title, body, note){
  if(!body || !body.trim()) return '';
  return `<section class="rp">
    <h2>${esc(title)}</h2>
    ${note ? `<p class="rpnote">${esc(note)}</p>` : ''}
    ${body}
  </section>`;
}
function cols(fn){
  const c = IDX.map(i => {
    const inner = fn(i);
    return inner ? `<div class="rpcol"><div class="who">${person(i)}</div>${inner}</div>` : '';
  }).join('');
  return c.trim() ? `<div class="rpcols${IDX.length===1?' one':''}">${c}</div>` : '';
}
const p  = t => t ? `<p>${esc(t)}</p>` : '';
const tagline = t => t ? `<p class="rptag">${esc(t)}</p>` : '';
function agree(rows){
  const r = rows.filter(x => x[1]).map(x =>
    `<div class="row"><span>${esc(x[0])}</span><b>${esc(x[1])}</b></div>`).join('');
  return r ? `<div class="rpagree">${r}</div>` : '';
}

/* ---------- הדוח ---------- */
function build(){
  const el = document.getElementById('report'); if(!el) return;
  const names = IDX.map(i => C.p[i].name).filter(Boolean).join(' & ');
  let out = '';

  /* 1 · איך נכנסים לריב */
  let combo = '';
  if(!SOLO){
    const a = K('01','mode',0), b = K('01','mode',1);
    if(a && b){
      const c = ((CONTENT['01']||{}).COMBOS||{})[[a,b].sort().join('|')];
      if(c) combo = `<div class="rpcombo"><b>${esc(c.name)}</b> ${esc(c.line)}</div>`;
    }
  }
  out += block('איך אתם נכנסים לריב',
    cols(i => tagline(lbl('01','MODES',K('01','mode',i),i)) + p(bank('01','BANK_A',K('01','mode',i),i))) + combo,
    'דפוס ההישרדות שכל אחד מכם סימן, והמפגש ביניהם.');

  /* 2 · מה נשמע כשמבקשים הפסקה */
  out += block('מה כל אחד מכם שומע כשמבקשים הפסקה',
    cols(i => tagline(lbl('01','INTERPRETATIONS',K('01','interp',i),i)) +
              p(bank('01','BANK_B',K('01','interp',1-i),i))),
    'הפרשנות שכל אחד נותן לבקשה לעצור, ומה שכדאי לדעת על הצד השני.');

  /* 3 · מה הראש עושה בזמן השקט */
  out += block('מה הראש עושה בזמן השקט',
    cols(i => keys('02','distortion',i).map(k =>
      tagline(lbl('02','DISTORTIONS',k,i)) + p(bank('02','BANK_A',k,i))).join('')),
    'עיוותי החשיבה שכל אחד מכם סימן.');

  /* 4 · מה עוצר מלחזור */
  out += block('מה עוצר כל אחד מכם מלחזור',
    cols(i => tagline(lbl('02','BELIEFS',K('02','belief',i),i)) + p(bank('02','BANK_EGO',K('02','belief',i),i))),
    'האמונה שקופצת בדיוק כשאתם שוקלים לבוא.');

  /* 5 · הקצב */
  out += block('הקצב של כל אחד מכם',
    cols(i => tagline(lbl('03','PACES',K('03','pace',i),i)) + p(bank('03','BANK_PACE',K('03','pace',i),i))),
    'כמה זמן לוקח לכל אחד להתעצבן, וכמה להירגע.');

  /* 6 · ה-50% */
  out += block('מה כל אחד לוקח על עצמו',
    cols(i => tagline(lbl('04','HALVES',K('04','half',i),i)) + p(bank('04','BANK_HALF',K('04','half',i),i))),
    'החלק שכל אחד מכם בחר לקחת עליו אחריות.');

  /* 7 · מה הכי קשה בחזרה */
  out += block('מה הכי קשה לכל אחד מכם בחזרה',
    cols(i => tagline(lbl('05','RUNGS',K('05','rung',i),i)) +
              p(bank('05','BANK_A',K('05','rung',i),i)) +
              p(bank('05','BANK_PARTNER',K('05','rung',1-i),i))),
    'הדבר שמעכב את החזרה לקרבה, אצל כל אחד ואצל השני.');

  /* 8 · ההסכמות */
  out += block('ההסכמות שלכם',
    agree([
      ['מילת הקוד', A['01'].code],
      ['אורך ההפסקה', A['01'].duration],
      ['מי מחזיר אותנו לשיחה', A['01'].whoreturns],
      ['מי יוזם את החזרה', A['03'].initiator],
      ['ההזמנה המוסכמת', A['03'].inviteCode],
      ['מי אחראי על הריכוך', A['03'].softener],
      ['מי פותח את שיחת התיקון', A['03'].openerRole],
      ['ואם הייתה דחייה', A['03'].retry],
      ['כשהשיחה מתפוצצת', A['04'].blowup],
      ['הסימן שחזרנו', A['05'].sign],
      ['המשפט שסוגר', A['05'].closure],
    ]),
    'כל מה שסיכמתם לאורך הדרך, במקום אחד.');

  /* 9 · על מה מתאמנים */
  const STEPS = [['01','BANK_C','mode'],['02','BANK_C','distortion'],
                 ['03','BANK_C','rejection'],['04','BANK_HALF','half'],['05','BANK_C','rung']];
  out += block('על מה כל אחד מכם מתאמן עכשיו',
    cols(i => STEPS.map(([n,b,f]) => {
      const t = bank(n,b,K(n,f,i),i);
      if(!t) return '';
      const st = ((CONTENT[n]||{}).CARD||{}).steps || {};
      const lead = st.lead ? rz((CONTENT[n]||{})[st.lead] || '', i) : '';
      return `<p class="rpstep"><span>${n}</span>${esc(lead ? lead + ' ' + t : t)}</p>`;
    }).join('')),
    'הצעד שיצא לכל אחד מכם בכל תחנה.');

  /* 10 · מה שראינו אחד על השני */
  out += block('ומה שראיתם אחד על השנייה',
    cols(i => { const v = val('05','learnedYou',1-i) || val('04','learnedYou',1-i) ||
                          val('03','learnedYou',1-i) || val('02','learnedYou',1-i) ||
                          val('01','learnedYou',1-i);
      return v ? `<p class="rpsaw">${esc(v)}</p>` : ''; }),
    'מה שכל אחד מכם כתב על השני לאורך הדרך.');

  el.innerHTML = `<div class="rphead"><b>דוח הקאמבק</b><span>${esc(names)}</span></div>` +
    (out || '<p class="rpempty">הדוח ייבנה כאן ככל שתעברו את התחנות.</p>');
}

document.readyState==='loading' ? addEventListener('DOMContentLoaded', build) : build();
})();
