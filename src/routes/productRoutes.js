const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

// Rutas para productos
router.get('/', ProductController.getAllProducts);
router.post('/:id/add-to-cart', ProductController.addToCart);
router.get('/cart', ProductController.getCart);

module.exports = router;