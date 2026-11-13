/** The last approved public photos, used if CMS image fields are missing. No secrets. */
export type ProfileMedia={image_url:string;photo_fit:'cover'|'contain';photo_position_x:number;photo_position_y:number};
export const approvedPhotos:Record<string,ProfileMedia>={
 'a11ab1b0-2026-4000-8000-000000000001':{image_url:'/api/media/media/443117de-e5ff-49ae-8c41-3e7fb971412c.webp',photo_fit:'cover',photo_position_x:50,photo_position_y:5},
 'a11ab1b0-2026-4000-8000-000000000002':{image_url:'/api/media/media/457225c2-7330-46a5-a59e-198a1d795c1a.webp',photo_fit:'cover',photo_position_x:50,photo_position_y:14},
 'a11ab1b0-2026-4000-8000-000000000003':{image_url:'/api/media/media/6967b399-ea41-49b7-b3d2-0b52a28e2c2f.webp',photo_fit:'cover',photo_position_x:50,photo_position_y:0},
 'a11ab1b0-2026-4000-8000-000000000004':{image_url:'/api/media/media/c26793cd-c7d4-46a9-8b9d-4d1636539a30.webp',photo_fit:'cover',photo_position_x:50,photo_position_y:8},
 'a11ab1b0-2026-4000-8000-000000000005':{image_url:'/api/media/media/6665c132-51a5-4cea-bbe3-e815f30f9c7f.webp',photo_fit:'cover',photo_position_x:49,photo_position_y:9},
 'a11ab1b0-2026-4000-8000-000000000006':{image_url:'/api/media/media/01178f5a-faa0-4f7d-b370-f15a5ac1c2d2.webp',photo_fit:'cover',photo_position_x:50,photo_position_y:7},
 'a11ab1b0-2026-4000-8000-000000000007':{image_url:'/api/media/media/2e39d8da-ee1b-447c-af69-8feb7f67e8b9.webp',photo_fit:'cover',photo_position_x:50,photo_position_y:0},
 'a11ab1b0-2026-4000-8000-000000000008':{image_url:'/api/media/media/420db745-82f2-480e-9a91-bd1e9dc27204.webp',photo_fit:'cover',photo_position_x:50,photo_position_y:23},
 'a11ab1b0-2026-4000-8000-000000000009':{image_url:'/api/media/media/8db636b0-0759-4b30-84b9-65df6d21898a.webp',photo_fit:'cover',photo_position_x:50,photo_position_y:17},
 'a11ab1b0-2026-4000-8000-000000000010':{image_url:'/api/media/media/ee1dcb52-7fb5-45f4-acbb-5d6ccbdea60d.webp',photo_fit:'cover',photo_position_x:50,photo_position_y:26}
};
export function approvedProfileMedia(id:string){return approvedPhotos[id];}
