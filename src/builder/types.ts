export type BreakpointId = 'desktop' | 'tablet' | 'mobileLandscape' | 'mobilePortrait'

export type BuilderNodeType =
  | 'section' | 'container' | 'div' | 'grid' | 'flex' | 'columns'
  | 'heading' | 'paragraph' | 'link' | 'button' | 'richText' | 'list' | 'quote'
  | 'image' | 'video' | 'icon' | 'backgroundVideo'
  | 'form' | 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'submit'
  | 'navbar' | 'dropdown' | 'footer'
  | 'tabs' | 'slider' | 'lightbox' | 'html' | 'collectionList'

export interface BuilderNode {
  id: string
  type: BuilderNodeType
  tag: string
  name: string
  children: BuilderNode[]
  classes: string[]
  attributes: Record<string,string>
  content?: string
  componentId?: string
  componentInstanceId?: string
  locked?: boolean
  hidden?: boolean
}

export type CssProperties = Record<string,string>
export type NodeState = 'none' | 'hover' | 'pressed' | 'focused'
export type StyleMap = Record<string,Partial<Record<BreakpointId,Partial<Record<NodeState,CssProperties>>>>>

export interface PageSeo {
  title: string
  description: string
  ogImage?: string
  slug: string
}

export interface BuilderPage {
  id: string
  name: string
  slug: string
  seo: PageSeo
  root: BuilderNode
  isCollectionTemplate?: boolean
  collectionId?: string
}

export interface BuilderAsset {
  id: string
  name: string
  mimeType: string
  url: string
  alt?: string
  createdAt: string
}

export interface BuilderComponent {
  id: string
  name: string
  master: BuilderNode
  createdAt: string
  updatedAt: string
}

export type InteractionTrigger = 'page-load' | 'scroll-into-view' | 'hover' | 'click'
export type InteractionAnimation = 'fade' | 'slide-up' | 'slide-left' | 'scale' | 'rotate'

export interface BuilderInteraction {
  id: string
  nodeId: string
  trigger: InteractionTrigger
  animation: InteractionAnimation
  duration: number
  delay: number
  easing: string
}

export type CmsFieldType = 'text' | 'richText' | 'image' | 'link' | 'date' | 'reference'

export interface CmsField {
  id: string
  name: string
  slug: string
  type: CmsFieldType
  required?: boolean
  referenceCollectionId?: string
}

export interface CmsItem {
  id: string
  values: Record<string,string>
  createdAt: string
  updatedAt: string
}

export interface CmsCollection {
  id: string
  name: string
  slug: string
  fields: CmsField[]
  items: CmsItem[]
  templatePageId?: string
}

export interface BuilderVersion {
  id: string
  label: string
  createdAt: string
  project: BuilderProjectSnapshot
}

export interface BuilderProjectSnapshot {
  id: string
  name: string
  version: number
  activePageId: string
  pages: BuilderPage[]
  styles: StyleMap
  globals: {
    colors: Record<string,string>
    textStyles: Record<string,CssProperties>
  }
  assets: BuilderAsset[]
  components: BuilderComponent[]
  interactions: BuilderInteraction[]
  collections: CmsCollection[]
  updatedAt: string
}

export interface BuilderProject extends BuilderProjectSnapshot {
  versions: BuilderVersion[]
}

export interface BuilderHistoryEntry {
  project: BuilderProject
  createdAt: string
}

export interface ExportedProject {
  schemaVersion: 1
  project: BuilderProject
  exportedAt: string
}
