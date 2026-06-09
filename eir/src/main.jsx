import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PasswordGate from './components/PasswordGate.jsx'

/* Chris ask 8 Jun - StrictMode removed.
   Pablo confirmed (their Claude Chat handoff) that React 19's
   StrictMode dev-only double-mount is the root cause of the
   Recharts 3.x animation strand bug: the first mount's tween
   starts → component unmounts → component remounts with a new
   <path> ref → the original tween writes `d` to the stale ref
   while the new ref is left empty. Pablo runs without StrictMode
   and Recharts native animation defaults just work. We were
   matching that.
   Production was never under StrictMode anyway - it only changed
   dev behaviour - so the visible app is unaffected. We lose the
   dev-time impure-render warnings; the app has been stable in
   production with StrictMode on, so anything it would have caught
   isn't there. */
createRoot(document.getElementById('root')).render(
  <PasswordGate>
    <App />
  </PasswordGate>
)
