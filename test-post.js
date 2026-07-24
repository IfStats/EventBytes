const http = require('http');

async function testEvent() {
  // Login
  const loginPayload = JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!@#'
  });

  const loginReq = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginPayload.length
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const loginData = JSON.parse(data);
      const token = loginData.accessToken;
      console.log('Token:', token);

      // Create event
      const eventPayload = JSON.stringify({
        name: 'Tech Conference 2026',
        description: 'Annual technology conference',
        venue: 'Convention Center',
        startDate: '2026-08-15T09:00:00Z',
        endDate: '2026-08-15T17:00:00Z'
      });

      const eventReq = http.request({
        hostname: 'localhost',
        port: 4000,
        path: '/events/cmryrf2i70002w2m4qqwh2w41',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': eventPayload.length
        }
      }, (res) => {
        let eventData = '';
        res.on('data', chunk => eventData += chunk);
        res.on('end', () => {
          console.log('Response Status:', res.statusCode);
          console.log('Response:', eventData);
        });
      });

      eventReq.on('error', (e) => console.error('Event error:', e.message));
      eventReq.write(eventPayload);
      eventReq.end();
    });
  });

  loginReq.on('error', (e) => console.error('Login error:', e.message));
  loginReq.write(loginPayload);
  loginReq.end();
}

testEvent();
