import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const generarJWT = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRETO, {
    expiresIn: '30d',
  });
};

export const registrarUsuario = async (req, res) => {
  const { nombre, email, password, dni } = req.body;
  if (!nombre || !email || !password || !dni) { /* ... */ }
  try {
    // --- SINTAXIS POSTGRESQL ---
    const { rows: existentes } = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 OR dni = $2',
      [email, dni]
    );
    if (existentes.length > 0) {
      return res.status(400).json({ msg: 'El email o DNI ya está registrado.' });
    }
    const { rows: rolCliente } = await pool.query("SELECT id FROM roles WHERE nombre = 'cliente'");
    if (rolCliente.length === 0) { /* ... */ }
    const rol_id = rolCliente[0].id;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const sql = 'INSERT INTO usuarios (nombre, email, password, dni, rol_id) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    const valores = [nombre, email, passwordHash, dni, rol_id];
    
    const resultado = await pool.query(sql, valores);
    const nuevoUsuarioId = resultado.rows[0].id; // Se usa .rows[0].id
    // --- FIN ---

    const token = generarJWT(nuevoUsuarioId, 'cliente');
    res.status(201).json({
      msg: 'Usuario registrado exitosamente.',
      token,
      usuario: { id: nuevoUsuarioId, nombre, email, rol: 'cliente' }
    });
  } catch (error) { /* ... */ }
};

export const loginUsuario = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { /* ... */ }
  try {
    // --- SINTAXIS POSTGRESQL ---
    const { rows: usuarios } = await pool.query(
      'SELECT u.*, r.nombre AS rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.email = $1',
      [email]
    );
    // --- FIN ---
    if (usuarios.length === 0) {
      return res.status(404).json({ msg: 'Credenciales incorrectas.' });
    }
    const usuario = usuarios[0];
    const esPasswordCorrecto = await bcrypt.compare(password, usuario.password);
    if (!esPasswordCorrecto) {
      return res.status(401).json({ msg: 'Credenciales incorrectas.' });
    }
    const token = generarJWT(usuario.id, usuario.rol);
    res.json({
      msg: 'Inicio de sesión exitoso.',
      token,
      usuario: { /* ... */ }
    });
  } catch (error) { /* ... */ }
};

export const obtenerPerfil = async (req, res) => {
  res.json(req.usuario);
};

export const loginConGoogle = async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) { /* ... */ }
  try {
    const { data } = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const { email, name, sub } = data;

    // --- SINTAXIS POSTGRESQL ---
    const { rows: usuarios } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    let usuario;
    if (usuarios.length > 0) {
      usuario = usuarios[0];
    } else {
      const { rows: rolCliente } = await pool.query("SELECT id FROM roles WHERE nombre = 'cliente'");
      const rol_id = rolCliente[0].id;
      const dniPlaceholder = sub.slice(0, 20);
      const passwordHash = await bcrypt.hash(Math.random().toString(36), 10);
      
      const sql = `INSERT INTO usuarios (nombre, email, password, dni, rol_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
      const valores = [name, email, passwordHash, dniPlaceholder, rol_id];
      const resultado = await pool.query(sql, valores);
      usuario = resultado.rows[0];
    }
    // --- FIN ---

    const token = generarJWT(usuario.id, usuario.rol);
    res.json({
      msg: 'Inicio de sesión con Google exitoso.',
      token,
      usuario: { /* ... */ }
    });
  } catch (error) {
    if (error.code === '23505') { // Código de error de Postgres
        return res.status(409).json({ msg: 'Error de conflicto al crear usuario.' });
    }
    console.error('Error en loginConGoogle:', error);
    res.status(500).json({ msg: 'Error del servidor al autenticar con Google.' });
  }
};