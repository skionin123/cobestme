// Runs the real server.mjs against a small stand-in for Supabase, so the
// publishing and security rules are checked through actual HTTP requests.
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const OWNER='owner-token'
const VIEWER='viewer-token'
type Row={snapshot:any,slug:string,custom_domain:string,published_at:string}

let fake:Server
let app:ChildProcess
let base=''
let published:Row|null=null
let failPublishedRead=false
const uploads:{path:string,type:string,size:number}[]=[]
const rpcCalls:{name:string,body:any}[]=[]
let ipCounter=0

const readBody=async(req:IncomingMessage)=>{
  const chunks:Buffer[]=[]
  for await(const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

function startFakeSupabase(){
  return new Promise<Server>(resolve=>{
    const server=createServer(async(req,res)=>{
      const url=new URL(req.url||'/','http://fake')
      const raw=await readBody(req)
      const json=()=>{try{return JSON.parse(raw.toString('utf8')||'null')}catch{return null}}
      const send=(status:number,data:any)=>{res.writeHead(status,{'content-type':'application/json'});res.end(data===undefined?'':JSON.stringify(data))}
      const token=String(req.headers.authorization||'').replace('Bearer ','')
      const q=url.search

      if(url.pathname==='/auth/v1/user'){
        if(token===OWNER)return send(200,{id:'user-1',email:'owner@example.com'})
        if(token===VIEWER)return send(200,{id:'user-2',email:'viewer@example.com'})
        return send(401,{message:'invalid token'})
      }
      if(url.pathname==='/auth/v1/signup')return send(200,{id:'new-user'})
      if(url.pathname==='/auth/v1/token')return send(400,{error_description:'Invalid login credentials'})
      if(url.pathname==='/rest/v1/workspaces'&&req.method==='GET'){
        if(q.includes('user_id=eq.user-1'))return send(200,[{id:7}])
        return send(200,[])
      }
      if(url.pathname==='/rest/v1/workspaces'&&req.method==='PATCH')return send(200,[{id:7}])
      if(url.pathname==='/rest/v1/workspace_members')return send(200,q.includes('member_user_id=eq.user-2')?[{owner_user_id:'user-1',role:'Viewer'}]:[])
      if(url.pathname==='/rest/v1/published_stores'&&req.method==='GET'){
        if(q.includes('custom_domain=eq.'))return send(200,published&&q.includes(`custom_domain=eq.${published.custom_domain}`)&&published.custom_domain?[{slug:published.slug}]:[])
        if(failPublishedRead)return send(500,{message:'database unavailable'})
        return send(200,published?[{snapshot:published.snapshot,published_at:published.published_at}]:[])
      }
      if(url.pathname==='/rest/v1/published_stores'&&req.method==='POST'){
        const body=json()
        published={snapshot:body.snapshot,slug:body.slug,custom_domain:body.custom_domain,published_at:body.published_at}
        return send(201,[body])
      }
      if(url.pathname.startsWith('/rest/v1/rpc/')){
        const name=url.pathname.split('/').pop() as string
        const body=json()
        rpcCalls.push({name,body})
        if(name==='public_store_payload')return send(200,published&&published.slug===body.p_slug?{...published.snapshot,slug:published.slug}:null)
        return send(200,null)
      }
      if(url.pathname.startsWith('/storage/v1/object/cobest-media/')){
        uploads.push({path:url.pathname,type:String(req.headers['content-type']),size:raw.length})
        return send(200,{Key:url.pathname})
      }
      if(url.pathname==='/rest/v1/media_assets')return send(201,[{id:1,...json()}])
      send(404,{message:`fake supabase: no route for ${req.method} ${url.pathname}`})
    })
    server.listen(0,'127.0.0.1',()=>resolve(server))
  })
}

const freePort=()=>new Promise<number>(resolve=>{
  const probe=createServer()
  probe.listen(0,'127.0.0.1',()=>{const {port}=probe.address() as AddressInfo;probe.close(()=>resolve(port))})
})

const call=(path:string,{method='GET',token='',body,headers={},raw}:{method?:string,token?:string,body?:any,headers?:Record<string,string>,raw?:Buffer|string}={})=>fetch(base+path,{
  method,
  headers:{
    // Every call gets its own address so tests do not share rate-limit buckets.
    'x-forwarded-for':`10.0.${Math.floor(++ipCounter/250)}.${ipCounter%250}`,
    ...(body!==undefined?{'content-type':'application/json'}:{}),
    ...(token?{authorization:`Bearer ${token}`}:{}),
    ...headers,
  },
  body:raw!==undefined?raw as any:body!==undefined?JSON.stringify(body):undefined,
})

const visual=(homeText:string)=>({name:'Site',pages:[{id:'home',name:'Home',slug:'',root:{id:'r',content:homeText}}],versions:[{id:'old'}]})
const shopSnapshot=(extra:any={})=>({
  onboarding:{businessName:'Bread Shop'},
  settings:{currency:'PHP'},
  products:[{id:1,name:'Loaf',status:'Active',price:100},{id:2,name:'Secret',status:'Draft',price:5}],
  discounts:[{code:'VIP50',active:true,kind:'percent',value:50}],
  editor:{shopDesign:{theme:'market'}},
  ...extra,
})

beforeAll(async()=>{
  fake=await startFakeSupabase()
  const port=await freePort()
  base=`http://127.0.0.1:${port}`
  app=spawn(process.execPath,['server.mjs'],{
    cwd:fileURLToPath(new URL('..',import.meta.url)),
    env:{...process.env,PORT:String(port),SUPABASE_URL:`http://127.0.0.1:${(fake.address() as AddressInfo).port}`,SUPABASE_ANON_KEY:'anon-key',
      STRIPE_SECRET_KEY:'',PAYPAL_CLIENT_ID:'',PAYPAL_CLIENT_SECRET:'',RESEND_API_KEY:''},
    stdio:['ignore','pipe','pipe'],
  })
  await new Promise<void>((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('server did not start')),15000)
    app.stdout!.on('data',chunk=>{if(String(chunk).includes('listening')){clearTimeout(timer);resolve()}})
    app.on('exit',code=>reject(new Error(`server exited early (${code})`)))
  })
},30000)

