class App {
    constructor() {
      this.currentUser = null;
      this.cart = [];
      this.init();
    }
  
    async init() {
      await this.checkAuth();
      this.setupEventListeners();
      
      if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        this.loadUsers();
      } else if (window.location.pathname.endsWith('products.html')) {
        this.loadProducts();
        this.loadCart();
      }
    }
  
    async checkAuth() {
      try {
        const response = await fetch('/api/users/current', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const { data: user } = await response.json();
          this.currentUser = user;
          this.updateUI();
          
          if (user && window.location.pathname.endsWith('login.html')) {
            const redirectTo = user.rol === 'admin' ? '/index.html' : '/products.html';
            window.location.href = redirectTo;
          }
        } else {
          if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = '/login.html';
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (!window.location.pathname.endsWith('login.html')) {
          window.location.href = '/login.html';
        }
      }
    }
  
    setupEventListeners() {
      // Login Form
      document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
  
        try {
          const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
          });
  
          const data = await response.json();
          
          if (data.success) {
            window.location.href = data.redirectTo;
          } else {
            this.showMessage(data.error || 'Credenciales incorrectas', 'error', 'loginMessage');
          }
        } catch (error) {
          this.showMessage('Error de conexión', 'error', 'loginMessage');
        }
      });
  
      // Logout Button
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        try {
          const response = await fetch('/api/users/logout', {
            method: 'POST',
            credentials: 'include'
          });
  
          if (response.ok) {
            this.currentUser = null;
            this.cart = [];
            window.location.href = '/login.html';
          }
        } catch (error) {
          this.showMessage('Error al cerrar sesión', 'error');
        }
      });
  
      // User Form (admin)
      document.getElementById('userForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('userId').value;
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        const role = document.getElementById('userRole').value;
  
        try {
          if (id) {
            await this.updateUser(id, email, password, role);
            this.showMessage('Usuario actualizado correctamente', 'success');
          } else {
            await this.createUser(email, password, role);
            this.showMessage('Usuario creado correctamente', 'success');
          }
          
          this.resetForm();
          this.loadUsers();
        } catch (error) {
          this.showMessage(error.message, 'error');
        }
      });
  
      // Add to Cart
      document.getElementById('productsContainer')?.addEventListener('click', async (e) => {
        if (e.target.classList.contains('add-to-cart')) {
          const productId = e.target.dataset.id;
          await this.addToCart(productId);
        }
      });
    }
  
    async loadUsers() {
      try {
        const response = await fetch('/api/users', {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Error al cargar usuarios');
        
        const { data: users } = await response.json();
        this.renderUsers(users);
      } catch (error) {
        this.showMessage(error.message, 'error');
      }
    }
  
    async loadProducts() {
      try {
        const response = await fetch('/api/products', {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Error al cargar productos');
        
        const { data: products } = await response.json();
        this.renderProducts(products);
      } catch (error) {
        this.showMessage(error.message, 'error');
      }
    }
  
    async loadCart() {
      try {
        const response = await fetch('/api/products/cart', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const { data } = await response.json();
          this.cart = data.cart;
          this.updateCartCount();
        }
      } catch (error) {
        console.error('Error al cargar carrito:', error);
      }
    }
  
    async addToCart(productId) {
      try {
        const response = await fetch(`/api/products/${productId}/add-to-cart`, {
          method: 'POST',
          credentials: 'include'
        });
        
        if (response.ok) {
          const { data } = await response.json();
          this.cart = data.cart;
          this.updateCartCount();
          this.showMessage('Producto añadido al carrito', 'success');
        } else {
          throw new Error('Error al agregar al carrito');
        }
      } catch (error) {
        this.showMessage(error.message, 'error');
      }
    }
  
    renderUsers(users) {
      const tbody = document.querySelector('#usersTable tbody');
      if (!tbody) return;
      
      tbody.innerHTML = users.map(user => `
        <tr>
          <td>${user.id}</td>
          <td>${user.email}</td>
          <td>${user.rol}</td>
          <td>
            <button class="btn-edit" data-id="${user.id}">Editar</button>
            <button class="btn-delete" data-id="${user.id}">Eliminar</button>
          </td>
        </tr>
      `).join('');
  
      // Add event listeners
      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => this.editUser(btn.dataset.id));
      });
  
      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => this.deleteUser(btn.dataset.id));
      });
    }
  
    renderProducts(products) {
      const container = document.getElementById('productsContainer');
      if (!container) return;
      
      container.innerHTML = products.map(product => `
        <div class="product-card">
          <div class="product-img-container">
            ${product.imagen ? 
              `<img src="${product.imagen}" alt="${product.nombre}" class="product-img">` : 
              '<div class="no-image">Imagen no disponible</div>'}
          </div>
          <div class="product-info">
            <h3 class="product-title">${product.nombre}</h3>
            <p class="product-description">${product.description}</p>
            <p class="product-price">$${product.precio.toFixed(2)}</p>
            <button class="btn-add-to-cart" data-id="${product.id}">Añadir al carrito</button>
          </div>
        </div>
      `).join('');
    }
  
    async editUser(id) {
      try {
        const response = await fetch(`/api/users/${id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Error al cargar usuario');
        
        const { data: user } = await response.json();
        
        document.getElementById('userId').value = user.id;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPassword').value = '';
        document.getElementById('userRole').value = user.rol;
        
      } catch (error) {
        this.showMessage(error.message, 'error');
      }
    }
  
    async deleteUser(id) {
      if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
      
      try {
        const response = await fetch(`/api/users/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Error al eliminar usuario');
        
        this.showMessage('Usuario eliminado correctamente', 'success');
        this.loadUsers();
      } catch (error) {
        this.showMessage(error.message, 'error');
      }
    }
  
    async createUser(email, password, rol) {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, rol }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear usuario');
      }
    }
  
    async updateUser(id, email, password, rol) {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, rol }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar usuario');
      }
    }
  
    updateUI() {
      if (!this.currentUser) return;
  
      const userInfo = document.getElementById('userInfo');
      if (userInfo) {
        userInfo.innerHTML = `
          ${this.currentUser.email} 
          <span class="badge ${this.currentUser.rol}">${this.currentUser.rol}</span>
        `;
      }
  
      const adminSection = document.getElementById('adminSection');
      if (adminSection) {
        adminSection.style.display = this.currentUser.rol === 'admin' ? 'block' : 'none';
      }
    }
  
    updateCartCount() {
      const cartCount = document.getElementById('cartCount');
      if (cartCount) {
        cartCount.textContent = this.cart.length;
      }
    }
  
    resetForm() {
      const form = document.getElementById('userForm');
      if (form) form.reset();
      document.getElementById('userId').value = '';
    }
  
    showMessage(message, type, containerId = 'messageContainer') {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${type}`;
      messageDiv.textContent = message;
      
      container.appendChild(messageDiv);
      
      setTimeout(() => {
        messageDiv.remove();
      }, 5000);
    }
  }
  
  // Iniciar la aplicación
  document.addEventListener('DOMContentLoaded', () => {
    new App();
  });