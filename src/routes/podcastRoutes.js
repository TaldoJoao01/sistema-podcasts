// ROTAS da API: ligam método HTTP + URL a uma função do controller
// Prefixo (definido no server.js): /api/podcasts
const express = require('express');
const router = express.Router();
const controller = require('../controllers/podcastController.js');

router.get('/', controller.listar);          // READ   -> GET    /api/podcasts
router.get('/:id', controller.buscarPorId);  // READ   -> GET    /api/podcasts/:id
router.post('/', controller.criar);          // CREATE -> POST   /api/podcasts
router.put('/:id', controller.atualizar);    // UPDATE -> PUT    /api/podcasts/:id
router.delete('/:id', controller.excluir);   // DELETE -> DELETE /api/podcasts/:id

module.exports = router;