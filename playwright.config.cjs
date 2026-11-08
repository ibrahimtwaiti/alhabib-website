const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests/browser',
 timeout:45000,
 expect:{timeout:15000},
 retries:1,
 workers:2,
 reporter:[['list'],['html',{open:'never',outputFolder:'playwright-report'}]],
 use:{baseURL:'http://127.0.0.1:3177',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
 webServer:{
  command:'npm run start -- --port 3177',
  url:'http://127.0.0.1:3177/',
  reuseExistingServer:false,
  timeout:120000,
  env:{NEXT_TELEMETRY_DISABLED:'1'}
 }
});