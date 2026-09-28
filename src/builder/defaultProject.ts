import type { BuilderNode, BuilderProject } from './types'

const node=(partial:Partial<BuilderNode> & Pick<BuilderNode,'id'|'type'|'tag'|'name'>):BuilderNode=>({
  children:[],
  classes:[],
  attributes:{},
  ...partial,
})

export const createDefaultProject=():BuilderProject=>({
  id:'cobest-starter-project',
  name:'Untitled CoBest Site',
  version:1,
  activePageId:'page-home',
  updatedAt:new Date().toISOString(),
  globals:{
    colors:{
      ink:'#111318',
      surface:'#ffffff',
      muted:'#f3f4f6',
      accent:'#4f46e5',
    },
    textStyles:{
      body:{fontFamily:'Inter, Arial, sans-serif',fontSize:'16px',lineHeight:'1.6'},
      display:{fontFamily:'Inter, Arial, sans-serif',fontWeight:'700',letterSpacing:'-0.04em'},
    },
  },
  styles:{
    'page-shell':{desktop:{none:{margin:'0',fontFamily:'Inter, Arial, sans-serif',color:'var(--ink)',background:'var(--surface)'}}},
    'site-nav':{desktop:{none:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'22px 40px',borderBottom:'1px solid #e5e7eb'}}},
    'hero':{desktop:{none:{minHeight:'70vh',display:'grid',alignItems:'center',padding:'80px 6vw',background:'linear-gradient(135deg,#ffffff 0%,#f5f7ff 100%)'}}},
    'hero-inner':{desktop:{none:{maxWidth:'920px'}}},
    'hero-title':{desktop:{none:{fontSize:'72px',lineHeight:'0.98',letterSpacing:'-0.05em',margin:'0 0 24px',fontWeight:'750'}},tablet:{none:{fontSize:'56px'}},mobilePortrait:{none:{fontSize:'40px'}}},
    'hero-copy':{desktop:{none:{fontSize:'20px',lineHeight:'1.6',maxWidth:'680px',color:'#525866'}}},
    'hero-button':{desktop:{none:{display:'inline-flex',marginTop:'26px',padding:'13px 18px',background:'var(--ink)',color:'#ffffff',borderRadius:'10px',textDecoration:'none'}}},
  },
  pages:[{
    id:'page-home',
    name:'Home',
    slug:'/',
    seo:{title:'Untitled CoBest Site',description:'A site designed visually with CoBest.',slug:'/'},
    root:node({
      id:'root-home',type:'div',tag:'main',name:'Page',
      classes:['page-shell'],
      children:[
        node({
          id:'nav-home',type:'navbar',tag:'nav',name:'Navbar',classes:['site-nav'],
          children:[
            node({id:'brand-home',type:'link',tag:'a',name:'Brand',content:'CoBest Site',attributes:{href:'#'}}),
            node({id:'nav-link-home',type:'link',tag:'a',name:'Nav Link',content:'Contact',attributes:{href:'#contact'}}),
          ],
        }),
        node({
          id:'hero-home',type:'section',tag:'section',name:'Hero',classes:['hero'],
          children:[node({
            id:'hero-inner-home',type:'container',tag:'div',name:'Hero Container',classes:['hero-inner'],
            children:[
              node({id:'hero-title-home',type:'heading',tag:'h1',name:'Heading',classes:['hero-title'],content:'Build something remarkable.'}),
              node({id:'hero-copy-home',type:'paragraph',tag:'p',name:'Paragraph',classes:['hero-copy'],content:'This page is rendered from a clean JSON node tree inside an isolated iframe canvas.'}),
              node({id:'hero-button-home',type:'link',tag:'a',name:'Button',classes:['hero-button'],content:'Start building',attributes:{href:'#'}}),
            ],
          })],
        }),
      ],
    }),
  }],
})
