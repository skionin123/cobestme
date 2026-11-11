// The small script every CoBest website runs: page links, the phone menu,
// forms, tabs, sliders and animations.
//
// One source is shared by the live website, the editor preview and the ZIP
// export, so what an owner tests in Preview is what visitors get.
//
//  - published: runs inside the store page's sandboxed frame. Page links and
//               form messages are passed to the store page.
//  - preview:   same behaviour inside the editor; forms are simulated.
//  - export:    a stand-alone static website with no CoBest page around it.
import { compileInteractionRuntime } from './compiler'
import type { BuilderProject } from './types'

export type RuntimeMode='published'|'preview'|'export'

/** Messages the website frame sends to the page around it. */
export const SITE_MESSAGE_SOURCE='cobest-public-visual'
/** Messages the surrounding page sends back to the website frame. */
export const HOST_MESSAGE_SOURCE='cobest-store'

// NOTE: this is JavaScript source kept in a string. It deliberately contains no
// backslashes and no regular expressions, so it survives being embedded.
const RUNTIME=String.raw`
  var framed=MODE!=='export';
  var send=function(type,payload){
    if(!framed)return;
    var message={source:SOURCE,type:type};
    if(payload)for(var key in payload)message[key]=payload[key];
    try{parent.postMessage(message,'*');}catch(error){}
  };
  var closest=function(node,selector){return node&&node.closest?node.closest(selector):null;};
  var isWebAddress=function(href){
    var lower=href.toLowerCase();
    return lower.indexOf('http://')===0||lower.indexOf('https://')===0||lower.indexOf('//')===0;
  };
  var hasScheme=function(href){
    var colon=href.indexOf(':');
    if(colon<1)return false;
    var slash=href.indexOf('/');
    return slash===-1||colon<slash;
  };

  /* Phone menu */
  var setMenu=function(nav,open){
    if(open)nav.setAttribute('data-nav-open','true');else nav.removeAttribute('data-nav-open');
    var button=nav.querySelector('.nav-menu-button');
    if(button){
      button.setAttribute('aria-expanded',open?'true':'false');
      button.setAttribute('aria-label',open?'Close menu':'Open menu');
    }
  };
  var closeMenus=function(){
    var open=document.querySelectorAll('[data-nav-open="true"]');
    for(var i=0;i<open.length;i++)setMenu(open[i],false);
  };
  document.addEventListener('click',function(event){
    var button=closest(event.target,'.nav-menu-button');
    if(!button)return;
    event.preventDefault();
    var nav=closest(button,'nav')||button.parentElement;
    if(nav)setMenu(nav,nav.getAttribute('data-nav-open')!=='true');
  });
  window.addEventListener('resize',function(){
    var open=document.querySelectorAll('[data-nav-open="true"]');
    for(var i=0;i<open.length;i++){
      var button=open[i].querySelector('.nav-menu-button');
      if(!button||getComputedStyle(button).display==='none')setMenu(open[i],false);
    }
  });
  document.addEventListener('keydown',function(event){if(event.key==='Escape')closeMenus();});

  /* Links */
  document.addEventListener('click',function(event){
    var link=closest(event.target,'a[href]');
    if(!link||event.defaultPrevented||link.hasAttribute('data-lightbox'))return;
    var href=(link.getAttribute('href')||'').trim();
    if(!href||href==='#'){event.preventDefault();return;}
    if(href.charAt(0)==='#'){
      closeMenus();
      if(!framed)return;
      event.preventDefault();
      var name=href.slice(1);
      try{name=decodeURIComponent(name);}catch(error){}
      var anchor=document.getElementById(name);
      if(anchor)anchor.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    if(isWebAddress(href)){
      /* Other websites open in a new tab so visitors keep this one. */
      if(framed){link.setAttribute('target','_blank');link.setAttribute('rel','noopener noreferrer');}
      return;
    }
    if(hasScheme(href))return;
    if(!framed)return;
    event.preventDefault();
    closeMenus();
    send('navigate',{href:href});
  });

  /* Forms */
  var labelText=function(holder){
    var text='';
    var walk=function(node){
      for(var i=0;i<node.childNodes.length;i++){
        var child=node.childNodes[i];
        if(child.nodeType===3)text+=child.nodeValue;
        else if(child.nodeType===1){
          var tag=child.tagName;
          if(tag!=='SELECT'&&tag!=='TEXTAREA'&&tag!=='INPUT'&&tag!=='BUTTON')walk(child);
        }
      }
    };
    walk(holder);
    return text;
  };
  var describeForm=function(form){
    var fields=[];
    var elements=form.elements;
    for(var i=0;i<elements.length&&fields.length<40;i++){
      var el=elements[i];
      var tag=el.tagName.toLowerCase();
      var type=(el.getAttribute('type')||(tag==='textarea'?'textarea':tag==='select'?'select':'text')).toLowerCase();
      if(tag==='button'||tag==='fieldset'||type==='submit'||type==='button'||type==='reset'||type==='file'||type==='password'||type==='image'||type==='hidden')continue;
      if((type==='checkbox'||type==='radio')&&!el.checked)continue;
      var label='';
      var holder=closest(el,'label');
      if(holder)label=labelText(holder);
      if(!label.trim()&&el.id){
        var labels=document.getElementsByTagName('label');
        for(var j=0;j<labels.length;j++)if(labels[j].htmlFor===el.id){label=labelText(labels[j]);break;}
      }
      if(!label.trim())label=el.getAttribute('aria-label')||el.getAttribute('placeholder')||el.getAttribute('name')||'';
      fields.push({tag:tag,type:type,name:el.getAttribute('name')||'',label:String(label).trim().slice(0,120),value:String(el.value||'').slice(0,5000)});
    }
    return fields;
  };
  var setFormState=function(form,state,message){
    form.setAttribute('data-state',state);
    var buttons=form.querySelectorAll('button[type="submit"],input[type="submit"],button:not([type])');
    for(var i=0;i<buttons.length;i++)buttons[i].disabled=state==='sending';
    if(state!=='success'&&state!=='error')return;
    var note=form.querySelector('[data-form-'+state+']');
    if(!note){
      note=document.createElement('div');
      note.setAttribute('data-form-'+state,'true');
      note.setAttribute('role',state==='error'?'alert':'status');
      note.textContent=state==='success'?'Thanks! Your message has been sent.':'Sorry, your message could not be sent. Please try again.';
      form.appendChild(note);
    }
    if(!note.hasAttribute('data-default-text'))note.setAttribute('data-default-text',note.textContent||'');
    note.textContent=message||note.getAttribute('data-default-text')||'';
  };
  var formCount=0;
  var waiting={};
  document.addEventListener('submit',function(event){
    var form=event.target;
    if(!form||form.tagName!=='FORM')return;
    var action=(form.getAttribute('action')||'').trim();
    if(action&&action!=='#'){
      /* The owner connected their own form service; keep this page open. */
      if(framed&&isWebAddress(action))form.setAttribute('target','_blank');
      return;
    }
    event.preventDefault();
    if(form.getAttribute('data-state')==='sending')return;
    if(!framed){setFormState(form,'error','This form is not connected to an inbox yet.');return;}
    var id='form-'+(++formCount);
    waiting[id]=form;
    setFormState(form,'sending');
    send(MODE==='preview'?'form-preview':'form-submit',{id:id,fields:describeForm(form)});
    /* Never leave a visitor waiting forever. */
    setTimeout(function(){if(waiting[id]){delete waiting[id];setFormState(form,'error');}},20000);
  },true);
  window.addEventListener('message',function(event){
    if(event.source!==parent)return;
    var data=event.data||{};
    if(data.source!==HOST||data.type!=='form-result')return;
    var form=waiting[data.id];
    if(!form)return;
    delete waiting[data.id];
    if(data.ok){setFormState(form,'success');form.reset();}
    else setFormState(form,'error',typeof data.error==='string'?data.error.slice(0,200):'');
  });

  /* Tabs, sliders, dropdowns, lightbox */
  var each=function(selector,run){var list=document.querySelectorAll(selector);for(var i=0;i<list.length;i++)run(list[i]);};
  each('[data-tabs]',function(tabs){
    var buttons=tabs.querySelectorAll('[data-tab]'),panes=tabs.querySelectorAll('[data-pane]');
    var show=function(index){
      for(var i=0;i<panes.length;i++)panes[i].hidden=i!==index;
      for(var j=0;j<buttons.length;j++){if(j===index)buttons[j].setAttribute('aria-selected','true');else buttons[j].removeAttribute('aria-selected');}
    };
    show(0);
    for(var k=0;k<buttons.length;k++)(function(index){buttons[index].addEventListener('click',function(event){event.preventDefault();show(index);});})(k);
  });
  each('[data-slider]',function(slider){
    var slides=slider.children,index=0;
    var show=function(){for(var i=0;i<slides.length;i++)slides[i].hidden=i!==index;};
    show();
    slider.addEventListener('click',function(event){if(closest(event.target,'a[href]'))return;event.preventDefault();index=(index+1)%Math.max(1,slides.length);show();});
  });
  each('[data-dropdown]',function(dropdown){
    var toggle=dropdown.querySelector('[data-dropdown-toggle]'),list=dropdown.querySelector('[data-dropdown-list]');
    if(toggle)toggle.addEventListener('click',function(event){event.preventDefault();if(list)list.hidden=!list.hidden;});
  });
  each('[data-lightbox]',function(link){
    link.addEventListener('click',function(event){
      event.preventDefault();
      var src=link.getAttribute('href');
      if(!src)return;
      var overlay=document.createElement('div');
      overlay.setAttribute('role','dialog');
      overlay.setAttribute('aria-label','Image');
      overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.86);display:grid;place-items:center;padding:30px;cursor:zoom-out';
      var image=document.createElement('img');
      image.src=src;image.alt='';
      image.style.cssText='max-width:min(1200px,92vw);max-height:90vh;object-fit:contain';
      overlay.appendChild(image);
      overlay.onclick=function(){overlay.remove();};
      document.body.appendChild(overlay);
    });
  });
`