afterAll(async()=>{
  app?.removeAllListeners('exit')
  app?.kill()
  await new Promise(resolve=>fake?.close(()=>resolve(null)))
})

beforeEach(()=>{published=null;failPublishedRead=false;uploads.length=0;rpcCalls.length=0})

describe('publishing',()=>{
  it('does not put the Advanced editor draft live when the shop is published',async()=>{
    const snapshot=shopSnapshot()
    snapshot.editor.visualBuilderProject=visual('UNFINISHED DRAFT')
    const response=await call('/api/publish',{method:'POST',token:OWNER,body:{slug:'bread',snapshot}})
    expect(response.status).toBe(200)
    const result=await response.json()
    expect(result).toMatchObject({ok:true,slug:'bread',home_source:'storefront',has_custom_pages:false})
    expect(JSON.stringify(published!.snapshot)).not.toContain('UNFINISHED DRAFT')

    const live=await (await call('/api/public/store/bread')).json()
    expect(live.home_source).toBe('storefront')
    expect(live.visual_project).toBeUndefined()
    expect(JSON.stringify(live)).not.toContain('UNFINISHED DRAFT')
  })

  it('keeps live custom pages and the homepage choice when products are republished',async()=>{
    await call('/api/publish',{method:'POST',token:OWNER,body:{slug:'bread',snapshot:shopSnapshot({visual_project:visual('LIVE CUSTOM HOME'),home_source:'custom'})}})
    const draftSnapshot=shopSnapshot()
    draftSnapshot.editor.visualBuilderProject=visual('NEWER DRAFT')
    const second=await (await call('/api/publish',{method:'POST',token:OWNER,body:{slug:'bread',snapshot:draftSnapshot}})).json()
    expect(second).toMatchObject({home_source:'custom',has_custom_pages:true,custom_page_names:['Home']})
    const live=await (await call('/api/public/store/bread')).json()
    expect(JSON.stringify(live)).toContain('LIVE CUSTOM HOME')
    expect(JSON.stringify(live)).not.toContain('NEWER DRAFT')
    expect(live.visual_project.versions).toEqual([])
  })

  it('can publish custom pages while the shop stays the homepage',async()=>{
    await call('/api/publish',{method:'POST',token:OWNER,body:{slug:'bread',snapshot:shopSnapshot()}})
    const result=await (await call('/api/publish',{method:'POST',token:OWNER,body:{slug:'bread',snapshot:shopSnapshot({visual_project:visual('ABOUT PAGES'),home_source:'storefront'})}})).json()
    expect(result).toMatchObject({home_source:'storefront',has_custom_pages:true})
    const status=await (await call('/api/publish/status',{token:OWNER})).json()
    expect(status).toMatchObject({published:true,home_source:'storefront',has_custom_pages:true,storefront_theme:'market'})
  })

  it('reports that nothing is live before the first publish',async()=>{
    const status=await (await call('/api/publish/status',{token:OWNER})).json()
    expect(status).toMatchObject({published:false,home_source:'storefront',has_custom_pages:false})
  })

  it('refuses to publish when it cannot check what is live',async()=>{
    failPublishedRead=true
    const response=await call('/api/publish',{method:'POST',token:OWNER,body:{slug:'bread',snapshot:shopSnapshot()}})
    expect(response.status).toBe(502)
    expect(published).toBeNull()
  })

  it('blocks viewers and anonymous callers',async()=>{
    expect((await call('/api/publish',{method:'POST',token:VIEWER,body:{slug:'x',snapshot:shopSnapshot()}})).status).toBe(403)
    expect((await call('/api/publish',{method:'POST',body:{slug:'x',snapshot:shopSnapshot()}})).status).toBe(401)
    expect((await call('/api/publish/status')).status).toBe(401)
    expect(published).toBeNull()
  })
})

