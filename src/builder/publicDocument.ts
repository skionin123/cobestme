import { compileProjectCss, fontLinks, renderPageBody } from './compiler'
import { siteRuntime } from './runtime'
import type { BuilderProject } from './types'

/**
 * A complete HTML document for one page of a website, as visitors see it.
 * `mode: 'preview'` is the same document inside the editor, where forms are
 * simulated instead of being sent.
 */
export function createPublishedDocument(project:BuilderProject,pageId:string,options:{mode?:'published'|'preview'}={}){
  const css=compileProjectCss(project)
  const body=renderPageBody(project,pageId,false)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${fontLinks}
<style>
${css}
</style>
</head>
<body>
${body}
<script>
${siteRuntime(project,options.mode||'published')}
</script>
</body>
</html>`
}
