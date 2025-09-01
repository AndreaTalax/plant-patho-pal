
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App.tsx'
import './index.css'
// Removed './utils/debugTester' import to avoid rendering components using routing outside a Router

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster position="top-right" richColors closeButton />
  </>
);
