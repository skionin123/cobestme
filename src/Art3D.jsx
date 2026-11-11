import React,{createContext,useContext,useEffect,useRef,useState,useSyncExternalStore} from 'react'
import { Pause, Play } from 'lucide-react'
import './art3d.css'

// CoBest's moving 3D pictures. Images are Microsoft Fluent Emoji (MIT); see
// /licenses/fluent-emoji-3d.txt. A few of them also exist as short 3D
// animations (name-anim.webp).

const MOVING=new Set(['rocket','truck','camera','party'])
export const art3dSrc=name=>`/images/3d/${name}.webp`
export const art3dMovingSrc=name=>MOVING.has(name)?`/images/3d/${name}-anim.webp`:''

/* ---- Motion on or off ---------------------------------------------------
   Motion plays unless the person paused it here. The choice is kept in this
   browser and written to <html data-motion> so CSS can follow it.

   Devices that ask for less motion get the calm version, marked with
   <html data-calm>: everything still moves by itself, but nothing follows
   the pointer or the scroll, which is the kind of motion that makes some
   people dizzy. Pressing Play here is an explicit choice and gives the
   full version. */
const MOTION_KEY='cobest-motion'
const listeners=new Set()
const lessMotion=typeof window!=='undefined'&&window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null
function savedChoice(){
  try{const value=window.localStorage.getItem(MOTION_KEY);return value==='on'||value==='off'?value:''}catch{return ''}
}
export function getMotion(){
  if(typeof window==='undefined')return 'off'
  return savedChoice()==='off'?'off':'on'
}
export function getCalm(){
  return !!lessMotion?.matches&&savedChoice()!=='on'
}
function applyMotion(){
  if(typeof document!=='undefined'){
    document.documentElement.dataset.motion=getMotion()
    document.documentElement.toggleAttribute('data-calm',getCalm())
  }
  listeners.forEach(listener=>listener())
}
export function setMotion(value){
  try{window.localStorage.setItem(MOTION_KEY,value==='off'?'off':'on')}catch{/* private mode: lasts for this page only */}
  applyMotion()
}
function subscribe(listener){
  listeners.add(listener)
  return ()=>listeners.delete(listener)
}
if(typeof window!=='undefined'){
  applyMotion()
  lessMotion?.addEventListener?.('change',applyMotion)
  window.addEventListener('storage',event=>{if(event.key===MOTION_KEY)applyMotion()})
}
/** 'on' or 'off'. */
export function useMotion(){
  return useSyncExternalStore(subscribe,getMotion,()=>'off')
}
/** True while the calm version is showing. */
export function useCalm(){
  return useSyncExternalStore(subscribe,getCalm,()=>false)
}
/** People who asked their browser to save data get the small still pictures. */
const savingData=()=>typeof navigator!=='undefined'&&navigator.connection?.saveData===true

/** A button that pauses or plays every animation on CoBest's own pages.
    compact: icon only. icon: icon and words. */
export function MotionToggle({className='',icon=false,compact=false}){
  const motion=useMotion()
  const Icon=motion==='on'?Pause:Play
  const label=motion==='on'?'Pause animations':'Play animations'
  return <button type="button" className={('motion-toggle '+(compact?'is-compact ':'')+className).trim()}
    aria-label={compact?label:undefined} title={compact||icon?label:undefined}
    onClick={()=>setMotion(motion==='on'?'off':'on')}>{(icon||compact)&&<Icon size={compact?16:18} aria-hidden="true"/>}{!compact&&<span className="motion-toggle-label">{label}</span>}</button>
}

/* ---- One 3D picture -----------------------------------------------------
   play="always"  keeps moving (homepage, log in).
   play="enter"   moves for a few seconds when it appears and again when the
                  pointer touches it, then rests (dashboard, next to work).
   play="hover"   rests until the pointer touches it. */
