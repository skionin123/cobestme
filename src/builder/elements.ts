import type { BuilderNode, BuilderNodeType } from './types'
import { P, S, samplePhotoUrl, samplePhotos } from './samples'
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

export const mvpElementCatalog=[
  {group:'Structure',items:[
    ['section','Section'],['container','Container'],['div','Box'],
  ]},
  {group:'Content',items:[
    ['heading','Heading'],['paragraph','Paragraph'],['button','Button'],['link','Link'],['image','Image'],
  ]},
  {group:'Layout',items:[
    ['flex','Flex container'],['grid','Grid container'],
  ]},
] as const

export const sectionCatalog=[
  {id:'navbar',label:'Menu bar',hint:'Logo and page links'},
  {id:'hero',label:'Hero',hint:'Big headline and button'},
  {id:'about',label:'Image and text',hint:'Photo beside your story'},
  {id:'features',label:'Features',hint:'Three services or benefits'},
  {id:'gallery',label:'Gallery',hint:'A grid of photos'},
  {id:'testimonials',label:'Testimonials',hint:'Customer reviews'},
  {id:'pricing',label:'Pricing',hint:'Plans and prices'},
  {id:'faq',label:'FAQ',hint:'Questions and answers'},
  {id:'cta',label:'Call to action',hint:'Short message and a button'},
  {id:'contact',label:'Contact form',hint:'Messages go to your Inbox'},
  {id:'footer',label:'Footer',hint:'Copyright and links'},
] as const

export type SectionId=typeof sectionCatalog[number]['id']

/** What a new section needs to know about the website it is added to. */
export interface SectionContext{
  /** Real pages, used to build working menu and footer links. */
  pages?:{name:string;slug:string}[]
  siteName?:string
}

export const placeholderImage=samplePhotoUrl(samplePhotos.placeholder)

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
    case 'div':{
      const n=base(type,'div','Box')
      n.classes=['box']
      return n
    }
    case 'grid':{
      const n=base(type,'div','Grid')
      n.classes=['grid']
      n.children=[base('div','div','Grid cell'),base('div','div','Grid cell')]
      return n
    }
    case 'flex':{
      const n=base(type,'div','Row')
      n.classes=['flex']
      n.children=[base('div','div','Row item'),base('div','div','Row item')]
      return n
    }
    case 'columns':{
      const n=base(type,'div','Columns')
      n.classes=['columns']
      n.children=[base('div','div','Column'),base('div','div','Column')]
      return n
    }
    case 'heading':{
      const n=base(type,'h2','Heading',P.heading)
      n.classes=['heading']
      return n
    }
    case 'paragraph':{
      const n=base(type,'p','Text',P.paragraph)
      n.classes=['paragraph']
      return n
    }
    case 'link':{
      const n=base(type,'a','Link','Learn more')
      n.attributes={href:'#'}
      n.classes=['link']
      return n
    }
    case 'button':{
      const n=base(type,'a','Button','Button')
      n.attributes={href:'#'}
      n.classes=['button']
      return n
    }
    case 'richText':{
      const n=base(type,'div','Rich text',P.paragraph)
      n.classes=['rich-text']
      return n
    }
    case 'list':{
      const n=base(type,'ul','List')
      n.children=[base('paragraph','li','List item','First item'),base('paragraph','li','List item','Second item')]
      return n
    }
    case 'quote':{
      const n=base(type,'blockquote','Quote',P.quote)
      n.classes=['quote']
      return n
    }
    case 'image':{
      const n=base(type,'img','Image')
      n.attributes={src:placeholderImage,alt:''}
      n.classes=['image']
      return n
    }
    case 'video':{
      const n=base(type,'iframe','Video')
      // Big Buck Bunny (Blender Foundation, Creative Commons) as a neutral sample.
      n.attributes={src:'https://www.youtube.com/embed/aqz-KE-bpKQ',title:'Video',allowfullscreen:'true',loading:'lazy'}
      n.classes=['video-frame']
      return n
    }
    case 'icon':return base(type,'span','Icon','✦')
    case 'backgroundVideo':{
      const n=base(type,'video','Background video')
      n.attributes={autoplay:'true',muted:'true',loop:'true',playsinline:'true'}
      return n
    }
    case 'form':return contactForm()
    case 'input':{
      const n=base(type,'input','Text field')
      n.attributes={type:'text',name:'field','aria-label':'Your answer',placeholder:'Your answer'}
      n.classes=['form-input']
      return n
    }
    case 'textarea':{
      const n=base(type,'textarea','Message field')
      n.attributes={name:'message','aria-label':'Message',placeholder:'Message'}
      n.classes=['form-input','form-textarea']
      return n
    }
    case 'select':{
      const n=base(type,'select','Dropdown field')
      n.attributes={name:'choice','aria-label':'Choose one'}
      n.classes=['form-input']
      n.children=[base('paragraph','option','Option','Choose one')]
      return n
    }
    case 'checkbox':{
      const n=base(type,'label','Checkbox',' Checkbox')
      n.children=[{...base('input','input','Checkbox input'),attributes:{type:'checkbox',name:'agree'}}]
      return n
    }
    case 'radio':{
      const n=base(type,'label','Option',' Option')
      n.children=[{...base('input','input','Option input'),attributes:{type:'radio',name:'choice'}}]
      return n
    }
    case 'submit':{
      const n=base(type,'button','Send button','Send message')
      n.attributes={type:'submit'}
      n.classes=['button','form-button']
      return n
    }
    case 'navbar':return createPrebuiltSection('navbar')
    case 'dropdown':{
      const n=base(type,'div','Dropdown')
      n.attributes={'data-dropdown':'true'}
      n.children=[{...base('button','button','Dropdown button','Menu'),attributes:{'data-dropdown-toggle':'true'}},{...base('div','div','Dropdown list','Dropdown content'),attributes:{'data-dropdown-list':'true',hidden:'true'}}]
      return n
    }
    case 'footer':return createPrebuiltSection('footer')
    case 'tabs':{
      const n=base(type,'div','Tabs')
      n.attributes={'data-tabs':'true'}
      n.children=[{...base('button','button','Tab','Tab 1'),attributes:{'data-tab':'true'}},{...base('button','button','Tab','Tab 2'),attributes:{'data-tab':'true'}},{...base('div','div','Tab content','Tab one content'),attributes:{'data-pane':'true'}},{...base('div','div','Tab content','Tab two content'),attributes:{'data-pane':'true'}}]
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
      n.attributes={href:samplePhotoUrl(samplePhotos.placeholder,1600),'data-lightbox':'true'}
      return n
    }
    case 'html':{
      const n=base(type,'div','Custom code','<div>Custom HTML</div>')
      n.attributes={'data-html':'<div>Custom HTML</div>'}
      return n
    }
    case 'collectionList':{
      const n=base(type,'section','Collection list')
      n.attributes={collectionId:''}
      n.children=[base('div','div','Collection item','Connect a CMS collection in Settings.')]
      return n
    }
    default:return base('div','div','Box')
  }
}

