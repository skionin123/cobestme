import React from 'react'

export default function ProductGrid({products,currency='PHP',onAdd,onOpen}){
  const price=new Intl.NumberFormat('en-PH',{style:'currency',currency,maximumFractionDigits:2})
  const ImageElement=onOpen?'button':'div'
  const NameElement=onOpen?'button':'strong'
  return <div className="public-products">{products.map(product=>{
    const image=product.image_url||product.images?.[0]
    const open=onOpen?()=>onOpen(product):undefined
    return <article key={product.id} className="public-product-card">
      <ImageElement className="public-product-image" onClick={open} aria-label={open?`View ${product.name}`:undefined}>
        {image?<img src={image} alt={product.name}/>:<span>{product.name?.slice(0,1)||'P'}</span>}
      </ImageElement>
      <div><NameElement className="public-product-name" onClick={open}>{product.name}</NameElement>
        <p>{product.category||'Product'}</p><strong>{price.format(Number(product.price||0))}</strong>
        {Number(product.compare_at_price)>Number(product.price)&&<del>{price.format(product.compare_at_price)}</del>}
      </div>
      {onAdd&&<button className="public-add" disabled={product.inventory!=null&&Number(product.inventory)<=0} onClick={()=>onAdd(product)}>
        {product.inventory!=null&&Number(product.inventory)<=0?'Out of stock':'Add to cart'}
      </button>}
    </article>
  })}{!products.length&&<div className="public-empty">No products match your search.</div>}</div>
}
