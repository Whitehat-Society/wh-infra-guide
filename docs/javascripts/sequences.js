(()=>{
'use strict';
// ── Sequence diagrams: lifelines + horizontal messages, text measured at render time ──
const SEQ={
pwnload:{actors:[
  {id:'t',l:'40 players',s:'all connect at once'},{id:'n',l:'Load balancer',s:'for loop only'},
  {id:'p1',l:'loop copy 1',s:'pod'},{id:'p2',l:'loop copy 2',s:'pod'},{id:'p3',l:'loop copy 3',s:'pod'},
  {id:'ca',l:'Cluster Autoscaler',s:'adds computers'}],
 rows:[
  {m:['t','n'],t:'40 connections to port 7331'},
  {note:['n','p1'],t:'The load balancer sends each new connection to one of the three copies. Roughly a third go to each.'},
  {m:['n','p1'],t:'about 13 connections'},
  {m:['n','p2'],t:'about 13 connections'},
  {m:['n','p3'],t:'about 14 connections'},
  {self:'p1',t:'starts a separate run of the program for each connection'},
  {note:['p1','p3'],tone:'warn',t:'All the runs inside one copy share that copy\'s allowance: half a processor core and 512 MB of memory. When they need more, every player on that copy gets slower answers. No copy is added.'},
  {note:['ca'],t:'Every copy is running, so it does nothing.'},
  {note:['t','ca'],tone:'crit',t:'The number of copies stays at 3. To add more, a person changes shared_tcp_replicas in config.ini and runs make build-images again.'}]},
webload:{actors:[
  {id:'t',l:'Players',s:'browsers and scripts'},{id:'g',l:'NGINX',s:'forwards requests'},
  {id:'r1',l:'xssive-login',s:'one copy'},{id:'ca',l:'Cluster Autoscaler',s:'adds computers'}],
 rows:[
  {m:['t','g'],t:'web requests from many players'},
  {note:['g'],tone:'warn',t:'More than 20 requests a second, or 15 open connections, from one address: NGINX answers 503 (busy) itself and doesn\'t pass the request on.'},
  {m:['g','r1'],t:'every other request'},
  {sec:'A player asks the admin bot to visit a link'},
  {m:['t','g'],t:'report a link'},
  {m:['g','r1'],t:'passed on'},
  {self:'r1',t:'starts a hidden web browser and waits for it to finish'},
  {note:['r1'],tone:'crit',t:'Every report running at the same moment starts another browser inside the same 512 MB allowance. If they need more, Kubernetes stops the copy and starts it again, and everyone on it is cut off for a few seconds. Possible from the code; not seen at WH-2026.'},
  {note:['ca'],t:'Every copy is running, so it does nothing.'}]},
scaleup:{actors:[
  {id:'o',l:'You',s:'at your laptop'},{id:'k',l:'Kubernetes',s:'the cluster\'s brain'},
  {id:'c',l:'Cluster Autoscaler',s:'adds computers'},{id:'a',l:'AWS',s:'rents computers'},
  {id:'n',l:'New computer',s:'a fourth node'}],
 rows:[
  {m:['o','k'],t:'make build-images with 2 copies per web challenge instead of 1'},
  {self:'k',t:'looks for a node with room for each new copy'},
  {sec:'If a node has room: the copy starts within seconds. If not:'},
  {self:'k',t:'the new copy waits in a queue (Pending)'},
  {m:['c','k'],t:'notices the waiting copy (checks every 10 seconds)'},
  {m:['c','a'],t:'asks for one more computer, never more than 6 in total'},
  {m:['a','n'],t:'starts the computer in the private network'},
  {m:['n','k'],t:'joins the cluster, usually within 2 to 5 minutes'},
  {m:['k','n'],t:'starts the waiting copy there'},
  {self:'n',t:'downloads the challenge image from ECR'},
  {note:['o','n'],tone:'ok',t:'Once the copy is ready, NGINX starts sending it half of that challenge\'s requests.'},
  {sec:'Later, when things are quiet'},
  {self:'c',t:'a node has been less than half used for 10 minutes'},
  {m:['c','a'],t:'moves its copies elsewhere and returns it, never going below 2'}]},
pwnshare:{actors:[
  {id:'a',l:'Player A',s:'nc <address> 1337'},{id:'b',l:'Player B',s:'the same command'},
  {id:'n',l:'Load balancer',s:'for example-tcp only'},{id:'p',l:'example-tcp copy',s:'one pod'},
  {id:'pa',l:'Run for A',s:'started for A'},{id:'pb',l:'Run for B',s:'started for B'}],
 rows:[
  {m:['a','n'],t:'connects to port 1337'},
  {m:['n','p'],t:'picks this copy'},
  {m:['p','pa'],t:'starts a fresh run of the program'},
  {m:['b','n'],t:'connects a few seconds later'},
  {m:['n','p'],t:'picks the same copy (any of the three is possible)'},
  {m:['p','pb'],t:'starts a second, separate run'},
  {m:['a','pa'],t:'what A types goes only to A\'s run'},
  {m:['b','pb'],t:'what B types goes only to B\'s run'},
  {note:['pa','pb'],tone:'ok',t:'Each run has its own memory. If A crashes the program, only A\'s connection ends. B never sees A\'s session, even when they are on the same team.'},
  {note:['p','pb'],tone:'warn',t:'Both runs share the copy\'s files, including the flag file, and its processor and memory allowance.'},
  {sec:'If player A takes over the program'},
  {m:['pa','a'],t:'A gets a command prompt inside the copy'},
  {note:['p','pb'],tone:'crit',t:'In a challenge whose files the program can write to, as in loop and xoph at WH-2026, that prompt can change or delete files that every other player on this copy uses, until the copy restarts.'},
  {sec:'When a player stops typing'},
  {self:'pb',t:'after 60 seconds of silence the connection closes and the run ends'}]},
webshare:{actors:[
  {id:'a',l:'Player A',s:'browser'},{id:'b',l:'Player B',s:'browser'},
  {id:'g',l:'NGINX',s:'takes turns'},
  {id:'r1',l:'Copy 1',s:'own key, own data'},{id:'r2',l:'Copy 2',s:'own key, own data'}],
 rows:[
  {note:['a','r2'],t:'This only happens when a web challenge runs 2 copies. A fresh deploy runs 1, and Adding capacity explains how to run 2.'},
  {sec:'Logging in doesn\'t stick'},
  {m:['a','g'],t:'logs in'},
  {m:['g','r1'],t:'sent to copy 1'},
  {m:['r1','a'],t:'login cookie, signed with copy 1\'s key'},
  {m:['a','g'],t:'opens the next page'},
  {m:['g','r2'],t:'sent to copy 2'},
  {m:['r2','a'],tone:'crit',t:'copy 2 can\'t check copy 1\'s signature, so A is logged out'},
  {sec:'Players see each other\'s data, on one copy only'},
  {m:['b','g'],t:'saves something, such as a profile or a message'},
  {m:['g','r1'],t:'stored in copy 1\'s data'},
  {m:['a','g'],t:'next request'},
  {m:['g','r1'],tone:'warn',t:'sent to copy 1: A sees what B saved'},
  {note:['r2'],t:'Copy 2 never receives it.'},
  {note:['a','r2'],tone:'warn',t:'Fixes: run 1 copy, or make NGINX send each player to the same copy every time, or give both copies the same key and one shared store for data.'}]},
ratelimit:{actors:[
  {id:'a',l:'Player A',s:'home internet'},{id:'b',l:'Player B',s:'campus internet'},
  {id:'n',l:'Load balancer',s:'for all web traffic'},{id:'g',l:'NGINX',s:'limit: 20 a second'},
  {id:'w',l:'Web challenge',s:'one copy'}],
 rows:[
  {m:['a','n'],t:'15 requests a second'},
  {m:['b','n'],t:'10 requests a second'},
  {m:['n','g'],t:'25 requests a second, all appearing to come from the load balancer\'s own address'},
  {self:'g',t:'counts both players as one address'},
  {m:['g','w'],t:'20 requests a second pass'},
  {m:['g','b'],tone:'crit',t:'the other 5 get 503 (busy)'},
  {note:['a','w'],tone:'warn',t:'Inferred from the settings, not tested live. The load balancer doesn\'t pass on each player\'s real address, so the limit may apply to many players together. Players behind the same campus network share one address in any case.'}]}
};
const SEQ_TONE={warn:'var(--warn)',crit:'var(--crit)',ok:'var(--ok)'};
const SEQ_FILL={warn:'var(--warn-soft)',crit:'var(--crit-soft)',ok:'var(--ok-soft)'};
const mctx=document.createElement('canvas').getContext('2d');
const FONT='13px "IBM Plex Sans","Segoe UI",system-ui,sans-serif';
const tw=(t,f=FONT)=>{mctx.font=f;return mctx.measureText(t).width};
function wrap(t,max,f=FONT){const out=[];let line='';for(const w of t.split(' ')){const c=line?line+' '+w:w;if(tw(c,f)>max&&line){out.push(line);line=w}else line=c}if(line)out.push(line);return out}
function fit(t,px,wt,fam,max){while(px>8&&tw(t,`${wt}${px}px ${fam}`)>max)px-=.5;return px}
function seqSVG(spec){
  const e=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const n=spec.actors.length,cw=spec.cw||188,L=12,W=L*2+cw*n,HB=50,LH=17,X={};
  spec.actors.forEach((a,i)=>X[a.id]=L+cw*(i+.5));
  const back=[],lines=[],front=[];let y=12+HB+26;
  const label=(txt,cx,top,max,tone,anchor='middle')=>{const ls=wrap(txt,max);const w=Math.max(...ls.map(l=>tw(l)))+12;
    const x0=anchor==='middle'?cx-w/2:anchor==='end'?cx-w+6:cx-6;
    front.push(`<rect x="${x0}" y="${top-2}" width="${w}" height="${ls.length*LH+4}" rx="4" class="sq-lbg"/>`);
    ls.forEach((l,i)=>front.push(`<text x="${cx}" y="${top+12.5+i*LH}" text-anchor="${anchor}" class="sq-t" ${tone?`style="fill:${SEQ_TONE[tone]}"`:''}>${e(l)}</text>`));return ls.length*LH};
  for(const r of spec.rows){
    if(r.sec){y+=6;back.push(`<line x1="${L}" x2="${W-L}" y1="${y+10}" y2="${y+10}" class="sq-sec"/>`);
      const w=tw(r.sec,'600 12px "IBM Plex Sans",sans-serif')+16;front.push(`<rect x="${L}" y="${y}" width="${w}" height="20" rx="4" class="sq-secbg"/><text x="${L+8}" y="${y+14}" class="sq-sect">${e(r.sec)}</text>`);y+=36;continue}
    if(r.m){const x1=X[r.m[0]],x2=X[r.m[1]],span=Math.abs(x2-x1),h=label(r.t,(x1+x2)/2,y,Math.max(span-28,140),r.tone);y+=h+8;
      const st=r.tone?`style="stroke:${SEQ_TONE[r.tone]}"`:'';lines.push(`<path d="M${x1},${y} L${x2-(x2>x1?2:-2)},${y}" class="sq-m" ${st} marker-end="url(#sq-${r.tone||'d'})"/>`);y+=22;continue}
    if(r.self){const x=X[r.self],max=cw-60,need=Math.min(max,Math.max(...wrap(r.t,max).map(l=>tw(l))))+12,right=x+42+need<=W-L,d=right?1:-1;
      const h=Math.max(label(r.t,x+42*d,y-4,max,r.tone,right?'start':'end'),30);
      lines.push(`<path d="M${x},${y} L${x+30*d},${y} L${x+30*d},${y+24} L${x+3*d},${y+24}" class="sq-m" marker-end="url(#sq-d)"/>`);y+=h+18;continue}
    if(r.note){const xs=r.note.map(id=>X[id]),x0=Math.min(...xs)-cw/2+12,x1=Math.max(...xs)+cw/2-12,w=x1-x0,ls=wrap(r.t,w-24),h=ls.length*18+16;
      front.push(`<rect x="${x0}" y="${y}" width="${w}" height="${h}" rx="6" class="sq-note" style="fill:${SEQ_FILL[r.tone]||'var(--bg)'};stroke:${SEQ_TONE[r.tone]||'var(--line)'}"/>`);
      ls.forEach((l,i)=>front.push(`<text x="${x0+12}" y="${y+21+i*18}" class="sq-t">${e(l)}</text>`));y+=h+16;continue}
  }
  const H=y+8;
  const heads=spec.actors.map(a=>{const x=X[a.id];return `<line x1="${x}" x2="${x}" y1="${12+HB}" y2="${H}" class="sq-life"/><rect x="${x-cw/2+8}" y="12" width="${cw-16}" height="${HB}" rx="8" class="sq-head"/><text x="${x}" y="33" text-anchor="middle" class="sq-hl" style="font-size:${fit(a.l,14,'600 ','"IBM Plex Sans",sans-serif',cw-32)}px">${e(a.l)}</text><text x="${x}" y="50" text-anchor="middle" class="sq-hs" style="font-size:${fit(a.s,11.5,'','"JetBrains Mono",monospace',cw-32)}px">${e(a.s)}</text>`}).join('');
  const mk=Object.entries({d:'var(--ink)',...SEQ_TONE}).map(([k,c])=>`<marker id="sq-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="${c}"/></marker>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;min-width:${Math.min(W,700)}px;display:block" role="img"><defs>${mk}</defs>${heads}${back.join('')}${lines.join('')}${front.join('')}</svg>`;
}
function renderSeqs(){document.querySelectorAll('[data-seq]').forEach(f=>{f.querySelector('.scroll').innerHTML=seqSVG(SEQ[f.dataset.seq])})}
// ── pod-slot grid ──
function renderSlots(){const el=document.getElementById('slots');if(!el)return;
  const ds=5,other=[['sys',14],['ctfd',3],['web',10],['pwn',15]];const pods=[];other.forEach(([k,n])=>{for(let i=0;i<n;i++)pods.push(k)});
  let html='';for(let node=0;node<4;node++){const take=pods.splice(0,12);const cells=[...Array(ds).fill('ds'),...take];while(cells.length<17)cells.push('free');
    html+=`<div class="slotnode${node===3?' extra':''}"><span class="k">${node===3?'Node 4 · added':'Node '+(node+1)} · ${cells.filter(c=>c!=='free').length}/17</span><div class="slotrow">${cells.map(c=>`<i class="slot s-${c}"></i>`).join('')}</div></div>`}
  el.innerHTML=html}
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>{renderSeqs();renderSlots()});
})();
