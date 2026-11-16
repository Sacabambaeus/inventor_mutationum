
(()=>{'use strict';
const toggle=document.getElementById('sources-toggle'),panel=document.getElementById('sources-panel');
function show(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.classList.toggle('active',open);}
toggle.addEventListener('click',()=>show(panel.hidden));
document.getElementById('open-sources').addEventListener('click',()=>{show(true);toggle.focus();toggle.scrollIntoView({block:'start'});});
const tabs=[...document.querySelectorAll('#source-language-tabs [role=tab]')];
function language(tab,focus=false){for(const t of tabs){const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!selected;}if(focus)tab.focus();}
for(const tab of tabs){tab.addEventListener('click',()=>language(tab));tab.addEventListener('keydown',event=>{let index=tabs.indexOf(tab);if(event.key==='ArrowRight')index=(index+1)%tabs.length;else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;event.preventDefault();language(tabs[index],true);});}
})();
