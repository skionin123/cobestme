import React from 'react'
import { geometryClass } from './geometry'
import { findNode } from './tree'
import { useBuilderStore } from './store'
import type { BreakpointId, BuilderProject, CssProperties } from './types'

export const fontChoices=[
  {name:'Inter',value:'Inter, Arial, sans-serif'},
  {name:'DM Sans',value:'"DM Sans", Arial, sans-serif'},
  {name:'Manrope',value:'Manrope, Arial, sans-serif'},
  {name:'Montserrat',value:'Montserrat, Arial, sans-serif'},
  {name:'Space Grotesk',value:'"Space Grotesk", Arial, sans-serif'},
  {name:'Playfair Display',value:'"Playfair Display", Georgia, serif'},
  {name:'Lora',value:'Lora, Georgia, serif'},
  {name:'Georgia',value:'Georgia, serif'},
  {name:'Arial',value:'Arial, sans-serif'},
]

const legalHex=(str:string)=>/^#[0-9a-fA-F]{6}$/.test(str)?str:'#6366f1'
const clip=(n:number,min:number,max:number)=>Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n))):min
const fontTypes=new Set(['heading','paragraph','button','link','richText','quote'])
const sectionTypes=new Set(['section','container','div','grid','flex','columns','navbar','footer'])
const defaults:Record<string,string>={fontSize:'18px',fontWeight:'400',color:'#171923',backgroundColor:'#ffffff',paddingTop:'0px',paddingRight:'0px',paddingBottom:'0px',paddingLeft:'0px',marginTop:'0px',marginBottom:'0px',gap:'0px',objectFit:'cover',objectPosition:'50% 50%',aspectRatio:'auto'}

