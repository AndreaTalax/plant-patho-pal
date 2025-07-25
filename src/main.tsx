
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster position="top-right" richColors closeButton />
  </>
);
