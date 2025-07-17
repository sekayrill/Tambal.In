from flask import Blueprint, jsonify, request
from src.models.user import Booking, TambalLocation, UserSession, Payment, db
from datetime import datetime, timedelta
import secrets

bookings_bp = Blueprint('bookings', __name__)

def get_current_user(token):
    """Get current user from token"""
    if not token:
        return None
    
    session = UserSession.query.filter_by(session_token=token).first()
    if not session or session.is_expired():
        return None
    
    return session.user

def generate_booking_id():
    """Generate unique booking ID"""
    return 'BK' + datetime.now().strftime('%Y%m%d') + secrets.token_hex(4).upper()

def calculate_service_price(service_type, service_description):
    """Calculate service price based on type and description"""
    base_prices = {
        'mobil': {
            'tambal_ban': 25000,
            'ganti_ban': 100000,
            'balancing': 50000,
            'spooring': 75000,
            'default': 30000
        },
        'motor': {
            'tambal_ban': 15000,
            'ganti_ban': 50000,
            'balancing': 25000,
            'spooring': 35000,
            'default': 20000
        }
    }
    
    service_key = service_description.lower().replace(' ', '_') if service_description else 'default'
    
    if service_type in base_prices:
        return base_prices[service_type].get(service_key, base_prices[service_type]['default'])
    
    return 25000  # Default price

