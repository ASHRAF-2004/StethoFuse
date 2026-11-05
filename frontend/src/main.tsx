import {createRoot,hydrateRoot} from 'react-dom/client';
import {createBrowserRouter} from 'react-router-dom';
import {Application,applicationRoutes} from './App';
import './styles.css';
import './studio/studio.css';

const root=document.getElementById('root')!;
const initialView={locale:document.documentElement.lang==='ar'?'ar' as const:'en' as const,appearance:document.documentElement.dataset.studioTheme==='dark'?'midnight' as const:'frost' as const};
const application=<Application router={createBrowserRouter(applicationRoutes())} initialView={initialView}/>;
if(location.pathname==='/'&&root.dataset.prerender==='ready')hydrateRoot(root,application);
else createRoot(root).render(application);
