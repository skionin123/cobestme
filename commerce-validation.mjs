export function isValidEmail(value=''){
  const email=String(value).trim()
  return email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function normalizeFutureDate(value,now=Date.now()){
  const time=new Date(value).getTime()
  if(!Number.isFinite(time))return {ok:false,error:'Enter a valid date and time.'}
  if(time<=now)return {ok:false,error:'Booking time must be in the future.'}
  return {ok:true,value:new Date(time).toISOString()}
}

export function normalizeReviewRating(value){
  const rating=Number(value)
  if(!Number.isInteger(rating)||rating<1||rating>5)return {ok:false,error:'Rating must be a whole number from 1 to 5.'}
  return {ok:true,value:rating}
}

function finiteNumber(value,{min=-Infinity,max=Infinity,integer=false}={}){
  const number=Number(value)
  if(!Number.isFinite(number)||number<min||number>max||(integer&&!Number.isInteger(number)))return null
  return number
}

export function calculateCheckout(snapshot,body){
  const catalog=Array.isArray(snapshot?.products)?snapshot.products:[]
  const requested=Array.isArray(body?.items)?body.items:[]
  const items=[]
  const inventoryIssues=[]
  const inputIssues=[]
  for(const row of requested){
    const product=catalog.find(p=>String(p.id)===String(row?.product_id)&&p.status==='Active')
    if(!product)continue
    const quantity=finiteNumber(row?.quantity,{min:1,max:99,integer:true})
    if(quantity==null){
      inputIssues.push({product_id:product.id,name:product.name,error:'Quantity must be a whole number from 1 to 99.'})
      continue
    }
    const unitPrice=finiteNumber(product.price,{min:0})
    if(unitPrice==null){
      inputIssues.push({product_id:product.id,name:product.name,error:'Product pricing is invalid.'})
      continue
    }
    let inventory=null
    if(product.inventory!=null){
      inventory=finiteNumber(product.inventory,{min:0,integer:true})
      if(inventory==null){
        inputIssues.push({product_id:product.id,name:product.name,error:'Product inventory is invalid.'})
        continue
      }
    }
    if(inventory!=null&&quantity>inventory){
      inventoryIssues.push({product_id:product.id,name:product.name,requested:quantity,available:inventory})
      continue
    }
    items.push({product_id:product.id,name:product.name,quantity,unit_price:unitPrice,line_total:unitPrice*quantity})
  }
  const subtotal=items.reduce((sum,x)=>sum+x.line_total,0)
  let discountAmount=0
  let discountCode=''
  const requestedCode=String(body?.discount_code||'').trim().toUpperCase()
  if(requestedCode){
    const discounts=Array.isArray(snapshot?.discounts)?snapshot.discounts:[]
    const d=discounts.find(x=>x.active&&String(x.code).toUpperCase()===requestedCode)
    const expiry=d?.expires_at?new Date(d.expires_at).getTime():null
    const notExpired=expiry==null||(Number.isFinite(expiry)&&expiry>Date.now())
    const usageLimit=d?.usage_limit==null?null:finiteNumber(d.usage_limit,{min:1,integer:true})
    const usedCount=finiteNumber(d?.used_count||0,{min:0,integer:true})??0
    const underLimit=usageLimit==null||usedCount<usageLimit
    const minSpend=finiteNumber(d?.min_spend||0,{min:0})??0
    const value=finiteNumber(d?.value,{min:0})
    if(d&&value!=null&&notExpired&&underLimit&&subtotal>=minSpend){
      discountCode=requestedCode
      discountAmount=d.kind==='fixed'
        ? Math.min(subtotal,value)
        : subtotal*Math.min(100,value)/100
    }
  }
  const settings=snapshot?.settings||{}
  const shippingFlat=finiteNumber(settings.shippingFlat||0,{min:0})??0
  const taxRate=finiteNumber(settings.taxRate||0,{min:0,max:100})??0
  const shippingAmount=subtotal>0?shippingFlat:0
  const taxableBase=Math.max(0,subtotal-discountAmount)
  const taxAmount=taxableBase*taxRate/100
  const total=Math.max(0,taxableBase+shippingAmount+taxAmount)
  return {items,subtotal,discountCode,discountAmount,shippingAmount,taxAmount,total,inventoryIssues,inputIssues}
}

export function validateResourceWrite(table,body,{partial=false}={}){
  const data=body&&typeof body==='object'&&!Array.isArray(body)?body:null
  if(!data)return 'Invalid JSON object.'
  if(table==='products'){
    if(!partial&&(!data.name||!String(data.name).trim()))return 'Product name is required.'
    if('name' in data&&!String(data.name||'').trim())return 'Product name is required.'
    if('price' in data&&finiteNumber(data.price,{min:0})==null)return 'Product price must be zero or greater.'
    if('compare_at_price' in data&&data.compare_at_price!=null&&data.compare_at_price!==''&&finiteNumber(data.compare_at_price,{min:0})==null)return 'Compare-at price must be zero or greater.'
    if('inventory' in data&&finiteNumber(data.inventory,{min:0,integer:true})==null)return 'Inventory must be a whole number of zero or greater.'
    if('status' in data&&!['Draft','Active','Archived'].includes(data.status))return 'Invalid product status.'
    if(Array.isArray(data.variants)){
      const bad=data.variants.some(v=>finiteNumber(v?.price,{min:0})==null||finiteNumber(v?.inventory,{min:0,integer:true})==null)
      if(bad)return 'Variant prices and inventory must be valid non-negative numbers.'
    }
  }
  if(table==='customers'){
    if(!partial&&!String(data.name||'').trim())return 'Customer name is required.'
    if('name' in data&&!String(data.name||'').trim())return 'Customer name is required.'
    if(data.email&&!isValidEmail(data.email))return 'Enter a valid customer email address.'
  }
  if(table==='discounts'){
    if(!partial&&!String(data.code||'').trim())return 'Discount code is required.'
    if('code' in data&&!String(data.code||'').trim())return 'Discount code is required.'
    if('kind' in data&&!['percent','fixed'].includes(data.kind))return 'Invalid discount type.'
    if('value' in data){
      const value=finiteNumber(data.value,{min:0})
      if(value==null||value<=0)return 'Discount value must be greater than zero.'
      if(data.kind==='percent'&&value>100)return 'Percentage discounts cannot exceed 100%.'
    }
    if('min_spend' in data&&finiteNumber(data.min_spend,{min:0})==null)return 'Minimum spend cannot be negative.'
    if('usage_limit' in data&&data.usage_limit!=null&&data.usage_limit!==''&&finiteNumber(data.usage_limit,{min:1,integer:true})==null)return 'Usage limit must be a whole number of at least 1.'
  }
  return ''
}
