const pool = require('../config/db');

const UserModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT id, email, rol FROM usuarios');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(
      'SELECT id, email, rol FROM usuarios WHERE id = ?', 
      [id]
    );
    return rows[0];
  },

  async create(email, password, rol = 'user') {
    const [result] = await pool.query(
      'INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)',
      [email, password, rol]
    );
    return { id: result.insertId, email, rol };
  },

  async update(id, email, password, rol) {
    let query = 'UPDATE usuarios SET email = ?';
    const params = [email];
    
    if (password) {
      query += ', password = ?';
      params.push(password);
    }
    
    if (rol) {
      query += ', rol = ?';
      params.push(rol);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await pool.query(query, params);
    
    const [updatedUser] = await pool.query(
      'SELECT id, email, rol FROM usuarios WHERE id = ?',
      [id]
    );
    return updatedUser[0];
  },

  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM usuarios WHERE id = ?', 
      [id]
    );
    return result.affectedRows > 0;
  },

  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?', 
      [email]
    );
    return rows[0];
  }
};

module.exports = UserModel;