describe('what visitors can download',()=>{
  it('never includes discount codes or unpublished products',async()=>{
    await call('/api/publish',{method:'POST',token:OWNER,body:{slug:'bread',snapshot:shopSnapshot()}})
    const text=await (await call('/api/public/store/bread')).text()
    expect(text).not.toContain('VIP50')
    expect(text).not.toContain('Secret')
    expect(text).toContain('Loaf')
    // Checkout still needs the codes on the server.
    expect(JSON.stringify(published!.snapshot)).toContain('VIP50')
  })

  it('answers unknown or malformed store addresses with 404',async()=>{
    expect((await call('/api/public/store/nope')).status).toBe(404)
    expect((await call('/api/public/store/%E0%A4%A')).status).toBe(404)
    expect((await call('/api/public/domain?host=not_a_domain')).status).toBe(404)
  })
})

describe('anonymous forms',()=>{
  it('trims oversized contact messages and rejects bad email addresses',async()=>{
    const ok=await call('/api/public/contact',{method:'POST',body:{slug:'bread',name:'A'.repeat(500),email:'a@b.co',message:'M'.repeat(9000)}})
    expect(ok.status).toBe(200)
    const sent=rpcCalls.find(x=>x.name==='contact_store')!.body
    expect(sent.p_name).toHaveLength(120)
    expect(sent.p_message).toHaveLength(5000)
    expect((await call('/api/public/contact',{method:'POST',body:{slug:'bread',email:'not-an-email',message:'hi'}})).status).toBe(400)
    expect((await call('/api/public/contact',{method:'POST',body:{slug:'bread',email:'a@b.co',message:'   '}})).status).toBe(400)
  })

  it('refuses bodies that are too large or not objects',async()=>{
    expect((await call('/api/public/contact',{method:'POST',raw:JSON.stringify({slug:'bread',email:'a@b.co',message:'x'.repeat(300*1024)}),headers:{'content-type':'application/json'}})).status).toBe(413)
    expect((await call('/api/public/contact',{method:'POST',raw:'[1,2,3]',headers:{'content-type':'application/json'}})).status).toBe(400)
    expect((await call('/api/public/contact',{method:'POST',raw:'{broken',headers:{'content-type':'application/json'}})).status).toBe(400)
  })

  it('only records well-formed analytics events',async()=>{
    expect((await call('/api/public/event',{method:'POST',body:{slug:'bread',event_type:'page_view',path:'/',metadata:{a:1}}})).status).toBe(200)
    expect((await call('/api/public/event',{method:'POST',body:{slug:'bread',event_type:'<script>alert(1)</script>'}})).status).toBe(400)
    await call('/api/public/event',{method:'POST',body:{slug:'bread',event_type:'page_view',metadata:{blob:'x'.repeat(5000)}}})
    expect(rpcCalls.filter(x=>x.name==='track_store_event').pop()!.body.p_metadata).toEqual({})
  })

  it('limits repeated attempts from one address',async()=>{
    const headers={'x-forwarded-for':'203.0.113.9'}
    let last=0
    for(let i=0;i<11;i++) last=(await call('/api/auth/login',{method:'POST',body:{email:'a@b.co',password:'wrong-password'},headers})).status
    expect(last).toBe(429)
    // Someone else is not locked out.
    expect((await call('/api/auth/login',{method:'POST',body:{email:'a@b.co',password:'wrong-password'}})).status).toBe(400)
  })
})

