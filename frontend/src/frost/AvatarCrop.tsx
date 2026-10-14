import {useEffect,useRef,useState} from 'react';
import {Button,Modal,Notice} from './primitives';
import {errorMessage} from './data';

export async function readAvatar(file:File) {
  if(file.size>2*1024*1024)throw new Error('Choose an image smaller than 2 MiB.');
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
  const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
  const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  if(!(png||jpeg||webp)||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPEG or WebP image.');
  const image=await createImageBitmap(file);
  if(Math.min(image.width,image.height)<64||Math.max(image.width,image.height)>4096){image.close();throw new Error('Choose an image between 64 and 4096 pixels on each side.');}
  return image;
}
export function AvatarCrop({image,onClose,onSave}:{image:ImageBitmap;onClose:()=>void;onSave:(blob:Blob)=>Promise<void>}) {
  const canvas=useRef<HTMLCanvasElement>(null),active=useRef(true);
  const [zoom,setZoom]=useState(1),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{active.current=true;return()=>{active.current=false;image.close();};},[image]);
  useEffect(()=>{const ctx=canvas.current!.getContext('2d')!,size=Math.min(image.width,image.height)/zoom;ctx.clearRect(0,0,128,128);ctx.drawImage(image,(image.width-size)/2,(image.height-size)/2,size,size,0,0,128,128);},[image,zoom]);
  async function save(){setBusy(true);setError('');try{const blob=await new Promise<Blob>((resolve,reject)=>canvas.current!.toBlob(value=>value?resolve(value):reject(new Error('The crop could not be encoded.')),'image/png'));if(!active.current)return;await onSave(blob);if(active.current)onClose();}catch(failure){if(active.current){setError(errorMessage(failure));setBusy(false);}}}
  return <Modal title="Choose your crop" onClose={()=>{if(!busy)onClose();}}><p>Centre your photo, then save it to your private profile. The original image and its metadata are not uploaded.</p><canvas className="sf-avatar-crop" ref={canvas} width={128} height={128} role="img" aria-label="Square avatar crop preview"/><label className="sf-field"><span>Zoom</span><input aria-label="Avatar zoom" type="range" min={1} max={3} step={.05} value={zoom} disabled={busy} onChange={e=>setZoom(Number(e.target.value))}/></label>{error&&<Notice danger>{error}</Notice>}<div className="sf-dialog-actions"><Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy} onClick={()=>void save()}>{busy?'Saving photo…':'Save photo'}</Button></div></Modal>;
}
