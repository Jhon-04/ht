const pool = require('../config/db');

const UserController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const [users] = await pool.query(
        'SELECT * FROM usuarios WHERE email = ? AND password = ?',
        [email, password]
      );
      
      if (users.length === 0) {
        return res.status(401).json({ 
          success: false, 
          error: 'Credenciales incorrectas' 
        });
      }

      req.session.user = {
        id: users[0].id,
        email: users[0].email,
        rol: users[0].rol
      };
      
      res.json({
        success: true,
        redirectTo: users[0].rol === 'admin' ? '/index.html' : '/products.html'
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error en el servidor' 
      });
    }
  },

  async getCurrentUser(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'No autenticado' 
        });
      }
      res.json({ 
        success: true, 
        data: req.session.user 
      });
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener usuario actual' 
      });
    }
  },

  async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error al cerrar sesión:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Error al cerrar sesión' 
          });
        }
        res.json({ 
          success: true, 
          message: 'Sesión cerrada correctamente' 
        });
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al cerrar sesión' 
      });
    }
  },

  async getAllUsers(req, res) {
    try {
      if (req.session.user?.rol !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'No autorizado' 
        });
      }

      const [users] = await pool.query('SELECT id, email, rol FROM usuarios');
      res.json({ 
        success: true, 
        data: users 
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener usuarios' 
      });
    }
  },

  async getUserById(req, res) {
    try {
      const [users] = await pool.query(
        'SELECT id, email, rol FROM usuarios WHERE id = ?', 
        [req.params.id]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Usuario no encontrado' 
        });
      }

      res.json({ 
        success: true, 
        data: users[0] 
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al obtener usuario' 
      });
    }
  },

  async createUser(req, res) {
    try {
      const { email, password, rol } = req.body;

      if (!email || !password || !rol) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email, contraseña y rol son requeridos' 
        });
      }

      const [result] = await pool.query(
        'INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)',
        [email, password, rol]
      );
      
      const newUser = {
        id: result.insertId,
        email,
        rol
      };

      res.status(201).json({ 
        success: true, 
        data: newUser 
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ 
          success: false, 
          error: 'El email ya está registrado' 
        });
      } else {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Error al crear usuario' 
        });
      }
    }
  },

  async updateUser(req, res) {
    try {
      const { email, password, rol } = req.body;

      if (!email) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email es requerido' 
        });
      }

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
      params.push(req.params.id);
      
      await pool.query(query, params);
      
      const [updatedUser] = await pool.query(
        'SELECT id, email, rol FROM usuarios WHERE id = ?',
        [req.params.id]
      );
      
      res.json({ 
        success: true, 
        message: 'Usuario actualizado correctamente', 
        data: updatedUser[0] 
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ 
          success: false, 
          error: 'El email ya está registrado' 
        });
      } else {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Error al actualizar usuario' 
        });
      }
    }
  },

  async deleteUser(req, res) {
    try {
      if (req.session.user?.rol !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'No autorizado' 
        });
      }

      const [result] = await pool.query(
        'DELETE FROM usuarios WHERE id = ?', 
        [req.params.id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Usuario no encontrado' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Usuario eliminado correctamente' 
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al eliminar usuario' 
      });
    }
  }
};

module.exports = UserController;