// ROTAS da API de EPISÓDIOS
// Prefixo (definido no server.js): /api
const express = require('express');
const router = express.Router();
const controller = require('../controllers/episodioController.js');

// Episódios de um podcast (o podcast vem na URL)
router.get('/podcasts/:podcastId/episodios', controller.listarPorPodcast);  // READ   -> GET    /api/podcasts/:podcastId/episodios
router.post('/podcasts/:podcastId/episodios', controller.criar);            // CREATE -> POST   /api/podcasts/:podcastId/episodios

// Um episódio específico (o id do episódio vem na URL)
router.put('/episodios/:id', controller.atualizar);                         // UPDATE -> PUT    /api/episodios/:id
router.delete('/episodios/:id', controller.excluir);                        // DELETE -> DELETE /api/episodios/:id

module.exports = router;