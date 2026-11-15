import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useCloud } from './store/cloud'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Sesi cloud dipulihkan di latar belakang; aplikasi tetap jalan tanpa database.
void useCloud.getState().init()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  })
}
