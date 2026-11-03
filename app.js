// Plan B: static app polls JSON files. No SSE, no write API.
(function(){
const qs=new URLSearchParams(location.search);
const h=new URLSearchParams(location.hash.slice(1));
const d=h.get('d')||qs.get('d');
const t=h.get('t')||qs.get('t');
if(d)localStorage.setItem('desk_d',d);
if(t)localStorage.setItem('desk_t',t);
if(d||t){
  try{history.replaceState(null,'',location.pathname);}catch(e){}
}
const D=localStorage.getItem('desk_d');
const BASE=localStorage.getItem('desk_base')||'d/';
const $=id=>document.getElementById(id),st=$('status');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const usd=n=>'$'+(Number(n)||0).toFixed(2);
const ago=t=>{const s=Date.now()/1000-t;return s<60?Math.round(s)+'s':s<3600?Math.round(s/60)+'m':Math.round(s/3600)+'h'};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===b));
  document.querySelectorAll('.tab').forEach(s=>s.classList.toggle('active',s.id===b.dataset.t));
});
async function get(f){
  const url=BASE+encodeURIComponent(D)+'/'+f+'?_='+Date.now();
  const r=await fetch(url,{cache:'no-store'});
  if(!r.ok)throw new Error(f+' '+r.status);
  return r.json();
}
function render(s,c,a){
  st.textContent='';st.className='state';
  const eq=s.equity_usd!=null?s.equity_usd:s.balance;
  $('equity').textContent=usd(eq);
  try{drawChart($('chart'),(c&&c.points)||[]);}catch(e){}
  const pos=s.positions||[];
  $('positions').innerHTML=pos.length?'<div class="card">'+pos.map(p=>`<div class="row"><a href="${esc(p.url)}" target="_blank" rel="noopener" style="color:#fff">${esc((p.mint||'').slice(0,6))}</a><span class="${p.pnl_usd>=0?'up':'down'}">${usd(p.pnl_usd)}</span></div>`).join('')+'</div>':'<div class="state">No open positions</div>';
  const ag=Object.entries(s.agents||{});
  $('agentlist').innerHTML=ag.length?'<div class="card">'+ag.map(([k,v])=>`<div class="row"><span>${esc(k)}</span><span class="${v.status==='ok'&&Date.now()/1000-v.ts<120?'up':'down'}">${esc(v.status)} · ${ago(v.ts)}</span></div>`).join('')+'</div>':'<div class="state">No agents reporting</div>';
  const items=a.items||a.rows||[];
  $('actlist').innerHTML=items.length?'<div class="card">'+items.map(i=>`<div class="row"><span>${esc(i.agent)} · ${esc(i.message||i.title||'')}</span><span class="muted">${ago(i.ts)}</span></div>`).join('')+'</div>':'<div class="state">No activity yet</div>';
  $('settings').innerHTML=Object.entries(s.settings||{}).map(([k,v])=>`<div class="row"><span>${esc(k)}</span><span class="muted">${esc(v)}</span></div>`).join('');
  if(s.signup_url)$('signup').href=s.signup_url;
}
async function poll(){
  if(!D){st.textContent='Open the private link once (needs ?d=…).';st.className='state err';$('equity').textContent='—';return}
  try{
    const [s,c,a]=await Promise.all([get('state.json'),get('chart.json'),get('activity.json')]);
    render(s,c,a);
  }catch(e){st.textContent='Cannot load data ('+e.message+')';st.className='state err'}
}
poll();setInterval(poll,15000);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
