// A test deployment shares the live database, so it must not be able to
// change what real websites show. Runs the real server.mjs twice (test
// deployment and normal) against a small stand-in for Supabase.
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const OWNER='owner-token'
let fake:Server
let testApp:ChildProcess
let liveApp:ChildProcess
let testBase=''
let liveBase=''
let site:{id:number,site_name:string,settings:any}={id:7,site_name:'Bread Shop',settings:{}}
const writes:{method:string,path:string,body:any}[]=[]
let ipCounter=0

const readBody=async(req:IncomingMessage)=>{
  const chunks:Buffer[]=[]
  for await(const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

function startFakeSupabase(){
  return new Promise<Server>(resolve=>{
    const server=createServer(async(req,res)=>{
      const url=new URL(req.url||'/','http://fake')
      const raw=await readBody(req)
      let body:any=null
      try{body=JSON.parse(raw||'null')}catch{}
      const send=(status:number,data?:any)=>{res.writeHead(status,{'content-type':'application/json'});res.end(data===undefined?'':JSON.stringify(data))}
      if(url.pathname==='/auth/v1/user')return String(req.headers.authorization)===`Bearer ${OWNER}`?send(200,{id:'user-1',email:'owner@example.com'}):send(401,{message:'invalid token'})
      if(req.method!=='GET')writes.push({method:req.method||'',path:url.pathname,body})
      if(url.pathname==='/rest/v1/workspaces'){
        if(req.method==='GET')return send(200,url.search.includes('slug=eq.')?[]:[{...site,slug:'bread-shop',onboarding:{},editor:{}}])
        if(req.method==='POST')return send(201,[{id:8,...body}])
        return send(200,[{...site,...body}])
      }
      if(url.pathname==='/rest/v1/workspace_members')return send(200,[])
      if(url.pathname==='/rest/v1/published_stores')return send(req.method==='GET'?200:201,[])
      send(404,{message:`fake supabase: no route for ${req.method} ${url.pathname}`})
    })
    server.listen(0,'127.0.0.1',()=>resolve(server))
  })
}

const freePort=()=>new Promise<number>(resolve=>{
  const probe=createServer()
  probe.listen(0,'127.0.0.1',()=>{const {port}=probe.address() as AddressInfo;probe.close(()=>resolve(port))})
})

async function startApp(extraEnv:Record<string,string>){
  const port=await freePort()
  const env:Record<string,string|undefined>={...process.env,PORT:String(port),SUPABASE_URL:`http://127.0.0.1:${(fake.address() as AddressInfo).port}`,SUPABASE_ANON_KEY:'anon-key',
    STRIPE_SECRET_KEY:'',PAYPAL_CLIENT_ID:'',PAYPAL_CLIENT_SECRET:'',RESEND_API_KEY:'',COBEST_TEST_DEPLOYMENT:'',...extraEnv}
  const child=spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('..',import.meta.url)),env,stdio:['ignore','pipe','pipe']})
  await new Promise<void>((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('server did not start')),15000)
    child.stdout!.on('data',chunk=>{if(String(chunk).includes('listening')){clearTimeout(timer);resolve()}})
    child.on('exit',code=>reject(new Error(`server exited early (${code})`)))
  })
  return {child,base:`http://127.0.0.1:${port}`}
}

const call=(base:string,path:string,{method='GET',body}:{method?:string,body?:any}={})=>fetch(base+path,{
  method,
  headers:{'x-forwarded-for':`10.1.0.${++ipCounter}`,authorization:`Bearer ${OWNER}`,...(body!==undefined?{'content-type':'application/json'}:{})},
  body:body!==undefined?JSON.stringify(body):undefined,
})
const snapshot={onboarding:{businessName:'Bread Shop'},settings:{},products:[],editor:{shopDesign:{theme:'market'}}}
const publishedWrites=()=>writes.filter(write=>write.path==='/rest/v1/published_stores')

beforeAll(async()=>{
  fake=await startFakeSupabase()
  ;({child:testApp,base:testBase}=await startApp({COBEST_TEST_DEPLOYMENT:'1'}))
  ;({child:liveApp,base:liveBase}=await startApp({}))
},40000)

