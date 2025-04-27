const pool = require('../config/db');

const ProductController = {
  async getAllProducts(req, res) {
    try {
      const [products] = await pool.query('SELECT * FROM productos');
      res.json({ 
        success: true,
        data: products 
      });
    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener productos' 
      });
    }
  },

  async addToCart(req, res) {
    try {
      if (!req.session.cart) {
        req.session.cart = [];
      }

      const [products] = await pool.query(
        'SELECT * FROM productos WHERE id = ?', 
        [req.params.id]
      );
      
      if (products.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Producto no encontrado' 
        });
      }
      
      const product = products[0];
      req.session.cart.push(product);
      
      res.json({ 
        success: true,
        data: {
          cart: req.session.cart,
          cartCount: req.session.cart.length
        }
      });
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al agregar al carrito' 
      });
    }
  },

  async getCart(req, res) {
    try {
      res.json({ 
        success: true,
        data: {
          cart: req.session.cart || [],
          cartCount: req.session.cart?.length || 0
        }
      });
    } catch (error) {
      console.error('Error al obtener carrito:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener carrito' 
      });
    }
  }
};

module.exports = ProductController;