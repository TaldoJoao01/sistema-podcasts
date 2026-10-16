// CONTROLLER DE EPISÓDIOS: CRUD da tabela "episodios"
const db = require('../config/db.js');

// Valida os dados recebidos do front-end
function validar(body) {
  const { titulo, numero, duracao_min, data_publicacao } = body;

  if (!titulo || !titulo.trim()) {
    return 'Informe o título do episódio.';
  }
  const num = Number(numero);
  if (!Number.isInteger(num) || num < 1) {
    return 'O número do episódio deve ser um inteiro maior ou igual a 1.';
  }
  const dur = Number(duracao_min);
  if (!Number.isInteger(dur) || dur < 0) {
    return 'A duração deve ser um número inteiro de minutos (0 ou mais).';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data_publicacao || ''))) {
    return 'Informe uma data de publicação válida.';
  }
  return null;
}

// Trata erros do banco de forma amigável
function responderErro(err, res, mensagemPadrao) {
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: 'Já existe um episódio com esse número neste podcast.' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(404).json({ erro: 'Podcast não encontrado.' });
  }
  if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
    return res.status(400).json({ erro: 'Data inválida.' });
  }
  console.error(err);
  res.status(500).json({ erro: mensagemPadrao });
}

// READ - lista os episódios de UM podcast (o id do podcast vem na URL)
exports.listarPorPodcast = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM episodios WHERE podcast_id = ? ORDER BY numero DESC',
      [req.params.podcastId]
    );
    res.json(rows);
  } catch (err) {
    responderErro(err, res, 'Erro ao consultar os episódios.');
  }
};

// CREATE - cadastra um episódio dentro de um podcast
exports.criar = async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const { titulo, numero, duracao_min, data_publicacao } = req.body;
    const [result] = await db.query(
      `INSERT INTO episodios (podcast_id, numero, titulo, duracao_min, data_publicacao)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.podcastId, Number(numero), titulo.trim(), Number(duracao_min), data_publicacao]
    );
    res.status(201).json({ mensagem: 'Episódio cadastrado com sucesso!', id: result.insertId });
  } catch (err) {
    responderErro(err, res, 'Erro ao cadastrar o episódio.');
  }
};

// UPDATE - altera um episódio (o id do episódio vem na URL)
exports.atualizar = async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const { titulo, numero, duracao_min, data_publicacao } = req.body;
    const [result] = await db.query(
      `UPDATE episodios
       SET numero = ?, titulo = ?, duracao_min = ?, data_publicacao = ?
       WHERE id = ?`,
      [Number(numero), titulo.trim(), Number(duracao_min), data_publicacao, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Episódio não encontrado.' });
    }
    res.json({ mensagem: 'Episódio atualizado com sucesso!' });
  } catch (err) {
    responderErro(err, res, 'Erro ao atualizar o episódio.');
  }
};

// DELETE - exclui um episódio (o id do episódio vem na URL)
exports.excluir = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM episodios WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Episódio não encontrado.' });
    }
    res.json({ mensagem: 'Episódio excluído com sucesso!' });
  } catch (err) {
    responderErro(err, res, 'Erro ao excluir o episódio.');
  }
};