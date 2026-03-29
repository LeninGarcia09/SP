const https = require('https');
https.get('https://yellow-moss-027665410.1.azurestaticapps.net', r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    const m = d.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (!m) { console.log('No JS bundle found'); return; }
    console.log('Bundle:', m[1]);
    https.get('https://yellow-moss-027665410.1.azurestaticapps.net' + m[1], r2 => {
      let js = '';
      r2.on('data', c => js += c);
      r2.on('end', () => {
        const limits = js.match(/limit:\s*\d+/g);
        console.log('limit values in bundle:', limits);
        const hasApi = /VITE_API_BASE_URL/.test(js);
        console.log('Has VITE_API_BASE_URL:', hasApi);
        const fallback = js.match(/\/api\/v1/g);
        console.log('/api/v1 occurrences:', fallback ? fallback.length : 0);
        // Check for dev-login in bundle
        const devLogin = /dev-login/.test(js);
        console.log('Has dev-login:', devLogin);
        // Check for MSAL 
        const msal = /msal/.test(js);
        console.log('Has MSAL:', msal);
      });
    });
  });
});
