import {describe,it,expect} from 'vitest'
import {visibleVariants} from '../src/variantVisibility.js'

describe('variant visibility adapted from Show In Results workflow',()=>{
  it('shows legacy variants when flag has not been set',()=>{
    expect(visibleVariants({variants:[{sku:'A'},{sku:'B',showInResults:true}]}).map(v=>v.sku)).toEqual(['A','B'])
  })
  it('does not expose merchant-hidden variants among storefront options',()=>{
    expect(visibleVariants({variants:[{sku:'A',showInResults:false},{sku:'B',showInResults:true}]})).toEqual([{sku:'B',showInResults:true}])
  })
  it('handles an empty or missing options list safely',()=>{
    expect(visibleVariants({})).toEqual([])
    expect(visibleVariants(null)).toEqual([])
  })
})