/** One labelled field of a form. The label text is editable on the page. */
function formField(labelText:string,control:BuilderNode):BuilderNode{
  return {...base('div','label',labelText+' field'),classes:['form-field'],children:[
    {...base('paragraph','span',labelText+' label',labelText),classes:['form-label']},
    control,
  ]}
}

/**
 * A working contact form: name, email and message. With no "send to" address
 * the published website delivers messages to the owner's CoBest Inbox.
 */
function contactForm():BuilderNode{
  const form=base('form','form','Contact form')
  form.attributes={method:'post'}
  form.classes=['form']
  form.children=[
    formField('Name',{...base('input','input','Name input'),classes:['form-input'],attributes:{type:'text',name:'name',autocomplete:'name',placeholder:'Your name'}}),
    formField('Email',{...base('input','input','Email input'),classes:['form-input'],attributes:{type:'email',name:'email',autocomplete:'email',placeholder:'you@example.com',required:'true'}}),
    formField('Message',{...base('textarea','textarea','Message input'),classes:['form-input','form-textarea'],attributes:{name:'message',placeholder:'How can we help?',required:'true'}}),
    createElement('submit'),
    {...base('div','div','Message after sending','Thanks! Your message has been sent.'),classes:['form-success'],attributes:{'data-form-success':'true',role:'status'}},
    {...base('div','div','Message if sending fails','Sorry, your message could not be sent. Please try again.'),classes:['form-error'],attributes:{'data-form-error':'true',role:'alert'}},
  ]
  return form
}

/** Menu links that point at pages that really exist. */
function pageLinks(context:SectionContext,linkClass:string,name:string,limit:number):BuilderNode[]{
  const pages=(context.pages||[]).filter(page=>page.slug&&page.slug!=='/').slice(0,limit)
  const links=pages.length?pages.map(page=>({label:page.name,href:page.slug})):[{label:'Contact',href:'#contact'}]
  return links.map(link=>({...base('link','a',name,link.label),attributes:{href:link.href},classes:[linkClass]}))
}

