import { createDefaultProject } from './defaultProject'
import { createPrebuiltSection } from './elements'
import { clone, uid, walkNodes } from './tree'
import type { BuilderProject } from './types'

export type TemplateCategory='Essential'|'Editorial'

export interface BuilderTemplate {
  id:string
  name:string
  category:TemplateCategory
  description:string
  accent:string
  build:()=>BuilderProject
}

function decorateProject(project:BuilderProject,variant:TemplateCategory){
  const page=project.pages[0]
  walkNodes(page.root,node=>{
    if(node.name==='Hero Container'&&!node.classes.includes('hero-inner')) node.classes=[...(node.classes||[]),'hero-inner']
    if(node.name==='Features') node.classes=[...(node.classes||[]),variant==='Editorial'?'editorial-section':'soft-section']
    if(node.name==='Testimonials') node.classes=[...(node.classes||[]),'editorial-section']
  })
}

function setSharedStyles(project:BuilderProject){
  project.styles.container.desktop.none={
    ...project.styles.container.desktop.none,
    width:'min(1120px,calc(100% - 48px))',
    marginLeft:'auto',
    marginRight:'auto'
  }
  project.styles['site-nav'].desktop.none={
    ...project.styles['site-nav'].desktop.none,
    padding:'18px clamp(24px,5vw,72px)',
    borderBottom:'1px solid var(--line)',
    background:'var(--surface)',
    position:'relative',
    zIndex:'2'
  }
  project.styles['site-nav'].mobileLandscape={none:{padding:'14px 20px'}}
  project.styles['nav-links'].desktop.none={display:'flex',alignItems:'center',gap:'clamp(18px,2.5vw,34px)'}
  project.styles['nav-links'].mobileLandscape={none:{display:'none'}}
  project.styles['nav-menu-button'].desktop.none={
    display:'none',border:'0',background:'transparent',fontSize:'24px',color:'var(--ink)',padding:'8px'
  }
  project.styles['nav-menu-button'].mobileLandscape={none:{display:'inline-flex'}}
  project.styles['brand-link']={desktop:{
    none:{fontWeight:'760',letterSpacing:'-0.025em',textDecoration:'none',fontSize:'15px'},
    focused:{outline:'2px solid var(--accent)',outlineOffset:'4px',borderRadius:'4px'}
  }}
  project.styles['nav-link']={desktop:{
    none:{fontSize:'14px',fontWeight:'520',textDecoration:'none',color:'var(--subtle)',transition:'color .18s ease,opacity .18s ease'},
    hover:{color:'var(--ink)'},
    focused:{outline:'2px solid var(--accent)',outlineOffset:'4px',borderRadius:'4px',color:'var(--ink)'}
  }}
  project.styles.button.desktop={
    none:{
      display:'inline-flex',alignItems:'center',justifyContent:'center',marginTop:'28px',padding:'13px 19px',
      background:'var(--ink)',color:'#ffffff',borderRadius:'9px',textDecoration:'none',border:'1px solid var(--ink)',
      cursor:'pointer',fontWeight:'650',fontSize:'14px',lineHeight:'1.2',
      transition:'transform .18s ease,box-shadow .18s ease,background .18s ease'
    },
    hover:{transform:'translateY(-1px)',boxShadow:'0 8px 22px rgba(17,24,39,.12)'},
    focused:{outline:'3px solid var(--accent)',outlineOffset:'3px'}
  }
  project.styles.lead.desktop.none={
    fontSize:'clamp(17px,1.5vw,20px)',lineHeight:'1.65',maxWidth:'62ch',color:'var(--subtle)',margin:'0'
  }
  project.styles.section.desktop.none={padding:'clamp(64px,8vw,112px) clamp(24px,6vw,80px)'}
  project.styles.section.mobilePortrait={none:{padding:'54px 20px'}}
  project.styles['section-title'].desktop.none={
    fontSize:'clamp(34px,4.2vw,56px)',lineHeight:'1.04',letterSpacing:'-0.04em',margin:'0 0 34px',maxWidth:'16ch'
  }
  project.styles['feature-grid'].desktop.none={display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'18px'}
  project.styles['feature-grid'].tablet={none:{gridTemplateColumns:'repeat(2,minmax(0,1fr))'}}
  project.styles['feature-grid'].mobilePortrait={none:{gridTemplateColumns:'1fr'}}
  project.styles.paragraph.desktop.none={fontSize:'16px',lineHeight:'1.7',color:'var(--subtle)',maxWidth:'68ch'}
  project.styles.heading.desktop.none={fontSize:'clamp(28px,3vw,42px)',lineHeight:'1.08',letterSpacing:'-0.03em',margin:'0 0 14px'}
  project.styles['card-title']={desktop:{none:{fontSize:'clamp(18px,2vw,23px)',lineHeight:'1.15',letterSpacing:'-0.025em',margin:'0 0 10px',fontWeight:'680'}}}
  project.styles['card-copy']={desktop:{none:{fontSize:'15px',lineHeight:'1.68',color:'var(--subtle)',margin:'0',maxWidth:'36ch'}}}
  project.styles['cta-copy']={desktop:{none:{fontSize:'clamp(16px,1.5vw,19px)',lineHeight:'1.65',maxWidth:'58ch',margin:'12px 0 0',opacity:'.8'}}}
  project.styles['footer-copy']={desktop:{none:{margin:'0',fontSize:'13px',lineHeight:'1.5'}}}
  project.styles['footer-link']={desktop:{
    none:{fontSize:'13px',textDecoration:'none',color:'var(--subtle)',fontWeight:'600'},
    hover:{color:'var(--ink)'},
    focused:{outline:'2px solid var(--accent)',outlineOffset:'4px',borderRadius:'4px',color:'var(--ink)'}
  }}
  project.styles['site-footer'].desktop.none={
    display:'flex',justifyContent:'space-between',alignItems:'center',gap:'24px',
    padding:'32px clamp(24px,5vw,72px)',borderTop:'1px solid var(--line)',fontSize:'13px',color:'var(--subtle)'
  }
  project.styles['site-footer'].mobilePortrait={none:{flexDirection:'column',alignItems:'flex-start',padding:'28px 20px'}}
}

