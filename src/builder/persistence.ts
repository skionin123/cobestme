import type { BuilderProject } from './types'

export interface ProjectRepository {
  save(project:BuilderProject):Promise<void>
  load(id:string):Promise<BuilderProject|undefined>
  remove(id:string):Promise<void>
}

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

export const indexedDbRepository:ProjectRepository={
  async save(project){
    const db=await openDb()
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite')
      tx.objectStore(STORE).put(project)
      tx.oncomplete=()=>resolve()
      tx.onerror=()=>reject(tx.error)
    })
    db.close()
  },
  async load(id){
    const db=await openDb()
    const value=await new Promise<BuilderProject|undefined>((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly')
      const req=tx.objectStore(STORE).get(id)
      req.onsuccess=()=>resolve(req.result)
      req.onerror=()=>reject(req.error)
    })
    db.close()
    return value
  },
  async remove(id){
    const db=await openDb()
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete=()=>resolve()
      tx.onerror=()=>reject(tx.error)
    })
    db.close()
  },
}

let activeRepository:ProjectRepository=indexedDbRepository

export function setProjectRepository(repository:ProjectRepository){
  activeRepository=repository
}

export const saveProject=(project:BuilderProject)=>activeRepository.save(project)
export const loadProject=(id:string)=>activeRepository.load(id)
export const removeProject=(id:string)=>activeRepository.remove(id)
