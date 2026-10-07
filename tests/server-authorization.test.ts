import { describe, expect, it } from 'vitest'
import { canDeleteSite, canManageBilling, canManageTeam, canSeeInviteTokens, canWriteWorkspace } from '../authorization.mjs'

describe('workspace authorization policy',()=>{
  it('allows workspace writes only for Owner, Admin, and Editor',()=>{
    expect(canWriteWorkspace('Owner')).toBe(true)
    expect(canWriteWorkspace('Admin')).toBe(true)
    expect(canWriteWorkspace('Editor')).toBe(true)
    expect(canWriteWorkspace('Viewer')).toBe(false)
    expect(canWriteWorkspace('Unknown')).toBe(false)
  })

  it('restricts billing and invitation management to Owner/Admin',()=>{
    for(const role of ['Owner','Admin']){
      expect(canManageBilling(role)).toBe(true)
      expect(canManageTeam(role)).toBe(true)
      expect(canSeeInviteTokens(role)).toBe(true)
    }
    for(const role of ['Editor','Viewer','Unknown']){
      expect(canManageBilling(role)).toBe(false)
      expect(canManageTeam(role)).toBe(false)
      expect(canSeeInviteTokens(role)).toBe(false)
    }
  })

  it('restricts site deletion to Owner',()=>{
    expect(canDeleteSite('Owner')).toBe(true)
    expect(canDeleteSite('Admin')).toBe(false)
    expect(canDeleteSite('Editor')).toBe(false)
    expect(canDeleteSite('Viewer')).toBe(false)
  })
})
