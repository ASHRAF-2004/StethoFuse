import {renderToString} from 'react-dom/server';
import {createMemoryRouter} from 'react-router-dom';
import {Application,applicationRoutes} from './App';
import type {InitialView} from './studio/InitialView';

/** Build-time public HTML. No auth effect, user identity or private response. */
export function renderHomepage(initialView:InitialView){
 const router=createMemoryRouter(applicationRoutes(),{initialEntries:['/']});
 try{return renderToString(<Application router={router} initialView={initialView}/>);}
 finally{router.dispose();}
}
