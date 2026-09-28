import type { BuilderProject } from './types'

const DB_NAME='cobest-builder'
const STORE='projects'
const DB_VERSION=1

const openDb=()=>new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,DB_VERSION)
  request.onupgradeneeded=()=>{
    const db=request.result
    if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'id'})
  }
  request.onsuccess=()=>resolve(request.result)
  request.onerror=()=>reject(request.error)
})

export async function saveProject(project:BuilderProject){
  const db=await openDb()
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite')
    tx.objectStore(STORE).put(project)
    tx.oncomplete=()=>resolve()
    tx.onerror=()=>reject(tx.error)
  })
  db.close()
}

export async function loadProject(id:string){
  const db=await openDb()
  const value=await new Promise<BuilderProject|undefined>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly')
    const req=tx.objectStore(STORE).get(id)
    req.onsuccess=()=>resolve(req.result)
    req.onerror=()=>reject(req.error)
  })
  db.close()
  return value
}