describe('sign up',()=>{
  it('requires a real email address and a password of 8 or more characters',async()=>{
    expect((await call('/api/auth/signup',{method:'POST',body:{email:'nope',password:'longenough1'}})).status).toBe(400)
    expect((await call('/api/auth/signup',{method:'POST',body:{email:'a@b.co',password:'short'}})).status).toBe(400)
    expect((await call('/api/auth/signup',{method:'POST',body:{email:'a@b.co',password:'longenough1'}})).status).toBe(200)
  })
})

describe('media uploads',()=>{
  const png=Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),Buffer.alloc(64)])
  const upload=(body:Buffer,type:string,name:string,token=OWNER)=>call('/api/media/upload',{method:'POST',token,raw:body,headers:{'content-type':type,'x-file-name':encodeURIComponent(name)}})

  it('stores a real image under its real type',async()=>{
    const response=await upload(png,'image/png','photo.png')
    expect(response.status).toBe(201)
    expect(uploads).toHaveLength(1)
    expect(uploads[0].type).toBe('image/png')
    expect(uploads[0].path).toMatch(/\/user-1\/7\/\d+-photo\.png$/)
  })

  it('rejects a web page or script that is renamed to look like an image',async()=>{
    const html=Buffer.from('<!doctype html><html><script>alert(document.cookie)</script></html>')
    expect((await upload(html,'image/png','photo.png')).status).toBe(415)
    expect((await upload(html,'text/html','page.html')).status).toBe(415)
    expect((await upload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'),'image/svg+xml','logo.svg')).status).toBe(415)
    expect(uploads).toHaveLength(0)
  })

  it('trusts the content, not the label: a mislabelled image is stored as what it really is',async()=>{
    expect((await upload(png,'application/pdf','invoice.pdf')).status).toBe(201)
    expect(uploads[0].type).toBe('image/png')
    expect(uploads[0].path).toMatch(/invoice\.png$/)
  })

  it('gives the stored file an extension that matches its content',async()=>{
    await upload(png,'image/png','photo.html')
    expect(uploads[0].path).toMatch(/photo\.png$/)
    expect(uploads[0].path).not.toContain('.html')
  })

  it('blocks viewers',async()=>{
    expect((await upload(png,'image/png','photo.png',VIEWER)).status).toBe(403)
    expect(uploads).toHaveLength(0)
  })
})

describe('dashboard data',()=>{
  it('refuses media records that point at script addresses',async()=>{
    const bad=await call('/api/data/media_assets',{method:'POST',token:OWNER,body:{name:'x',url:'javascript:alert(document.cookie)'}})
    expect(bad.status).toBe(400)
    const good=await call('/api/data/media_assets',{method:'POST',token:OWNER,body:{name:'x',url:'https://example.com/a.png'}})
    expect(good.status).toBe(201)
  })
  it('keeps viewers read-only',async()=>{
    expect((await call('/api/data/products',{method:'POST',token:VIEWER,body:{name:'Hack'}})).status).toBe(403)
  })
})

describe('every response',()=>{
  it('carries the security headers and is never cached for API calls',async()=>{
    const response=await call('/api/health')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    expect(response.headers.get('strict-transport-security')).toContain('max-age')
    expect(response.headers.get('content-security-policy')).toContain("frame-ancestors 'self'")
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
  it('does not reveal internals on unknown routes',async()=>{
    const response=await call('/api/does-not-exist',{token:OWNER})
    expect(response.status).toBe(404)
    expect(await response.text()).not.toMatch(/stack|node_modules|supabase/i)
  })
})
