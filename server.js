
require('dotenv').config();
const express = require('express');
const path = require('path');
const podcastRoutes = require('./src/routes/podcastRoutes.js');
const episodioRoutes = require('./src/routes/episodioRoutes.js');

const app = express();

// Permite ler JSON enviado no corpo das requisições
app.use(express.json());

// Serve o front-end (pasta public)
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/podcasts', podcastRoutes); // /api/podcasts e /api/podcasts/:id
app.use('/api', episodioRoutes);         // /api/podcasts/:podcastId/episodios e /api/episodios/:id

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});