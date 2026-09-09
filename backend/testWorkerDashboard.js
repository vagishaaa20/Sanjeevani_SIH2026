const { generateAccessToken } = require('./src/utils/jwt');
const http = require('http');

async function run() {
  const token = generateAccessToken({ id: 'some-uuid', role: 'health_worker' });
  const req = http.request({ 
    hostname: '127.0.0.1', 
    port: 5000, 
    path: '/api/health-worker/dashboard', 
    method: 'GET', 
    headers: { 'Authorization': 'Bearer ' + token } 
  }, (res) => {
    let data = ''; 
    res.on('data', d => data += d); 
    res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
  }); 
  req.end();
}
run();