export function updateElementAppearance(project:BuilderProject,nodeId:string,breakpoint:BreakpointId,properties:Record<string,string|null>):boolean{
  const page=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  const node=page&&findNode(page.root,nodeId)
  if(!node||node.id===page.root.id||node.locked)return false
  const cls=geometryClass(nodeId)
  if(!node.classes.includes(cls))node.classes.push(cls)
  const styles=project.styles[cls]||(project.styles[cls]={desktop:{none:{}}})
  const target=breakpoint==='desktop'?styles.desktop:styles[breakpoint]||(styles[breakpoint]={})
  const props:CssProperties=target.none||(target.none={})
  for(const [property,value] of Object.entries(properties)){
    if(value===null||value==='')delete props[property]
    else props[property]=value
  }
  return true
}
export function makeGradient(kind:'linear'|'radial',start:string,end:string,angle:number,midpoint=100):string{
  const colors=`${legalHex(start)} 0%,${legalHex(end)} ${clip(midpoint,1,100)}%`
  return kind==='radial'?`radial-gradient(circle,${colors})`:`linear-gradient(${clip(angle,0,360)}deg,${colors})`
}
export function safeBackgroundUrl(value:string):string|null{
  const trimmed=value.trim()
  if(!trimmed||trimmed.length>2000)return null
  if(!/^(https?:\/\/|\/[^/]|data:image\/(?:png|jpeg|webp|gif|svg\+xml);base64,)/i.test(trimmed))return null
  if(/[\\"'<>\n\r]/.test(trimmed))return null
  return `url("${trimmed}")`
}

const control='vb-basic-input'
function NumberField({name,value,unit='px',min=0,max=1000,onChange}:{name:string;value:string;unit?:string;min?:number;max?:number;onChange:(v:number)=>void}){
  return <label className="vb-basic-field"><span>{name}</span><div className="vb-basic-numeric">
    <input aria-label={name} type="number" min={min} max={max} value={String(parseFloat(value)||0)}
      onChange={e=>onChange(clip(Number(e.target.value),min,max))}/><small>{unit}</small>
  </div></label>
}
export function DesignControls(){
  const project=useBuilderStore(s=>s.project)
  const selectedId=useBuilderStore(s=>s.selectedNodeId)
  const breakpoint=useBuilderStore(s=>s.breakpoint)
  const mutate=useBuilderStore(s=>s.mutate)
  const page=project.pages.find(p=>p.id===project.activePageId)||project.pages[0]
  const node=findNode(page.root,selectedId)
  if(!node||node.id===page.root.id||node.locked)return null
  const cls=geometryClass(node.id)
  const own=project.styles[cls]
  const desktop=own?.desktop.none||{}
  const responsive=own?.[breakpoint]?.none||{}
  const read=(name:string)=>responsive[name]||desktop[name]||''
  const apply=(label:string,properties:Record<string,string|null>)=>
    mutate(label,draft=>{updateElementAppearance(draft,node.id,breakpoint,properties)})
  const text=fontTypes.has(node.type)
  const frame=sectionTypes.has(node.type)
  const img=node.type==='image'
  const gradient=read('backgroundImage')
  const isGradient=gradient.startsWith('linear-gradient')||gradient.startsWith('radial-gradient')
  const isImage=gradient.startsWith('url(')
  const mode=isGradient?'gradient':isImage?'image':'solid'
  const kind=gradient.startsWith('radial-gradient')?'radial':'linear'
  const matched=gradient.match(/(#[0-9a-f]{6})\s+0%,(#[0-9a-f]{6})\s+(\d+)%/i)
  const stops=[legalHex(matched?.[1]||'#6057ed'),legalHex(matched?.[2]||'#d5e3ff')]
  const endAt=Number(matched?.[3]||100)
  const angle=Number(gradient.match(/linear-gradient\((\d+)deg/i)?.[1]||135)
  const color=legalHex(read('color')||'#171923')
  const bg=legalHex(read('backgroundColor')||'#ffffff')
  const palette=Object.entries(project.globals.colors).filter(([,hex])=>/^#[0-9a-fA-F]{6}$/.test(hex)).slice(0,12)
  const backgroundGradient=(k:'linear'|'radial'=kind,a=stops[0],b=stops[1],dir=angle,stop=endAt)=>
    apply('Change background gradient',{backgroundImage:makeGradient(k,a,b,dir,stop),backgroundColor:null})
  return <div className="vb-design-basics" aria-label="Design controls">
    {text&&<section className="vb-design-group">
      <div className="vb-design-heading"><strong>Typography</strong><small>{breakpoint==='desktop'?'All devices':'This device'}</small></div>
      <label className="vb-basic-field"><span>Font family</span>
        <select aria-label="Font family" className={control}
          value={fontChoices.some(f=>f.value===read('fontFamily'))?read('fontFamily'):''}
          onChange={e=>apply('Change font',{fontFamily:e.target.value||null})}>
          <option value="">Theme font</option>{fontChoices.map(f=><option value={f.value} key={f.name}>{f.name}</option>)}
        </select>
      </label>
      <div className="vb-font-preview" style={{fontFamily:read('fontFamily')||'Inter, Arial, sans-serif'}}>The quick brown fox · Aa Bb 123</div>
      <div className="vb-design-columns">
        <NumberField name="Font size" value={read('fontSize')||defaults.fontSize} min={8} max={240}
          onChange={n=>apply('Change font size',{fontSize:n+'px'})}/>
        <label className="vb-basic-field"><span>Font weight</span><select className={control} aria-label="Font weight"
          value={read('fontWeight')||'400'} onChange={e=>apply('Change font weight',{fontWeight:e.target.value})}>
          {['300','400','500','600','700','800','900'].map(x=><option key={x} value={x}>{x==='400'?'Regular (400)':x==='700'?'Bold (700)':x}</option>)}
        </select></label>
      </div>
      <div className="vb-design-columns">
        <NumberField name="Letter spacing" value={read('letterSpacing')||'0px'} min={-10} max={50}
          onChange={n=>apply('Change letter spacing',{letterSpacing:n+'px'})}/>
        <NumberField name="Line height" value={read('lineHeight')||'1.4'} unit="×" min={1} max={3}
          onChange={n=>apply('Change line height',{lineHeight:String(n)})}/>
      </div>
      <div className="vb-design-columns">
        <label className="vb-basic-field"><span>Alignment</span><select className={control} aria-label="Text alignment"
          value={read('textAlign')||'left'} onChange={e=>apply('Align text',{textAlign:e.target.value})}>
          {['left','center','right','justify'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="vb-basic-field"><span>Text style</span><select className={control} aria-label="Text style"
          value={read('fontStyle')||'normal'} onChange={e=>apply('Text style',{fontStyle:e.target.value})}>
          <option value="normal">Normal</option><option value="italic">Italic</option></select></label>
      </div>
      <div className="vb-basic-color"><label><span>Text color</span><input type="color" aria-label="Text color" value={color}
        onChange={e=>apply('Text color',{color:e.target.value})}/></label>
        <input aria-label="Text color hex" value={read('color')||color} onChange={e=>{if(/^#[0-9a-fA-F]{6}$/.test(e.target.value))apply('Text color',{color:e.target.value})}}/>
      </div>
      {palette.length>0&&<div className="vb-brand-swatches" aria-label="Brand colors">
        {palette.map(([name,hex])=><button type="button" title={'Use '+name} aria-label={'Use '+name+' text color'}
          key={name} style={{background:hex}} onClick={()=>apply('Use brand text color',{color:hex})}/>)}
      </div>}
    </section>}
    {(frame||node.type==='button')&&<section className="vb-design-group">
      <div className="vb-design-heading"><strong>Background</strong><small>Color · Gradient · Image</small></div>
      <div className="vb-design-tabs" role="group" aria-label="Background type">
        {['solid','gradient','image'].map(m=><button type="button" key={m} aria-pressed={mode===m}
          onClick={()=>{
            if(m==='solid')apply('Solid background',{backgroundImage:null,backgroundColor:bg})
            else if(m==='gradient')backgroundGradient('linear')
            else apply('Image background',{backgroundImage:'url("https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80")'})
          }}>{m==='solid'?'Solid':m==='gradient'?'Gradient':'Image'}</button>)}
      </div>
      {mode==='solid'&&<><div className="vb-basic-color"><label><span>Background color</span>
        <input type="color" aria-label="Background color" value={bg}
          onChange={e=>apply('Background color',{backgroundColor:e.target.value})}/></label>
        <input aria-label="Background color hex" value={read('backgroundColor')||bg}
          onChange={e=>{if(/^#[0-9a-fA-F]{6}$/.test(e.target.value))apply('Background color',{backgroundColor:e.target.value})}}/>
      </div>
      <div className="vb-brand-swatches" aria-label="Background brand colors">
        {palette.map(([name,hex])=><button type="button" title={'Use '+name} aria-label={'Use '+name+' background color'}
          key={name} style={{background:hex}} onClick={()=>apply('Brand background',{backgroundColor:hex})}/>)}
      </div></>}
      {mode==='gradient'&&<>
        <div className="vb-gradient-preview" style={{backgroundImage:gradient}}/>
        <label className="vb-basic-field"><span>Gradient type</span><select className={control}
          aria-label="Gradient type" value={kind} onChange={e=>backgroundGradient(e.target.value as 'linear'|'radial')}>
          <option value="linear">Linear</option><option value="radial">Radial</option></select></label>
        <div className="vb-design-columns">
          <label className="vb-basic-field"><span>First color</span><input type="color" aria-label="First gradient color"
            value={stops[0]} onChange={e=>backgroundGradient(kind,e.target.value,stops[1])}/></label>
          <label className="vb-basic-field"><span>Second color</span><input type="color" aria-label="Second gradient color"
            value={stops[1]} onChange={e=>backgroundGradient(kind,stops[0],e.target.value)}/></label>
        </div>
        {kind==='linear'&&<label className="vb-basic-field"><span>Direction · {angle}°</span>
          <input aria-label="Gradient angle" type="range" min="0" max="360" value={angle}
            onChange={e=>backgroundGradient(kind,stops[0],stops[1],Number(e.target.value))}/></label>}
        <label className="vb-basic-field"><span>Second color stop · {endAt}%</span>
          <input aria-label="Gradient stop position" type="range" min="1" max="100" value={endAt}
            onChange={e=>backgroundGradient(kind,stops[0],stops[1],angle,Number(e.target.value))}/></label>
      </>}
      {mode==='image'&&<>
        <label className="vb-basic-field"><span>Background image URL</span><input className={control}
          aria-label="Background image URL" type="url" placeholder="https://..."
          defaultValue={gradient.match(/^url\("(.+)"\)$/)?.[1]||''} key={node.id+gradient}
          onBlur={e=>{const uri=safeBackgroundUrl(e.target.value);if(uri)apply('Background image',{backgroundImage:uri})}}/></label>
        <label className="vb-basic-field"><span>Image fit</span><select className={control} aria-label="Background image fit"
          value={read('backgroundSize')||'cover'} onChange={e=>apply('Background image fit',{backgroundSize:e.target.value})}>
          <option>cover</option><option>contain</option><option>auto</option></select></label>
        <div className="vb-brand-swatches" aria-label="Choose background image from assets">
          {project.assets.filter(a=>a.mimeType.startsWith('image/')).slice(0,10).map(a=>
            <button key={a.id} type="button" title={a.name} aria-label={'Set background '+a.name}
              style={{backgroundImage:safeBackgroundUrl(a.url)||'',backgroundSize:'cover',backgroundPosition:'center'}}
              onClick={()=>{const url=safeBackgroundUrl(a.url);if(url)apply('Use image background',{backgroundImage:url})}}/>)}
        </div>
      </>}
      <button className="vb-basic-reset" type="button" onClick={()=>apply('Reset background',{backgroundImage:null,backgroundColor:null,backgroundSize:null})}>Reset background</button>
    </section>}
    {(frame||text||img)&&<section className="vb-design-group">
      <div className="vb-design-heading"><strong>Spacing</strong><small>Inside & outside</small></div>
      <div className="vb-design-columns">
        <NumberField name="Padding top" value={read('paddingTop')||defaults.paddingTop}
          onChange={n=>apply('Padding top',{paddingTop:n+'px'})}/>
        <NumberField name="Padding bottom" value={read('paddingBottom')||defaults.paddingBottom}
          onChange={n=>apply('Padding bottom',{paddingBottom:n+'px'})}/>
        <NumberField name="Padding left" value={read('paddingLeft')||defaults.paddingLeft}
          onChange={n=>apply('Padding left',{paddingLeft:n+'px'})}/>
        <NumberField name="Padding right" value={read('paddingRight')||defaults.paddingRight}
          onChange={n=>apply('Padding right',{paddingRight:n+'px'})}/>
        <NumberField name="Margin top" value={read('marginTop')||defaults.marginTop}
          onChange={n=>apply('Margin top',{marginTop:n+'px'})}/>
        <NumberField name="Margin bottom" value={read('marginBottom')||defaults.marginBottom}
          onChange={n=>apply('Margin bottom',{marginBottom:n+'px'})}/>
      </div>
      {frame&&<NumberField name="Content gap" value={read('gap')||'0px'}
        onChange={n=>apply('Content gap',{gap:n+'px'})}/>}
    </section>}
    {frame&&<section className="vb-design-group">
      <div className="vb-design-heading"><strong>Responsive layout</strong><small>{breakpoint}</small></div>
      {(node.type==='flex'||node.type==='grid'||node.type==='container'||node.type==='div')&&
        <label className="vb-basic-field"><span>Stack direction</span><select className={control}
          aria-label="Stack direction" value={read('flexDirection')||''}
          onChange={e=>apply('Responsive stacking',{display:e.target.value?'flex':null,flexDirection:e.target.value||null})}>
          <option value="">Theme layout</option><option value="row">Horizontal</option><option value="column">Vertical</option></select></label>}
      {node.type==='grid'&&<label className="vb-basic-field"><span>Grid columns</span>
        <select className={control} aria-label="Grid columns" value={read('gridTemplateColumns')||''}
          onChange={e=>apply('Responsive grid',{gridTemplateColumns:e.target.value||null})}>
          <option value="">Theme columns</option><option value="1fr">1</option>
          <option value="repeat(2,minmax(0,1fr))">2</option>
          <option value="repeat(3,minmax(0,1fr))">3</option></select></label>}
      <label className="vb-basic-field"><span>Visibility on this device</span>
        <select className={control} aria-label="Visibility on breakpoint" value={read('display')==='none'?'hidden':'visible'}
          onChange={e=>apply('Responsive visibility',{display:e.target.value==='hidden'?'none':null})}>
          <option value="visible">Visible</option><option value="hidden">Hidden</option></select></label>
      <p className="vb-basic-note">Edits here affect the selected device and smaller widths. Choose Desktop to style all devices.</p>
    </section>}
    {img&&<section className="vb-design-group" aria-label="Image crop and fit">
      <div className="vb-design-heading"><strong>Image crop & focal point</strong><small>Non-destructive</small></div>
      <label className="vb-basic-field"><span>Fit</span><select className={control} aria-label="Image fit"
        value={read('objectFit')||'cover'} onChange={e=>apply('Image fit',{objectFit:e.target.value})}>
        <option value="cover">Cover (crop frame)</option><option value="contain">Contain (entire image)</option><option value="fill">Fill (stretch)</option></select></label>
      <label className="vb-basic-field"><span>Crop frame</span><select className={control} aria-label="Image aspect ratio"
        value={read('aspectRatio')||'auto'} onChange={e=>apply('Image crop frame',{aspectRatio:e.target.value})}>
        <option value="auto">Original</option><option value="1/1">Square</option><option value="4/3">Landscape 4:3</option>
        <option value="16/9">Wide 16:9</option><option value="3/4">Portrait 3:4</option></select></label>
      {(['x','y'] as const).map(axis=>{
        const positions=(read('objectPosition')||'50% 50%').match(/(\d+)%\s+(\d+)%/)||[]
        const x=clip(Number(positions[1]||50),0,100),y=clip(Number(positions[2]||50),0,100)
        return <label key={axis} className="vb-basic-field"><span>{axis==='x'?'Focal point horizontal':'Focal point vertical'}</span>
          <input type="range" min="0" max="100" value={axis==='x'?x:y}
            aria-label={axis==='x'?'Image focal X':'Image focal Y'}
            onChange={e=>apply('Image focal point',{objectPosition:`${axis==='x'?e.target.value:x}% ${axis==='y'?e.target.value:y}%`})}/></label>
      })}
      <button className="vb-basic-reset" type="button" onClick={()=>apply('Reset image crop',{objectFit:null,objectPosition:null,aspectRatio:null})}>Reset crop & fit</button>
    </section>}
  </div>
}
