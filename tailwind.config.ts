import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { teal: { 50:'#effcfb',100:'#d4f5f1',500:'#159b94',600:'#087f7a',700:'#086b68',900:'#123f42' } }, boxShadow: { soft:'0 18px 55px rgba(18,63,66,.08)' } } }, plugins: [] } satisfies Config;
