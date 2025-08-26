document.addEventListener('DOMContentLoaded', function() {
    initializeCheckout();
    setupEventListeners();
});

function initializeCheckout() {
    loadCartItems();
    updateOrderSummary();
    updateCartCount();
}

function loadCartItems() {
    const cart = getCart();
    const orderItemsList = document.querySelector('.order-items-list');

    if (cart.length === 0) {
        orderItemsList.innerHTML = '<p class="empty-message">No items in cart</p>';
        return;
    }

    let itemsHTML = '';

    cart.forEach(item => {
        itemsHTML += `
            <div class="order-item">
                <div class="order-item-image">
                    <img src="${item.image}" alt="${item.alt}">
                </div>
                <div class="order-item-details">
                    <h4 class="order-item-name">${item.name}</h4>
                    <p class="order-item-price">$${item.price.toFixed(2)} each</p>
                </div>
                <div class="order-item-quantity">Qty: ${item.quantity}</div>
            </div>
        `;
    });

    orderItemsList.innerHTML = itemsHTML;
}

function updateOrderSummary() {
    const cart = getCart();
    const subtotalElement = document.querySelector('.order-subtotal');
    const totalElement = document.querySelector('.order-total');
    const shippingElement = document.querySelector('.shipping-cost');

    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    const shipping = calculateShipping(subtotal);
    const total = subtotal + shipping;

    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    totalElement.textContent = `$${total.toFixed(2)}`;
    shippingElement.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
}

function getCart() {
    const savedCart = localStorage.getItem('shopEaseCart');
    return savedCart ? JSON.parse(savedCart) : [];
}

function calculateShipping(subtotal) {
    return subtotal > 0 ? 0 : 5.99;
}

function calculateOrderTotal() {
    const cart = getCart();
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    const shipping = calculateShipping(subtotal);

    return subtotal + shipping;
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.querySelector('.cart-count');

    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

function setupEventListeners() {
    // Payment method toggle
    const paymentMethodSelect = document.getElementById('payment_method');
    const creditCardDetails = document.getElementById('credit-card-details');

    if (paymentMethodSelect && creditCardDetails) {
        paymentMethodSelect.addEventListener('change', function() {
            if (this.value === 'credit_card') {
                creditCardDetails.style.display = 'block';
            } else {
                creditCardDetails.style.display = 'none';
            }
        });
    }

    // Form submission
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processOrder();
        });
    }

    // Input formatting
    document.getElementById('card_number')?.addEventListener('input', formatCardNumber);
    document.getElementById('expiry_date')?.addEventListener('input', formatExpiryDate);
    document.getElementById('cvv')?.addEventListener('input', formatCVV);
}

function formatCardNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    e.target.value = value.substring(0, 19);
}

function formatExpiryDate(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value.substring(0, 5);
}

function formatCVV(e) {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
}

function processOrder() {
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    // Basic form validation
    const form = document.getElementById('checkout-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const orderData = {
        customer: {
            full_name: formData.get('full_name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address')
        },
        payment_method: formData.get('payment_method'),
        items: cart,
        total: calculateOrderTotal()
    };

    // Add credit card details if applicable
    if (orderData.payment_method === 'credit_card') {
        orderData.card_details = {
            number: formData.get('card_number'),
            expiry: formData.get('expiry_date'),
            cvv: formData.get('cvv')
        };
    }

    // Show loading state
    const submitBtn = document.querySelector('.place-order-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    // Send order data to server
    fetch('/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
    if (data.success) {
        let successMessage = 'Order placed successfully!';

        if (data.message.includes('Telegram') || data.message.includes('Email')) {
            successMessage = data.message;
        }

        showNotification(successMessage, 'success');

        // Clear cart and redirect
        localStorage.removeItem('shopEaseCart');
        setTimeout(() => {
            window.location.href = "/";
        }, 3000);

    } else {
        throw new Error(data.message || 'Unknown error occurred');
    }
})
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error processing order: ' + error.message, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

function showNotification(message, type = 'error') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        font-weight: 500;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    notification.style.backgroundColor = type === 'success' ? '#27ae60' : '#e74c3c';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            document.body.removeChild(notification);
        }
    }, 5000);
}