function setBaseStyles(project:BuilderProject, variant:TemplateCategory){
  setSharedStyles(project)
  if(variant==='Editorial'){
    project.globals.colors={
      ink:'#211d19',surface:'#fcfaf6',muted:'#f2ede6',accent:'#8d5c3f',subtle:'#6f665e',line:'#ddd5cb'
    }
    project.globals.textStyles.body={fontFamily:'DM Sans, Arial, sans-serif',fontSize:'16px',lineHeight:'1.72',fontWeight:'400'}
    project.globals.textStyles.display={fontFamily:'Playfair Display, Georgia, serif',fontWeight:'600',letterSpacing:'-0.035em',lineHeight:'1.02'}
    project.globals.textStyles.heading={fontFamily:'Playfair Display, Georgia, serif',fontWeight:'600',letterSpacing:'-0.025em',lineHeight:'1.08'}
    project.styles['page-shell'].desktop.none={
      ...project.styles['page-shell'].desktop.none,fontFamily:'DM Sans, Arial, sans-serif',
      color:'var(--ink)',background:'var(--surface)',minHeight:'100vh'
    }
    project.styles.hero.desktop.none={
      minHeight:'70vh',display:'grid',alignItems:'center',
      padding:'clamp(84px,11vw,150px) clamp(24px,7vw,96px)',
      background:'linear-gradient(180deg,#fcfaf6 0%,#f3ece4 100%)',
      borderBottom:'1px solid var(--line)'
    }
    project.styles.hero.mobilePortrait={none:{minHeight:'auto',padding:'68px 20px'}}
    project.styles['hero-inner']={desktop:{none:{width:'min(1120px,100%)',margin:'0 auto'}}}
    project.styles.display.desktop.none={
      fontFamily:'Playfair Display, Georgia, serif',
      fontSize:'clamp(48px,7.8vw,104px)',fontWeight:'600',lineHeight:'.98',
      letterSpacing:'-0.045em',margin:'0 0 26px',maxWidth:'10.5ch'
    }
    project.styles['section-title'].desktop.none={
      ...project.styles['section-title'].desktop.none,
      fontFamily:'Playfair Display, Georgia, serif',fontWeight:'600',maxWidth:'13ch'
    }
    project.styles.card.desktop.none={
      padding:'clamp(24px,3vw,34px)',border:'1px solid var(--line)',borderRadius:'3px',
      background:'var(--surface)',boxShadow:'none'
    }
    project.styles.quote.desktop.none={
      fontFamily:'Playfair Display, Georgia, serif',fontSize:'clamp(28px,4vw,44px)',lineHeight:'1.28',
      letterSpacing:'-0.025em',margin:'0',padding:'32px 0',
      borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)',borderLeft:'0',background:'transparent'
    }
    project.styles.cta.desktop.none={
      padding:'clamp(72px,10vw,128px) clamp(24px,7vw,96px)',textAlign:'left',
      background:'#211d19',color:'#fcfaf6'
    }
    project.styles.button.desktop.none={
      ...project.styles.button.desktop.none,borderRadius:'999px',padding:'13px 22px'
    }
    project.styles['editorial-section']={desktop:{none:{background:'var(--muted)'}}}
  } else {
    project.globals.colors={
      ink:'#111827',surface:'#ffffff',muted:'#f5f7fa',accent:'#2563eb',subtle:'#5c6674',line:'#e3e7ed'
    }
    project.globals.textStyles.body={fontFamily:'Inter, Arial, sans-serif',fontSize:'16px',lineHeight:'1.68',fontWeight:'400'}
    project.globals.textStyles.display={fontFamily:'Manrope, Arial, sans-serif',fontWeight:'720',letterSpacing:'-0.05em',lineHeight:'.98'}
    project.globals.textStyles.heading={fontFamily:'Manrope, Arial, sans-serif',fontWeight:'680',letterSpacing:'-0.035em',lineHeight:'1.06'}
    project.styles['page-shell'].desktop.none={
      ...project.styles['page-shell'].desktop.none,fontFamily:'Inter, Arial, sans-serif',
      color:'var(--ink)',background:'var(--surface)',minHeight:'100vh'
    }
    project.styles.hero.desktop.none={
      minHeight:'68vh',display:'grid',alignItems:'center',
      padding:'clamp(76px,10vw,132px) clamp(24px,6vw,88px)',
      background:'linear-gradient(135deg,#ffffff 0%,#f4f7fb 100%)',
      borderBottom:'1px solid var(--line)'
    }
    project.styles.hero.mobilePortrait={none:{minHeight:'auto',padding:'62px 20px'}}
    project.styles['hero-inner']={desktop:{none:{width:'min(1120px,100%)',margin:'0 auto'}}}
    project.styles.display.desktop.none={
      fontFamily:'Manrope, Arial, sans-serif',
      fontSize:'clamp(44px,7vw,88px)',fontWeight:'720',lineHeight:'.98',
      letterSpacing:'-0.055em',margin:'0 0 24px',maxWidth:'11ch'
    }
    project.styles['section-title'].desktop.none={
      ...project.styles['section-title'].desktop.none,fontFamily:'Manrope, Arial, sans-serif',fontWeight:'680'
    }
    project.styles.card.desktop.none={
      padding:'clamp(22px,3vw,32px)',border:'1px solid var(--line)',borderRadius:'14px',
      background:'var(--surface)',boxShadow:'0 10px 30px rgba(17,24,39,.055)'
    }
    project.styles['soft-section']={desktop:{none:{background:'var(--muted)'}}}
    project.styles.cta.desktop.none={
      padding:'clamp(72px,9vw,112px) clamp(24px,6vw,88px)',textAlign:'center',
      background:'var(--ink)',color:'#ffffff'
    }
  }
}

