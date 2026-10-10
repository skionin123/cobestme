// Stored categories remain strings for compatibility with existing product and
// catalog_terms tables. "Home / Lighting" represents a subcategory of "Home".
const divider=' / '
export function splitCategory(value=''){
  const name=String(value||'').trim()
  const index=name.indexOf(divider)
  if(index<0)return {primary:name,subcategory:''}
  return {primary:name.slice(0,index).trim(),subcategory:name.slice(index+divider.length).trim()}
}
export function joinCategory(primary='',subcategory=''){
  const parent=String(primary||'').trim()
  const child=String(subcategory||'').trim()
  return parent?(child?parent+divider+child:parent):''
}
export function categorySlug(name=''){
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}
export function getPrimaryCategories(terms=[],products=[]){
  return [...new Set([
    ...terms.filter(t=>t.term_type==='category').map(t=>splitCategory(t.name).primary),
    ...products.map(p=>splitCategory(p.category).primary),
  ].filter(Boolean))].sort((a,b)=>a.localeCompare(b))
}
export function getSubcategories(terms=[],primary='',products=[]){
  return [...new Set([
    ...terms.filter(t=>t.term_type==='category').map(t=>splitCategory(t.name)),
    ...products.map(p=>splitCategory(p.category)),
  ].filter(c=>c.primary===primary&&c.subcategory).map(c=>c.subcategory))]
    .sort((a,b)=>a.localeCompare(b))
}
export function categoryIncludes(category,part){
  return category===part||category.startsWith(part+divider)
}
export function replaceCategoryPath(category,oldPath,newPath){
  return categoryIncludes(category,oldPath)
    ? newPath+category.slice(oldPath.length)
    : category
}
