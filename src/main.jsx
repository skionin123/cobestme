import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('CoBest UI error', error, info)
  }
  render() {
    if (this.state.error) {
      return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#f7f7f5'}}>
        <div style={{maxWidth:620,background:'#fff',border:'1px solid #e1e0db',borderRadius:16,padding:28}}>
          <h1 style={{marginTop:0}}>CoBest hit a UI error.</h1>
          <p>The app is still online, but this screen caught an interface error instead of leaving the buttons frozen.</p>
          <pre style={{whiteSpace:'pre-wrap',fontSize:12,background:'#f4f3ef',padding:12,borderRadius:8}}>{String(this.state.error?.message || this.state.error)}</pre>
          <button onClick={()=>{localStorage.removeItem('cobest-v4-mode');window.location.reload()}} style={{border:0,borderRadius:9,padding:'11px 16px',background:'#171717',color:'#fff',cursor:'pointer'}}>Reset interface and reload</button>
        </div>
      </div>
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
)
