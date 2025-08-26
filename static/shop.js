document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart from localStorage
    initializeCart();

    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const cartCountElement = document.querySelector('.cart-count');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const product = getProductData(productCard);
            addToCart(product);

            // Visual feedback
            showAddedToCartFeedback(this);
        });
    });

    // Update cart count on page load
    updateCartCount();
});

// Cart functionality
let cart = [];

function initializeCart() {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('shopEaseCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

function getProductData(productCard) {
    const productImage = productCard.querySelector('.product-image img');
    const productName = productCard.querySelector('.product-title').textContent;
    const productPrice = productCard.querySelector('.current-price').textContent;

    return {
        id: generateProductId(productName),
        name: productName,
        price: parseFloat(productPrice.replace('$', '')),
        image: productImage.src,
        alt: productImage.alt,
        quantity: 1
    };
}

function generateProductId(name) {
    return name.toLowerCase().replace(/\s+/g, '-');
}

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push(product);
    }

    saveCart();
    updateCartCount();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    updateCartDisplay(); // If on cart page
}

function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart();
            updateCartDisplay(); // If on cart page
        }
    }
}

function saveCart() {
    localStorage.setItem('shopEaseCart', JSON.stringify(cart));
}

function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

function showAddedToCartFeedback(button) {
    const originalText = button.textContent;
    const originalBgColor = button.style.backgroundColor;

    button.textContent = 'Added!';
    button.style.backgroundColor = '#27ae60';
    button.disabled = true;

    setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = originalBgColor;
        button.disabled = false;
    }, 2000);
}

// Cart page functionality (if on cart page)
function loadCartPage() {
    if (document.querySelector('.cart-page')) {
        updateCartDisplay();
        setupCartEventListeners();
    }
}

function updateCartDisplay() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartSubtotalElement = document.querySelector('.cart-subtotal');
    const cartTotalElement = document.querySelector('.cart-total');
    const emptyCartMessage = document.querySelector('.empty-cart-message');

    if (cart.length === 0) {
        if (cartItemsContainer) cartItemsContainer.innerHTML = '';
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
        if (cartSubtotalElement) cartSubtotalElement.textContent = '$0.00';
        if (cartTotalElement) cartTotalElement.textContent = '$0.00';
        return;
    }

    if (emptyCartMessage) emptyCartMessage.style.display = 'none';

    let subtotal = 0;
    let cartHTML = '';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        cartHTML += `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.alt}">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn minus" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn plus" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
                    <button class="remove-item-btn" onclick="removeFromCart('${item.id}')">×</button>
                </div>
            </div>
        `;
    });

    // Calculate shipping (free over $50, otherwise $5.99)
    const shipping = 0
    const total = subtotal + shipping;

    if (cartItemsContainer) cartItemsContainer.innerHTML = cartHTML;
    if (cartSubtotalElement) cartSubtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;

    // Update shipping display
    const shippingElement = document.querySelector('.shipping-cost');
    if (shippingElement) {
        shippingElement.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
    }

    if (cartItemsContainer) cartItemsContainer.innerHTML = cartHTML;
    if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
}

function setupCartEventListeners() {
    // Event delegation for quantity buttons
    document.querySelector('.cart-items')?.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const cartItem = e.target.closest('.cart-item');
            const productId = cartItem.dataset.productId;
            const quantityDisplay = cartItem.querySelector('.quantity-display');
            let quantity = parseInt(quantityDisplay.textContent);

            if (e.target.classList.contains('minus')) {
                quantity = Math.max(0, quantity - 1);
            } else if (e.target.classList.contains('plus')) {
                quantity += 1;
            }

            updateQuantity(productId, quantity);
        }
    });
}

// Make functions available globally for HTML onclick attributes
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;

// Initialize cart page if needed
document.addEventListener('DOMContentLoaded', loadCartPage);