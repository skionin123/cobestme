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
      subtle:'#6b7280',
      line:'#e5e7eb',
    },
    textStyles:{
      body:{fontFamily:'Inter, Arial, sans-serif',fontSize:'16px',lineHeight:'1.6',fontWeight:'400'},
      display:{fontFamily:'Inter, Arial, sans-serif',fontWeight:'700',letterSpacing:'-0.04em',lineHeight:'1'},
      heading:{fontFamily:'Inter, Arial, sans-serif',fontWeight:'650',letterSpacing:'-0.025em',lineHeight:'1.12'},
    },
  },
  styles:{
    'page-shell':{desktop:{none:{margin:'0',fontFamily:'Inter, Arial, sans-serif',color:'var(--ink)',background:'var(--surface)',minHeight:'100vh'}}},
    'site-nav':{desktop:{none:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'24px',padding:'20px 5vw',borderBottom:'1px solid var(--line)',background:'var(--surface)',position:'relative',zIndex:'5'}},mobileLandscape:{none:{padding:'16px 20px'}}},
    'nav-links':{desktop:{none:{display:'flex',alignItems:'center',gap:'22px'}},mobileLandscape:{none:{display:'none'}}},
    'nav-menu-button':{desktop:{none:{display:'none'}},mobileLandscape:{none:{display:'inline-flex',border:'0',background:'transparent',fontSize:'24px'}}},
    'hero':{desktop:{none:{minHeight:'72vh',display:'grid',alignItems:'center',padding:'96px 6vw',background:'linear-gradient(135deg,#ffffff 0%,#f4f5ff 100%)'}},tablet:{none:{padding:'72px 5vw'}},mobilePortrait:{none:{minHeight:'auto',padding:'56px 22px'}}},
    'container':{desktop:{none:{width:'min(1180px,100%)',marginLeft:'auto',marginRight:'auto'}}},
    'display':{desktop:{none:{fontSize:'76px',lineHeight:'0.96',letterSpacing:'-0.055em',margin:'0 0 26px',fontWeight:'760',maxWidth:'980px'}},tablet:{none:{fontSize:'58px'}},mobileLandscape:{none:{fontSize:'46px'}},mobilePortrait:{none:{fontSize:'38px'}}},
    'lead':{desktop:{none:{fontSize:'20px',lineHeight:'1.62',maxWidth:'700px',color:'#525866',margin:'0'}}},
    'button':{desktop:{none:{display:'inline-flex',alignItems:'center',justifyContent:'center',marginTop:'26px',padding:'13px 18px',background:'var(--ink)',color:'#ffffff',borderRadius:'10px',textDecoration:'none',border:'0',cursor:'pointer',transition:'transform .2s ease,opacity .2s ease'},hover:{transform:'translateY(-2px)'}}},
    'section':{desktop:{none:{padding:'88px 6vw'}},mobilePortrait:{none:{padding:'56px 22px'}}},
    'section-title':{desktop:{none:{fontSize:'44px',lineHeight:'1.05',letterSpacing:'-0.035em',margin:'0 0 32px'}},mobilePortrait:{none:{fontSize:'34px'}}},
    'grid':{desktop:{none:{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'24px'}}},
    'flex':{desktop:{none:{display:'flex',gap:'20px',alignItems:'center'}}},
    'columns':{desktop:{none:{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'28px'}},mobileLandscape:{none:{gridTemplateColumns:'1fr'}}},
    'feature-grid':{desktop:{none:{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'20px'}},tablet:{none:{gridTemplateColumns:'repeat(2,minmax(0,1fr))'}},mobilePortrait:{none:{gridTemplateColumns:'1fr'}}},
    'pricing-grid':{desktop:{none:{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'20px'}},mobileLandscape:{none:{gridTemplateColumns:'1fr'}}},
    'card':{desktop:{none:{padding:'28px',border:'1px solid var(--line)',borderRadius:'16px',background:'var(--surface)',boxShadow:'0 12px 30px rgba(17,19,24,.06)'}}},
    'quote':{desktop:{none:{fontSize:'30px',lineHeight:'1.3',letterSpacing:'-0.02em',margin:'18px 0',padding:'28px',borderLeft:'3px solid var(--accent)',background:'var(--muted)'}}},
    'cta':{desktop:{none:{padding:'88px 6vw',textAlign:'center',background:'var(--ink)',color:'#fff'}}},
    'site-footer':{desktop:{none:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'24px',padding:'32px 5vw',borderTop:'1px solid var(--line)'}},mobilePortrait:{none:{flexDirection:'column',alignItems:'flex-start'}}},
    'heading':{desktop:{none:{fontSize:'40px',lineHeight:'1.08',letterSpacing:'-0.03em',margin:'0 0 16px'}}},
    'paragraph':{desktop:{none:{fontSize:'16px',lineHeight:'1.65',color:'var(--subtle)'}}},
    'rich-text':{desktop:{none:{fontSize:'17px',lineHeight:'1.75',maxWidth:'760px'}}},
  },
  assets:[],
  components:[],
  interactions:[],
  collections:[],
  versions:[],
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
            node({id:'brand-home',type:'link',tag:'a',name:'Brand',content:'CoBest Site',attributes:{href:'/'}}),
            node({id:'nav-links-home',type:'div',tag:'div',name:'Nav Links',classes:['nav-links'],children:[
              node({id:'nav-link-about',type:'link',tag:'a',name:'Nav Link',content:'About',attributes:{href:'/about'}}),
              node({id:'nav-link-contact',type:'link',tag:'a',name:'Nav Link',content:'Contact',attributes:{href:'/contact'}}),
            ]}),
            node({id:'nav-mobile-home',type:'button',tag:'button',name:'Mobile Menu Button',content:'☰',classes:['nav-menu-button']}),
          ],
        }),
        node({
          id:'hero-home',type:'section',tag:'section',name:'Hero',classes:['hero'],
          children:[node({
            id:'hero-inner-home',type:'container',tag:'div',name:'Hero Container',classes:['container'],
            children:[
              node({id:'hero-title-home',type:'heading',tag:'h1',name:'Heading',classes:['display'],content:'Build something remarkable.'}),
              node({id:'hero-copy-home',type:'paragraph',tag:'p',name:'Paragraph',classes:['lead'],content:'This page is rendered from a clean JSON node tree inside an isolated iframe canvas.'}),
              node({id:'hero-button-home',type:'link',tag:'a',name:'Button',classes:['button'],content:'Start building',attributes:{href:'#contact'}}),
            ],
          })],
        }),
      ],
    }),
  }],
})
