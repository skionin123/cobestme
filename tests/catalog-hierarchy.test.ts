import { describe, expect, it } from 'vitest'
import { categoryIncludes, categorySlug, getPrimaryCategories, getSubcategories, joinCategory, replaceCategoryPath, splitCategory } from '../src/catalogHierarchy.js'

describe('primary category and subcategory storage',()=>{
  const terms=[
    {term_type:'category',name:'Home'},
    {term_type:'category',name:'Home / Lighting'},
    {term_type:'category',name:'Home / Furniture'},
    {term_type:'category',name:'Sports'},
    {term_type:'brand',name:'Home Store'},
  ]
  it('preserves the existing single category column',()=>{
    expect(splitCategory('Home / Lighting')).toEqual({primary:'Home',subcategory:'Lighting'})
    expect(splitCategory('Home')).toEqual({primary:'Home',subcategory:''})
    expect(joinCategory('Home','Lighting')).toBe('Home / Lighting')
  })
  it('builds the list from stored terms and existing products',()=>{
    expect(getPrimaryCategories(terms,[{category:'Beauty / Skincare'}])).toEqual(['Beauty','Home','Sports'])
    expect(getSubcategories(terms,'Home')).toEqual(['Furniture','Lighting'])
  })
  it('renames all descendants without touching unrelated categories',()=>{
    expect(replaceCategoryPath('Home / Lighting','Home','Living')).toBe('Living / Lighting')
    expect(replaceCategoryPath('Home / Lighting','Home / Lighting','Home / Lamps')).toBe('Home / Lamps')
    expect(replaceCategoryPath('Homeware','Home','Living')).toBe('Homeware')
    expect(categoryIncludes('Home / Lighting','Home')).toBe(true)
    expect(categorySlug('Home / Lighting')).toBe('home-lighting')
  })
})
