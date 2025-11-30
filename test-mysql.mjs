import mysql from 'mysql2/promise';

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'sas_app',
      password: '9482824040',
      database: 'sas'
    });
    
    console.log('✅ Connection successful!');
    
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM students');
    console.log('✅ Query successful! Student count:', rows[0].count);
    
    await conn.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Error code:', err.code);
  }
}

test();
