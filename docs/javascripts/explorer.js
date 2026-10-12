(()=>{const SRC=document.currentScript.src;
'use strict';
const CAT={net:'#8C4FFF',compute:'#ED7100',store:'#7AA116',db:'#C925D1',sec:'#DD344C',mgmt:'#E7157B',k8s:'#326CE5',app:'#0b7a94',ext:'#64748b',tool:'#5268a6'};
const CATN={net:'Networking',compute:'Compute',store:'Storage',db:'Database',sec:'Security',mgmt:'Management',k8s:'Kubernetes',app:'Application',ext:'External',tool:'Deploy tool'};
const GS={cloud:'#232F3E',region:'#00A4A6',vpc:'#8C4FFF',az:'#147EBA',public:'#7AA116',private:'#00A4A6',cluster:'#326CE5',ns:'#326CE5',lane:'#64748b'};
const NS='http://www.w3.org/2000/svg',$=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let D,view='traffic',sel=null,flow=-1,step=0;
if(document.getElementById('map'))fetch(new URL('../assets/infra-diagram-data.json',SRC)).then(r=>r.json()).then(d=>{D=d;tabs();go('traffic');});
function tabs(){$('#tabs').innerHTML=Object.entries(D.views).map(([k,v])=>`<button data-v="${k}" aria-pressed="false">${esc(v.title)}</button>`).join('');
 document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>go(b.dataset.v));
 $('#legend').innerHTML=Object.entries(CATN).map(([k,n])=>`<span><i class="sw" style="background:${CAT[k]};border-color:${CAT[k]}"></i>${n}</span>`).join('')+'<span>— solid: traffic · - - dashed: control / unproven</span>';}
function go(v){view=v;flow=-1;step=0;sel=D.views[v].nodes[0].id;
 document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));draw();inspect();flows();}
function draw(){const v=D.views[v_()];const svg=$('#map');svg.setAttribute('viewBox',`0 0 ${v.w} ${v.h}`);
 const f=flow<0?null:v.flows[flow];let onE=new Set(),onN=new Set(),cur=new Set();
 if(f){f.steps.forEach((s,i)=>{(s.e||[]).forEach(id=>{onE.add(id);const e=v.edges.find(x=>x.id===id);onN.add(e.from);onN.add(e.to);if(i===step)cur.add(id)});(s.n||[]).forEach(n=>onN.add(n))});}
 let s=`<defs>${['m','a','w'].map((k,i)=>`<marker id="mk${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="${['var(--muted)','var(--accent)','var(--warn)'][i]}"/></marker>`).join('')}</defs>`;
 v.groups.forEach(g=>{const c=GS[g.style];const ly=g.labelPos==='bottom'?g.y+g.h-9:g.y+19;
  s+=g.style==='lane'?`<line x1="${g.x}" x2="${g.x+g.w}" y1="${g.y}" y2="${g.y}" stroke="${c}" stroke-width="1.2"/>`:`<rect class="grp" x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="8" stroke="${c}" ${['az','ns'].includes(g.style)?'stroke-dasharray="5 4"':''} fill="${['public','private'].includes(g.style)?c:'none'}" fill-opacity="${['public','private'].includes(g.style)?.06:0}"/>`;
  s+=`<text class="glbl" x="${g.x+10}" y="${ly}" fill="${c==='#232F3E'?'var(--ink)':c}">${esc(g.label)}</text>`;});
 v.edges.forEach(e=>{const st=cur.has(e.id)?'cur':onE.has(e.id)?'on':'';const dim=f&&!onE.has(e.id)?' dim':'';
  s+=`<path class="edge ${e.style||''} ${st}${dim}" d="M${e.pts.map(p=>p.join(',')).join(' L')}" marker-end="url(#mk${st==='cur'?'w':st==='on'?'a':'m'})"/>`;});
 v.edges.forEach(e=>{if(!e.label)return;const w=[...e.label].length*7.44+12,dim=f&&!onE.has(e.id)?' dim':'';
  s+=`<g class="elbl${dim}"><rect x="${e.lx-w/2}" y="${e.ly-10}" width="${w}" height="20" rx="4"/><text x="${e.lx}" y="${e.ly+4}" text-anchor="middle">${esc(e.label)}</text></g>`;});
 v.nodes.forEach(n=>{const m=D.nodes[n.id],h=n.h||56,c=CAT[m.cat],cls=(n.id===sel?' sel':'')+(f?(onN.has(n.id)?' on':' dim'):'');
  s+=`<g class="node${cls}" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(m.title)}" transform="translate(${n.x} ${n.y})"><rect class="body" width="${n.w}" height="${h}" rx="8"/>
  <g class="glyph"><rect x="10" y="${h/2-13}" width="26" height="26" rx="6" fill="${c}"/><text x="23" y="${h/2+3.5}" text-anchor="middle">${esc(m.glyph.slice(0,3))}</text></g>
  <text class="ttl" x="44" y="${h/2+5}">${esc(m.title)}</text><title>${esc(m.title+" · "+m.sub)}</title></g>`;});
 svg.innerHTML=s;
 svg.querySelectorAll('.node').forEach(g=>{const n=v.nodes.find(x=>x.id===g.dataset.id),av=n.w-52;
  g.querySelectorAll('text.ttl').forEach(t=>{let fs=parseFloat(getComputedStyle(t).fontSize);while(t.getComputedTextLength()>av&&fs>7){fs-=.5;t.style.fontSize=fs+'px'}});
  const pick=()=>{sel=g.dataset.id;draw();inspect();svg.querySelector(`[data-id="${sel}"]`).focus()};
  g.onclick=pick;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}};});
 $('#vtitle').textContent=v.title;$('#vdesc').textContent=v.desc;}
const v_=()=>view;
function inspect(){const m=D.nodes[sel],v=D.views[view];
 const links=v.edges.filter(e=>e.from===sel||e.to===sel).map(e=>(e.from===sel?'→ ':'← ')+D.nodes[e.from===sel?e.to:e.from].title+(e.label?` (${e.label})`:''));
 $('#inspect').innerHTML=`<div class="col"><span class="k" style="color:${CAT[m.cat]}">${CATN[m.cat]} · selected</span><h3>${esc(m.title)}</h3><span class="tag">${esc(m.sub)}</span><p>${esc(m.body)}</p>${m.facts.length?`<ul>${m.facts.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</div><div class="col">${links.length?`<span class="k">Connections in this view</span><ul>${links.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}<span class="k">Sources</span><div class="srcs">${m.src.map(esc).join('<br>')}</div></div>`;}
function flows(){const v=D.views[view];
 $('#flows').innerHTML=v.flows.map((f,i)=>`<button data-f="${i}" aria-pressed="${i===flow}">${esc(f.label)}</button>`).join('')+(flow>=0?'<button data-f="-1" aria-pressed="false">Show everything</button>':'');
 document.querySelectorAll('#flows button').forEach(b=>b.onclick=()=>{flow=+b.dataset.f;step=0;draw();flows()});
 if(flow<0){$('#walk').innerHTML='';return}
 const f=v.flows[flow];$('#walk').innerHTML=`<div class="walkbox"><p>${esc(f.steps[step].t)}</p><div class="nav"><button id="pv" ${step?'':'disabled'}>← Back</button><button id="nx" ${step<f.steps.length-1?'':'disabled'}>Next →</button><span>Step ${step+1} of ${f.steps.length} · current step in amber</span></div></div>`;
 $('#pv').onclick=()=>{step--;draw();flows()};$('#nx').onclick=()=>{step++;draw();flows()};}
})();
