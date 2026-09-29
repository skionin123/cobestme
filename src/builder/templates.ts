import { createDefaultProject } from './defaultProject'
import { createPrebuiltSection } from './elements'
import { clone, uid } from './tree'
import type { BuilderProject } from './types'

export type TemplateCategory='Business'|'Portfolio'|'Agency'|'SaaS'|'Ecommerce'|'Restaurant'|'Personal'|'Blog'

export interface BuilderTemplate {
  id:string
  name:string
  category:TemplateCategory
  description:string
  accent:string
  build:()=>BuilderProject
}

function templateProject(name:string,category:TemplateCategory,accent:string,sections:string[],headline:string,copy:string){
  const project=createDefaultProject()
  project.name=name
  project.globals.colors.accent=accent
  project.globals.colors.ink=category==='Restaurant'?'#261c16':'#121316'
  const home=project.pages[0]
  home.root.children=[
    createPrebuiltSection('navbar'),
    createPrebuiltSection('hero'),
    ...sections.map(createPrebuiltSection),
    createPrebuiltSection('footer')
  ]
  home.root.children=home.root.children.map(node=>clone(node))
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
  {id:'business',name:'Northstar Business',category:'Business',accent:'#2563eb',description:'Professional services with credibility, features, FAQ, and contact.',build:()=>templateProject('Northstar Business','Business','#2563eb',['features','testimonials','faq','contact'],'Build trust before the first conversation.','A polished business website with a clear story, proof, and conversion path.')},
  {id:'portfolio',name:'Frame Portfolio',category:'Portfolio',accent:'#7c3aed',description:'A minimal creative portfolio with strong typography and project storytelling.',build:()=>templateProject('Frame Portfolio','Portfolio','#7c3aed',['features','testimonials','cta'],'Selected work, deliberately presented.','A quiet canvas for designers, photographers, architects, and independent creatives.')},
  {id:'agency',name:'Signal Agency',category:'Agency',accent:'#ea580c',description:'Bold agency landing structure with services, proof, pricing, and CTA.',build:()=>templateProject('Signal Agency','Agency','#ea580c',['features','testimonials','pricing','cta'],'Strategy, design, and execution without the handoffs.','A confident agency structure for turning expertise into qualified conversations.')},
  {id:'saas',name:'Orbit SaaS',category:'SaaS',accent:'#4f46e5',description:'Product-led SaaS page with features, pricing, FAQ, and conversion sections.',build:()=>templateProject('Orbit SaaS','SaaS','#4f46e5',['features','pricing','testimonials','faq','cta'],'One product. A clearer way to work.','Explain the product quickly, demonstrate value, and move visitors toward a trial.')},
  {id:'ecommerce',name:'Field Shop',category:'Ecommerce',accent:'#166534',description:'Editorial commerce landing page that pairs naturally with CoBest Shop.',build:()=>templateProject('Field Shop','Ecommerce','#166534',['features','testimonials','cta'],'Considered goods for everyday life.','Use the visual site for brand storytelling and CoBest Shop for live products and checkout.')},
  {id:'restaurant',name:'Supper House',category:'Restaurant',accent:'#b45309',description:'Warm restaurant website with story, highlights, FAQ, and contact.',build:()=>templateProject('Supper House','Restaurant','#b45309',['features','testimonials','faq','contact'],'A neighborhood table worth returning to.','Share the atmosphere, signature dishes, practical details, and how to visit.')},
  {id:'personal',name:'Profile One',category:'Personal',accent:'#db2777',description:'Clean personal site for consultants, creators, and independent professionals.',build:()=>templateProject('Profile One','Personal','#db2777',['features','testimonials','contact'],'Your work, point of view, and next chapter.','A flexible personal site for presenting expertise without feeling like a résumé template.')},
  {id:'blog',name:'Margin Journal',category:'Blog',accent:'#0f766e',description:'Editorial home for articles, ideas, and an expandable CMS collection.',build:()=>templateProject('Margin Journal','Blog','#0f766e',['features','cta'],'Ideas deserve a home of their own.','Start with an editorial structure, then connect a Blog Posts collection in the CMS panel.')}
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
