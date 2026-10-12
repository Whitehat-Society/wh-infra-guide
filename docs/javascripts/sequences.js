(()=>{
'use strict';
// ── Sequence diagrams: lifelines + horizontal messages, text measured at render time ──
const SEQ={
pwnload:{actors:[
  {id:'t',l:'40 players',s:'nc at once'},{id:'n',l:'NLB · loop',s:'one per challenge'},
  {id:'p1',l:'loop pod 1',s:'socat :7331'},{id:'p2',l:'loop pod 2',s:'socat :7331'},{id:'p3',l:'loop pod 3',s:'socat :7331'},
  {id:'ca',l:'Cluster Autoscaler',s:'watches Pending pods'}],
 rows:[
  {m:['t','n'],t:'40 connections to …elb…:7331'},
  {note:['n','p1'],t:'For each new connection the NLB hashes (source IP, source port, destination, protocol) to pick a pod. Cross-zone is off by default, so an NLB node only uses pods in its own AZ.'},
  {m:['n','p1'],t:'≈ 13 connections'},
  {m:['n','p2'],t:'≈ 13 connections'},
  {m:['n','p3'],t:'≈ 14 connections'},
  {self:'p1',t:'socat forks 13 copies of loop'},
  {note:['p1','p3'],tone:'warn',t:'All processes in a pod share its 500m CPU and 512Mi memory limit. Past that the kernel throttles CPU, so every player on that pod gets slower responses. No pod is added.'},
  {note:['ca'],t:'No Pending pods, so it does nothing.'},
  {note:['t','ca'],tone:'crit',t:'Replicas stay at 3 because there is no HorizontalPodAutoscaler. To add capacity, an operator raises shared_tcp_replicas in config.ini and reruns make build-images.'}]},
webload:{actors:[
  {id:'t',l:'Players',s:'browsers, scripts'},{id:'g',l:'NGINX ×2',s:'ingress'},
  {id:'r1',l:'xssive-login 1',s:'Flask, 1 process'},{id:'r2',l:'xssive-login 2',s:'Flask, 1 process'},
  {id:'ca',l:'Cluster Autoscaler',s:'watches Pending pods'}],
 rows:[
  {m:['t','g'],t:'HTTPS requests from many players'},
  {note:['g'],tone:'warn',t:'Over 20 req/s or 15 open connections per source address: 503 here, before a pod sees it.'},
  {m:['g','r1'],t:'about half the requests'},
  {m:['g','r2'],t:'the other half'},
  {sec:'A player reports a link to the admin bot'},
  {m:['t','g'],t:'POST /reportLink'},
  {m:['g','r1'],t:'→ pod 1'},
  {self:'r1',t:'launches headless Chromium and waits for it to finish'},
  {note:['r1','r2'],tone:'crit',t:'Each report running at the same time adds a browser inside the same 512Mi limit. Going over it kills the container (OOMKilled) and Kubernetes restarts it. Possible from the code; not observed.'},
  {note:['ca'],t:'Still no Pending pods: no action.'}]},
scaleup:{actors:[
  {id:'o',l:'Operator',s:'laptop'},{id:'k',l:'Kubernetes API',s:'EKS control plane'},
  {id:'s',l:'Scheduler',s:'places pods'},{id:'c',l:'Cluster Autoscaler',s:'kube-system'},
  {id:'a',l:'EC2 Auto Scaling',s:'node group 2 to 6'},{id:'n',l:'New node',s:'t3.medium'}],
 rows:[
  {m:['o','k'],t:'pulumi up: replicas 1 → 2 for the 5 web Deployments'},
  {m:['k','s'],t:'5 new pods to place'},
  {self:'s',t:'any node with 100m CPU, 128Mi and a free pod slot?'},
  {sec:'Yes: pod starts in seconds. No: the path below'},
  {m:['s','k'],t:'pod stays Pending'},
  {m:['c','k'],t:'sees the Pending pod (checks every 10 s)'},
  {m:['c','a'],t:'desired size +1, never above the max'},
  {m:['a','n'],t:'launch an instance in a private subnet'},
  {m:['n','k'],t:'joins the cluster and turns Ready (5 min allowed)'},
  {m:['s','n'],t:'binds the Pending pod'},
  {self:'n',t:'pulls the image from ECR through the NAT gateway'},
  {note:['o','n'],tone:'ok',t:'When the pod is Ready, the Service gains a second endpoint and NGINX starts sending it half the requests.'},
  {sec:'Scale-down, later'},
  {self:'c',t:'node under 50% requested for 10 min, and 10 min since the last scale-up'},
  {m:['c','a'],t:'drain the node, desired size −1, never below 2'}]},
pwnshare:{actors:[
  {id:'a',l:'Player A',s:'nc …elb… 7331'},{id:'b',l:'Player B',s:'same command'},
  {id:'n',l:'NLB · loop',s:'TCP passthrough'},{id:'p',l:'loop pod',s:'socat parent'},
  {id:'pa',l:'Process A',s:'forked for A'},{id:'pb',l:'Process B',s:'forked for B'}],
 rows:[
  {m:['a','n'],t:'connect to port 7331'},
  {m:['n','p'],t:'flow hash picks this pod'},
  {m:['p','pa'],t:'fork, exec /chal/loop on a new PTY'},
  {m:['b','n'],t:'connect to port 7331, seconds later'},
  {m:['n','p'],t:'flow hash picks the same pod (any of the 3 is possible)'},
  {m:['p','pb'],t:'fork, exec a second, separate copy'},
  {m:['a','pa'],t:"A's bytes, relayed by socat"},
  {m:['b','pb'],t:"B's bytes, relayed by socat"},
  {note:['pa','pb'],tone:'ok',t:"Separate processes: own memory, stack, heap and PTY. A crash or a bad input ends only that connection's process. Two connections never share a session, even when both come from teammates."},
  {note:['p','pb'],tone:'warn',t:"Shared by both: the container's filesystem, the /chal files and flag, and the pod's 500m CPU and 512Mi memory."},
  {sec:'If player A gets a shell'},
  {m:['pa','a'],t:'shell as user ctf (uid 1000)'},
  {note:['p','pb'],tone:'crit',t:'In loop and xoph, /chal is owned by ctf, so that shell can change or delete files every other player on this pod uses, until the pod restarts. No Kubernetes token is mounted.'},
  {sec:'When a player goes quiet'},
  {self:'pb',t:'60 s without traffic: socat closes the connection and the process ends'}]},
webshare:{actors:[
  {id:'a',l:'Player A',s:'browser'},{id:'b',l:'Player B',s:'browser'},
  {id:'g',l:'NGINX',s:'round-robin'},
  {id:'r1',l:'Pod 1',s:'secret key-1 · DB-1'},{id:'r2',l:'Pod 2',s:'secret key-2 · DB-2'}],
 rows:[
  {sec:'Login doesn\'t stick'},
  {m:['a','g'],t:'POST /login'},
  {m:['g','r1'],t:'→ pod 1'},
  {m:['r1','a'],t:'session cookie signed with key-1'},
  {m:['a','g'],t:'GET /profile with that cookie'},
  {m:['g','r2'],t:'→ pod 2'},
  {m:['r2','a'],tone:'crit',t:"key-2 can't verify the cookie: A is logged out"},
  {sec:'Players see each other\'s data, on one pod only'},
  {m:['b','g'],t:'saves something (a profile, a message, a payload)'},
  {m:['g','r1'],t:'→ pod 1, written to DB-1'},
  {m:['a','g'],t:'next request'},
  {m:['g','r1'],tone:'warn',t:"→ pod 1: A sees B's data"},
  {note:['r2'],t:'DB-2 never gets it.'},
  {sec:'The admin bot'},
  {m:['b','g'],t:'POST /reportLink'},
  {m:['g','r1'],t:'→ pod 1 starts the bot'},
  {m:['r1','g'],t:'bot logs in through the public URL'},
  {m:['g','r2'],t:'→ lands on pod 2, cookie signed with key-2'},
  {m:['r1','g'],t:"bot opens B's link"},
  {m:['g','r1'],tone:'crit',t:'→ pod 1 rejects the key-2 cookie: bot is logged out'},
  {note:['a','r2'],tone:'warn',t:'If routing is effectively random, about half of bot runs fail this way. Fixes: 1 replica, sticky sessions (nginx affinity: cookie), or a fixed secret_key shared by both pods.'}]},
ratelimit:{actors:[
  {id:'a',l:'Player A',s:'203.0.113.7'},{id:'b',l:'Player B',s:'198.51.100.4'},
  {id:'n',l:'NLB node',s:'AZ a · 10.100.0.x'},{id:'g',l:'NGINX pod',s:'limit-rps 20'},
  {id:'w',l:'Web pod',s:'challenge'}],
 rows:[
  {m:['a','n'],t:'15 req/s'},
  {m:['b','n'],t:'10 req/s'},
  {m:['n','g'],t:'25 req/s, all from the NLB\'s private IP'},
  {self:'g',t:'one rate-limit key for both players'},
  {m:['g','w'],t:'20 req/s pass'},
  {m:['g','b'],tone:'crit',t:'the rest get 503'},
  {note:['a','w'],tone:'warn',t:'Inferred from config: ip targets with no proxy protocol and no client-IP preservation. With proxy protocol, NGINX would see each player\'s address and give each its own 20 req/s. Teammates behind the same home or campus NAT would still share one.'}]}
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
