const https = require('https');

https.get('https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4', (res) => {
  console.log('STATUS:', res.statusCode);
  process.exit(0);
}).on('error', (e) => {
  console.error(e);
  process.exit(1);
});
