import React from 'react'
import {ArrowRight,Check,Eye,FileText,LayoutTemplate,MousePointer2,Plus,Save,Smartphone,X} from 'lucide-react'

export type GuideAction='themes'|'add'|'content'|'phone'|'save'|'preview'|'publish'
type GuideStep={key:GuideAction;number:string;name:string;description:string;label:string;icon:React.ReactNode}
export function BuilderGuide({
  onClose,onAction,selectedName,saveStatus,canPublish,
}:{
  onClose:()=>void
  onAction:(action:GuideAction)=>void
  selectedName:string|null
  saveStatus:'saved'|'dirty'|'saving'|'error'
  canPublish:boolean
}){
  const steps:GuideStep[]=[
    {key:'themes',number:'01',name:'Choose a look',description:'Start with a theme. You can change your draft later.',label:'Browse themes',icon:<LayoutTemplate size={16}/>},
    {key:'add',number:'02',name:'Add a section',description:'Add a banner, image, store information or other ready-made layout.',label:'Add section',icon:<Plus size={16}/>},
    {key:'content',number:'03',name:'Make it yours',description:selectedName?'Edit '+selectedName+' using Content or Design.':'Select anything on the page, then edit its words, images or appearance.',label:selectedName?'Edit selected':'Select an element',icon:<MousePointer2 size={16}/>},
    {key:'phone',number:'04',name:'Check on phones',description:'Preview your mobile layout and review horizontal overflow.',label:'See mobile view',icon:<Smartphone size={16}/>},
    {key:'save',number:'05',name:'Save a draft',description:'Save your edits. Draft changes are not automatically published.',label:saveStatus==='saving'?'Saving…':saveStatus==='saved'?'Save again':'Save draft',icon:<Save size={16}/>},
    {key:'preview',number:'06',name:'Review and publish',description:'Preview the visitor experience. Only Publish updates the live website.',label:'Preview first',icon:<Eye size={16}/>}
  ]
  return <section className="vb-guide" aria-label="Website editor getting started guide">
    <div className="vb-guide-header">
      <div className="vb-guide-icon"><FileText size={19}/></div>
      <div><span>YOUR BUILDING GUIDE</span><h2>Your first website, step by step.</h2><p>Start anywhere. Each action opens the real editing tool.</p></div>
      <button type="button" className="vb-guide-close" onClick={onClose} aria-label="Close website guide" title="Hide guide; reopen any time"><X size={18}/></button>
    </div>
    <div className="vb-guide-steps">
      {steps.map(step=><div className="vb-guide-step" key={step.key}>
        <span className="vb-guide-number">{step.number}</span>
        <div className="vb-guide-step-copy">
          <strong>{step.name}</strong><p>{step.description}</p>
          <button type="button" onClick={()=>onAction(step.key)} disabled={step.key==='save'&&saveStatus==='saving'}>
            {step.icon}{step.label}<ArrowRight size={13}/>
          </button>
        </div>
      </div>)}
    </div>
    <footer><Check size={15}/><span>Tip: use Undo if something looks wrong. Preview before publishing. Published visitors won't see your unsaved draft.</span>
      {canPublish&&<button type="button" onClick={()=>onAction('publish')}>Publication checklist <ArrowRight size={13}/></button>}
    </footer>
  </section>
}