export function createPrebuiltSection(id:string,context:SectionContext={}):BuilderNode{
  if(id==='navbar'){
    const n=base('navbar','nav','Menu bar')
    n.classes=['site-nav']
    n.attributes={'aria-label':'Main menu'}
    n.children=[
      {...base('link','a','Logo text',context.siteName?.trim()||P.brand),attributes:{href:'/'},classes:['brand-link']},
      {...base('div','div','Menu links'),classes:['nav-links'],children:pageLinks(context,'nav-link','Menu link',5)},
      {...base('button','button','Menu button (phones)','☰'),classes:['nav-menu-button'],attributes:{type:'button','aria-label':'Open menu','aria-expanded':'false'}},
    ]
    return n
  }
  if(id==='hero'){
    const n=base('section','section','Hero')
    n.classes=['hero']
    n.children=[{
      ...base('container','div','Hero content'),
      classes:['container'],
      children:[
        {...base('heading','h1','Hero heading',P.heroHeading),classes:['display']},
        {...base('paragraph','p','Hero text',P.heroCopy),classes:['lead']},
        {...base('button','a','Hero button','Contact us'),attributes:{href:'#contact'},classes:['button']},
      ],
    }]
    return n
  }
  if(id==='about'){
    const n=base('section','section','Image and text')
    n.classes=['section']
    n.attributes={id:'about'}
    n.children=[{...base('grid','div','Two columns'),classes:['split'],children:[
      {...base('div','div','Text column'),children:[
        {...base('heading','h2','Section heading',S.aboutHeading),classes:['section-title']},
        {...base('paragraph','p','Story text',P.aboutCopy),classes:['lead']},
        {...base('button','a','Button','Contact us'),attributes:{href:'#contact'},classes:['button']},
      ]},
      {...base('image','img','Photo'),classes:['split-image'],attributes:{src:samplePhotoUrl(samplePhotos.about),alt:''}},
    ]}]
    return n
  }
  if(id==='features'){
    const n=base('section','section','Features')
    n.classes=['section']
    n.attributes={id:'services'}
    n.children=[
      {...base('heading','h2','Section heading',S.featuresHeading),classes:['section-title']},
      {...base('grid','div','Features grid'),classes:['feature-grid'],children:P.featureTitles.map((title,i)=>({
        ...base('div','article',`Feature ${i+1}`),
        classes:['card'],
        children:[{...base('heading','h3','Feature heading',title),classes:['card-title']},{...base('paragraph','p','Feature text',P.featureCopy),classes:['card-copy']}],
      }))},
    ]
    return n
  }
  if(id==='gallery'){
    const n=base('section','section','Gallery')
    n.classes=['section']
    n.attributes={id:'gallery'}
    n.children=[
      {...base('heading','h2','Section heading',S.galleryHeading),classes:['section-title']},
      {...base('grid','div','Photo grid'),classes:['gallery-grid'],children:samplePhotos.gallery.map((photo,i)=>(
        {...base('image','img',`Photo ${i+1}`),classes:['gallery-image'],attributes:{src:samplePhotoUrl(photo,900),alt:''}}))},
    ]
    return n
  }
  if(id==='testimonials'){
    const n=base('section','section','Testimonials')
    n.classes=['section']
    n.children=[{...base('heading','h2','Section heading',S.testimonialsHeading),classes:['section-title']},
      ...[1,2].map(i=>({...base('quote','blockquote',`Review ${i}`,P.testimonialQuote),classes:['quote']}))]
    return n
  }
  if(id==='pricing'){
    const n=base('section','section','Pricing')
    n.classes=['section']
    n.attributes={id:'pricing'}
    n.children=[{...base('heading','h2','Section heading',S.pricingHeading),classes:['section-title']},
      {...base('grid','div','Pricing grid'),classes:['pricing-grid'],children:S.planNames.map(name=>({...base('div','article',name+' plan'),classes:['card'],children:[
        {...base('heading','h3','Plan name',name),classes:['card-title']},
        {...base('paragraph','p','Price',P.planPrice),classes:['price']},
        {...base('paragraph','p','Plan details',P.planCopy),classes:['card-copy']},
        {...base('button','a','Plan button','Choose '+name),attributes:{href:'#contact'},classes:['button']},
      ]}))}]
    return n
  }
  if(id==='faq'){
    const n=base('section','section','FAQ')
    n.classes=['section']
    n.attributes={id:'faq'}
    n.children=[{...base('heading','h2','Section heading',S.faqHeading),classes:['section-title']},
      {...base('div','div','Questions'),classes:['faq-list'],children:S.faqQuestions.map((question,i)=>({...base('div','details',`Question ${i+1}`),classes:['faq-item'],children:[
        {...base('heading','summary','Question',question),classes:['faq-question']},
        {...base('paragraph','p','Answer',P.faqAnswer),classes:['faq-answer']},
      ]}))}]
    return n
  }
  if(id==='cta'){
    const n=base('section','section','Call to action')
    n.classes=['cta']
    n.children=[
      {...base('heading','h2','Heading',S.ctaHeading),classes:['cta-title']},
      {...base('paragraph','p','Text',P.ctaCopy),classes:['cta-copy']},
      {...base('button','a','Button','Contact us'),attributes:{href:'#contact'},classes:['button','button-light']},
    ]
    return n
  }
  if(id==='contact'){
    const n=base('section','section','Contact')
    n.classes=['section']
    n.attributes={id:'contact'}
    n.children=[{...base('grid','div','Two columns'),classes:['contact-layout'],children:[
      {...base('div','div','Text column'),children:[
        {...base('heading','h2','Section heading',S.contactHeading),classes:['section-title']},
        {...base('paragraph','p','Intro text',S.contactCopy),classes:['lead']},
      ]},
      contactForm(),
    ]}]
    return n
  }
  if(id==='footer'){
    const n=base('footer','footer','Footer')
    n.classes=['site-footer']
    n.children=[
      {...base('paragraph','p','Copyright',P.footerCopy.replace(P.brand,context.siteName?.trim()||P.brand)),classes:['footer-copy']},
      {...base('div','div','Footer links'),classes:['footer-links'],children:pageLinks(context,'footer-link','Footer link',6)},
    ]
    return n
  }
  return createElement('section')
}
