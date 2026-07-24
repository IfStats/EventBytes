const http = require('http');

const payload = JSON.stringify({
  name: 'VIP Pass',
  price: 250,
  quantity: 100
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/tickets/cmryt8pji0001w20w78b54h7y',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(payload);
req.end();
