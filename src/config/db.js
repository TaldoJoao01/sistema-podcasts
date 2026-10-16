// Configuração da CONEXÃO com o banco de dados
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true // datas chegam como texto "2024-02-05" (evita problema de fuso horário)
});

// Teste de conexão ao iniciar
pool.getConnection()
  .then((conn) => {
    console.log('Conectado ao banco de dados MySQL');
    conn.release();
  })
  .catch((err) => {
    console.error('Erro ao conectar no banco:', err.message);
  });

module.exports = pool;