/** JavaScript for a website page. Safe to place inside a <script> element. */
export function siteRuntime(project:BuilderProject,mode:RuntimeMode){
  return `(function(){
  var MODE=${JSON.stringify(mode)},SOURCE=${JSON.stringify(SITE_MESSAGE_SOURCE)},HOST=${JSON.stringify(HOST_MESSAGE_SOURCE)};${RUNTIME}
  ${compileInteractionRuntime(project)}
})();`
}

/** One form control as reported by the website frame. */
export interface FormFieldValue{tag?:string;type?:string;name?:string;label?:string;value?:string}

export interface FormMessage{name:string;email:string;message:string;missing:''|'email'|'message'}

/** Stored as the message when a form has no message box at all. */
export const NO_MESSAGE='This visitor sent your website form without a message.'

const clean=(value:unknown,max:number)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,max)
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Turn whatever fields an owner put in a form into the name, email and
 * message that CoBest's inbox stores. Extra fields (phone, date, choices…)
 * are kept by adding them to the message, so nothing a visitor typed is lost.
 */
export function mapFormFields(input:unknown):FormMessage{
  const fields:FormFieldValue[]=Array.isArray(input)?input.filter(field=>field&&typeof field==='object').slice(0,40):[]
  const every=fields.map(field=>{
    const type=clean(field.type,20).toLowerCase()
    const label=clean(field.label,120)||clean(field.name,60)
    const key=(clean(field.name,60)+' '+label).toLowerCase()
    let value=String(field.value??'').slice(0,5000).trim()
    if((type==='checkbox'||type==='radio')&&(value==='on'||value===''))value='Yes'
    return {type,label,key,value,tag:clean(field.tag,12).toLowerCase(),used:false}
  })
  const rows=every.filter(row=>row.value)
  const isWriting=(row:typeof every[number])=>row.tag==='textarea'||row.type==='textarea'
  const messageWords=/message|comment|question|details|inquiry|enquiry|note/

  const take=(test:(row:typeof rows[number])=>boolean)=>{
    const row=rows.find(candidate=>!candidate.used&&test(candidate))
    if(row)row.used=true
    return row
  }
  const emailRow=take(row=>row.type==='email')||take(row=>/e-?mail/.test(row.key))||take(row=>emailPattern.test(row.value))
  const nameRow=take(row=>/\bname\b|your name|full name/.test(row.key)&&row.type!=='textarea')
  const messageRow=take(isWriting)||take(row=>messageWords.test(row.key))

  const extras=rows.filter(row=>!row.used).map(row=>(row.label||'Answer')+': '+row.value.replace(/\s+/g,' '))
  let message=messageRow?messageRow.value:''
  if(extras.length)message=(message?message+'\n\n':'')+extras.join('\n')
  // A form with nowhere to write (for example "leave your email and we will
  // call you") is still delivered: the visitor has nothing left to fill in.
  if(!message.trim()&&!every.some(row=>isWriting(row)||messageWords.test(row.key)))message=NO_MESSAGE
  const email=emailRow?clean(emailRow.value,254):''
  return {
    name:nameRow?clean(nameRow.value,120):'',
    email,
    message:message.slice(0,5000),
    missing:!email||!emailPattern.test(email)?'email':!message.trim()?'message':'',
  }
}

/**
 * Exported websites are plain files. Point page links at those files so they
 * work on any host and when opened straight from a folder.
 */
export function rewriteLinksForExport(html:string,fileBySlug:Map<string,string>){
  return html.replace(/(\shref=")(\/[^"#?]*)([#?][^"]*)?"/g,(whole,prefix:string,path:string,suffix:string|undefined)=>{
    const key=path.replace(/\/+$/,'')||'/'
    const file=fileBySlug.get(key.toLowerCase())
    return file?`${prefix}${file}${suffix||''}"`:whole
  })
}
