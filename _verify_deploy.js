const https = require('https');
// 1. Check API health
https.get('https://api-bizops-dev.graysand-3ab24a81.eastus.azurecontainerapps.io/api/v1/system/health', r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => console.log('API Health:', r.statusCode, d.substring(0, 100)));
}).on('error', e => console.log('API ERR:', e.message));

// 2. Check SWA serves the new bundle with correct config
https.get('https://yellow-moss-027665410.1.azurestaticapps.net', r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    console.log('SWA:', r.statusCode);
    const m = d.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (!m) { console.log('No JS bundle found'); return; }
    console.log('New bundle:', m[1]);
    https.get('https://yellow-moss-027665410.1.azurestaticapps.net' + m[1], r2 => {
      let js = '';
      r2.on('data', c => js += c);
      r2.on('end', () => {
        // Check limits
        const limits = js.match(/limit:\d+/g);
        const grouped = {};
        (limits||[]).forEach(l => grouped[l] = (grouped[l]||0)+1);
        console.log('Limit values:', JSON.stringify(grouped));
        // Check for production API URL
        const hasApi = js.includes('api-bizops-dev');
        console.log('Has production API URL:', hasApi);
        // Check no limit > 100
        const bad = (limits||[]).filter(l => parseInt(l.split(':')[1]) > 100);
        console.log('Limits > 100:', bad.length === 0 ? 'NONE (good!)' : bad);
      });
    });
  });
}).on('error', e => console.log('SWA ERR:', e.message));