@bookings_bp.route('/', methods=['POST'])
def create_booking():
    """Create new booking"""
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
        required_fields = ['location_id', 'service_type', 'booking_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} harus diisi'
                }), 400
        
        location_id = data['location_id']
        service_type = data['service_type']
        service_description = data.get('service_description', '')
        booking_date_str = data['booking_date']
        notes = data.get('notes', '')
        
        # Validate location
        location = TambalLocation.query.get(location_id)
        if not location or not location.is_active:
            return jsonify({
                'success': False,
                'message': 'Lokasi tidak ditemukan atau tidak aktif'
            }), 404
        
        # Validate service type
        if service_type not in ['mobil', 'motor']:
            return jsonify({
                'success': False,
                'message': 'Jenis layanan harus mobil atau motor'
            }), 400
        
        # Parse booking date
        try:
            booking_date = datetime.fromisoformat(booking_date_str.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Format tanggal tidak valid'
            }), 400
        
        # Validate booking date (must be in the future)
        if booking_date <= datetime.utcnow():
            return jsonify({
                'success': False,
                'message': 'Tanggal booking harus di masa depan'
            }), 400
        
        # Calculate price
        service_price = calculate_service_price(service_type, service_description)
        admin_fee = 2500
        total_price = service_price + admin_fee
        
        # Create booking
        booking = Booking(
            user_id=user.id,
            location_id=location_id,
            service_type=service_type,
            service_description=service_description,
            booking_date=booking_date,
            total_price=total_price,
            notes=notes
        )
        
        db.session.add(booking)
        db.session.commit()
        
        # Generate booking ID after commit to get the actual ID
        booking_id = generate_booking_id()
        
        return jsonify({
            'success': True,
            'message': 'Booking berhasil dibuat',
            'booking': booking.to_dict(),
            'booking_id': booking_id,
            'total_price': float(total_price)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@bookings_bp.route('/', methods=['GET'])
def get_user_bookings():
    """Get user's bookings"""
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
        
        # Build query
        query = Booking.query.filter_by(user_id=user.id)
        
        if status:
            query = query.filter_by(status=status)
        
        # Get total count
        total = query.count()
        
        # Get bookings with pagination
        bookings = query.order_by(Booking.created_at.desc())\
                       .offset(offset)\
                       .limit(limit)\
                       .all()
        
        return jsonify({
            'success': True,
            'bookings': [booking.to_dict() for booking in bookings],
            'total': total,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@bookings_bp.route('/<int:booking_id>', methods=['GET'])
def get_booking(booking_id):
    """Get specific booking details"""
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
        
        # Get booking
        booking = Booking.query.filter_by(id=booking_id, user_id=user.id).first()
        
        if not booking:
            return jsonify({
                'success': False,
                'message': 'Booking tidak ditemukan'
            }), 404
        
        # Get payment history
        payments = Payment.query.filter_by(booking_id=booking_id)\
                               .order_by(Payment.created_at.desc())\
                               .all()
        
        booking_dict = booking.to_dict()
        booking_dict['payments'] = [payment.to_dict() for payment in payments]
        
        return jsonify({
            'success': True,
            'booking': booking_dict
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@bookings_bp.route('/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    """Update booking status"""
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
        
        # Get booking
        booking = Booking.query.filter_by(id=booking_id, user_id=user.id).first()
        
        if not booking:
            return jsonify({
                'success': False,
                'message': 'Booking tidak ditemukan'
            }), 404
        
        data = request.get_json()
        
        # Only allow certain status updates by user
        allowed_statuses = ['cancelled']
        
        if 'status' in data:
            new_status = data['status']
            
            if new_status not in allowed_statuses:
                return jsonify({
                    'success': False,
                    'message': 'Status tidak diizinkan untuk diubah'
                }), 400
            
            # Check if booking can be cancelled
            if new_status == 'cancelled':
                if booking.status in ['completed', 'cancelled']:
                    return jsonify({
                        'success': False,
                        'message': 'Booking tidak dapat dibatalkan'
                    }), 400
                
                # Check if booking is within cancellation window (e.g., 1 hour before)
                if booking.booking_date <= datetime.utcnow() + timedelta(hours=1):
                    return jsonify({
                        'success': False,
                        'message': 'Booking tidak dapat dibatalkan kurang dari 1 jam sebelum jadwal'
                    }), 400
            
            booking.status = new_status
        
        # Update notes if provided
        if 'notes' in data:
            booking.notes = data['notes']
        
        booking.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Booking berhasil diperbarui',
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@bookings_bp.route('/<int:booking_id>/cancel', methods=['POST'])
def cancel_booking(booking_id):
    """Cancel booking"""
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
        
        # Get booking
        booking = Booking.query.filter_by(id=booking_id, user_id=user.id).first()
        
        if not booking:
            return jsonify({
                'success': False,
                'message': 'Booking tidak ditemukan'
            }), 404
        
        # Check if booking can be cancelled
        if booking.status in ['completed', 'cancelled']:
            return jsonify({
                'success': False,
                'message': 'Booking tidak dapat dibatalkan'
            }), 400
        
        # Check cancellation window
        if booking.booking_date <= datetime.utcnow() + timedelta(hours=1):
            return jsonify({
                'success': False,
                'message': 'Booking tidak dapat dibatalkan kurang dari 1 jam sebelum jadwal'
            }), 400
        
        # Cancel booking
        booking.status = 'cancelled'
        booking.updated_at = datetime.utcnow()
        
        # If payment was made, create refund record
        if booking.payment_status == 'paid':
            booking.payment_status = 'refunded'
            
            # Create refund payment record
            refund_payment = Payment(
                booking_id=booking_id,
                amount=-booking.total_price,  # Negative amount for refund
                payment_method='refund',
                status='success'
            )
            db.session.add(refund_payment)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Booking berhasil dibatalkan',
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@bookings_bp.route('/stats', methods=['GET'])
def get_booking_stats():
    """Get user's booking statistics"""
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
        
        # Get booking statistics
        total_bookings = Booking.query.filter_by(user_id=user.id).count()
        completed_bookings = Booking.query.filter_by(user_id=user.id, status='completed').count()
        cancelled_bookings = Booking.query.filter_by(user_id=user.id, status='cancelled').count()
        pending_bookings = Booking.query.filter_by(user_id=user.id, status='pending').count()
        
        # Calculate total spent
        total_spent = db.session.query(db.func.sum(Booking.total_price))\
                               .filter_by(user_id=user.id, payment_status='paid')\
                               .scalar() or 0
        
        return jsonify({
            'success': True,
            'stats': {
                'total_bookings': total_bookings,
                'completed_bookings': completed_bookings,
                'cancelled_bookings': cancelled_bookings,
                'pending_bookings': pending_bookings,
                'total_spent': float(total_spent)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@bookings_bp.route('/upcoming', methods=['GET'])
def get_upcoming_bookings():
    """Get user's upcoming bookings"""
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
        
        # Get upcoming bookings
        upcoming_bookings = Booking.query.filter(
            Booking.user_id == user.id,
            Booking.booking_date > datetime.utcnow(),
            Booking.status.in_(['pending', 'confirmed', 'in_progress'])
        ).order_by(Booking.booking_date.asc()).all()
        
        return jsonify({
            'success': True,
            'bookings': [booking.to_dict() for booking in upcoming_bookings]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

