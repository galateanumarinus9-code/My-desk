(function(){
// ---- data path: ?d= / #d= -> localStorage, fallback deskdata (Plan B static JSON) ----
const qs=new URLSearchParams(location.search);
const h=new URLSearchParams(location.hash.slice(1));
const dIn=h.get('d')||qs.get('d'); const t=h.get('t')||qs.get('t');
if(dIn)localStorage.setItem('desk_d',dIn); if(t)localStorage.setItem('desk_t',t);
if(dIn||t){try{history.replaceState(null,'',location.pathname+(dIn?('?d='+encodeURIComponent(dIn)):''));}catch(e){}}
let D=dIn||localStorage.getItem('desk_d')||'deskdata';
const BASE='d/';
const $=id=>document.getElementById(id), st=$('status');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>v!=null&&v!==''&&isFinite(v);
const usd=n=>(Number(n)<0?'-$':'$')+Math.abs(Number(n)||0).toFixed(2);
const pct=n=>num(n)?((n>=0?'+':'')+Number(n).toFixed(2)+'%'):'—';
const cls=n=>Number(n)>0?'up':Number(n)<0?'down':'';
const px=p=>!num(p)?'—':(p>=1?Number(p).toFixed(4):Number(p).toPrecision(4));
const short=m=>m?String(m).slice(0,4)+'…'+String(m).slice(-4):'—';
const ago=ts=>{if(!ts)return'never';const s=Math.max(0,Date.now()/1000-ts);return s<60?Math.round(s)+'s ago':s<3600?Math.round(s/60)+'m ago':s<86400?Math.round(s/3600)+'h ago':Math.round(s/86400)+'d ago'};
const safeUrl=u=>/^https:\/\//.test(u||'')?u:null; // only URLs from JSON; never built here
const pts=a=>(a||[]).map(p=>Array.isArray(p)?p:[p.t,p.v!=null?p.v:p.c]).filter(p=>num(p[0])&&num(p[1]));
const TITLES={home:'Home',agents:'Agents',activity:'Activity',account:'Account'};
const ROLES={scanner:'Finds fresh migrated coins',auditor:'8-layer on-chain safety audit',analyst:'Scores & picks entries',executor:'Places paper trades on FOMO',risk:'Stops, trailing & timeouts'};
let S=null,C=null,A=null,AERR=null;

document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('.tab').forEach(s=>s.classList.toggle('active',s.id===b.dataset.t));$('title').textContent=TITLES[b.dataset.t];window.scrollTo(0,0);if(b.dataset.t==='home'&&C)drawChart($('chart'),pts(C.points))});
async function get(f,path){const r=await fetch(BASE+(path||D)+'/'+f+'?_='+Date.now(),{cache:'no-store'}); if(!r.ok) throw new Error(f+' '+r.status); return r.json()}

// ---- tap delegation ----
document.addEventListener('click',e=>{const el=e.target.closest('[data-mint],[data-audit]');if(!el)return;
 if(el.dataset.mint)openCoin(el.dataset.mint); else openAudit();});
$('ovclose').onclick=closeOv;
function openOv(title,html){$('ovtitle').textContent=title;$('ovbody').innerHTML=html;$('overlay').hidden=false;document.body.style.overflow='hidden'}
function closeOv(){$('overlay').hidden=true;document.body.style.overflow=''}

