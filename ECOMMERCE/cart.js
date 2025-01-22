class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.updateCartUI();
    }

    addItem(id, name, price, quantity = 1, image) {
        // Create a unique identifier by combining product ID and options
        const options = name.match(/\((.*?)\)/);
        const uniqueId = options ? `${id}-${options[1].replace(/,\s*/g, '-')}` : id;
        
        // Look for an existing item with the same unique ID
        const existingItem = this.items.find(item => {
            const itemOptions = item.name.match(/\((.*?)\)/);
            const itemUniqueId = itemOptions ? `${item.id}-${itemOptions[1].replace(/,\s*/g, '-')}` : item.id;
            return itemUniqueId === uniqueId;
        });
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({ 
                id: uniqueId, // Store the unique ID
                originalId: id, // Store the original product ID
                name, 
                price, 
                quantity, 
                image 
            });
        }
        
        this.saveCart();
        this.updateCartUI();
        
        // Show toast
        const toast = new bootstrap.Toast(document.getElementById('addToCartToast'));
        toast.show();
    }

    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveCart();
        this.displayCartItems();
        this.updateCartUI();
    }

updateQuantity(id, quantity) {
    const item = this.items.find(item => item.id === id);
    if (item) {
        const newQuantity = parseInt(quantity);
        if (newQuantity <= 0) {
            this.removeItem(id);
        } else {
            item.quantity = newQuantity;
        }
        this.saveCart();
        this.displayCartItems();
        this.updateCartUI();
    }
}

  getTotal() {
      return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  saveCart() {
      localStorage.setItem('cart', JSON.stringify(this.items));
  }

  updateCartUI() {
      const cartCount = document.getElementById('cart-count');
      const itemCount = this.items.reduce((total, item) => total + item.quantity, 0);
      if (cartCount) {
          cartCount.textContent = itemCount;
      }
  }

  clearCart() {
      this.items = [];
      this.saveCart();
      this.updateCartUI();
  }

  displayCartItems() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

    if (this.items.length === 0) {
        cartContainer.innerHTML = '<p class="text-center">Your cart is empty</p>';
        this.updateCartSummary(0);
        return;
    }

    let cartHTML = '';
    this.items.forEach(item => {
        // Extract color and switch from the item name if they exist
        const optionsMatch = item.name.match(/\((.*?)\)/);
        const options = optionsMatch ? optionsMatch[1].split(', ') : [];
        const baseName = item.name.replace(/\s*\(.*?\)$/, '');
        
        cartHTML += `
            <div class="card mb-3">
                <div class="row g-0">
                    <div class="col-md-2">
                        <img src="${item.image}" class="img-fluid rounded-start" alt="${baseName}">
                    </div>
                    <div class="col-md-10">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h5 class="card-title mb-1">${baseName}</h5>
                                    ${options.length > 0 ? `
                                        <div class="text-muted small mb-2">
                                            <span class="me-2"><i class="bi bi-palette-fill"></i> ${options[0]}</span>
                                            <span><i class="bi bi-keyboard-fill"></i> ${options[1]}</span>
                                        </div>
                                    ` : ''}
                                </div>
                                <button class="btn btn-sm btn-danger ms-2" onclick="cart.removeItem('${item.id}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <div class="input-group" style="max-width: 120px;">
                                    <button class="btn btn-outline-secondary btn-sm" type="button" 
                                        onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                                    <input type="number" class="form-control form-control-sm text-center" value="${item.quantity}" 
                                        onchange="cart.updateQuantity('${item.id}', this.value)">
                                    <button class="btn btn-outline-secondary btn-sm" type="button" 
                                        onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                                </div>
                                <p class="card-text mb-0">
                                    <strong>${this.formatPrice(item.price * item.quantity)}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    cartContainer.innerHTML = cartHTML;
    this.updateCartSummary(this.getTotal());
    
  }

  updateCartSummary(total) {
      const subtotalElement = document.getElementById('subtotal');
      const totalElement = document.getElementById('total');
      
      if (subtotalElement) {
          subtotalElement.textContent = this.formatPrice(total);
      }
      if (totalElement) {
          totalElement.textContent = this.formatPrice(total);
      }
  }

  formatPrice(price) {
      // Check if price is in Rupiah format (contains 'Rp')
      if (typeof price === 'string' && price.includes('Rp')) {
          return `Rp ${parseInt(price.replace(/[^0-9]/g, '')).toLocaleString('id-ID')},-`;
      }
      // For dollar prices
      return `$${price.toFixed(2)}`;
  }
}

// Initialize cart and display items when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltips.forEach(tooltip => {
      new bootstrap.Tooltip(tooltip);
  });

  // Initialize cart
  window.cart = new ShoppingCart();
  if (window.location.pathname.includes('cart.html')) {
      window.cart.displayCartItems();
  }
});

function addToCart(button) {
  const card = button.closest('.card');
  const id = card.dataset.productId;
  const name = card.querySelector('.card-title').textContent;
  const priceText = card.querySelector('.fw-bold').textContent;
  const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
  const image = card.querySelector('.card-img-top').src;
  
  window.cart.addItem(id, name, price, 1, image);
}

function proceedToCheckout() {
  window.location.href = 'checkout.html';
}

function displayOrderSummary() {
    const orderSummaryContainer = document.getElementById('order-summary');
    if (!orderSummaryContainer) return;

    const cart = window.cart;
    if (!cart || !cart.items || cart.items.length === 0) {
        orderSummaryContainer.innerHTML = '<p class="text-center">Your cart is empty</p>';
        return;
    }

    let summaryHTML = '<div class="mb-4">';
    
    // Display each item in the order
    cart.items.forEach(item => {
        const optionsMatch = item.name.match(/\((.*?)\)/);
        const options = optionsMatch ? optionsMatch[1].split(', ') : [];
        const baseName = item.name.replace(/\s*\(.*?\)$/, '');
        
        summaryHTML += `
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h6 class="mb-0">${baseName}</h6>
                    ${options.length > 0 ? `
                        <small class="text-muted">
                            ${options.join(' - ')}
                        </small>
                    ` : ''}
                    <div class="text-muted">
                        Quantity: ${item.quantity}
                    </div>
                </div>
                <div class="text-end">
                    <strong>${cart.formatPrice(item.price * item.quantity)}</strong>
                </div>
            </div>
        `;
    });

    summaryHTML += '</div>';

    // Add subtotal, shipping, and total
    const subtotal = cart.getTotal();
    const shipping = 10; // Example shipping cost - adjust as needed
    const total = subtotal + shipping;

    summaryHTML += `
        <hr>
        <div class="d-flex justify-content-between mb-2">
            <span>Subtotal:</span>
            <span>${cart.formatPrice(subtotal)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
            <span>Shipping:</span>
            <span>${cart.formatPrice(shipping)}</span>
        </div>
        <hr>
        <div class="d-flex justify-content-between mb-2">
            <strong>Total:</strong>
            <strong>${cart.formatPrice(total)}</strong>
        </div>
    `;

    orderSummaryContainer.innerHTML = summaryHTML;
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });

    // Initialize cart
    window.cart = new ShoppingCart();
    
    // Check which page we're on and call appropriate display function
    if (window.location.pathname.includes('cart.html')) {
        window.cart.displayCartItems();
    } else if (window.location.pathname.includes('checkout.html')) {
        displayOrderSummary();
    }
});

// Add this function to handle order submission
function submitOrder(event) {
    event.preventDefault();
    // Add your order processing logic here
    alert('Order placed successfully!');
    window.cart.clearCart();
    window.location.href = 'index.html'; // Redirect to home page or order confirmation page
}