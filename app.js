(function(){
const qs=new URLSearchParams(location.search);
const h=new URLSearchParams(location.hash.slice(1));
const dIn=h.get('d')||qs.get('d'); const t=h.get('t')||qs.get('t');
if(dIn)localStorage.setItem('desk_d',dIn); if(t)localStorage.setItem('desk_t',t);
if(dIn||t){try{history.replaceState(null,'',location.pathname+(dIn?('?d='+encodeURIComponent(dIn)):''));}catch(e){}}
let D=dIn||localStorage.getItem('desk_d')||'deskdata';
const BASE='d/';
const $=id=>document.getElementById(id), st=$('status');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const usd=n=>'$'+(Number(n)||0).toFixed(2);
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('.tab').forEach(s=>s.classList.toggle('active',s.id===b.dataset.t))});
async function get(f, path){const r=await fetch(BASE+(path||D)+'/'+f+'?_='+Date.now(),{cache:'no-store'}); if(!r.ok) throw new Error(f+' '+r.status); return r.json()}
function render(s,c,a){st.textContent=''; st.className='state'; $('equity').textContent=usd(s.equity_usd!=null?s.equity_usd:s.balance); try{drawChart($('chart'),(c&&c.points)||[])}catch(e){}
 $('positions').innerHTML='<div class="state">No open positions</div>';
 const ag=Object.entries(s.agents||{}); $('agentlist').innerHTML=ag.length?'<div class="card">'+ag.map(([k,v])=>`<div class="row"><span>${esc(k)}</span><span class="up">${esc(v.status)}</span></div>`).join('')+'</div>':'';
 $('actlist').innerHTML='<div class="state">No activity yet</div>';
 $('settings').innerHTML=Object.entries(s.settings||{}).map(([k,v])=>`<div class="row"><span>${esc(k)}</span><span class="muted">${esc(v)}</span></div>`).join('');
 if(s.signup_url)$('signup').href=s.signup_url}
async function loadWith(path){
 const s=await get('state.json',path); let c={points:[]},a={items:[]};
 try{c=await get('chart.json',path)}catch(e){}
 try{a=await get('act.json',path)}catch(e){try{a=await get('activity.json',path)}catch(e2){}}
 D=path; localStorage.setItem('desk_d',path); render(s,c,a);
}
async function poll(){
 try{await loadWith(D)}
 catch(e){
  if(D!=='deskdata'){try{await loadWith('deskdata');return}catch(e2){}}
  st.textContent='Cannot load data ('+e.message+')';st.className='state err'
 }
}
if('serviceWorker'in navigator)navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
poll(); setInterval(poll,15000);
})();