// ---- Home ----
function renderHome(s,c){
 const eq=s.equity_usd!=null?s.equity_usd:s.balance; $('equity').textContent=usd(eq);
 const m=(s.mode||(s.paper===false?'LIVE':'PAPER')).toUpperCase(); $('mode').textContent=m; $('mode').className='badge'+(m==='LIVE'?' live':'');
 $('today').textContent='Today '+pct(s.todayPct); $('today').className='chip '+cls(s.todayPct);
 $('mult').textContent=num(s.multiplier)?Number(s.multiplier).toFixed(2)+'×':'—×'; $('mult').className='chip '+cls((s.multiplier||1)-1);
 $('cash').textContent=num(s.cash_usd)?'Cash '+usd(s.cash_usd):'';
 try{drawChart($('chart'),pts(c&&c.points))}catch(e){}
 const ps=s.positions||[];
 $('positions').innerHTML=ps.length?'<div class="card">'+ps.map(p=>{const name=p.symbol||p.name||short(p.mint);
  const pnl=num(p.pnl_usd)?p.pnl_usd:null;
  const stop=num(p.stop_price)?`${p.trail_active?'Trail':'Stop'} ${px(p.stop_price)}`:'No stop set';
  return `<div class="row tap chev" data-mint="${esc(p.mint)}"><div class="l"><b>${esc(name)}</b><span class="muted small">${esc(short(p.mint))} · entry ${px(p.entry_price)} · ${esc(stop)}</span></div><div class="r"><div>${usd(p.size_usd)}</div>${pnl!=null?`<div class="small ${cls(pnl)}">${usd(pnl)}</div>`:''}</div></div>`}).join('')+'</div>'
  :'<div class="card state">No open positions</div>';
}
// ---- Agents ----
function renderAgents(s){
 const ag=s.agents||{}, la=s.last_audit;
 $('agentlist').innerHTML=Object.keys(ROLES).map(k=>{const v=ag[k];const ok=v&&v.status==='ok';const stv=v?v.status:'missing';
  let extra='';
  if(k==='auditor'){ if(la&&la.layers&&la.layers.length) extra=`<div class="row tap chev" data-audit="1"><span class="muted small">Last audit ${esc(short(la.mint))}: <b class="${la.passed===la.total?'up':'down'}">${la.passed}/${la.total}</b> · ${ago(la.ts)}</span></div>`;
   else { const lastA=(A&&A.items||[]).find(i=>i.agent==='auditor'); extra=`<div class="row tap chev" data-audit="1"><span class="muted small">${lastA?esc(lastA.title||lastA.message):'No audits yet'}</span></div>`; } }
  return `<div class="card"><div class="row"><div class="l"><b><span class="dot ${ok?'ok':'stale'}"></span>${esc(k[0].toUpperCase()+k.slice(1))}</b><span class="muted small">${ROLES[k]}</span></div><div class="r"><div class="${ok?'up':'down'} small">${esc(stv)}</div><div class="muted small">${v?ago(v.ts):'—'}</div></div></div>${extra}</div>`}).join('');
}
// ---- Activity ----
const KIND={bought:['B','Bought'],sold:['S','Sold'],stopped:['■','Stopped'],rejected:['×','Rejected']};
function renderActivity(a,err){
 if(err&&!a){$('actlist').innerHTML=`<div class="card state err">Couldn't load activity (${esc(err)})</div>`;return}
 const it=(a&&a.items||[]).filter(i=>KIND[i.kind]);
 if(!it.length){$('actlist').innerHTML='<div class="card state">No activity yet<br><span class="small">Buys, sells, stops and rejections will show here.</span></div>';return}
 $('actlist').innerHTML='<div class="card">'+it.map(i=>{const k=KIND[i.kind];const v=num(i.value)?usd(i.value):esc(i.value||'');
  return `<div class="row${i.mint?' tap':''}" ${i.mint?`data-mint="${esc(i.mint)}"`:''}><div class="ico ${esc(i.kind)}">${k[0]}</div><div class="l"><b>${esc(i.title||i.message||k[1])}</b><span class="muted small">${esc(i.subtitle||short(i.mint))} · ${ago(i.ts)}</span></div><div class="r ${num(i.value)?cls(i.value):''}">${v}</div></div>`}).join('')+'</div>';
}
// ---- Account ----
const LABEL={stack_usd:['Stack',v=>usd(v)],stack_pct:['Stack per trade',v=>v+'%'],stop_pct:['Stop loss',v=>v+'%'],trail_pct:['Trailing stop',v=>v+'%'],timeout_h:['Timeout',v=>v+' h'],fomo_handle:['FOMO handle',v=>'@'+String(v).replace(/^@/,'')],analyst_mode:['Analyst mode',v=>v],paused:['Paused',v=>v?'Yes':'No']};
function renderAccount(s){
 const live=(s.mode||'').toUpperCase()==='LIVE', set=s.settings||{};
 const prof=safeUrl(s.profile_url), sign=safeUrl(s.signup_url);
 $('acct').innerHTML=`<div class="card"><div class="row"><div class="l"><b>Mode: ${live?'LIVE':'PAPER'}</b><span class="muted small">Read-only here — change via Telegram</span></div><div class="sw${live?' on':''}" aria-disabled="true" title="change via Telegram"></div></div></div>
 <h2>Settings</h2><div class="card">${Object.keys(LABEL).map(k=>`<div class="row"><span>${LABEL[k][0]}</span><span class="muted">${k in set?esc(LABEL[k][1](set[k])):'—'}</span></div>`).join('')}<div class="muted small" style="padding-top:8px">Change settings via Telegram.</div></div>
 <h2>FOMO</h2><div class="card">${prof?`<a class="btn alt" href="${esc(prof)}" target="_blank" rel="noopener">Your FOMO profile</a>`:'<div class="muted small">Profile link unavailable</div>'}${sign?`<a class="btn" href="${esc(sign)}" target="_blank" rel="noopener">Invite friends / Sign up on FOMO</a>`:''}</div>
 <h2>Notifications</h2><div class="card"><div class="row"><span>Telegram</span><span class="up">Connected</span></div><div class="row"><div class="l"><b>Web push</b><span class="muted small">Telegram only — web push needs Plan A</span></div><div class="sw" aria-disabled="true"></div></div></div>
 <div class="state small">Updated ${ago(s.ts)}</div>`;
}
// ---- Coin overlay ----
async function openCoin(mint){
 openOv(short(mint),'<div class="state">Loading coin…</div>');
 let c; try{c=await get('coin/'+encodeURIComponent(mint)+'.json')}catch(e){$('ovbody').innerHTML=`<div class="card state err">Coin data not available (${esc(e.message)})</div>`;return}
 const co=c.coin||{}, name=co.symbol||co.name||short(mint), s=c.stats||{}, p=c.position, url=safeUrl(c.url||c.coin_url);
 $('ovtitle').textContent=name;
 const ser=(c.series&&c.series.length?c.series:c.candles)||[];
 const ex=(c.exits||[])[0];
 const stopNote=ex?`${ex.kind==='trail'?'Trailing stop':'Stop'} at ${px(ex.price)}${num(c.price)&&ex.price?` (${pct((ex.price/c.price-1)*100)} from price)`:''}`:'No active stop';
 $('ovbody').innerHTML=`<div class="card"><div class="muted">${esc(co.name||'')} <span class="small">${esc(short(mint))}</span></div><div class="big">${px(c.price)}</div><div class="chips"><span class="chip ${cls(s.change_pct)}">${pct(s.change_pct)}</span><span class="chip">${s.n||0} ticks</span></div><canvas id="coinchart" height="180"></canvas></div>
 <div class="card grid"><div><span class="muted small">High</span><br>${px(s.high)}</div><div><span class="muted small">Low</span><br>${px(s.low)}</div><div><span class="muted small">First</span><br>${px(s.first)}</div><div><span class="muted small">Holders</span><br>${num(c.holders)?Number(c.holders).toLocaleString():'—'}</div></div>
 <div class="card"><div class="row"><span>Stop line</span><span class="muted small">${esc(stopNote)}</span></div>${p?`<div class="row"><span>Position</span><span>${usd(p.size_usd)} @ ${px(p.entry_price)}</span></div>`:''}${c.audit?`<div class="row tap chev" data-audit="1"><span>Audit</span><span class="${c.audit.passed===c.audit.total?'up':'down'}">${c.audit.passed}/${c.audit.total}</span></div>`:''}</div>
 ${url?`<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Buy / Sell on FOMO</a>`:''}`;
 window._coinAudit=c.audit||null;
 try{drawChart($('coinchart'),pts(ser))}catch(e){}
}
// ---- Auditor overlay ----
function openAudit(){
 const au=(!$('overlay').hidden&&window._coinAudit)||(S&&S.last_audit);
 if(!au||!au.layers||!au.layers.length){openOv('Auditor','<div class="card state">No audit data yet<br><span class="small">The 8-layer audit appears after the auditor checks a coin.</span></div>');return}
 openOv('Auditor',`<div class="card"><div class="muted">${esc(short(au.mint))} · ${ago(au.ts)}</div><div class="big ${au.passed===au.total?'up':'down'}">${au.passed}/${au.total}</div><div class="muted small">All 8 layers must pass</div></div>
 <div class="card">${au.layers.map(l=>`<div class="row"><div class="l"><b>${l.pass?'✓':'✗'} ${l.layer}. ${esc(l.name)}</b><span class="muted small">${esc(l.source||'')}</span></div><div class="r small ${l.pass?'up':'down'}">${esc(l.value)}</div></div>`).join('')}</div>`);
}
// ---- load / poll ----
function render(){st.textContent='';st.className='';renderHome(S,C);renderAgents(S);renderActivity(A,AERR);renderAccount(S)}
async function loadWith(path){
 const s=await get('state.json',path); let c={points:[]},a=null,err=null;
 try{c=await get('chart.json',path)}catch(e){}
 try{a=await get('act.json',path)}catch(e){try{a=await get('activity.json',path)}catch(e2){err=e2.message}}
 D=path; localStorage.setItem('desk_d',path); S=s;C=c;A=a;AERR=err; render();
}
async function poll(){
 try{await loadWith(D)}
 catch(e){
  if(D!=='deskdata'){try{await loadWith('deskdata');return}catch(e2){}}
  st.textContent='Cannot load data ('+e.message+')';st.className='state err';
  if(!S){$('positions').innerHTML='';renderActivity(null,e.message)}
 }
}
window.addEventListener('resize',()=>{if(C)try{drawChart($('chart'),pts(C.points))}catch(e){}});
if('serviceWorker'in navigator)navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});
poll(); setInterval(poll,15000);
})();
