from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from src.models.user import User, UserSession, db
from datetime import datetime, timedelta
import secrets
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password minimal 8 karakter"
    if not re.search(r'[A-Za-z]', password):
        return False, "Password harus mengandung huruf"
    if not re.search(r'\d', password):
        return False, "Password harus mengandung angka"
    return True, "Password valid"

def generate_session_token():
    """Generate secure session token"""
    return secrets.token_urlsafe(32)

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'full_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} harus diisi'
                }), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        full_name = data['full_name'].strip()
        phone = data.get('phone', '').strip()
        
        # Validate email format
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Format email tidak valid'
            }), 400
        
        # Validate password strength
        is_valid, password_message = validate_password(password)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': password_message
            }), 400
        
        # Check if username already exists
        if User.query.filter_by(username=username).first():
            return jsonify({
                'success': False,
                'message': 'Username sudah digunakan'
            }), 400
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({
                'success': False,
                'message': 'Email sudah terdaftar'
            }), 400
        
        # Create new user
        user = User(
            username=username,
            email=email,
            full_name=full_name,
            phone=phone
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Registrasi berhasil',
            'user': user.to_public_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email dan password harus diisi'
            }), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        remember_me = data.get('remember_me', False)
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({
                'success': False,
                'message': 'Email atau password salah'
            }), 401
        
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Akun Anda telah dinonaktifkan'
            }), 401
        
        # Generate session token
        session_token = generate_session_token()
        
        # Set session expiry (7 days if remember_me, otherwise 1 day)
        expires_at = datetime.utcnow() + timedelta(days=7 if remember_me else 1)
        
        # Create user session
        user_session = UserSession(
            user_id=user.id,
            session_token=session_token,
            expires_at=expires_at
        )
        
        db.session.add(user_session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Login berhasil',
            'user': user.to_public_dict(),
            'token': session_token,
            'expires_at': expires_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """User logout endpoint"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token tidak valid'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Find and delete session
        session = UserSession.query.filter_by(session_token=token).first()
        if session:
            db.session.delete(session)
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Logout berhasil'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify session token"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token tidak valid'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Find session
        session = UserSession.query.filter_by(session_token=token).first()
        
        if not session:
            return jsonify({
                'success': False,
                'message': 'Token tidak ditemukan'
            }), 401
        
        if session.is_expired():
            # Delete expired session
            db.session.delete(session)
            db.session.commit()
            return jsonify({
                'success': False,
                'message': 'Token telah expired'
            }), 401
        
        # Get user
        user = User.query.get(session.user_id)
        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'message': 'User tidak valid'
            }), 401
        
        return jsonify({
            'success': True,
            'user': user.to_public_dict(),
            'expires_at': session.expires_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token tidak valid'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Find session
        session = UserSession.query.filter_by(session_token=token).first()
        
        if not session or session.is_expired():
            return jsonify({
                'success': False,
                'message': 'Token tidak valid atau expired'
            }), 401
        
        # Get user
        user = User.query.get(session.user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User tidak ditemukan'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token tidak valid'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Find session
        session = UserSession.query.filter_by(session_token=token).first()
        
        if not session or session.is_expired():
            return jsonify({
                'success': False,
                'message': 'Token tidak valid atau expired'
            }), 401
        
        # Get user
        user = User.query.get(session.user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User tidak ditemukan'
            }), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'full_name' in data:
            user.full_name = data['full_name'].strip()
        
        if 'phone' in data:
            user.phone = data['phone'].strip()
        
        if 'email' in data:
            new_email = data['email'].strip().lower()
            if new_email != user.email:
                # Validate email format
                if not validate_email(new_email):
                    return jsonify({
                        'success': False,
                        'message': 'Format email tidak valid'
                    }), 400
                
                # Check if email already exists
                if User.query.filter_by(email=new_email).first():
                    return jsonify({
                        'success': False,
                        'message': 'Email sudah digunakan'
                    }), 400
                
                user.email = new_email
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profil berhasil diperbarui',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """Change user password"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Token tidak valid'
            }), 401
        
        token = auth_header.split(' ')[1]
        
        # Find session
        session = UserSession.query.filter_by(session_token=token).first()
        
        if not session or session.is_expired():
            return jsonify({
                'success': False,
                'message': 'Token tidak valid atau expired'
            }), 401
        
        # Get user
        user = User.query.get(session.user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User tidak ditemukan'
            }), 404
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({
                'success': False,
                'message': 'Password lama dan baru harus diisi'
            }), 400
        
        current_password = data['current_password']
        new_password = data['new_password']
        
        # Check current password
        if not user.check_password(current_password):
            return jsonify({
                'success': False,
                'message': 'Password lama salah'
            }), 400
        
        # Validate new password
        is_valid, password_message = validate_password(new_password)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': password_message
            }), 400
        
        # Update password
        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password berhasil diubah'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

