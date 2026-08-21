const fetch = require('node-fetch');
async function test() {
  const urls = {
    netflix: 'https://www.justwatch.com/br/provedor/netflix',
  };
  
  const res = await fetch(urls.netflix, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  
  // JustWatch embeds a __NEXT_DATA__ or similar script, or has specific picture/img tags.
  // Let's find picture tags or titles
  const regex = /<picture[^>]*>.*?<img[^>]+alt="([^"]+)"[^>]+src="([^"]+)"/gi;
  let match;
  let count = 0;
  while ((match = regex.exec(html)) !== null && count < 5) {
    console.log("Found:", match[1], match[2]);
    count++;
  }
}
test();
