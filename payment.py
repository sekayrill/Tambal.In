from flask import Blueprint, jsonify, request
from src.models.user import Payment, Booking, UserSession, db
from datetime import datetime
import secrets
import hashlib
import hmac
import json

payment_bp = Blueprint('payment', __name__)

def get_current_user(token):
    """Get current user from token"""
    if not token:
        return None
    
    session = UserSession.query.filter_by(session_token=token).first()
    if not session or session.is_expired():
        return None
    
    return session.user

def generate_transaction_id():
    """Generate unique transaction ID"""
    return 'TXN' + datetime.now().strftime('%Y%m%d%H%M%S') + secrets.token_hex(4).upper()

def calculate_payment_fee(amount, method):
    """Calculate payment processing fee"""
    fees = {
        'gopay': 0.02,      # 2%
        'ovo': 0.02,        # 2%
        'dana': 0.02,       # 2%
        'bca': 4000,        # Flat fee
        'mandiri': 4000,    # Flat fee
        'bni': 4000,        # Flat fee
        'credit_card': 0.029,  # 2.9%
        'cash': 0           # No fee
    }
    
    fee_rate = fees.get(method, 0)
    
    if isinstance(fee_rate, float):
        return amount * fee_rate
    else:
        return fee_rate

@payment_bp.route('/methods', methods=['GET'])
def get_payment_methods():
    """Get available payment methods"""
    try:
        methods = [
            {
                'id': 'gopay',
                'name': 'GoPay',
                'type': 'ewallet',
                'icon': 'fab fa-google-pay',
                'description': 'Bayar dengan GoPay',
                'fee_rate': 0.02,
                'min_amount': 10000,
                'max_amount': 20000000,
                'processing_time': 'Instan'
            },
            {
                'id': 'ovo',
                'name': 'OVO',
                'type': 'ewallet',
                'icon': 'fas fa-wallet',
                'description': 'Bayar dengan OVO',
                'fee_rate': 0.02,
                'min_amount': 10000,
                'max_amount': 10000000,
                'processing_time': 'Instan'
            },
            {
                'id': 'dana',
                'name': 'DANA',
                'type': 'ewallet',
                'icon': 'fas fa-mobile-alt',
                'description': 'Bayar dengan DANA',
                'fee_rate': 0.02,
                'min_amount': 10000,
                'max_amount': 20000000,
                'processing_time': 'Instan'
            },
            {
                'id': 'bca',
                'name': 'BCA',
                'type': 'bank_transfer',
                'icon': 'fas fa-university',
                'description': 'Transfer ke rekening BCA',
                'fee_rate': 4000,
                'min_amount': 10000,
                'max_amount': 500000000,
                'processing_time': '1-3 jam'
            },
            {
                'id': 'mandiri',
                'name': 'Mandiri',
                'type': 'bank_transfer',
                'icon': 'fas fa-university',
                'description': 'Transfer ke rekening Mandiri',
                'fee_rate': 4000,
                'min_amount': 10000,
                'max_amount': 500000000,
                'processing_time': '1-3 jam'
            },
            {
                'id': 'bni',
                'name': 'BNI',
                'type': 'bank_transfer',
                'icon': 'fas fa-university',
                'description': 'Transfer ke rekening BNI',
                'fee_rate': 4000,
                'min_amount': 10000,
                'max_amount': 500000000,
                'processing_time': '1-3 jam'
            },
            {
                'id': 'credit_card',
                'name': 'Kartu Kredit/Debit',
                'type': 'card',
                'icon': 'fas fa-credit-card',
                'description': 'Visa, Mastercard, JCB',
                'fee_rate': 0.029,
                'min_amount': 10000,
                'max_amount': 50000000,
                'processing_time': 'Instan'
            },
            {
                'id': 'cash',
                'name': 'Bayar di Tempat',
                'type': 'cash',
                'icon': 'fas fa-money-bill-wave',
                'description': 'Bayar tunai saat layanan selesai',
                'fee_rate': 0,
                'min_amount': 0,
                'max_amount': 1000000,
                'processing_time': 'Saat layanan'
            }
        ]
        
        return jsonify({
            'success': True,
            'methods': methods
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@payment_bp.route('/calculate-fee', methods=['POST'])
def calculate_fee():
    """Calculate payment fee for given amount and method"""
    try:
        data = request.get_json()
        
        if not data.get('amount') or not data.get('method'):
            return jsonify({
                'success': False,
                'message': 'Amount dan method harus diisi'
            }), 400
        
        amount = float(data['amount'])
        method = data['method']
        
        if amount <= 0:
            return jsonify({
                'success': False,
                'message': 'Amount harus lebih dari 0'
            }), 400
        
        fee = calculate_payment_fee(amount, method)
        total = amount + fee
        
        return jsonify({
            'success': True,
            'calculation': {
                'amount': amount,
                'fee': fee,
                'total': total,
                'method': method
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@payment_bp.route('/process', methods=['POST'])
def process_payment():
    """Process payment for booking"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token tidak valid'
            }), 401
        
        token = auth_header.split(' ')[1]
        user = get_current_user(token)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User tidak valid'
            }), 401
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['booking_id', 'payment_method', 'amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} harus diisi'
                }), 400
        
        booking_id = data['booking_id']
        payment_method = data['payment_method']
        amount = float(data['amount'])
        
        # Validate booking
        booking = Booking.query.filter_by(id=booking_id, user_id=user.id).first()
        
        if not booking:
            return jsonify({
                'success': False,
                'message': 'Booking tidak ditemukan'
            }), 404
        
        if booking.payment_status == 'paid':
            return jsonify({
                'success': False,
                'message': 'Booking sudah dibayar'
            }), 400
        
        if booking.status == 'cancelled':
            return jsonify({
                'success': False,
                'message': 'Booking sudah dibatalkan'
            }), 400
        
        # Validate amount
        if amount != booking.total_price:
            return jsonify({
                'success': False,
                'message': 'Jumlah pembayaran tidak sesuai'
            }), 400
        
        # Calculate fee
        payment_fee = calculate_payment_fee(amount, payment_method)
        total_amount = amount + payment_fee
        
        # Generate transaction ID
        transaction_id = generate_transaction_id()
        
        # Create payment record
        payment = Payment(
            booking_id=booking_id,
            transaction_id=transaction_id,
            amount=total_amount,
            payment_method=payment_method,
            status='pending'
        )
        
        db.session.add(payment)
        
        # Process payment based on method
        payment_result = process_payment_method(payment_method, total_amount, data)
        
        if payment_result['success']:
            payment.status = 'success'
            payment.external_transaction_id = payment_result.get('external_id')
            payment.payment_details = json.dumps(payment_result.get('details', {}))
            
            # Update booking status
            booking.payment_status = 'paid'
            booking.status = 'confirmed'
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Pembayaran berhasil',
                'payment': {
                    'transaction_id': transaction_id,
                    'amount': total_amount,
                    'method': payment_method,
                    'status': 'success',
                    'booking_id': booking_id
                },
                'booking_status': 'confirmed'
            }), 200
            
        else:
            payment.status = 'failed'
            payment.failure_reason = payment_result.get('message')
            
            db.session.commit()
            
            return jsonify({
                'success': False,
                'message': payment_result.get('message', 'Pembayaran gagal'),
                'payment': {
                    'transaction_id': transaction_id,
                    'status': 'failed'
                }
            }), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

def process_payment_method(method, amount, data):
    """Process payment based on method"""
    
    if method in ['gopay', 'ovo', 'dana']:
        return process_ewallet_payment(method, amount, data)
    elif method in ['bca', 'mandiri', 'bni']:
        return process_bank_transfer(method, amount, data)
    elif method == 'credit_card':
        return process_credit_card(amount, data)
    elif method == 'cash':
        return process_cash_payment(amount, data)
    else:
        return {
            'success': False,
            'message': 'Metode pembayaran tidak didukung'
        }

def process_ewallet_payment(method, amount, data):
    """Process e-wallet payment (simulation)"""
    # In production, integrate with actual payment gateway
    # For now, simulate success/failure
    
    import random
    import time
    
    # Simulate processing time
    time.sleep(random.uniform(1, 3))
    
    # Simulate 95% success rate
    if random.random() < 0.95:
        return {
            'success': True,
            'external_id': f'{method.upper()}_{secrets.token_hex(8)}',
            'details': {
                'method': method,
                'amount': amount,
                'processed_at': datetime.utcnow().isoformat()
            }
        }
    else:
        failure_reasons = [
            'Saldo tidak mencukupi',
            'Akun e-wallet tidak aktif',
            'Transaksi ditolak oleh sistem',
            'Batas transaksi harian terlampaui'
        ]
        return {
            'success': False,
            'message': random.choice(failure_reasons)
        }

def process_bank_transfer(method, amount, data):
    """Process bank transfer payment (simulation)"""
    # In production, generate virtual account or bank transfer instructions
    
    virtual_account = f"{method.upper()}{secrets.randbelow(9999999999):010d}"
    
    return {
        'success': True,
        'external_id': f'VA_{virtual_account}',
        'details': {
            'method': method,
            'virtual_account': virtual_account,
            'amount': amount,
            'bank_name': method.upper(),
            'expires_at': (datetime.utcnow().timestamp() + 86400),  # 24 hours
            'instructions': f'Transfer ke rekening virtual {virtual_account} sejumlah Rp {amount:,.0f}'
        }
    }

def process_credit_card(amount, data):
    """Process credit card payment (simulation)"""
    card_data = data.get('card_data', {})
    
    if not card_data:
        return {
            'success': False,
            'message': 'Data kartu tidak lengkap'
        }
    
    # Validate card data
    required_card_fields = ['number', 'expiry', 'cvv', 'name']
    for field in required_card_fields:
        if not card_data.get(field):
            return {
                'success': False,
                'message': f'Data kartu {field} harus diisi'
            }
    
    # Simulate card processing
    import random
    import time
    
    time.sleep(random.uniform(2, 5))
    
    # Simulate 90% success rate for credit cards
    if random.random() < 0.90:
        return {
            'success': True,
            'external_id': f'CC_{secrets.token_hex(8)}',
            'details': {
                'method': 'credit_card',
                'amount': amount,
                'card_last4': card_data['number'][-4:],
                'card_type': detect_card_type(card_data['number']),
                'processed_at': datetime.utcnow().isoformat()
            }
        }
    else:
        failure_reasons = [
            'Kartu ditolak oleh bank',
            'CVV tidak valid',
            'Kartu sudah kadaluarsa',
            'Limit kartu tidak mencukupi',
            'Transaksi mencurigakan'
        ]
        return {
            'success': False,
            'message': random.choice(failure_reasons)
        }

def process_cash_payment(amount, data):
    """Process cash payment (always success, payment at location)"""
    return {
        'success': True,
        'external_id': f'CASH_{secrets.token_hex(6)}',
        'details': {
            'method': 'cash',
            'amount': amount,
            'note': 'Pembayaran akan dilakukan di lokasi saat layanan selesai'
        }
    }

def detect_card_type(card_number):
    """Detect credit card type from number"""
    card_number = card_number.replace(' ', '')
    
    if card_number.startswith('4'):
        return 'Visa'
    elif card_number.startswith(('51', '52', '53', '54', '55')):
        return 'Mastercard'
    elif card_number.startswith(('34', '37')):
        return 'American Express'
    elif card_number.startswith('35'):
        return 'JCB'
    else:
        return 'Unknown'

@payment_bp.route('/status/<transaction_id>', methods=['GET'])
def get_payment_status(transaction_id):
    """Get payment status"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token tidak valid'
            }), 401
        
        token = auth_header.split(' ')[1]
        user = get_current_user(token)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User tidak valid'
            }), 401
        
        # Find payment
        payment = Payment.query.filter_by(transaction_id=transaction_id).first()
        
        if not payment:
            return jsonify({
                'success': False,
                'message': 'Transaksi tidak ditemukan'
            }), 404
        
        # Check if user owns this payment
        booking = Booking.query.get(payment.booking_id)
        if not booking or booking.user_id != user.id:
            return jsonify({
                'success': False,
                'message': 'Akses ditolak'
            }), 403
        
        return jsonify({
            'success': True,
            'payment': payment.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@payment_bp.route('/history', methods=['GET'])
def get_payment_history():
    """Get user's payment history"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token tidak valid'
            }), 401
        
        token = auth_header.split(' ')[1]
        user = get_current_user(token)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User tidak valid'
            }), 401
        
        # Get query parameters
        status = request.args.get('status')
        limit = request.args.get('limit', default=20, type=int)
        offset = request.args.get('offset', default=0, type=int)
        
        # Build query through bookings
        query = Payment.query.join(Booking).filter(Booking.user_id == user.id)
        
        if status:
            query = query.filter(Payment.status == status)
        
        # Get total count
        total = query.count()
        
        # Get payments with pagination
        payments = query.order_by(Payment.created_at.desc())\
                       .offset(offset)\
                       .limit(limit)\
                       .all()
        
        return jsonify({
            'success': True,
            'payments': [payment.to_dict() for payment in payments],
            'total': total,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@payment_bp.route('/webhook', methods=['POST'])
def payment_webhook():
    """Handle payment gateway webhooks"""
    try:
        # In production, verify webhook signature
        data = request.get_json()
        
        transaction_id = data.get('transaction_id')
        status = data.get('status')
        external_id = data.get('external_id')
        
        if not transaction_id or not status:
            return jsonify({
                'success': False,
                'message': 'Invalid webhook data'
            }), 400
        
        # Find payment
        payment = Payment.query.filter_by(transaction_id=transaction_id).first()
        
        if not payment:
            return jsonify({
                'success': False,
                'message': 'Payment not found'
            }), 404
        
        # Update payment status
        payment.status = status
        if external_id:
            payment.external_transaction_id = external_id
        
        # Update booking if payment successful
        if status == 'success':
            booking = Booking.query.get(payment.booking_id)
            if booking:
                booking.payment_status = 'paid'
                booking.status = 'confirmed'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Webhook processed'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Webhook processing failed'
        }), 500

