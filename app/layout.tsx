import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'مركز الحبيب للعلاج الطبيعي والتأهيل الطبي', description: 'رعايتك تبدأ بخطوة.. وعودتك لحياتك هدفنا.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ar" dir="rtl"><body>{children}</body></html>; }
