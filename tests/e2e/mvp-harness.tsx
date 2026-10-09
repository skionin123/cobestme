import React from 'react'
import { createRoot } from 'react-dom/client'
import VisualBuilder from '../../src/builder/VisualBuilder'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <VisualBuilder projectKey="playwright-mvp"/>
  </React.StrictMode>
)
