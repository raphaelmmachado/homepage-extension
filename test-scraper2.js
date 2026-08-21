const fetch = require('node-fetch');
async function test() {
  const urls = { netflix: 'https://www.justwatch.com/br/provedor/netflix' };
  const res = await fetch(urls.netflix, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  
  // Find standard poster images or Apollo state
  const imgRegex = /<img[^>]+alt="([^"]+)"[^>]+src="([^"]+)"/gi;
  let match;
  let count = 0;
  while ((match = imgRegex.exec(html)) !== null && count < 20) {
    if (match[2].includes('/poster/')) {
       console.log("Movie:", match[1], match[2]);
       count++;
    }
  }
}
test();
