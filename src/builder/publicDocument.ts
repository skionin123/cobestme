import { compileInteractionRuntime, compileProjectCss, renderPageBody } from './compiler'
import type { BuilderProject } from './types'

export function createPublishedDocument(project:BuilderProject,pageId:string){
  const css=compileProjectCss(project)
  const body=renderPageBody(project,pageId,false)
  const interactions=compileInteractionRuntime(project)
  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=Manrope:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
${css}
[data-form-success],[data-form-error]{display:none}
form[data-state="success"] [data-form-success]{display:block}
form[data-state="error"] [data-form-error]{display:block}
</style>
</head>
<body>
${body}
<script>
(() => {
  const send=(type,payload={})=>parent.postMessage({source:'cobest-public-visual',type,...payload},'*');
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href]');
    if(!link)return;
    const href=link.getAttribute('href')||'';
    if(href.startsWith('/')&&!href.startsWith('//')){
      event.preventDefault();send('navigate',{href});
    }
  });
  document.querySelectorAll('.nav-menu-button').forEach(button=>button.addEventListener('click',event=>{
    event.preventDefault();const nav=button.closest('nav');const links=nav?.querySelector('.nav-links');if(!links)return;
    const open=links.dataset.open==='true';links.dataset.open=String(!open);links.style.display=open?'':'flex';
  }));
  document.querySelectorAll('[data-tabs]').forEach(tabs=>{
    const buttons=[...tabs.querySelectorAll('[data-tab]')],panes=[...tabs.querySelectorAll('[data-pane]')];
    panes.forEach((pane,index)=>pane.hidden=index!==0);
    buttons.forEach((button,index)=>button.addEventListener('click',event=>{event.preventDefault();buttons.forEach(x=>x.removeAttribute('aria-selected'));panes.forEach(x=>x.hidden=true);button.setAttribute('aria-selected','true');if(panes[index])panes[index].hidden=false}));
  });
  document.querySelectorAll('[data-slider]').forEach(slider=>{
    const slides=[...slider.children];let index=0;const show=()=>slides.forEach((x,i)=>x.hidden=i!==index);show();
    slider.addEventListener('click',event=>{event.preventDefault();index=(index+1)%slides.length;show()});
  });
  document.querySelectorAll('[data-dropdown]').forEach(dropdown=>{
    const toggle=dropdown.querySelector('[data-dropdown-toggle]'),list=dropdown.querySelector('[data-dropdown-list]');
    toggle?.addEventListener('click',event=>{event.preventDefault();if(list)list.hidden=!list.hidden});
  });
  document.querySelectorAll('[data-lightbox]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();const src=link.getAttribute('href');if(!src)return;
    const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.86);display:grid;place-items:center;padding:30px;cursor:zoom-out';
    const img=document.createElement('img');img.src=src;img.style.cssText='max-width:min(1200px,92vw);max-height:90vh;object-fit:contain';overlay.appendChild(img);overlay.onclick=()=>overlay.remove();document.body.appendChild(overlay);
  }));
  document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>{
    const action=form.getAttribute('action');if(!action||action==='#'){event.preventDefault();form.dataset.state='success';}
  }));
  ${interactions}
})()
</script>
</body>
</html>`
}