const PLAY_MS=4200
const FADE_MS=320
export function Icon3D({name,size=64,play='always',lazy=false,delay=0,calm=false,ground=true,hoverParent=false,className=''}){
  const motionOn=useMotion()==='on'
  const [active,setActive]=useState(play==='enter')
  const [first,setFirst]=useState(play==='enter')
  const [leaving,setLeaving]=useState(false)
  const [loaded,setLoaded]=useState('')
  const timer=useRef(0)
  const node=useRef(null)
  const rest=()=>{setActive(false);setFirst(false)}
  const start=()=>{
    if(play==='always')return
    window.clearTimeout(timer.current)
    setActive(true)
    timer.current=window.setTimeout(rest,PLAY_MS)
  }
  useEffect(()=>{
    if(play==='enter')timer.current=window.setTimeout(rest,PLAY_MS)
    return ()=>window.clearTimeout(timer.current)
  },[play])
  // Touching the row or header the picture sits in plays it too.
  useEffect(()=>{
    const parent=hoverParent&&play!=='always'?node.current?.parentElement:null
    if(!parent)return undefined
    parent.addEventListener('pointerenter',start)
    parent.addEventListener('focusin',start)
    return ()=>{parent.removeEventListener('pointerenter',start);parent.removeEventListener('focusin',start)}
  },[hoverParent,play])
  const playing=motionOn&&(play==='always'||active)
  // Keep the moving picture for a moment after play ends, so it can fade into the still one.
  const wasPlaying=useRef(playing)
  useEffect(()=>{
    if(playing){wasPlaying.current=true;return undefined}
    if(!wasPlaying.current)return undefined
    wasPlaying.current=false
    setLeaving(true)
    const fade=window.setTimeout(()=>setLeaving(false),FADE_MS)
    return ()=>window.clearTimeout(fade)
  },[playing])
  const movingSrc=motionOn&&!savingData()?art3dMovingSrc(name):''
  // A short film further down the page is fetched when the visitor gets near it,
  // not on arrival, and stops being decoded once it is scrolled away again.
  const [near,setNear]=useState(!lazy)
  useEffect(()=>{
    if(!lazy||!movingSrc||!node.current)return undefined
    if(typeof IntersectionObserver==='undefined'){setNear(true);return undefined}
    const watcher=new IntersectionObserver(entries=>setNear(entries[entries.length-1].isIntersecting),{rootMargin:'240px 0px'})
    watcher.observe(node.current)
    return ()=>watcher.disconnect()
  },[lazy,movingSrc])
  const movingMounted=!!movingSrc&&near&&(playing||leaving)
  const classes=['i3d','i3d-'+play,playing?'is-playing':'',playing&&first?'is-first':'',
    playing&&movingMounted&&loaded===movingSrc?'is-moving':'',calm?'is-calm':'',className].filter(Boolean).join(' ')
  return <span ref={node} className={classes} style={{'--i3d-size':size+'px','--i3d-delay':delay+'s'}} aria-hidden="true"
    onPointerEnter={play==='always'||hoverParent?undefined:start}>
    <span className="i3d-lift">
      <img className="i3d-still" src={art3dSrc(name)} alt="" width={size} height={size} loading={lazy?'lazy':undefined} decoding="async" draggable={false}/>
      {movingMounted&&<img className="i3d-moving" src={movingSrc} alt="" width={size} height={size} loading={lazy?'lazy':undefined} decoding="async" draggable={false}
        onLoad={()=>setLoaded(movingSrc)}/>}
    </span>
    {ground&&<span className="i3d-ground"/>}
  </span>
}

