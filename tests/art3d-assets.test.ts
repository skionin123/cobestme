import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// CoBest's 3D pictures are looked up by name. A name with no file behind it
// shows a broken image, so every name used in the code must have its file,
// and the files must stay small enough for a phone on mobile data.

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8')
const folder=new URL('../public/images/3d/',import.meta.url)
const files=readdirSync(folder)
const kilobytes=(file:string)=>statSync(new URL(file,folder)).size/1024

const art=read('../src/Art3D.jsx')
const sources=['../src/Art3D.jsx','../src/Landing.jsx','../src/StoreOverview.jsx','../src/ShopLaunch.jsx','../src/GuestShop.jsx'].map(read).join('\n')
const all=(pattern:RegExp,text:string)=>[...text.matchAll(pattern)].map(match=>match[1])
const block=(start:string,end:string)=>art.slice(art.indexOf(start),art.indexOf(end,art.indexOf(start)))

const moving=all(/'([a-z-]+)'/g,block('const MOVING=',')'))
const names=new Set([
  ...all(/:'([a-z-]+)'/g,block('const pageArt={','}')),           // one per dashboard page
  ...all(/\['([a-z-]+)',\d+/g,block('const authSets={','\n}')),     // log in, sign up, password pages
  ...all(/Icon3D name="([a-z-]+)"/g,sources),
  ...all(/art3dSrc\('([a-z-]+)'\)/g,sources),
  ...all(/pageArt\[page\]\|\|'([a-z-]+)'/g,art),
  ...all(/^\s*\['([a-z-]+)','/gm,read('../src/Landing.jsx')),       // homepage steps and features
  ...moving,
])

describe('3D pictures',()=>{
  it('finds the names the code uses',()=>{
    expect(names.size).toBeGreaterThan(20)
    expect(moving.sort()).toEqual(['camera','party','rocket','truck'])
  })

  it('has a still picture for every name',()=>{
    const missing=[...names].filter(name=>!existsSync(new URL(`${name}.webp`,folder)))
    expect(missing).toEqual([])
  })

  it('has a moving picture for every name that moves',()=>{
    const missing=moving.filter(name=>!existsSync(new URL(`${name}-anim.webp`,folder)))
    expect(missing).toEqual([])
  })

  it('ships no picture that nothing uses',()=>{
    const expected=new Set([...[...names].map(name=>`${name}.webp`),...moving.map(name=>`${name}-anim.webp`)])
    expect(files.filter(file=>!expected.has(file))).toEqual([])
  })

  it('keeps the pictures light',()=>{
    const heavy=files.filter(file=>kilobytes(file)>(file.endsWith('-anim.webp')?160:16))
    expect(heavy).toEqual([])
    expect(files.reduce((sum,file)=>sum+kilobytes(file),0)).toBeLessThan(700)
  })

  it('credits both Microsoft image sets',()=>{
    const licence=read('../public/licenses/fluent-emoji-3d.txt')
    expect(licence).toContain('github.com/microsoft/fluentui-emoji)')
    expect(licence).toContain('github.com/microsoft/fluentui-emoji-animated')
    expect(licence).toContain('MIT License')
  })
})

describe('motion can always be paused',()=>{
  const css=read('../src/art3d.css')+read('../src/landing.css')

  it('only animates while motion is switched on',()=>{
    // Every animation in these two files sits behind html[data-motion="on"].
    const rules=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g,'')
    const animated=all(/([^{}]+)\{[^{}]*\banimation(?:-name)?:(?!none)[^{}]*\}/g,rules).map(selector=>selector.trim())
    expect(animated.length).toBeGreaterThan(10)
    expect(animated.filter(selector=>selector.split(',').some(part=>!part.includes('html[data-motion="on"]')))).toEqual([])
  })

  it('starts paused when the device asks for less motion',()=>{
    expect(art).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(art).toContain("savedChoice()||(lessMotion?.matches?'off':'on')")
  })
})

describe('pictures are cached by browsers',()=>{
  it('serves /images/ with a one-day cache',()=>{
    expect(read('../server.mjs')).toContain("url.pathname.startsWith('/images/')) headers['cache-control'] = 'public, max-age=86400, stale-while-revalidate=604800'")
  })
})
