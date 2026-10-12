(function(){const q=document.getElementById('glsearch'),btn=document.getElementById('gl-all');if(!q)return;
const G=[...document.querySelectorAll('#gl-wrap .gl-g')],sync=()=>{btn.textContent=G.every(g=>g.open)?'Collapse all':'Expand all'};
G.forEach(g=>g.addEventListener('toggle',sync));
btn.addEventListener('click',()=>{const o=!G.every(g=>g.open);G.forEach(g=>g.open=o);sync()});
q.addEventListener('input',()=>{const v=q.value.trim().toLowerCase();let any=false;
document.querySelectorAll('#gl-wrap .gl').forEach(el=>{const m=!v||el.textContent.toLowerCase().includes(v);el.hidden=!m;if(m)any=true});
G.forEach(g=>{const hit=g.querySelectorAll('.gl:not([hidden])').length>0;g.hidden=!hit;if(v)g.open=hit});sync();
document.getElementById('gl-none').hidden=any;})})();