/* ---- The picture that belongs to a dashboard page ----------------------- */
const pageArt={
  dashboard:'shopping-bags',orders:'truck',customers:'handshake','sales-report':'chart',analytics:'chart',
  products:'package',taxonomy:'dividers',collections:'star',discounts:'gift',
  'shop-design':'palette',themes:'palette',website:'frame',pages:'frame',settings:'rocket',sites:'globe',storefront:'shopping-bags',
  media:'camera',inbox:'inbox',marketing:'megaphone',team:'wave',billing:'card',integrations:'puzzle',
  blog:'memo',brief:'memo',help:'bulb',navigation:'globe',processes:'check',
}
export const pageArtName=page=>pageArt[page]||'sparkles'
export const PageContext=createContext('')
/** Sits in a page header, next to the title. */
export function PageArt({size=72}){
  const page=useContext(PageContext)
  return <Icon3D key={page} name={pageArtName(page)} size={size} play="enter" hoverParent className="page-art"/>
}
/** For lists that are still empty. */
export function EmptyArt(){
  return <Icon3D name="sparkles" size={76} play="enter"/>
}

/* ---- Pointer and scroll for 3D scenes ------------------------------------
   Writes --px and --py (-1 to 1, where the pointer is) and --scroll (0 to 1,
   how far the element has scrolled away) on the element, and marks it
   "is-offscreen" so its animations can rest while nobody can see them.
   The calm version leaves all three at zero. */
export function useScene3D(ref,{pointer=true,scroll=false}={}){
  const motionOn=useMotion()==='on'
  const calm=useCalm()
  useEffect(()=>{
    const node=ref.current
    if(!node||typeof window==='undefined')return undefined
    let frame=0,px=0,py=0,progress=0
    const write=()=>{
      frame=0
      node.style.setProperty('--px',px.toFixed(3))
      node.style.setProperty('--py',py.toFixed(3))
      node.style.setProperty('--scroll',progress.toFixed(3))
    }
    const queue=()=>{if(!frame)frame=window.requestAnimationFrame(write)}
    const onPointer=event=>{
      if(event.pointerType==='touch')return
      px=Math.max(-1,Math.min(1,event.clientX/window.innerWidth*2-1))
      py=Math.max(-1,Math.min(1,event.clientY/window.innerHeight*2-1))
      queue()
    }
    const onScroll=()=>{
      const box=node.getBoundingClientRect()
      const start=box.top+window.scrollY
      progress=Math.max(0,Math.min(1,window.scrollY/Math.max(1,start+box.height)))
      queue()
    }
    const reset=()=>{px=0;py=0;progress=0;write()}
    if(!motionOn){reset();return undefined}
    if(calm)reset()
    if(pointer&&!calm)window.addEventListener('pointermove',onPointer,{passive:true})
    if(scroll&&!calm){window.addEventListener('scroll',onScroll,{passive:true});onScroll()}
    let observer
    if('IntersectionObserver' in window){
      observer=new IntersectionObserver(entries=>entries.forEach(entry=>node.classList.toggle('is-offscreen',!entry.isIntersecting)))
      observer.observe(node)
    }
    return ()=>{
      window.removeEventListener('pointermove',onPointer)
      window.removeEventListener('scroll',onScroll)
      observer?.disconnect()
      if(frame)window.cancelAnimationFrame(frame)
      node.classList.remove('is-offscreen')
    }
  },[ref,motionOn,calm,pointer,scroll])
}

/* ---- Pictures that drift around the log-in and sign-up cards ------------ */
const authSets={
  login:[['shopping-bags',148,'a'],['key',112,'b'],['package',118,'c'],['rocket',124,'d']],
  signup:[['shopping-bags',148,'a'],['sparkles',112,'b'],['package',118,'c'],['rocket',124,'d']],
  recover:[['lock',140,'a'],['key',108,'b'],['inbox',116,'c'],['sparkles',104,'d']],
}
export function AuthArt({kind='login'}){
  const ref=useRef(null)
  useScene3D(ref)
  return <div className="auth-art" ref={ref} aria-hidden="true">
    {(authSets[kind]||authSets.login).map(([name,size,slot],index)=>
      <span key={name} className={'auth-art-item auth-art-'+slot}><Icon3D name={name} size={size} delay={index*-1.3}/></span>)}
  </div>
}
