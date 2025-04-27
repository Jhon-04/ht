require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 1 día
  }
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Rutas API
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Middleware de autenticación
app.use((req, res, next) => {
  const publicPaths = ['/login.html', '/api/users/login', '/api/users/current'];
  if (publicPaths.includes(req.path) || req.path.startsWith('/api/products')) {
    return next();
  }
  
  if (!req.session.user) {
    return res.redirect('/login.html');
  }
  next();
});

// Rutas para servir páginas HTML
app.get(['/', '/index.html'], (req, res) => {
  if (req.session.user?.rol === 'user') {
    return res.redirect('/products.html');
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/products.html', (req, res) => {
  if (req.session.user?.rol === 'admin') {
    return res.redirect('/index.html');
  }
  res.sendFile(path.join(__dirname, '../public/products.html'));
});

app.get('/login.html', (req, res) => {
  if (req.session.user) {
    const redirectTo = req.session.user.rol === 'admin' ? '/index.html' : '/products.html';
    return res.redirect(redirectTo);
  }
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});