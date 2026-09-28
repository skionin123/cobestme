import { create } from 'zustand'
import { createDefaultProject } from './defaultProject'
import type { BuilderHistoryEntry, BuilderProject, BreakpointId } from './types'

const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value))

interface BuilderState {
  project: BuilderProject
  selectedNodeId: string | null
  hoveredNodeId: string | null
  breakpoint: BreakpointId
  history: BuilderHistoryEntry[]
  future: BuilderHistoryEntry[]
  saveStatus: 'saved' | 'saving' | 'dirty' | 'error'
  selectNode:(id:string|null)=>void
  hoverNode:(id:string|null)=>void
  setBreakpoint:(id:BreakpointId)=>void
  setSaveStatus:(status:BuilderState['saveStatus'])=>void
  replaceProject:(project:BuilderProject,recordHistory?:boolean)=>void
  renameProject:(name:string)=>void
  undo:()=>void
  redo:()=>void
}

const snapshot=(project:BuilderProject):BuilderHistoryEntry=>({project:clone(project),createdAt:new Date().toISOString()})

export const useBuilderStore=create<BuilderState>((set,get)=>({
  project:createDefaultProject(),
  selectedNodeId:'hero-title-home',
  hoveredNodeId:null,
  breakpoint:'desktop',
  history:[],
  future:[],
  saveStatus:'saved',
  selectNode:id=>set({selectedNodeId:id}),
  hoverNode:id=>set({hoveredNodeId:id}),
  setBreakpoint:breakpoint=>set({breakpoint}),
  setSaveStatus:saveStatus=>set({saveStatus}),
  replaceProject:(project,recordHistory=true)=>set(state=>({
    project:{...clone(project),updatedAt:new Date().toISOString()},
    history:recordHistory?[...state.history,snapshot(state.project)].slice(-20):state.history,
    future:recordHistory?[]:state.future,
    saveStatus:recordHistory?'dirty':state.saveStatus,
  })),
  renameProject:name=>{
    const state=get()
    state.replaceProject({...state.project,name})
  },
  undo:()=>{
    const state=get()
    const previous=state.history.at(-1)
    if(!previous)return
    set({
      project:clone(previous.project),
      history:state.history.slice(0,-1),
      future:[snapshot(state.project),...state.future].slice(0,20),
      saveStatus:'dirty',
    })
  },
  redo:()=>{
    const state=get()
    const next=state.future[0]
    if(!next)return
    set({
      project:clone(next.project),
      history:[...state.history,snapshot(state.project)].slice(-20),
      future:state.future.slice(1),
      saveStatus:'dirty',
    })
  },
}))
