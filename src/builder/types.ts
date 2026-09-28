export type BreakpointId = 'desktop' | 'tablet' | 'mobileLandscape' | 'mobilePortrait'

export type BuilderNodeType =
  | 'section' | 'container' | 'div' | 'grid' | 'flex' | 'columns'
  | 'heading' | 'paragraph' | 'link' | 'button' | 'richText' | 'list' | 'quote'
  | 'image' | 'video' | 'icon' | 'backgroundVideo'
  | 'form' | 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'submit'
  | 'navbar' | 'dropdown' | 'footer'
  | 'tabs' | 'slider' | 'lightbox' | 'html'

export interface BuilderNode {
  id: string
  type: BuilderNodeType
  tag: string
  name: string
  children: BuilderNode[]
  classes: string[]
  attributes: Record<string,string>
  content?: string
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
}

export interface BuilderProject {
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
  updatedAt: string
}

export interface BuilderHistoryEntry {
  project: BuilderProject
  createdAt: string
}
