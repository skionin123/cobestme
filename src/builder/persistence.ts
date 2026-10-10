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

/**
 * Prefer a local backup only when it is newer than the server copy.
 * This preserves edits saved to IndexedDB when a cloud sync failed.
 */
export function chooseLatestProject(local:BuilderProject|undefined,cloud:BuilderProject|null){
  if(!cloud)return {project:local||null,needsCloudSync:Boolean(local)}
  const localTime=Date.parse(local?.updatedAt||'')
  const cloudTime=Date.parse(cloud.updatedAt||'')
  const localIsNewer=Boolean(
    local&&Number.isFinite(localTime)&&(!Number.isFinite(cloudTime)||localTime>cloudTime||(localTime===cloudTime&&(local.version||0)>(cloud.version||0)))
  )
  return {
    project:localIsNewer?local!:cloud,
    needsCloudSync:localIsNewer,
  }
}

export const saveProject=(project:BuilderProject)=>activeRepository.save(project)
export const loadProject=(id:string)=>activeRepository.load(id)
export const removeProject=(id:string)=>activeRepository.remove(id)
