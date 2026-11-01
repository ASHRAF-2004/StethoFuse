import {createContext,useContext,type ReactNode} from 'react';

/** Public build snapshot only. Never includes an identity, token or private data. */
export interface InitialView {locale:'en'|'ar';appearance:'frost'|'midnight'}
const InitialViewContext=createContext<InitialView>({locale:'en',appearance:'frost'});
export const useInitialView=()=>useContext(InitialViewContext);
export function InitialViewProvider({value,children}:{value:InitialView;children:ReactNode}){return <InitialViewContext.Provider value={value}>{children}</InitialViewContext.Provider>;}
