(function(){
const qs=new URLSearchParams(location.search);
const h=new URLSearchParams(location.hash.slice(1));
const d=h.get('d')||qs.get('d'); const t=h.get('t')||qs.get('t');
if(d)localStorage.setItem('desk_d',d); if(t)localStorage.setItem('desk_t',t);
if(d||t){try{history.replaceState(null,'',location.pathname);}catch(e){}}
const D=localStorage.getItem('desk_d'), BASE=localStorage.getItem('desk_base')||'d/';
const $=id=>document.getElementById(id), st=$('status');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const usd=n=>'$'+(Number(n)||0).toFixed(2);
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('.tab').forEach(s=>s.classList.toggle('active',s.id===b.dataset.t))});
async function get(f){const r=await fetch(BASE+D+'/'+f+'?_='+Date.now(),{cache:'no-store'}); if(!r.ok) throw new Error(f+' '+r.status); return r.json()}
function render(s,c,a){st.textContent=''; st.className='state'; $('equity').textContent=usd(s.equity_usd!=null?s.equity_usd:s.balance); try{drawChart($('chart'),(c&&c.points)||[])}catch(e){}
 const pos=s.positions||[]; $('positions').innerHTML=pos.length?'<div class="card">'+pos.map(p=>`<div class="row"><span>${esc((p.mint||'').slice(0,8))}</span><span>${usd(p.pnl_usd)}</span></div>`).join('')+'</div>':'<div class="state">No open positions</div>';
 const ag=Object.entries(s.agents||{}); $('agentlist').innerHTML=ag.length?'<div class="card">'+ag.map(([k,v])=>`<div class="row"><span>${esc(k)}</span><span class="up">${esc(v.status)}</span></div>`).join('')+'</div>':'';
 const items=(a&&(a.items||a.rows))||[]; $('actlist').innerHTML=items.length?'<div class="card">'+items.map(i=>`<div class="row"><span>${esc(i.agent)} · ${esc(i.message||'')}</span></div>`).join('')+'</div>':'<div class="state">No activity yet</div>';
 $('settings').innerHTML=Object.entries(s.settings||{}).map(([k,v])=>`<div class="row"><span>${esc(k)}</span><span class="muted">${esc(v)}</span></div>`).join('');
 if(s.signup_url)$('signup').href=s.signup_url}
async function poll(){if(!D){st.textContent='Open the private link once.';st.className='state err';return}
 try{const s=await get('state.json'); let c={points:[]},a={items:[]};
  try{c=await get('chart.json')}catch(e){}
  try{a=await get('act.json')}catch(e){try{a=await get('activity.json')}catch(e2){}}
  render(s,c,a)}catch(e){st.textContent='Cannot load data ('+e.message+')';st.className='state err'}}
if('serviceWorker'in navigator)navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
poll(); setInterval(poll,15000);
})();
