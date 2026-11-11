// Styles for the ready-made sections ("the section kit").
//
// Projects created from older templates may not define these classes. When a
// section is added, any missing class is copied into the project once, so the
// section looks finished immediately and the owner's own styles are never
// overwritten.
import { clone } from './tree'
import type { BuilderNode, BuilderProject, StyleMap } from './types'

const focusRing={outline:'2px solid var(--accent)',outlineOffset:'3px',borderRadius:'4px'}

export const kitStyles:StyleMap={
  box:{desktop:{none:{padding:'16px'}}},
  link:{desktop:{none:{color:'var(--accent)',textDecoration:'underline',textUnderlineOffset:'3px'},hover:{opacity:'.8'},focused:focusRing}},
  image:{desktop:{none:{maxWidth:'100%',height:'auto',borderRadius:'12px',background:'var(--muted)'}}},
  'brand-link':{desktop:{none:{fontWeight:'760',letterSpacing:'-0.02em',textDecoration:'none',fontSize:'17px',color:'var(--ink)'},focused:focusRing}},
  'nav-link':{desktop:{
    none:{fontSize:'15px',fontWeight:'520',textDecoration:'none',color:'var(--subtle)',transition:'color .18s ease'},
    hover:{color:'var(--ink)'},focused:{...focusRing,color:'var(--ink)'},
  }},
  'section-intro':{desktop:{none:{fontSize:'18px',lineHeight:'1.65',color:'var(--subtle)',margin:'-12px 0 32px',maxWidth:'60ch'}}},
  'card-title':{desktop:{none:{fontSize:'21px',lineHeight:'1.2',letterSpacing:'-0.02em',margin:'0 0 10px',fontWeight:'680',color:'var(--ink)'}}},
  'card-copy':{desktop:{none:{fontSize:'15px',lineHeight:'1.68',color:'var(--subtle)',margin:'0'}}},
  price:{desktop:{none:{fontSize:'30px',lineHeight:'1.1',fontWeight:'700',letterSpacing:'-0.02em',color:'var(--ink)',margin:'4px 0 10px'}}},
  // Buttons that sit on a dark background (call-to-action sections).
  'button-light':{desktop:{none:{background:'#ffffff',color:'#111318',borderColor:'#ffffff'},hover:{opacity:'.92'}}},
  'cta-title':{desktop:{none:{fontSize:'40px',lineHeight:'1.08',letterSpacing:'-0.03em',margin:'0 auto',maxWidth:'22ch'}},mobilePortrait:{none:{fontSize:'30px'}}},
  'cta-copy':{desktop:{none:{fontSize:'18px',lineHeight:'1.65',maxWidth:'58ch',margin:'12px auto 0',opacity:'.85'}}},
  'faq-list':{desktop:{none:{display:'grid',gap:'10px',maxWidth:'780px'}}},
  'faq-item':{desktop:{none:{border:'1px solid var(--line)',borderRadius:'12px',background:'var(--surface)',padding:'2px 18px'}}},
  'faq-question':{desktop:{none:{fontSize:'17px',lineHeight:'1.4',fontWeight:'650',padding:'14px 0',color:'var(--ink)',margin:'0'}}},
  'faq-answer':{desktop:{none:{margin:'0 0 16px',fontSize:'16px',lineHeight:'1.65',color:'var(--subtle)'}}},
  split:{desktop:{none:{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'48px',alignItems:'center'}},mobileLandscape:{none:{gridTemplateColumns:'1fr',gap:'28px'}}},
  // The soft background shows while a photo loads (or if it cannot load).
  'split-image':{desktop:{none:{width:'100%',aspectRatio:'4/3',objectFit:'cover',borderRadius:'16px',background:'var(--muted)'}}},
  'gallery-grid':{desktop:{none:{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'16px'}},mobileLandscape:{none:{gridTemplateColumns:'repeat(2,minmax(0,1fr))'}},mobilePortrait:{none:{gridTemplateColumns:'1fr'}}},
  'gallery-image':{desktop:{none:{width:'100%',aspectRatio:'1/1',objectFit:'cover',borderRadius:'12px',background:'var(--muted)'}}},
  'contact-layout':{desktop:{none:{display:'grid',gridTemplateColumns:'minmax(0,5fr) minmax(0,6fr)',gap:'48px',alignItems:'start'}},mobileLandscape:{none:{gridTemplateColumns:'1fr',gap:'24px'}}},
  form:{desktop:{none:{display:'grid',gap:'16px',padding:'28px',border:'1px solid var(--line)',borderRadius:'16px',background:'var(--surface)'}},mobilePortrait:{none:{padding:'20px'}}},
  'form-field':{desktop:{none:{display:'grid',gap:'6px'}}},
  'form-label':{desktop:{none:{fontSize:'14px',fontWeight:'600',color:'var(--ink)'}}},
  // 16px text stops phones from zooming in when a field is tapped.
  'form-input':{desktop:{
    none:{width:'100%',padding:'12px 14px',fontSize:'16px',lineHeight:'1.4',color:'var(--ink)',background:'#ffffff',border:'1px solid var(--line)',borderRadius:'10px'},
    focused:{outline:'2px solid var(--accent)',outlineOffset:'1px'},
  }},
  'form-textarea':{desktop:{none:{minHeight:'140px',resize:'vertical'}}},
  'form-button':{desktop:{none:{marginTop:'4px',justifySelf:'start'}}},
  'form-success':{desktop:{none:{padding:'12px 14px',borderRadius:'10px',background:'#ecfdf3',color:'#05603a',fontWeight:'600'}}},
  'form-error':{desktop:{none:{padding:'12px 14px',borderRadius:'10px',background:'#fef3f2',color:'#b42318',fontWeight:'600'}}},
  'video-frame':{desktop:{none:{width:'100%',aspectRatio:'16/9',border:'0',borderRadius:'12px',display:'block'}}},
  'footer-copy':{desktop:{none:{margin:'0',fontSize:'14px',lineHeight:'1.5',color:'var(--subtle)'}}},
  'footer-links':{desktop:{none:{display:'flex',flexWrap:'wrap',gap:'8px 20px'}}},
  'footer-link':{desktop:{
    none:{fontSize:'14px',textDecoration:'none',color:'var(--subtle)',fontWeight:'600'},
    hover:{color:'var(--ink)'},focused:{...focusRing,color:'var(--ink)'},
  }},
}

/**
 * Copy any kit class used by `node` (or its children) that the project does
 * not define yet. Existing classes are left exactly as the owner styled them.
 * Returns the names that were added.
 */
export function ensureKitStyles(project:BuilderProject,node:BuilderNode):string[]{
  const used=new Set<string>()
  const walk=(current:BuilderNode)=>{
    for(const name of current.classes||[])used.add(name)
    for(const child of current.children||[])walk(child)
  }
  walk(node)
  const added:string[]=[]
  // Kit order is kept so later classes (e.g. button-light) override earlier ones.
  for(const name of Object.keys(kitStyles)){
    if(!used.has(name)||project.styles[name])continue
    project.styles[name]=clone(kitStyles[name])
    added.push(name)
  }
  return added
}
