from flask import Flask, render_template, request, jsonify
from flask_mail import Mail, Message
import requests
import json
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Telegram Configuration (Replace with your actual values)
TELEGRAM_BOT_TOKEN = "7068214952:AAEoQB_Br04qWPpwEMZMrj7II-_RIdBS_94"  # e.g., "1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
TELEGRAM_CHAT_ID = "@lighttelebot"  # e.g., "1234567890"

# Email Configuration (Replace with your actual email settings)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # For Gmail, use your email provider's SMTP
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'chivornwiko@gmail.com'  # Your email address
app.config['MAIL_PASSWORD'] = 'fwbk bmlf sisn pqvy'     # Your email password or app password
app.config['MAIL_DEFAULT_SENDER'] = ('Mail','chivornwiko@gmail.com')

mail = Mail(app)

if os.environ.get('FLASK_ENV') == 'production':
    app.config['DEBUG'] = False
    app.config['TESTING'] = False
else:
    app.config['DEBUG'] = True
def send_telegram_notification(order_data):
    """
    Send order notification to Telegram
    """
    try:
        # Format the message
        message = format_telegram_message(order_data)

        # Send message via Telegram Bot API
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

        payload = {
            'chat_id': TELEGRAM_CHAT_ID,
            'text': message,
            'parse_mode': 'HTML'
        }

        response = requests.post(url, data=payload, timeout=10)

        if response.status_code == 200:
            print("Telegram notification sent successfully!")
            return True
        else:
            print(f"Failed to send Telegram notification: {response.text}")
            return False

    except Exception as e:
        print(f"Error sending Telegram notification: {str(e)}")
        return False


def format_telegram_message(order_data):
    """
    Format order data into a clean Telegram message
    """
    customer = order_data['customer']
    items = order_data['items']
    total = order_data['total']
    payment_method = order_data.get('payment_method', 'Not specified')

    # Calculate item details
    items_text = ""
    for item in items:
        item_total = item['price'] * item['quantity']
        items_text += f"• {item['name']} (Qty: {item['quantity']}) - ${item_total:.2f}\n"

    # Create clean message
    message = f"""
<b>🛒 NEW ORDER</b>
──────────────────
<b>Order Details:</b>
• Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
• Total: <b>${total:.2f}</b>
• Payment: {payment_method.title()}

<b>Customer:</b>
• {customer['full_name']}
• {customer['phone']}
• {customer['email']}
• {customer['address']}

<b>Items:</b>
{items_text}
──────────────────
"""
    return message

@app.get('/')
def home():
    categories = [
        {
            'name': 'Electronics',
            'image': 'Electronics.png',
            'count': 4,
            'slug': 'electronics'
        },
        {
            'name': 'Fashion',
            'image': 'fashion.png',
            'count': 4,
            'slug': 'fashion'
        },
        {
            'name': 'Garden',
            'image': 'home.jpg',
            'count': 4,
            'slug': 'home-garden'
        },
        {
            'name': 'Sports',
            'image': 'sports.jpg',
            'count': 4,
            'slug': 'sports'
        }
    ]
    return render_template('front/home.html', categories=categories)

@app.route('/shop')
def shop():
    # This is a static example - in a real app you would query your database
    return render_template('front/shop.html')

@app.route('/about')
def about():
    return render_template('front/about.html')



@app.route('/cart')
def cart():
    return render_template('front/cart.html')


