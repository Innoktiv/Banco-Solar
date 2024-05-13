const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  user: 'postgres',
  password: 'password',
  database: 'bancosolar',
  host: 'localhost',
  port: 5432
});

app.use(bodyParser.json());

// Get the application client
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Create a new user
app.post('/usuario', async (req, res) => {
  const { nombre, balance } = req.body;

  try {
    await pool.query('INSERT INTO usuarios (nombre, balance) VALUES ($1, $2)', [nombre, balance]);
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

// Get all users
app.get('/usuarios', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Update a user
app.put('/usuario', async (req, res) => {
  const { id, nombre, balance } = req.body;

  try {
    await pool.query('UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3', [nombre, balance, id]);
    res.status(200).json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// Delete a user
app.delete('/usuario', async (req, res) => {
  const { id } = req.query;

  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

// Create a new transfer
app.post('/transferencia', async (req, res) => {
  const { emisor, receptor, monto } = req.body;

  try {
    await pool.query('BEGIN; UPDATE usuarios SET balance = balance - $1 WHERE nombre = $2; UPDATE usuarios SET balance = balance + $1 WHERE nombre = $3; COMMIT;', [monto, emisor, receptor]);
    res.status(201).json({ message: 'Transferencia realizada exitosamente' });
  } catch (error) {
    await pool.query('ROLLBACK;');
    console.error(error);
    res.status(500).json({ message: 'Error al realizar transferencia' });
  }
});

// Get all transfers
app.get('/transferencias', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT t.fecha, u1.nombre AS emisor, u2.nombre AS receptor, t.monto FROM transferencias t JOIN usuarios u1 ON u1.id = t.emisor JOIN usuarios u2 ON u2.id = t.receptor ORDER BY t.fecha DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener transferencias' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
