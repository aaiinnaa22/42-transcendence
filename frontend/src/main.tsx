import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './localization/LanguageInit';

createRoot(document.getElementById('root')!).render(
    <App />
)
