import type { BuilderNode, BuilderNodeType } from './types'
import { uid } from './tree'

const base=(type:BuilderNodeType,tag:string,name:string,content=''):BuilderNode=>({
  id:uid(type),
  type,
  tag,
  name,
  content,
  children:[],
  classes:[],
  attributes:{},
})

export const elementCatalog=[
  {group:'Layout',items:[
    ['section','Section'],['container','Container'],['div','Div Block'],['grid','Grid'],['flex','Flex'],['columns','Columns'],
  ]},
  {group:'Basic',items:[
    ['heading','Heading'],['paragraph','Paragraph'],['link','Text Link'],['button','Button'],['richText','Rich text'],['list','List'],['quote','Quote'],
  ]},
  {group:'Media',items:[
    ['image','Image'],['video','Video Embed'],['icon','Icon'],['backgroundVideo','Background Video'],
  ]},
  {group:'Forms',items:[
    ['form','Form Block'],['input','Input'],['textarea','Textarea'],['select','Select'],['checkbox','Checkbox'],['radio','Radio'],['submit','Submit'],
  ]},
  {group:'Navigation',items:[
    ['navbar','Navbar'],['dropdown','Dropdown'],['footer','Footer'],
  ]},
  {group:'Advanced',items:[
    ['tabs','Tabs'],['slider','Slider'],['lightbox','Lightbox'],['html','HTML Embed'],['collectionList','Collection List'],
  ]},
] as const

export const sectionCatalog=[
  {id:'hero',label:'Hero'},
  {id:'features',label:'Features grid'},
  {id:'testimonials',label:'Testimonials'},
  {id:'pricing',label:'Pricing'},
  {id:'faq',label:'FAQ accordion'},
  {id:'cta',label:'CTA'},
  {id:'contact',label:'Contact'},
  {id:'footer',label:'Footer'},
] as const

export function createElement(type:BuilderNodeType):BuilderNode{
  switch(type){
    case 'section':{
      const n=base(type,'section','Section')
      n.classes=['section']
      return n
    }
    case 'container':{
      const n=base(type,'div','Container')
      n.classes=['container']
      return n
    }
    case 'div':return base(type,'div','Div Block')
    case 'grid':{
      const n=base(type,'div','Grid')
      n.classes=['grid']
      n.children=[base('div','div','Grid Cell'),base('div','div','Grid Cell')]
      return n
    }
    case 'flex':{
      const n=base(type,'div','Flex')
      n.classes=['flex']
      n.children=[base('div','div','Flex Item'),base('div','div','Flex Item')]
      return n
    }
    case 'columns':{
      const n=base(type,'div','Columns')
      n.classes=['columns']
      n.children=[base('div','div','Column'),base('div','div','Column')]
      return n
    }
    case 'heading':{
      const n=base(type,'h2','Heading','Heading')
      n.classes=['heading']
      return n
    }
    case 'paragraph':{
      const n=base(type,'p','Paragraph','Write your text here.')
      n.classes=['paragraph']
      return n
    }
    case 'link':{
      const n=base(type,'a','Text Link','Learn more')
      n.attributes={href:'#'}
      return n
    }
    case 'button':{
      const n=base(type,'a','Button','Button')
      n.attributes={href:'#'}
      n.classes=['button']
      return n
    }
    case 'richText':{
      const n=base(type,'div','Rich Text','Rich text content')
      n.classes=['rich-text']
      return n
    }
    case 'list':{
      const n=base(type,'ul','List')
      n.children=[base('paragraph','li','List Item','First item'),base('paragraph','li','List Item','Second item')]
      return n
    }
    case 'quote':{
      const n=base(type,'blockquote','Quote','A memorable quote goes here.')
      n.classes=['quote']
      return n
    }
    case 'image':{
      const n=base(type,'img','Image')
      n.attributes={src:'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80',alt:'Placeholder image'}
      return n
    }
    case 'video':{
      const n=base(type,'iframe','Video')
      n.attributes={src:'https://www.youtube.com/embed/dQw4w9WgXcQ',title:'Video',allowfullscreen:'true'}
      return n
    }
    case 'icon':return base(type,'span','Icon','✦')
    case 'backgroundVideo':{
      const n=base(type,'video','Background Video')
      n.attributes={autoplay:'true',muted:'true',loop:'true',playsinline:'true'}
      return n
    }
    case 'form':{
      const n=base(type,'form','Form Block')
      n.attributes={action:'#',method:'post'}
      n.children=[createElement('input'),createElement('textarea'),createElement('submit'),{...base('div','div','Success State','Thanks! Your submission was received.'),attributes:{'data-form-success':'true'}},{...base('div','div','Error State','Something went wrong. Please try again.'),attributes:{'data-form-error':'true'}}]
      return n
    }
    case 'input':{
      const n=base(type,'input','Input')
      n.attributes={type:'text',placeholder:'Name'}
      return n
    }
    case 'textarea':{
      const n=base(type,'textarea','Textarea')
      n.attributes={placeholder:'Message'}
      return n
    }
    case 'select':{
      const n=base(type,'select','Select')
      n.children=[base('paragraph','option','Option','Choose one')]
      return n
    }
    case 'checkbox':{
      const n=base(type,'label','Checkbox',' Checkbox')
      n.children=[{...base('input','input','Checkbox Input'),attributes:{type:'checkbox'}}]
      return n
    }
    case 'radio':{
      const n=base(type,'label','Radio',' Radio')
      n.children=[{...base('input','input','Radio Input'),attributes:{type:'radio',name:'choice'}}]
      return n
    }
    case 'submit':{
      const n=base(type,'button','Submit','Submit')
      n.attributes={type:'submit'}
      n.classes=['button']
      return n
    }
    case 'navbar':return createPrebuiltSection('navbar')
    case 'dropdown':{
      const n=base(type,'div','Dropdown')
      n.children=[base('button','button','Dropdown Toggle','Menu'),base('div','div','Dropdown List','Dropdown content')]
      return n
    }
    case 'footer':return createPrebuiltSection('footer')
    case 'tabs':{
      const n=base(type,'div','Tabs')
      n.attributes={'data-tabs':'true'}
      n.children=[{...base('button','button','Tab','Tab 1'),attributes:{'data-tab':'true'}},{...base('button','button','Tab','Tab 2'),attributes:{'data-tab':'true'}},{...base('div','div','Tab Pane','Tab one content'),attributes:{'data-pane':'true'}},{...base('div','div','Tab Pane','Tab two content'),attributes:{'data-pane':'true'}}]
      return n
    }
    case 'slider':{
      const n=base(type,'div','Slider')
      n.attributes={'data-slider':'true'}
      n.children=[base('div','div','Slide','Slide 1'),base('div','div','Slide','Slide 2')]
      return n
    }
    case 'lightbox':{
      const n=base(type,'a','Lightbox','Open image')
      n.attributes={href:'#'}
      return n
    }
    case 'html':{
      const n=base(type,'div','HTML Embed','<div>Custom HTML</div>')
      n.attributes={'data-html':'<div>Custom HTML</div>'}
      return n
    }
    case 'collectionList':{
      const n=base(type,'section','Collection List')
      n.attributes={collectionId:''}
      n.children=[base('div','div','Collection Item','Connect a CMS collection in Settings.')]
      return n
    }
    default:return base('div','div','Div Block')
  }
}

