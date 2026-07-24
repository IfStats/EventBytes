const http = require('http');

const payload = JSON.stringify({
  email: 'test@example.com',
  password: 'Test123!@#'
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/auth/login',
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
    const result = JSON.parse(data);
    console.log('Response:');
    console.log(JSON.stringify(result, null, 2));
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(payload);
req.end();
