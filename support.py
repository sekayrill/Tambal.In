from flask import Blueprint, jsonify, request
from src.models.user import SupportMessage, UserSession, db
from datetime import datetime
import re

support_bp = Blueprint('support', __name__)

def get_current_user(token):
    """Get current user from token"""
    if not token:
        return None
    
    session = UserSession.query.filter_by(session_token=token).first()
    if not session or session.is_expired():
        return None
    
    return session.user

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@support_bp.route('/contact', methods=['POST'])
def submit_contact_form():
    """Submit contact form / support message"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} harus diisi'
                }), 400
        
        name = data['name'].strip()
        email = data['email'].strip().lower()
        subject = data['subject'].strip()
        message = data['message'].strip()
        
        # Validate email format
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Format email tidak valid'
            }), 400
        
        # Validate message length
        if len(message) < 10:
            return jsonify({
                'success': False,
                'message': 'Pesan minimal 10 karakter'
            }), 400
        
        # Get user if authenticated
        user_id = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user = get_current_user(token)
            if user:
                user_id = user.id
        
        # Create support message
        support_message = SupportMessage(
            user_id=user_id,
            name=name,
            email=email,
            subject=subject,
            message=message
        )
        
        db.session.add(support_message)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Pesan Anda telah terkirim. Tim support akan merespon segera.',
            'ticket_id': f'TK{support_message.id:06d}'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@support_bp.route('/messages', methods=['GET'])
def get_user_messages():
    """Get user's support messages"""
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
        query = SupportMessage.query.filter_by(user_id=user.id)
        
        if status:
            query = query.filter_by(status=status)
        
        # Get total count
        total = query.count()
        
        # Get messages with pagination
        messages = query.order_by(SupportMessage.created_at.desc())\
                       .offset(offset)\
                       .limit(limit)\
                       .all()
        
        return jsonify({
            'success': True,
            'messages': [message.to_dict() for message in messages],
            'total': total,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@support_bp.route('/messages/<int:message_id>', methods=['GET'])
def get_message(message_id):
    """Get specific support message"""
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
        
        # Get message
        message = SupportMessage.query.filter_by(id=message_id, user_id=user.id).first()
        
        if not message:
            return jsonify({
                'success': False,
                'message': 'Pesan tidak ditemukan'
            }), 404
        
        return jsonify({
            'success': True,
            'message': message.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@support_bp.route('/faq', methods=['GET'])
def get_faq():
    """Get frequently asked questions"""
    try:
        # Static FAQ data (in production, this could come from database)
        faq_data = [
            {
                'id': 1,
                'category': 'general',
                'question': 'Apa itu Tambal.In?',
                'answer': 'Tambal.In adalah platform yang membantu Anda menemukan bengkel tambal ban terdekat dengan mudah dan cepat. Kami menyediakan informasi lengkap tentang lokasi, harga, dan layanan yang tersedia.'
            },
            {
                'id': 2,
                'category': 'booking',
                'question': 'Bagaimana cara membuat pesanan?',
                'answer': 'Untuk membuat pesanan, Anda perlu: 1) Daftar atau login ke akun Anda, 2) Cari bengkel terdekat menggunakan fitur pencarian, 3) Pilih bengkel yang diinginkan, 4) Isi form pemesanan dengan detail kendaraan dan waktu, 5) Lakukan pembayaran.'
            },
            {
                'id': 3,
                'category': 'payment',
                'question': 'Metode pembayaran apa saja yang tersedia?',
                'answer': 'Kami menerima berbagai metode pembayaran termasuk kartu kredit/debit, transfer bank, e-wallet (GoPay, OVO, DANA), dan pembayaran tunai di lokasi (untuk beberapa bengkel).'
            },
            {
                'id': 4,
                'category': 'booking',
                'question': 'Bisakah saya membatalkan pesanan?',
                'answer': 'Ya, Anda dapat membatalkan pesanan hingga 1 jam sebelum waktu yang dijadwalkan. Pembatalan dapat dilakukan melalui halaman "Pesanan Saya" di akun Anda. Jika sudah melakukan pembayaran, dana akan dikembalikan dalam 1-3 hari kerja.'
            },
            {
                'id': 5,
                'category': 'technical',
                'question': 'Mengapa saya tidak bisa login?',
                'answer': 'Jika Anda mengalami masalah login, pastikan: 1) Email dan password yang dimasukkan benar, 2) Koneksi internet stabil, 3) Browser sudah diperbarui. Jika masih bermasalah, gunakan fitur "Lupa Password" atau hubungi customer service.'
            },
            {
                'id': 6,
                'category': 'general',
                'question': 'Apakah layanan tersedia 24 jam?',
                'answer': 'Jam operasional berbeda untuk setiap bengkel. Sebagian besar bengkel buka dari pukul 08:00-17:00, namun ada juga yang melayani 24 jam. Informasi jam operasional dapat dilihat di halaman detail bengkel.'
            },
            {
                'id': 7,
                'category': 'pricing',
                'question': 'Berapa biaya tambal ban?',
                'answer': 'Harga tambal ban bervariasi tergantung jenis kendaraan dan lokasi. Untuk motor mulai dari Rp 15.000, untuk mobil mulai dari Rp 25.000. Harga lengkap dapat dilihat di halaman detail bengkel.'
            },
            {
                'id': 8,
                'category': 'account',
                'question': 'Bagaimana cara mengubah profil saya?',
                'answer': 'Untuk mengubah profil: 1) Login ke akun Anda, 2) Klik menu "Profil" di pojok kanan atas, 3) Klik "Edit Profil", 4) Ubah informasi yang diinginkan, 5) Klik "Simpan Perubahan".'
            }
        ]
        
        # Filter by category if provided
        category = request.args.get('category')
        if category:
            faq_data = [faq for faq in faq_data if faq['category'] == category]
        
        return jsonify({
            'success': True,
            'faq': faq_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@support_bp.route('/categories', methods=['GET'])
def get_support_categories():
    """Get support categories"""
    try:
        categories = [
            {
                'id': 'technical',
                'name': 'Masalah Teknis',
                'description': 'Website, aplikasi, login, dan masalah teknis lainnya'
            },
            {
                'id': 'booking',
                'name': 'Pemesanan',
                'description': 'Cara pesan, ubah pesanan, dan masalah booking'
            },
            {
                'id': 'payment',
                'name': 'Pembayaran',
                'description': 'Metode bayar, gagal bayar, dan refund'
            },
            {
                'id': 'account',
                'name': 'Akun',
                'description': 'Registrasi, login, profil, dan pengaturan akun'
            },
            {
                'id': 'general',
                'name': 'Umum',
                'description': 'Informasi layanan, cara kerja, dan pertanyaan umum'
            },
            {
                'id': 'complaint',
                'name': 'Keluhan',
                'description': 'Keluhan layanan, bengkel, atau pengalaman buruk'
            },
            {
                'id': 'suggestion',
                'name': 'Saran',
                'description': 'Saran perbaikan, fitur baru, dan feedback'
            }
        ]
        
        return jsonify({
            'success': True,
            'categories': categories
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@support_bp.route('/chat', methods=['POST'])
def chat_message():
    """Handle chat message (simple auto-response)"""
    try:
        data = request.get_json()
        
        if not data.get('message'):
            return jsonify({
                'success': False,
                'message': 'Pesan tidak boleh kosong'
            }), 400
        
        user_message = data['message'].lower().strip()
        
        # Simple auto-response logic
        responses = {
            'halo': 'Halo! Selamat datang di Tambal.In. Ada yang bisa saya bantu?',
            'help': 'Tentu! Saya siap membantu Anda. Apa yang ingin Anda tanyakan?',
            'booking': 'Untuk membuat pesanan, Anda bisa menggunakan fitur pencarian lokasi di website kami. Apakah Anda memerlukan bantuan untuk mencari bengkel terdekat?',
            'payment': 'Kami menerima berbagai metode pembayaran termasuk kartu kredit, transfer bank, dan e-wallet. Ada masalah dengan pembayaran Anda?',
            'location': 'Anda bisa mencari bengkel terdekat menggunakan fitur pencarian di halaman utama. Masukkan alamat atau gunakan lokasi saat ini.',
            'price': 'Harga layanan bervariasi tergantung jenis kendaraan dan layanan. Untuk tambal ban motor mulai dari Rp 15.000, dan mobil mulai dari Rp 25.000.',
            'hours': 'Jam operasional bengkel berbeda-beda. Sebagian besar buka dari pukul 08:00-17:00, dan ada juga yang melayani 24 jam.',
            'contact': 'Anda bisa menghubungi kami melalui telepon di +62 812-3456-7890, email support@tambal.in, atau WhatsApp.',
            'cancel': 'Anda dapat membatalkan pesanan hingga 1 jam sebelum waktu yang dijadwalkan melalui halaman "Pesanan Saya".',
            'refund': 'Jika pesanan dibatalkan atau ada masalah pembayaran, dana akan dikembalikan dalam 1-3 hari kerja.'
        }
        
        # Find matching response
        response_message = None
        for keyword, response in responses.items():
            if keyword in user_message:
                response_message = response
                break
        
        if not response_message:
            response_message = 'Terima kasih atas pertanyaan Anda. Tim support kami akan membantu menyelesaikan masalah Anda. Untuk bantuan lebih lanjut, silakan hubungi customer service kami.'
        
        return jsonify({
            'success': True,
            'response': response_message,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@support_bp.route('/stats', methods=['GET'])
def get_support_stats():
    """Get support statistics (admin only)"""
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
        
        # For now, return user's own message stats
        # In production, you might want to add admin role check
        
        total_messages = SupportMessage.query.filter_by(user_id=user.id).count()
        open_messages = SupportMessage.query.filter_by(user_id=user.id, status='open').count()
        resolved_messages = SupportMessage.query.filter_by(user_id=user.id, status='resolved').count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_messages': total_messages,
                'open_messages': open_messages,
                'resolved_messages': resolved_messages,
                'response_rate': round((resolved_messages / total_messages * 100) if total_messages > 0 else 0, 2)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

