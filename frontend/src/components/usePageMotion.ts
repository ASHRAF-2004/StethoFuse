import {useEffect,type RefObject} from 'react';
import {animate,stagger} from 'animejs';

/** Motion explains a new page; it never gates content or holds the user in a loader. */
export function usePageMotion(root:RefObject<HTMLElement|null>,route:string){
 useEffect(()=>{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||root.current?.closest('.reduce-motion'))return;
  const nodes=root.current?.querySelectorAll<HTMLElement>('[data-entrance]');
  if(!nodes?.length)return;
  const animation=animate(nodes,{opacity:[.6,1],translateY:[10,0],duration:420,delay:stagger(35),ease:'outCubic'});
  return()=>{animation.revert();};
 },[root,route]);
}