export function createPrebuiltSection(id:string):BuilderNode{
  if(id==='navbar'){
    const n=base('navbar','nav','Navbar')
    n.classes=['site-nav']
    n.children=[
      {...base('link','a','Brand','Brand'),attributes:{href:'/'}},
      {...base('div','div','Nav Links'),classes:['nav-links'],children:[
        {...base('link','a','Nav Link','About'),attributes:{href:'/about'}},
        {...base('link','a','Nav Link','Contact'),attributes:{href:'/contact'}},
      ]},
      {...base('button','button','Mobile Menu Button','☰'),classes:['nav-menu-button']},
    ]
    return n
  }
  if(id==='hero'){
    const n=base('section','section','Hero')
    n.classes=['hero']
    n.children=[{
      ...base('container','div','Hero Container'),
      classes:['container'],
      children:[
        {...base('heading','h1','Hero Heading','Build something remarkable.'),classes:['display']},
        {...base('paragraph','p','Hero Copy','Design and launch a responsive website visually, without giving up control of the underlying structure.'),classes:['lead']},
        {...base('button','a','Primary Button','Start building'),attributes:{href:'#contact'},classes:['button']},
      ],
    }]
    return n
  }
  if(id==='features'){
    const n=base('section','section','Features')
    n.classes=['section']
    n.children=[
      {...base('heading','h2','Section Heading','Everything you need to build.'),classes:['section-title']},
      {...base('grid','div','Features Grid'),classes:['feature-grid'],children:['Visual design','Responsive controls','Reusable components'].map((x,i)=>({
        ...base('div','article',`Feature ${i+1}`),
        classes:['card'],
        children:[base('heading','h3','Feature Heading',x),base('paragraph','p','Feature Copy','Use precise visual controls while keeping the site structure clean.')],
      }))},
    ]
    return n
  }
  if(id==='testimonials'){
    const n=base('section','section','Testimonials')
    n.classes=['section']
    n.children=[base('heading','h2','Section Heading','Loved by teams who care about craft'),...['“Fast, flexible, and clear.”','“We finally control every breakpoint.”'].map((q,i)=>({...base('quote','blockquote',`Testimonial ${i+1}`,q),classes:['quote']}))]
    return n
  }
  if(id==='pricing'){
    const n=base('section','section','Pricing')
    n.classes=['section']
    n.children=[base('heading','h2','Section Heading','Simple plans'),{...base('grid','div','Pricing Grid'),classes:['pricing-grid'],children:['Starter','Pro','Studio'].map((name,i)=>({...base('div','article',name),classes:['card'],children:[base('heading','h3','Plan',name),base('paragraph','p','Price',i?'$29 / month':'Free'),base('button','a','Choose','Choose plan')]}))}]
    return n
  }
  if(id==='faq'){
    const n=base('section','section','FAQ')
    n.classes=['section']
    n.children=[base('heading','h2','Section Heading','Frequently asked questions'),...['Can I customize every breakpoint?','Can I export my code?','Can I reuse components?'].map((q,i)=>({...base('div','details',`FAQ ${i+1}`),children:[base('heading','summary','Question',q),base('paragraph','p','Answer','Yes. Edit this answer directly in the builder.')]}))]
    return n
  }
  if(id==='cta'){
    const n=base('section','section','CTA')
    n.classes=['cta']
    n.children=[base('heading','h2','CTA Heading','Ready to build?'),base('paragraph','p','CTA Copy','Start with a strong structure and refine every detail visually.'),{...base('button','a','CTA Button','Get started'),attributes:{href:'#'}}]
    return n
  }
  if(id==='contact'){
    const n=base('section','section','Contact')
    n.classes=['section']
    n.children=[base('heading','h2','Contact Heading','Let’s talk'),createElement('form')]
    return n
  }
  if(id==='footer'){
    const n=base('footer','footer','Footer')
    n.classes=['site-footer']
    n.children=[base('paragraph','p','Copyright','© 2026 Your company'),{...base('link','a','Footer Link','Privacy'),attributes:{href:'/privacy'}}]
    return n
  }
  return createElement('section')
}