function templateProject(variant:TemplateCategory,sections:string[],headline:string,copy:string){
  const project=createDefaultProject()
  project.name=variant
  setBaseStyles(project,variant)
  const home=project.pages[0]
  home.root.children=[
    createPrebuiltSection('navbar'),
    createPrebuiltSection('hero'),
    ...sections.map(createPrebuiltSection),
    createPrebuiltSection('footer')
  ].map(node=>clone(node))
  const hero=home.root.children.find(n=>n.name==='Hero')
  const heading=hero?.children?.[0]?.children?.find(n=>n.type==='heading')
  const paragraph=hero?.children?.[0]?.children?.find(n=>n.type==='paragraph')
  if(heading)heading.content=headline
  if(paragraph)paragraph.content=copy
  decorateProject(project,variant)
  project.id=uid('template')
  project.updatedAt=new Date().toISOString()
  return project
}

export const builderTemplates:BuilderTemplate[]=[
  {
    id:'essential',
    name:'Simple',
    category:'Essential',
    accent:'#2563eb',
    description:'A clean, neutral foundation with fluid type, disciplined spacing, clear cards, and accessible interaction states.',
    build:()=>templateProject(
      'Essential',
      ['features'],
      'Clear, credible, ready to grow.',
      'A professional starting point with generous whitespace, strong hierarchy, and just enough structure to make every edit obvious.'
    )
  },
  {
    id:'editorial',
    name:'Professional',
    category:'Editorial',
    accent:'#8d5c3f',
    description:'A refined serif-led foundation with warm neutrals, hairline borders, strong rhythm, and restrained visual detail.',
    build:()=>templateProject(
      'Editorial',
      ['testimonials','cta'],
      'A refined home for your brand.',
      'A calm editorial system for brands, portfolios, ecommerce, and content where typography and spacing do most of the visual work.'
    )
  }
]

export function applyTemplate(template:BuilderTemplate,current:BuilderProject){
  const next=template.build()
  next.id=current.id
  next.name=current.name==='Untitled CoBest Site'?template.name:current.name
  next.assets=clone(current.assets||[])
  next.version=(current.version||0)+1
  next.versions=clone(current.versions||[])
  return next
}
