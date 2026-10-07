export const WORKSPACE_ROLES=['Owner','Admin','Editor','Viewer']

export function canWriteWorkspace(role){
  return role==='Owner'||role==='Admin'||role==='Editor'
}

export function canManageBilling(role){
  return role==='Owner'||role==='Admin'
}

export function canManageTeam(role){
  return role==='Owner'||role==='Admin'
}

export function canDeleteSite(role){
  return role==='Owner'
}

export function canSeeInviteTokens(role){
  return canManageTeam(role)
}
