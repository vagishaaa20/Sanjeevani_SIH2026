const sequelize = require('./src/config/db');
const { generateAccessToken } = require('./src/utils/jwt');
const http = require('http');

async function run() {
  const [results] = await sequelize.query(`SELECT id, email, role FROM users WHERE email = 'worker@email.com'`);
  const token = generateAccessToken({ id: results[0].id, role: results[0].role });
  const req = http.request({ 
    hostname: '127.0.0.1', 
    port: 5000, 
    path: '/api/health-worker/dashboard', 
    method: 'GET', 
    headers: { 'Authorization': 'Bearer ' + token } 
  }, (res) => {
    let data = ''; 
    res.on('data', d => data += d); 
    res.on('end', () => {
        console.log('Dashboard Response:', res.statusCode, data);
    });
  }); 
  req.on('error', (e) => console.error(e));
  req.end();
}
run();