afterAll(async()=>{
  for(const child of [testApp,liveApp]){child?.removeAllListeners('exit');child?.kill()}
  await new Promise(resolve=>fake?.close(()=>resolve(null)))
})

beforeEach(()=>{site={id:7,site_name:'Bread Shop',settings:{}};writes.length=0})

describe('a test deployment cannot change real websites',()=>{
  it('says that it is a test deployment',async()=>{
    expect(await (await call(testBase,'/api/health')).json()).toMatchObject({ok:true,testDeployment:true})
    expect(await (await call(liveBase,'/api/health')).json()).not.toHaveProperty('testDeployment')
  })

  it('refuses to publish or unpublish a shop from the live site, with a message that says what to do',async()=>{
    const publish=await call(testBase,'/api/publish',{method:'POST',body:{slug:'bread-shop',snapshot}})
    expect(publish.status).toBe(403)
    expect((await publish.json()).error).toMatch(/test version of CoBest.*Create a new shop here/)
    const unpublish=await call(testBase,'/api/unpublish',{method:'POST',body:{}})
    expect(unpublish.status).toBe(403)
    // Nothing was written or removed.
    expect(publishedWrites()).toEqual([])
    expect(writes.filter(write=>write.method==='PATCH')).toEqual([])
  })

  it('publishes shops that were created on the test deployment',async()=>{
    const created=await call(testBase,'/api/sites',{method:'POST',body:{site_name:'My trial shop'}})
    expect(created.status).toBe(201)
    const sent=writes.find(write=>write.method==='POST'&&write.path==='/rest/v1/workspaces')
    expect(sent?.body.settings).toEqual({createdOnTestDeployment:true})
    site={id:7,site_name:'My trial shop',settings:{createdOnTestDeployment:true}}
    const publish=await call(testBase,'/api/publish',{method:'POST',body:{slug:'my-trial-shop',snapshot}})
    expect(publish.status).toBe(200)
    expect(publishedWrites()).toHaveLength(1)
  })

  it('publishes shops whose name starts with “Test”',async()=>{
    site={id:7,site_name:'  test bakery',settings:{}}
    expect((await call(testBase,'/api/publish',{method:'POST',body:{slug:'test-bakery',snapshot}})).status).toBe(200)
    site={id:7,site_name:'Contest shop',settings:{}}
    expect((await call(testBase,'/api/publish',{method:'POST',body:{slug:'contest-shop',snapshot}})).status).toBe(403)
  })

  it('does not let the browser mark a live shop as a test shop',async()=>{
    for(const base of [testBase,liveBase]){
      writes.length=0
      const saved=await call(base,'/api/workspace',{method:'PUT',body:{settings:{createdOnTestDeployment:true,contactEmail:'owner@example.com'}}})
      expect(saved.status).toBe(200)
      const patch=writes.find(write=>write.method==='PATCH'&&write.path==='/rest/v1/workspaces')
      expect(patch?.body.settings).toEqual({contactEmail:'owner@example.com'})
    }
    // …and saving keeps the marker on shops that really are test shops.
    site={id:7,site_name:'My trial shop',settings:{createdOnTestDeployment:true}}
    writes.length=0
    await call(testBase,'/api/workspace',{method:'PUT',body:{settings:{contactEmail:'owner@example.com'}}})
    expect(writes.find(write=>write.method==='PATCH')?.body.settings).toEqual({createdOnTestDeployment:true,contactEmail:'owner@example.com'})
  })

  it('the normal website publishes as usual and creates ordinary shops',async()=>{
    expect((await call(liveBase,'/api/publish',{method:'POST',body:{slug:'bread-shop',snapshot}})).status).toBe(200)
    writes.length=0
    await call(liveBase,'/api/sites',{method:'POST',body:{site_name:'Second shop'}})
    expect(writes.find(write=>write.method==='POST'&&write.path==='/rest/v1/workspaces')?.body.settings).toEqual({})
  })
})
