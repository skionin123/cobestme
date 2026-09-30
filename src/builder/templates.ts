import { createDefaultProject } from './defaultProject'
import { createPrebuiltSection } from './elements'
import { clone, uid } from './tree'
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

function setBaseStyles(project:BuilderProject, variant:TemplateCategory){
  if(variant==='Editorial'){
    project.globals.colors={ink:'#201c18',surface:'#fbf8f3',muted:'#f0ebe3',accent:'#8a5b3d',subtle:'#6e655d',line:'#ddd4c8'}
    project.globals.textStyles.body={fontFamily:'DM Sans, Arial, sans-serif',fontSize:'16px',lineHeight:'1.7',fontWeight:'400'}
    project.globals.textStyles.display={fontFamily:'Playfair Display, Georgia, serif',fontWeight:'600',letterSpacing:'-0.035em',lineHeight:'1.02'}
    project.globals.textStyles.heading={fontFamily:'Playfair Display, Georgia, serif',fontWeight:'600',letterSpacing:'-0.025em',lineHeight:'1.1'}
    project.styles['page-shell'].desktop.none={...project.styles['page-shell'].desktop.none,fontFamily:'DM Sans, Arial, sans-serif'}
    project.styles.hero.desktop.none={...project.styles.hero.desktop.none,minHeight:'68vh',padding:'94px 7vw',background:'linear-gradient(180deg,#fbf8f3 0%,#f4eee6 100%)'}
    project.styles.display.desktop.none={...project.styles.display.desktop.none,fontSize:'74px',fontWeight:'600',lineHeight:'1.01',letterSpacing:'-0.045em',maxWidth:'900px'}
    project.styles.section.desktop.none={...project.styles.section.desktop.none,padding:'82px 7vw'}
    project.styles.card.desktop.none={...project.styles.card.desktop.none,borderRadius:'4px',boxShadow:'none'}
    project.styles.button.desktop.none={...project.styles.button.desktop.none,borderRadius:'999px',padding:'13px 20px'}
  } else {
    project.globals.colors={ink:'#111827',surface:'#ffffff',muted:'#f6f7f9',accent:'#2563eb',subtle:'#5f6875',line:'#e5e7eb'}
    project.globals.textStyles.body={fontFamily:'Inter, Arial, sans-serif',fontSize:'16px',lineHeight:'1.65',fontWeight:'400'}
    project.globals.textStyles.display={fontFamily:'Manrope, Arial, sans-serif',fontWeight:'700',letterSpacing:'-0.045em',lineHeight:'1'}
    project.globals.textStyles.heading={fontFamily:'Manrope, Arial, sans-serif',fontWeight:'650',letterSpacing:'-0.03em',lineHeight:'1.08'}
    project.styles['page-shell'].desktop.none={...project.styles['page-shell'].desktop.none,fontFamily:'Inter, Arial, sans-serif'}
    project.styles.hero.desktop.none={...project.styles.hero.desktop.none,minHeight:'64vh',padding:'88px 6vw',background:'linear-gradient(135deg,#ffffff 0%,#f5f7fb 100%)'}
    project.styles.display.desktop.none={...project.styles.display.desktop.none,fontSize:'68px',fontWeight:'720',lineHeight:'0.98',letterSpacing:'-0.05em',maxWidth:'900px'}
    project.styles.section.desktop.none={...project.styles.section.desktop.none,padding:'72px 6vw'}
    project.styles.card.desktop.none={...project.styles.card.desktop.none,borderRadius:'12px',boxShadow:'0 10px 28px rgba(17,24,39,.05)'}
    project.styles.button.desktop.none={...project.styles.button.desktop.none,borderRadius:'8px'}
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
  project.id=uid('template')
  project.updatedAt=new Date().toISOString()
  return project
}

export const builderTemplates:BuilderTemplate[]=[
  {
    id:'essential',
    name:'Essential',
    category:'Essential',
    accent:'#2563eb',
    description:'A clean, neutral foundation with only the sections most sites need. Best when you want every edit to be obvious.',
    build:()=>templateProject('Essential',['features'],'Clear, credible, ready to grow.','A simple professional starting point with generous space, strong hierarchy, and very little visual noise.')
  },
  {
    id:'editorial',
    name:'Editorial',
    category:'Editorial',
    accent:'#8a5b3d',
    description:'A refined typography-led foundation for brands, ecommerce, portfolios, and content without becoming visually busy.',
    build:()=>templateProject('Editorial',['testimonials','cta'],'A refined home for your brand.','A restrained editorial starting point with warmer typography, clear rhythm, and room for your content to lead.')
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
