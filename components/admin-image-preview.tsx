'use client';
import {useState} from 'react';
type Props={src:string;alt:string;fit?:'cover'|'contain';position?:string;className?:string;emptyLabel?:string};
/**
 * A src-keyed image replaces the previous bitmap immediately with a neutral
 * placeholder; the new bitmap is revealed only after load completes.
 * This prevents the half-second flash of the previously selected image.
 */
export default function AdminImagePreview(props:Props){
 return <div className="relative w-full h-full bg-[#f3f3f3] overflow-hidden">
  {props.src?<LoadedImage key={props.src} {...props}/>:<div className="grid h-full place-items-center text-xs text-slate-500">{props.emptyLabel||'لم يتم اختيار صورة'}</div>}
 </div>;
}
function LoadedImage({src,alt,fit='contain',position='center',className=''}:Props){
 const [ready,setReady]=useState(false);
 const [failed,setFailed]=useState(false);
 return <>
  {!ready&&!failed&&<div role="status" aria-label="جارٍ تحميل الصورة المختارة" className="absolute inset-0 grid place-items-center bg-[#f3f3f3]"><span className="h-6 w-6 rounded-full border-2 border-[#d9c5d3] border-t-[#8d517a] animate-spin"/></div>}
  {failed?<div role="alert" className="absolute inset-0 grid place-items-center p-3 text-center text-xs text-red-700">تعذر تحميل الصورة المختارة. تحقق من الرابط أو جرّب ملفًا آخر.</div>:
   <img src={src} alt={alt} className={'h-full w-full '+className} style={{objectFit:fit,objectPosition:position,opacity:ready?1:0,transition:'opacity 180ms ease-out'}} onLoad={()=>setReady(true)} onError={()=>setFailed(true)}/>}
 </>;
}
