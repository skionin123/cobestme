import { create } from 'zustand'
import { createDefaultProject } from './defaultProject'
import { canAcceptChild, clone, findNode, findParent, insertNode, moveNode, regenerateNodeIds, removeNode, replaceComponentInstances, slugify, uid, updateNode, walkNodes } from './tree'
import type {
  BuilderAsset,
  BuilderComponent,
  BuilderInteraction,
  BuilderNode,
  BuilderPage,
  BuilderProject,
  BuilderProjectSnapshot,
  BuilderVersion,
  BreakpointId,
  CmsCollection,
  CssProperties,
  NodeState,
} from './types'

interface BuilderState {
  project: BuilderProject
  selectedNodeId: string | null
  hoveredNodeId: string | null
  breakpoint: BreakpointId
  styleState: NodeState
  history: BuilderProject[]
  future: BuilderProject[]
  saveStatus: 'saved' | 'saving' | 'dirty' | 'error'
  selectNode:(id:string|null)=>void
  hoverNode:(id:string|null)=>void
  setBreakpoint:(id:BreakpointId)=>void
  setStyleState:(state:NodeState)=>void
  setSaveStatus:(status:BuilderState['saveStatus'])=>void
  replaceProject:(project:BuilderProject,recordHistory?:boolean,label?:string)=>void
  mutate:(label:string,mutation:(draft:BuilderProject)=>void)=>void
  renameProject:(name:string)=>void
  setActivePage:(pageId:string)=>void
  addPage:(name:string)=>void
  renamePage:(pageId:string,name:string)=>void
  duplicatePage:(pageId:string)=>void
  deletePage:(pageId:string)=>void
  reorderPage:(pageId:string,delta:number)=>void
  updatePageSeo:(pageId:string,key:'title'|'description'|'ogImage'|'slug',value:string)=>void
  addNode:(parentId:string,node:BuilderNode,index?:number)=>void
  updateNode:(nodeId:string,patch:Partial<BuilderNode>)=>void
  updateNodeAttribute:(nodeId:string,key:string,value:string)=>void
  removeNodeAttribute:(nodeId:string,key:string)=>void
  deleteNode:(nodeId:string)=>void
  duplicateNode:(nodeId:string)=>void
  moveNode:(nodeId:string,parentId:string,index?:number)=>void
  addClass:(nodeId:string,className:string)=>void
  removeClass:(nodeId:string,className:string)=>void
  renameClass:(oldName:string,newName:string)=>void
  setStyle:(className:string,property:string,value:string,breakpoint?:BreakpointId,state?:NodeState)=>void
  removeStyle:(className:string,property:string,breakpoint?:BreakpointId,state?:NodeState)=>void
  setGlobalColor:(name:string,value:string)=>void
  setTextStyle:(name:string,properties:CssProperties)=>void
  addAsset:(asset:BuilderAsset)=>void
  removeAsset:(assetId:string)=>void
  createComponent:(nodeId:string,name:string)=>void
  updateComponentMaster:(componentId:string,node:BuilderNode)=>void
  insertComponent:(componentId:string,parentId:string)=>void
  deleteComponent:(componentId:string)=>void
  addInteraction:(interaction:BuilderInteraction)=>void
  updateInteraction:(id:string,patch:Partial<BuilderInteraction>)=>void
  deleteInteraction:(id:string)=>void
  addCollection:(collection:CmsCollection)=>void
  updateCollection:(id:string,patch:Partial<CmsCollection>)=>void
  deleteCollection:(id:string)=>void
  restoreVersion:(versionId:string)=>void
  importProject:(project:BuilderProject)=>void
  undo:()=>void
  redo:()=>void
}

const snapshotWithoutVersions=(project:BuilderProject):BuilderProjectSnapshot=>{
  const {versions,...rest}=clone(project)
  return rest
}

const makeVersion=(project:BuilderProject,label:string):BuilderVersion=>({
  id:uid('version'),
  label,
  createdAt:new Date().toISOString(),
  project:snapshotWithoutVersions(project),
})

