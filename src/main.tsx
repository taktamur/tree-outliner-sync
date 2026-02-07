/**
 * アプリケーションエントリーポイント
 *
 * React 19のcreateRootを使用してDOMにアプリをマウントする。
 * StrictModeで開発時の潜在的な問題を検出する。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ルート要素にReactアプリをマウント
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
