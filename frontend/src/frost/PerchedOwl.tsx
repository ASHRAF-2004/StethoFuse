import ListeningOwl from '../studio/ListeningOwl';
/** Same approved owl as the public listening studio; flight studies are not active. */
export function PerchedOwl({reducedMotion=false}:{reducedMotion?:boolean}){return <ListeningOwl reducedMotion={reducedMotion}/>;}