const updateAllNodes=(project:BuilderProject,updater:(node:BuilderNode)=>BuilderNode)=>({
  ...project,
  pages:project.pages.map(page=>{
    const walk=(node:BuilderNode):BuilderNode=>{
      const next=updater(node)
      return {...next,children:(next.children||[]).map(walk)}
    }
    return {...page,root:walk(page.root)}
  }),
})

export const useBuilderStore=create<BuilderState>((set,get)=>{
  // Undo and redo are new edits for persistence, even when their content is old.
  // A monotonic timestamp and revision prevent an earlier cloud copy winning on reload.
  const advanceRevision=(current:BuilderProject,next:BuilderProject)=>{
    const previousTime=Date.parse(current.updatedAt||'')
    next.updatedAt=new Date(Math.max(Date.now(),(Number.isFinite(previousTime)?previousTime:0)+1)).toISOString()
    next.version=Math.max(current.version||0,next.version||0)+1
  }

  const commit=(label:string,mutation:(draft:BuilderProject)=>void)=>{
    const state=get()
    const previous=clone(state.project)
    const draft=clone(state.project)
    mutation(draft)
    advanceRevision(state.project,draft)
    const version=makeVersion(previous,label)
    draft.versions=[version,...(draft.versions||[])].slice(0,20)
    set({
      project:draft,
      history:[...state.history,previous],
      future:[],
      saveStatus:'dirty',
    })
  }

  const currentPage=(project:BuilderProject)=>project.pages.find(p=>p.id===project.activePageId)||project.pages[0]

  return {
    project:createDefaultProject(),
    selectedNodeId:'hero-title-home',
    hoveredNodeId:null,
    breakpoint:'desktop',
    styleState:'none',
    history:[],
    future:[],
    saveStatus:'saved',
    selectNode:id=>set({selectedNodeId:id}),
    hoverNode:id=>set({hoveredNodeId:id}),
    setBreakpoint:breakpoint=>set({breakpoint}),
    setStyleState:styleState=>set({styleState}),
    setSaveStatus:saveStatus=>set({saveStatus}),
    mutate:(label,mutation)=>commit(label,mutation),
    replaceProject:(project,recordHistory=true,label='Replace project')=>{
      if(!recordHistory){
        set({project:clone(project),history:[],future:[],saveStatus:'saved'})
        return
      }
      commit(label,draft=>Object.assign(draft,clone(project)))
    },
    renameProject:name=>commit('Rename project',draft=>{draft.name=name}),
    setActivePage:pageId=>{
      const project=get().project
      const page=project.pages.find(p=>p.id===pageId)
      if(!page)return
      commit('Switch page',draft=>{draft.activePageId=pageId})
      set({selectedNodeId:page.root.id})
    },
    addPage:name=>{
      const clean=name.trim()||'Untitled'
      const id=uid('page')
      const slug='/'+slugify(clean)
      const root:BuilderNode={id:uid('root'),type:'div',tag:'main',name:'Page',classes:['page-shell'],attributes:{},children:[]}
      commit('Add page',draft=>{
        draft.pages.push({id,name:clean,slug,seo:{title:clean,description:'',slug},root})
        draft.activePageId=id
      })
      set({selectedNodeId:root.id})
    },
    renamePage:(pageId,name)=>commit('Rename page',draft=>{
      const page=draft.pages.find(p=>p.id===pageId);if(!page)return
      page.name=name
      page.slug=page.slug==='/'?'/':'/'+slugify(name)
      page.seo.title=page.seo.title||name
      page.seo.slug=page.slug
    }),
    duplicatePage:pageId=>{
      const source=get().project.pages.find(p=>p.id===pageId);if(!source)return
      const page=clone(source)
      page.id=uid('page')
      page.name=source.name+' Copy'
      page.slug='/'+slugify(page.name)
      page.seo={...page.seo,title:page.name,slug:page.slug}
      page.root=regenerateNodeIds(page.root,'node')
      commit('Duplicate page',draft=>{draft.pages.push(page);draft.activePageId=page.id})
      set({selectedNodeId:page.root.id})
    },
    deletePage:pageId=>{
      const project=get().project
      const page=project.pages.find(p=>p.id===pageId)
      if(!page||page.slug==='/'||project.pages.length<=1)return
      commit('Delete page',draft=>{
        draft.pages=draft.pages.filter(p=>p.id!==pageId)
        if(draft.activePageId===pageId)draft.activePageId=draft.pages[0].id
      })
      const next=get().project.pages.find(p=>p.id===get().project.activePageId)
      set({selectedNodeId:next?.root.id||null})
    },
    reorderPage:(pageId,delta)=>commit('Reorder page',draft=>{
      const i=draft.pages.findIndex(p=>p.id===pageId),j=i+delta
      if(i<0||j<0||j>=draft.pages.length)return
      ;[draft.pages[i],draft.pages[j]]=[draft.pages[j],draft.pages[i]]
    }),
    updatePageSeo:(pageId,key,value)=>commit('Update page SEO',draft=>{
      const page=draft.pages.find(p=>p.id===pageId);if(!page)return
      page.seo={...page.seo,[key]:value}
      if(key==='slug'){page.slug=value.startsWith('/')?value:'/'+value;page.seo.slug=page.slug}
    }),
    addNode:(parentId,node,index)=>{
      const page=currentPage(get().project)
      const parent=findNode(page.root,parentId)
      if(!parent||!canAcceptChild(parent,node))return
      commit('Add element',draft=>{
        const draftPage=currentPage(draft)
        draftPage.root=insertNode(draftPage.root,parentId,node,index)
      })
      set({selectedNodeId:node.id})
    },
    updateNode:(nodeId,patch)=>commit('Edit element',draft=>{
      const page=currentPage(draft)
      page.root=updateNode(page.root,nodeId,node=>({...node,...clone(patch)}))
      let componentRoot:BuilderNode|null=findNode(page.root,nodeId)
      while(componentRoot&&!componentRoot.componentId){
        componentRoot=findParent(page.root,componentRoot.id)
      }
      if(componentRoot?.componentId&&String(componentRoot.componentInstanceId||'').startsWith('master:')){
        const component=draft.components.find(c=>c.id===componentRoot!.componentId)
        if(component){
          component.master={...clone(componentRoot),componentInstanceId:'master:'+component.id}
          component.updatedAt=new Date().toISOString()
          Object.assign(draft,replaceComponentInstances(draft,component.id,component.master))
        }
      }
    }),
    updateNodeAttribute:(nodeId,key,value)=>commit('Edit attribute',draft=>{
      const page=currentPage(draft)
      page.root=updateNode(page.root,nodeId,node=>({...node,attributes:{...(node.attributes||{}),[key]:value}}))
    }),
    removeNodeAttribute:(nodeId,key)=>commit('Remove attribute',draft=>{
      const page=currentPage(draft)
      page.root=updateNode(page.root,nodeId,node=>{const attributes={...(node.attributes||{})};delete attributes[key];return {...node,attributes}})
    }),
    deleteNode:nodeId=>{
      commit('Delete element',draft=>{
        const page=currentPage(draft)
        if(page.root.id===nodeId)return
        page.root=removeNode(page.root,nodeId).root
      })
      set({selectedNodeId:null})
    },
    duplicateNode:nodeId=>{
      let copy:BuilderNode|null=null
      commit('Duplicate element',draft=>{
        const page=currentPage(draft)
        const node=findNode(page.root,nodeId)
        if(!node)return
        const findParentLocal=(root:BuilderNode,id:string):BuilderNode|null=>{
          for(const child of root.children){if(child.id===id)return root;const hit=findParentLocal(child,id);if(hit)return hit}return null
        }
        const parentNode=findParentLocal(page.root,nodeId);if(!parentNode)return
        copy=regenerateNodeIds(node,'copy')
        const index=parentNode.children.findIndex(x=>x.id===nodeId)+1
        page.root=insertNode(page.root,parentNode.id,copy,index)
      })
      if(copy)set({selectedNodeId:(copy as BuilderNode).id})
    },
    moveNode:(nodeId,parentId,index)=>{
      const page=currentPage(get().project)
      const moving=findNode(page.root,nodeId)
      const parent=findNode(page.root,parentId)
      if(!moving||!parent||!canAcceptChild(parent,moving))return
      let containsParent=false
      walkNodes(moving,node=>{if(node.id===parentId)containsParent=true})
      if(containsParent)return
      commit('Move element',draft=>{
        const draftPage=currentPage(draft)
        draftPage.root=moveNode(draftPage.root,nodeId,parentId,index)
      })
    },
    addClass:(nodeId,className)=>commit('Add class',draft=>{
      const page=currentPage(draft)
      page.root=updateNode(page.root,nodeId,node=>({...node,classes:Array.from(new Set([...(node.classes||[]),className]))}))
      draft.styles[className]=draft.styles[className]||{desktop:{none:{}}}
    }),
    removeClass:(nodeId,className)=>commit('Remove class',draft=>{
      const page=currentPage(draft)
      page.root=updateNode(page.root,nodeId,node=>({...node,classes:(node.classes||[]).filter(x=>x!==className)}))
    }),
    renameClass:(oldName,newName)=>commit('Rename class',draft=>{
      const clean=newName.trim();if(!clean||clean===oldName)return
      if(draft.styles[oldName]){draft.styles[clean]=draft.styles[oldName];delete draft.styles[oldName]}
      const updated=updateAllNodes(draft,node=>({...node,classes:(node.classes||[]).map(x=>x===oldName?clean:x)}))
      draft.pages=updated.pages
    }),
    setStyle:(className,property,value,breakpoint,state)=>commit('Edit style',draft=>{
      const bp=breakpoint||get().breakpoint
      const st=state||get().styleState
      const style=draft.styles[className]||(draft.styles[className]={desktop:{none:{}}})
      if(bp==='desktop')style.desktop=style.desktop||{none:{}}
      else style[bp]=style[bp]||{}
      const breakpointStyle=style[bp]!
      breakpointStyle[st]=breakpointStyle[st]||{}
      breakpointStyle[st]![property]=value
    }),
    removeStyle:(className,property,breakpoint,state)=>commit('Reset style',draft=>{
      const bp=breakpoint||get().breakpoint
      const st=state||get().styleState
      const props=draft.styles[className]?.[bp]?.[st]
      if(props)delete props[property]
    }),
    setGlobalColor:(name,value)=>commit('Edit color variable',draft=>{draft.globals.colors[name]=value}),
    setTextStyle:(name,properties)=>commit('Edit text style',draft=>{draft.globals.textStyles[name]={...(draft.globals.textStyles[name]||{}),...properties}}),
    addAsset:asset=>commit('Add asset',draft=>{draft.assets=[asset,...draft.assets]}),
    removeAsset:assetId=>commit('Delete asset',draft=>{draft.assets=draft.assets.filter(a=>a.id!==assetId)}),
    createComponent:(nodeId,name)=>{
      const state=get();const page=currentPage(state.project);const node=findNode(page.root,nodeId);if(!node)return
      const id=uid('component')
      const master={...clone(node),componentId:id,componentInstanceId:'master:'+id}
      const component:BuilderComponent={id,name:name||node.name,master:clone(master),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}
      commit('Create component',draft=>{
        draft.components.push(component)
        const p=currentPage(draft)
        p.root=updateNode(p.root,nodeId,n=>({...n,componentId:id,componentInstanceId:'master:'+id}))
      })
    },
    updateComponentMaster:(componentId,node)=>commit('Update component',draft=>{
      const component=draft.components.find(c=>c.id===componentId);if(!component)return
      component.master={...clone(node),componentId}
      component.updatedAt=new Date().toISOString()
      Object.assign(draft,replaceComponentInstances(draft,componentId,component.master))
    }),
    insertComponent:(componentId,parentId)=>{
      const component=get().project.components.find(c=>c.id===componentId);if(!component)return
      const node=regenerateNodeIds({...component.master,componentId},'component')
      node.componentId=componentId;node.componentInstanceId=uid('instance')
      get().addNode(parentId,node)
    },
    deleteComponent:componentId=>commit('Delete component',draft=>{draft.components=draft.components.filter(c=>c.id!==componentId)}),
    addInteraction:interaction=>commit('Add interaction',draft=>{draft.interactions.push(interaction)}),
    updateInteraction:(id,patch)=>commit('Edit interaction',draft=>{const x=draft.interactions.find(i=>i.id===id);if(x)Object.assign(x,patch)}),
    deleteInteraction:id=>commit('Delete interaction',draft=>{draft.interactions=draft.interactions.filter(i=>i.id!==id)}),
    addCollection:collection=>commit('Add CMS collection',draft=>{
      const templateId=uid('page')
      const templateRoot:BuilderNode={
        id:uid('root'),type:'div',tag:'main',name:collection.name+' Template',classes:['page-shell'],attributes:{},children:[
          {id:uid('section'),type:'section',tag:'section',name:'CMS Template',classes:['section'],attributes:{collectionId:collection.id},children:[
            {id:uid('heading'),type:'heading',tag:'h1',name:'CMS Title',classes:['heading'],attributes:{'data-cms-field':'title'},content:'Collection item title',children:[]},
            {id:uid('paragraph'),type:'paragraph',tag:'p',name:'CMS Content',classes:['paragraph'],attributes:{'data-cms-field':'description'},content:'Collection item content',children:[]}
          ]}
        ]
      }
      const next={...collection,templatePageId:templateId}
      draft.collections.push(next)
      draft.pages.push({id:templateId,name:collection.name+' Template',slug:'/'+collection.slug+'/{slug}',seo:{title:collection.name+' Template',description:'',slug:'/'+collection.slug+'/{slug}'},root:templateRoot,isCollectionTemplate:true,collectionId:collection.id})
    }),
    updateCollection:(id,patch)=>commit('Edit CMS collection',draft=>{const x=draft.collections.find(c=>c.id===id);if(x)Object.assign(x,clone(patch))}),
    deleteCollection:id=>commit('Delete CMS collection',draft=>{
      draft.collections=draft.collections.filter(c=>c.id!==id)
      draft.pages=draft.pages.filter(p=>p.collectionId!==id)
    }),
    restoreVersion:versionId=>{
      const state=get();const version=state.project.versions.find(v=>v.id===versionId);if(!version)return
      const restored:BuilderProject={...clone(version.project),versions:clone(state.project.versions)}
      set({
        project:restored,
        history:[...state.history,clone(state.project)].slice(-20),
        future:[],
        saveStatus:'dirty',
        selectedNodeId:restored.pages.find(p=>p.id===restored.activePageId)?.root.id||null,
      })
    },
    importProject:project=>set({project:clone(project),history:[],future:[],selectedNodeId:project.pages.find(p=>p.id===project.activePageId)?.root.id||null,saveStatus:'dirty'}),
    undo:()=>{
      const state=get();const previous=state.history.at(-1);if(!previous)return
      const restored=clone(previous)
      advanceRevision(state.project,restored)
      const page=currentPage(restored)
      const selected=state.selectedNodeId&&findNode(page.root,state.selectedNodeId)?state.selectedNodeId:page.root.id
      set({project:restored,history:state.history.slice(0,-1),future:[clone(state.project),...state.future],saveStatus:'dirty',selectedNodeId:selected,hoveredNodeId:null})
    },
    redo:()=>{
      const state=get();const next=state.future[0];if(!next)return
      const restored=clone(next)
      advanceRevision(state.project,restored)
      const page=currentPage(restored)
      const selected=state.selectedNodeId&&findNode(page.root,state.selectedNodeId)?state.selectedNodeId:page.root.id
      set({project:restored,history:[...state.history,clone(state.project)],future:state.future.slice(1),saveStatus:'dirty',selectedNodeId:selected,hoveredNodeId:null})
    },
  }
})
