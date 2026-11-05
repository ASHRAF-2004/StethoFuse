import {GeneratedForestDeer} from './GeneratedForestDeer';
const A='/assets/forest-world/';

/** Dedicated forest preview. The approved original remains available for comparison. */
export function ForestDeer(){
 if(new URLSearchParams(location.search).get('deer')!=='still')return <GeneratedForestDeer/>;
 return <figure className="deer-clearing is-approved-still" data-play-state="approved-still-animation-rebuild" data-renderer="approved-original-still" aria-hidden="true"><img src={A+'deer-clearing.webp'} alt="" width="1024" height="1536" loading="lazy"/><i className="hoof-anchor" data-anchor="deer-ground"/></figure>;
}
