'use client';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {getImageProps} from 'next/image';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {isAdActive,type AdPlacement,type PublicAdvertising} from '@/lib/advertising';
import styles from './advertising.module.css';

const Context=createContext<PublicAdvertising|null>(null);
/** One refresh loop for every placement. The provider never creates a DOM wrapper. */
export function AdvertisingProvider({initial,children}:{initial:PublicAdvertising;children:ReactNode}){
 const [data,setData]=useState(initial),[now,setNow]=useState(initial.server_now);
 useEffect(()=>{setData(initial);setNow(initial.server_now)},[initial]);
 useEffect(()=>{
  let cancelled=false,inFlight=false;
  const receivedAt=Date.now();
  const controller=new AbortController();
  async function refresh(){
   if(inFlight||document.hidden)return;
   inFlight=true;
   try{
    const response=await fetch('/api/advertising',{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw Error();
    const value:PublicAdvertising=await response.json();
    if(!cancelled){setData(value);setNow(value.server_now)}
   }catch{
    if(!cancelled)setData(old=>({...old,ads:[]}));
   }finally{inFlight=false}
  }
  const interval=setInterval(refresh,60000);
  const visible=()=>{if(!document.hidden){setNow(data.server_now+Date.now()-receivedAt);void refresh()}};
  window.addEventListener('focus',visible);document.addEventListener('visibilitychange',visible);
  const remaining=data.next_change_at===null?null:Math.max(0,data.next_change_at-data.server_now);
  const boundary=remaining===null?undefined:setTimeout(()=>{
   if(remaining!==null&&remaining<=2147483000)setNow(data.next_change_at!);
   void refresh();
  },Math.min(remaining+20,2147483000));
  return()=>{cancelled=true;controller.abort();clearInterval(interval);clearTimeout(boundary);window.removeEventListener('focus',visible);document.removeEventListener('visibilitychange',visible)};
 },[data.server_now,data.next_change_at]);
 const value={...data,ads:data.ads.filter(ad=>isAdActive(ad,now))};
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function AdvertisingSlot({placement,lang='ar'}:{placement:AdPlacement;lang?:'ar'|'en'}){
 const data=useContext(Context);
 const [index,setIndex]=useState(0),[hover,setHover]=useState(false),[focused,setFocused]=useState(false),[paused,setPaused]=useState(false);
 const [reduced,setReduced]=useState(false),[visible,setVisible]=useState(false),[tabVisible,setTabVisible]=useState(true);
 const [failed,setFailed]=useState<string[]>([]);
 const root=useRef<HTMLElement>(null),touch=useRef<number|null>(null);
 const ads=(data?.ads||[]).filter(a=>a.placement===placement&&!failed.includes(a.id+':'+a.image_url+':'+a.mobile_image_url));
 const ids=ads.map(a=>a.id).join(',');
 const current=index%Math.max(ads.length,1),ad=ads[current],settings=data?.settings;
 useEffect(()=>{setIndex(0)},[ids]);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const change=()=>setReduced(media.matches);change();media.addEventListener('change',change);
  const visibility=()=>setTabVisible(!document.hidden);visibility();document.addEventListener('visibilitychange',visibility);
  return()=>{media.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility)};
 },[]);
 useEffect(()=>{
  if(!root.current)return;
  const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:0.1});
  observer.observe(root.current);return()=>observer.disconnect();
 },[ids]);
 useEffect(()=>{
  if(ads.length<2||!settings?.autoplay||paused||hover||focused||reduced||!visible||!tabVisible)return;
  const timer=setTimeout(()=>setIndex(i=>(i+1)%ads.length),settings.interval_ms);
  return()=>clearTimeout(timer);
 },[ads.length,current,settings,paused,hover,focused,reduced,visible,tabVisible]);
 // No section, container, margin, padding or placeholder exists in the empty state.
 if(!ad||!settings)return null;
 const en=lang==='en',multiple=ads.length>1;
 function go(delta:number){setPaused(true);setIndex(i=>(i+delta+ads.length)%ads.length)}
 const high=placement==='home_top'&&current===0;
 const desktop=getImageProps({src:ad.image_url,alt:ad.alt,width:2000,height:625,sizes:'(max-width: 1200px) 100vw, 1200px',loading:high?'eager':'lazy'}).props;
 const mobile=ad.mobile_image_url?getImageProps({src:ad.mobile_image_url,alt:ad.alt,width:1000,height:750,sizes:'100vw'}).props:null;
 const picture=<picture>{mobile&&<source media="(max-width: 640px)" srcSet={mobile.srcSet} sizes={mobile.sizes}/>}<img {...desktop} className={styles.image} fetchPriority={high?'high':'auto'} onError={()=>setFailed(old=>[...old,ad.id+':'+ad.image_url+':'+ad.mobile_image_url])}/></picture>;
 return <section ref={root} className={styles.section} data-ad-placement={placement} aria-label={en?'Clinic announcements':'إعلانات المركز'} aria-roledescription={en?'carousel':'عارض إعلانات'}
 onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setFocused(false)}} onKeyDown={e=>{
 if(e.target!==e.currentTarget||!multiple)return;
 if(e.key==='ArrowLeft'){e.preventDefault();go(en?-1:1)}if(e.key==='ArrowRight'){e.preventDefault();go(en?1:-1)}
 }} tabIndex={multiple?0:undefined}>
 <div className={styles.card} style={{'--ad-duration':settings.transition_ms+'ms'} as CSSProperties}>
 <div className={styles.viewport} onTouchStart={e=>{touch.current=e.touches[0].clientX;setPaused(true)}} onTouchEnd={e=>{
 if(touch.current===null||!multiple)return;const delta=e.changedTouches[0].clientX-touch.current;touch.current=null;if(Math.abs(delta)>45)go(delta>0?(en?-1:1):(en?1:-1));
 }}>
 <div key={ad.id+ad.updated_at} className={styles.slide} data-transition={reduced?'none':settings.transition} role="group" aria-roledescription={en?'slide':'شريحة'} aria-label={(current+1)+' / '+ads.length}>
 {ad.target_url?<a href={ad.target_url} className={styles.imageLink} aria-label={ad.title||ad.alt}>{picture}</a>:picture}
 </div>
 {multiple&&settings.show_arrows&&<div className={styles.arrows}>
 <button type="button" onClick={()=>go(-1)} aria-label={en?'Previous announcement':'الإعلان السابق'}>{en?<ChevronLeft aria-hidden="true"/>:<ChevronRight aria-hidden="true"/>}</button>
 <button type="button" onClick={()=>go(1)} aria-label={en?'Next announcement':'الإعلان التالي'}>{en?<ChevronRight aria-hidden="true"/>:<ChevronLeft aria-hidden="true"/>}</button>
 </div>}
 </div>
 {(ads.some(a=>a.title||a.description))&&<div className={styles.caption} aria-live={paused?'polite':'off'}><strong>{ad.title}</strong><p>{ad.description}</p></div>}
 {multiple&&settings.show_dots&&<div className={styles.controls}>
 {settings.show_dots&&<div className={styles.dots}>{ads.map((item,i)=><button key={item.id} type="button" aria-label={(en?'Show announcement ':'عرض الإعلان ')+(i+1)} aria-current={i===current?'true':undefined} onClick={()=>{setPaused(true);setIndex(i)}}/>)}</div>}
 </div>}
 </div></section>;
}
