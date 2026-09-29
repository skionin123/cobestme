import { compileInteractionRuntime, compileProjectCss, renderPageBody } from './compiler'
import type { BuilderNode, BuilderProject, ExportedProject } from './types'

type ZipValue=string|Uint8Array

const encoder=new TextEncoder()

function crc32(data:Uint8Array){
  let crc=0xffffffff
  for(const byte of data){
    crc^=byte
    for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)
  }
  return (crc^0xffffffff)>>>0
}

function u16(n:number){return new Uint8Array([n&255,(n>>>8)&255])}
function u32(n:number){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
function concat(parts:Uint8Array[]){
  const size=parts.reduce((n,p)=>n+p.length,0)
  const out=new Uint8Array(size)
  let offset=0
  for(const part of parts){out.set(part,offset);offset+=part.length}
  return out
}

function dosDateTime(date=new Date()){
  const year=Math.max(1980,date.getFullYear())
  const time=(date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1)
  const day=(year-1980)<<9 | (date.getMonth()+1)<<5 | date.getDate()
  return {time,day}
}

export function makeZip(files:Record<string,ZipValue>){
  const locals:Uint8Array[]=[]
  const centrals:Uint8Array[]=[]
  let offset=0
  const {time,day}=dosDateTime()
  for(const [name,value] of Object.entries(files)){
    const nameBytes=encoder.encode(name)
    const data=typeof value==='string'?encoder.encode(value):value
    const crc=crc32(data)
    const local=concat([
      u32(0x04034b50),u16(20),u16(0),u16(0),u16(time),u16(day),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),nameBytes,data
    ])
    locals.push(local)
    const central=concat([
      u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(time),u16(day),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBytes
    ])
    centrals.push(central)
    offset+=local.length
  }
  const centralBlob=concat(centrals)
  const end=concat([
    u32(0x06054b50),u16(0),u16(0),u16(centrals.length),u16(centrals.length),u32(centralBlob.length),u32(offset),u16(0)
  ])
  return concat([...locals,centralBlob,end])
}

function pageFileName(slug:string){
  if(slug==='/'||!slug)return 'index.html'
  return slug.replace(/^\//,'').replace(/\/$/,'').replace(/[^a-zA-Z0-9/_-]/g,'-').replaceAll('/','-')+'.html'
}

function shellHtml(project:BuilderProject,pageId:string,cssPath='styles.css',jsPath='site.js',cmsItemId?:string){
  const page=project.pages.find(p=>p.id===pageId)||project.pages[0]
  const body=renderPageBody(project,page.id,false,cmsItemId)
  const title=page.seo.title||page.name
  const description=page.seo.description||''
  const og=page.seo.ogImage?`<meta property="og:image" content="${page.seo.ogImage}">`:''
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  ${og}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Manrope:wght@300;400;500;600;700;800&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${cssPath}">
</head>
<body>
${body}
<script src="${jsPath}" defer></script>
</body>
</html>`
}

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]||ch))}
function escapeAttr(value=''){return escapeHtml(value).replace(/\n/g,' ')}

function siteRuntime(project:BuilderProject){
  return `(() => {
  document.querySelectorAll('.nav-menu-button').forEach(button=>button.addEventListener('click',()=>{
    const nav=button.closest('nav');const links=nav?.querySelector('.nav-links');if(!links)return;
    const open=links.dataset.open==='true';links.dataset.open=String(!open);links.style.display=open?'':'flex';
  }));
  document.querySelectorAll('[data-tabs]').forEach(tabs=>{
    const buttons=[...tabs.querySelectorAll('[data-tab]')];const panes=[...tabs.querySelectorAll('[data-pane]')];
    buttons.forEach((button,index)=>button.addEventListener('click',()=>{buttons.forEach(x=>x.removeAttribute('aria-selected'));panes.forEach(x=>x.hidden=true);button.setAttribute('aria-selected','true');if(panes[index])panes[index].hidden=false;}));
  });
  document.querySelectorAll('[data-slider]').forEach(slider=>{
    const slides=[...slider.children];let index=0;const show=()=>slides.forEach((x,i)=>x.hidden=i!==index);show();
    slider.addEventListener('click',()=>{index=(index+1)%slides.length;show()});
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
  ${compileInteractionRuntime(project)}
})();`
}

function sitemap(project:BuilderProject){
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${project.pages.map(page=>`  <url><loc>${page.slug}</loc></url>`).join('\n')}
</urlset>`
}

function dataUrlToBytes(url:string){
  const match=url.match(/^data:([^;,]+)?(;base64)?,(.*)$/)
  if(!match)return null
  if(match[2]){
    const raw=atob(match[3])
    const bytes=new Uint8Array(raw.length)
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i)
    return bytes
  }
  return encoder.encode(decodeURIComponent(match[3]))
}

export function exportFiles(project:BuilderProject){
  const files:Record<string,ZipValue>={}
  const assetPaths=new Map<string,string>()
  for(const asset of project.assets){
    if(!asset.url.startsWith('data:'))continue
    const safe=(asset.id+'-'+asset.name).replace(/[^a-zA-Z0-9._-]/g,'-')
    const path='assets/'+safe
    const bytes=dataUrlToBytes(asset.url)
    if(bytes){files[path]=bytes;assetPaths.set(asset.url,path)}
  }
  const rewriteAssets=(value:string)=>{
    let next=value
    for(const [url,path] of assetPaths)next=next.split(url).join(path)
    return next
  }
  files['styles.css']=rewriteAssets(compileProjectCss(project))
  files['site.js']=siteRuntime(project)
  for(const page of project.pages){
    if(page.isCollectionTemplate&&page.collectionId){
      const collection=project.collections.find(c=>c.id===page.collectionId)
      if(collection){
        const slugField=collection.fields.find(f=>f.slug==='slug')
        const titleField=collection.fields.find(f=>f.slug==='title')||collection.fields[0]
        for(const item of collection.items){
          const raw=(slugField&&item.values[slugField.id])||(titleField&&item.values[titleField.id])||item.id
          const itemSlug=String(raw).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item'
          files[`${collection.slug}-${itemSlug}.html`]=rewriteAssets(shellHtml(project,page.id,'styles.css','site.js',item.id))
        }
        continue
      }
    }
    files[pageFileName(page.slug)]=rewriteAssets(shellHtml(project,page.id))
  }
  files['sitemap.xml']=sitemap(project)
  const exported:ExportedProject={schemaVersion:1,project,exportedAt:new Date().toISOString()}
  files['project.cobest.json']=JSON.stringify(exported,null,2)
  return files
}

export function downloadProjectZip(project:BuilderProject){
  const zip=makeZip(exportFiles(project))
  const blob=new Blob([zip],{type:'application/zip'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url;a.download=`${project.name.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'cobest-site'}.zip`;a.click()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}

export function downloadProjectJson(project:BuilderProject){
  const exported:ExportedProject={schemaVersion:1,project,exportedAt:new Date().toISOString()}
  const blob=new Blob([JSON.stringify(exported,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a');a.href=url;a.download='project.cobest.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}

export async function importProjectJson(file:File){
  const text=await file.text()
  const data=JSON.parse(text) as ExportedProject
  if(data?.schemaVersion!==1||!data.project?.pages)throw new Error('This is not a supported CoBest project file.')
  return data.project
}
