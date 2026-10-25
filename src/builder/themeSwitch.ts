import {applyTemplate,type BuilderTemplate} from './templates'
import {clone,uid} from './tree'
import type {BuilderProject,BuilderProjectSnapshot} from './types'

/** Switch a merchant's draft safely. This does NOT publish the result. */
export function prepareThemeSwitch(
  template:BuilderTemplate,
  previous:BuilderProject|null|undefined,
  siteId:string,
  siteName:string,
  now=Date.now()
):BuilderProject{
  const next=previous?.pages?.length?applyTemplate(template,previous):template.build()
  next.id=siteId
  next.name=siteName||'My website'

  if(previous?.pages?.length){
    const {versions:_discarded,...snapshot}=clone(previous)
    const saved:BuilderProjectSnapshot=snapshot
    next.versions=[{
      id:uid('version'),
      label:'Before switching to '+template.name,
      createdAt:new Date(now).toISOString(),
      project:saved,
    },...(next.versions||[])].slice(0,20)
  }
  const prior=Date.parse(previous?.updatedAt||'')
  next.version=Math.max(previous?.version||0,next.version||0)+1
  next.updatedAt=new Date(Math.max(now,Number.isFinite(prior)?prior+1:0)).toISOString()
  return next
}