def generate_invoice_html(order_data):
    """
    Generate HTML invoice template
    """
    customer = order_data['customer']
    items = order_data['items']
    total = order_data['total']

    # Calculate subtotal and shipping
    subtotal = sum(item['price'] * item['quantity'] for item in items)
    shipping = 0 if subtotal > 50 else 5.99

    invoice_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice - ShopEase</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #3498db;
                padding-bottom: 20px;
            }}
            .company-info {{
                margin-bottom: 20px;
            }}
            .invoice-details {{
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }}
            .customer-info, .order-info {{
                flex: 1;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }}
            th, td {{
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }}
            th {{
                background-color: #f8f9fa;
                font-weight: bold;
            }}
            .totals {{
                float: right;
                width: 300px;
            }}
            .total-row {{
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 5px 0;
            }}
            .grand-total {{
                font-size: 1.2em;
                font-weight: bold;
                border-top: 2px solid #333;
                padding-top: 10px;
                margin-top: 10px;
            }}
            .footer {{
                margin-top: 50px;
                text-align: center;
                color: #666;
                font-size: 0.9em;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>ShopEase</h1>
            <p>Your Online Shopping Destination</p>
        </div>

        <div class="company-info">
            <h2>INVOICE</h2>
            <p>Invoice Date: {datetime.now().strftime('%B %d, %Y')}</p>
            <p>Invoice #: {datetime.now().strftime('%Y%m%d%H%M%S')}</p>
        </div>

        <div class="invoice-details">
            <div class="customer-info">
                <h3>Bill To:</h3>
                <p><strong>{customer['full_name']}</strong></p>
                <p>Email: {customer['email']}</p>
                <p>Phone: {customer['phone']}</p>
                <p>Address: {customer['address']}</p>
            </div>

            <div class="order-info">
                <h3>Order Details:</h3>
                <p><strong>Order Date:</strong> {datetime.now().strftime('%B %d, %Y %H:%M')}</p>
                <p><strong>Payment Method:</strong> {order_data.get('payment_method', 'Not specified').title()}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    """

    # Add items to table
    for item in items:
        item_total = item['price'] * item['quantity']
        invoice_html += f"""
                <tr>
                    <td>{item['name']}</td>
                    <td>${item['price']:.2f}</td>
                    <td>{item['quantity']}</td>
                    <td>${item_total:.2f}</td>
                </tr>
        """

    invoice_html += f"""
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>${subtotal:.2f}</span>
            </div>
            <div class="total-row">
                <span>Shipping:</span>
                <span>{'Free' if shipping == 0 else f'${shipping:.2f}'}</span>
            </div>
            <div class="total-row grand-total">
                <span>Total:</span>
                <span>${total:.2f}</span>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>ShopEase • support@shopease.com • www.shopease.com</p>
            <p>This is an automated invoice. Please contact us if you have any questions.</p>
        </div>
    </body>
    </html>
    """

    return invoice_html


def send_email_invoice(order_data):
        """
        Send invoice email to customer with detailed error reporting
        """
        try:
            customer = order_data['customer']
            customer_email = customer['email']
            customer_name = customer['full_name']

            print(f"Attempting to send email to: {customer_email}")
            print(f"Using mail server: {app.config['MAIL_SERVER']}")
            print(f"Using mail username: {app.config['MAIL_USERNAME']}")

            # Generate HTML invoice
            invoice_html = generate_invoice_html(order_data)

            # Create email message
            subject = f"Your ShopEase Order Invoice - #{datetime.now().strftime('%Y%m%d%H%M%S')}"

            msg = Message(
                subject=subject,
                recipients=[customer_email],
                html=invoice_html
            )

            # Add some plain text for email clients that don't support HTML
            msg.body = f"""
            Thank you for your order with ShopEase!

            Order Details:
            - Customer: {customer_name}
            - Email: {customer_email}
            - Total: ${order_data['total']:.2f}
            - Order Date: {datetime.now().strftime('%B %d, %Y %H:%M')}

            Please check your email for the full HTML invoice with item details.

            Thank you for shopping with us!
            ShopEase Team
            """

            # Send email
            mail.send(msg)
            print(f"✓ Success! Invoice email sent to {customer_email}")
            return True

        except Exception as e:
            print(f"✗ Error sending email:")
            print(f"Error type: {type(e).__name__}")
            print(f"Error message: {str(e)}")

            # More detailed error information
            import traceback
            traceback.print_exc()

            return False


@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    if request.method == 'POST':
        try:
            # Get order data from the request
            order_data = request.get_json()

            # Send Telegram notification
            telegram_sent = send_telegram_notification(order_data)

            # Send email invoice
            email_sent = send_email_invoice(order_data)

            if telegram_sent and email_sent:
                return jsonify({
                    'success': True,
                    'message': 'Order placed successfully! Notifications sent.'
                })
            elif telegram_sent:
                return jsonify({
                    'success': True,
                    'message': 'Order placed! Telegram sent but email failed.'
                })
            elif email_sent:
                return jsonify({
                    'success': True,
                    'message': 'Order placed! Email sent but Telegram failed.'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Order placed but both notifications failed.'
                }), 500

        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error processing order: {str(e)}'
            }), 500

    # GET request - render checkout page
    return render_template('front/checkout.html')




if __name__ == '__main__':
    app.run()
