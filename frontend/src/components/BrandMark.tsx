import type {SVGProps} from 'react';

/** Two broad channels share one S-shaped counterform: one source, two signals. */
export function BrandMark(props:SVGProps<SVGSVGElement>){
 return <svg viewBox="0 0 256 256" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
  <path d="M28 124C28 71 71 28 124 28H148V76H124C97.5 76 76 97.5 76 124V204H28Z"/>
  <path d="M228 132C228 185 185 228 132 228H108V180H132C158.5 180 180 158.5 180 132V52H228Z"/>
 </svg>;
}
