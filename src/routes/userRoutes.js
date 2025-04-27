const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// Rutas de autenticación
router.post('/login', UserController.login);
router.get('/current', UserController.getCurrentUser);
router.post('/logout', UserController.logout);

// Rutas de gestión de usuarios
router.get('/', UserController.getAllUsers);
router.post('/', UserController.createUser);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

module.exports = router;