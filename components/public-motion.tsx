'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

/**
 * Progressive enhancement: content is readable by default. Only off-screen
 * items are hidden once IntersectionObserver is active. No third-party
 * animation bundle, layout shift, or image color overlays.
 */
export default function PublicMotion(){
 const pathname=usePathname();
 useEffect(()=>{
  if(typeof window==='undefined'||!('IntersectionObserver' in window)||!('MutationObserver' in window))return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const root=document.querySelector<HTMLElement>('.public-site');
  if(!root)return;
  const selectors=[
   '.hero .kicker','.hero h1','.hero .section-text','.hero-visual',
   '.hero .button-primary','.hero .button-outline',
   '.section .kicker','.section .section-title',
   '.section .feature-card','.section .specialty-card','.section .profile-card',
   '.section .booking-panel','.section .directory-controls',
   '.inner-banner h1','.inner-banner .section-text'
  ].join(',');
  const tracked=new WeakSet<Element>();
  let sequence=0;
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const node=entry.target as HTMLElement;
    node.classList.remove('reveal-pending');
    node.classList.add('reveal-visible');
    observer.unobserve(node);
   });
  },{threshold:0.07,rootMargin:'0px 0px -5% 0px'});
  const register=(node:Element)=>{
   if(tracked.has(node))return;
   tracked.add(node);
   const element=node as HTMLElement;
   element.classList.add('motion-reveal');
   element.style.setProperty('--reveal-delay',`${(sequence++%4)*65}ms`);
   // Never hide initially visible content or content above the viewport.
   if(element.getBoundingClientRect().top>window.innerHeight*0.92){
    element.classList.add('reveal-pending');
   }
   observer.observe(element);
  };
  const scan=()=>root.querySelectorAll(selectors).forEach(register);
  scan();
  // Search/filter results on the team page may be rendered after the first scan.
  const changes=new MutationObserver(scan);
  changes.observe(root,{childList:true,subtree:true});
  return ()=>{
   changes.disconnect();
   observer.disconnect();
   root.querySelectorAll('.reveal-pending').forEach(node=>node.classList.remove('reveal-pending'));
  };
 },[pathname]);
 return null;
}
