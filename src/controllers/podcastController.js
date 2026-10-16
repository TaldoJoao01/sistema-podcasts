// CONTROLLER DE PODCASTS: recebe a requisição, fala com o banco (SQL) e devolve a resposta
const db = require('../config/db.js');

// A quantidade de episódios NÃO é digitada: é calculada contando a tabela "episodios"
// (JOIN + COUNT), então nunca fica diferente da realidade.
const SELECT_PODCASTS = `
  SELECT p.id, p.nome, p.categoria, p.apresentador, p.criado_em,
         COUNT(e.id) AS qtd_episodios
  FROM podcasts p
  LEFT JOIN episodios e ON e.podcast_id = p.id
`;

// Valida os dados recebidos do front-end
function validar(body) {
  const { nome, categoria, apresentador } = body;
  if (!nome || !nome.trim() || !categoria || !categoria.trim() || !apresentador || !apresentador.trim()) {
    return 'Preencha nome, categoria e apresentador.';
  }
  return null;
}

// READ - lista todos os podcasts (já com a quantidade de episódios)
exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(`${SELECT_PODCASTS} GROUP BY p.id ORDER BY p.id DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao consultar o banco de dados.' });
  }
};

// READ - busca um podcast pelo id
exports.buscarPorId = async (req, res) => {
  try {
    const [rows] = await db.query(`${SELECT_PODCASTS} WHERE p.id = ? GROUP BY p.id`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Podcast não encontrado.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao consultar o banco de dados.' });
  }
};

// CREATE - cadastra um novo podcast
exports.criar = async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const { nome, categoria, apresentador } = req.body;
    const [result] = await db.query(
      'INSERT INTO podcasts (nome, categoria, apresentador) VALUES (?, ?, ?)',
      [nome.trim(), categoria.trim(), apresentador.trim()]
    );
    res.status(201).json({ mensagem: 'Podcast cadastrado com sucesso!', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar no banco de dados.' });
  }
};

// UPDATE - altera um podcast existente (o id vem na URL)
exports.atualizar = async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const { nome, categoria, apresentador } = req.body;
    const [result] = await db.query(
      'UPDATE podcasts SET nome = ?, categoria = ?, apresentador = ? WHERE id = ?',
      [nome.trim(), categoria.trim(), apresentador.trim(), req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Podcast não encontrado.' });
    }
    res.json({ mensagem: 'Podcast atualizado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar no banco de dados.' });
  }
};

// DELETE - exclui um podcast (o id vem na URL).
// Os episódios dele são apagados automaticamente (ON DELETE CASCADE no banco).
exports.excluir = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM podcasts WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Podcast não encontrado.' });
    }
    res.json({ mensagem: 'Podcast excluído com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao excluir no banco de dados.' });
  }
};