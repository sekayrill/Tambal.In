import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from src.models.user import db
from src.routes.auth import auth_bp
from src.routes.locations import locations_bp
from src.routes.bookings import bookings_bp
from src.routes.support import support_bp
from src.routes.payment import payment_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'tambal_in_secret_key_2024_secure'

# Enable CORS for all routes
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(locations_bp, url_prefix='/api/locations')
app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
app.register_blueprint(support_bp, url_prefix='/api/support')
app.register_blueprint(payment_bp, url_prefix='/api/payment')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Create database tables
with app.app_context():
    db.create_all()
    
    # Add sample data if database is empty
    from src.models.user import TambalLocation
    if TambalLocation.query.count() == 0:
        sample_locations = [
            TambalLocation(
                name='Tambal Ban Jaya',
                address='Jl. Sudirman No. 123, Jakarta Pusat',
                latitude=-6.2088,
                longitude=106.8456,
                phone='021-12345678',
                email='jaya@tambalban.com',
                description='Bengkel tambal ban terpercaya dengan pengalaman lebih dari 10 tahun',
                services='["Mobil", "Motor", "Ban Tubeless", "Balancing"]',
                operating_hours='{"senin": "08:00-17:00", "selasa": "08:00-17:00", "rabu": "08:00-17:00", "kamis": "08:00-17:00", "jumat": "08:00-17:00", "sabtu": "08:00-17:00", "minggu": "Tutup"}',
                rating=4.5,
                total_reviews=25
            ),
            TambalLocation(
                name='Bengkel Ban Merdeka',
                address='Jl. Merdeka Raya No. 45, Jakarta Selatan',
                latitude=-6.2615,
                longitude=106.8106,
                phone='021-87654321',
                email='merdeka@tambalban.com',
                description='Spesialis tambal ban mobil dan motor dengan teknologi modern',
                services='["Mobil", "Motor", "Balancing", "Spooring"]',
                operating_hours='{"senin": "07:00-18:00", "selasa": "07:00-18:00", "rabu": "07:00-18:00", "kamis": "07:00-18:00", "jumat": "07:00-18:00", "sabtu": "07:00-18:00", "minggu": "08:00-16:00"}',
                rating=4.2,
                total_reviews=18
            ),
            TambalLocation(
                name='Tambal Ban 24 Jam',
                address='Jl. Gatot Subroto No. 67, Jakarta Selatan',
                latitude=-6.2297,
                longitude=106.8253,
                phone='021-11223344',
                email='24jam@tambalban.com',
                description='Layanan tambal ban 24 jam dengan layanan panggilan',
                services='["Mobil", "Motor", "24 Jam", "Panggilan", "Emergency"]',
                operating_hours='{"senin": "24 Jam", "selasa": "24 Jam", "rabu": "24 Jam", "kamis": "24 Jam", "jumat": "24 Jam", "sabtu": "24 Jam", "minggu": "24 Jam"}',
                rating=4.8,
                total_reviews=42
            ),
            TambalLocation(
                name='Ban Center Kemang',
                address='Jl. Kemang Raya No. 89, Jakarta Selatan',
                latitude=-6.2633,
                longitude=106.8167,
                phone='021-55667788',
                email='kemang@bancenter.com',
                description='Pusat layanan ban lengkap dengan berbagai merek ban berkualitas',
                services='["Mobil", "Motor", "Ganti Ban", "Balancing", "Nitrogen"]',
                operating_hours='{"senin": "08:00-17:00", "selasa": "08:00-17:00", "rabu": "08:00-17:00", "kamis": "08:00-17:00", "jumat": "08:00-17:00", "sabtu": "08:00-17:00", "minggu": "Tutup"}',
                rating=4.3,
                total_reviews=31
            ),
            TambalLocation(
                name='Quick Fix Tire',
                address='Jl. Casablanca No. 12, Jakarta Selatan',
                latitude=-6.2244,
                longitude=106.8412,
                phone='021-99887766',
                email='quickfix@tire.com',
                description='Perbaikan ban cepat dan berkualitas dengan harga terjangkau',
                services='["Mobil", "Motor", "Express Service", "Tambal Tubeless"]',
                operating_hours='{"senin": "09:00-18:00", "selasa": "09:00-18:00", "rabu": "09:00-18:00", "kamis": "09:00-18:00", "jumat": "09:00-18:00", "sabtu": "09:00-16:00", "minggu": "Tutup"}',
                rating=4.1,
                total_reviews=15
            )
        ]
        
        for location in sample_locations:
            db.session.add(location)
        
        db.session.commit()
        print("Sample data added to database")

# API health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Tambal.In API is running',
        'version': '1.0.0'
    }), 200

# API info
@app.route('/api/info', methods=['GET'])
def api_info():
    return jsonify({
        'name': 'Tambal.In API',
        'version': '1.0.0',
        'description': 'API untuk platform pencarian bengkel tambal ban',
        'endpoints': {
            'auth': '/api/auth',
            'locations': '/api/locations',
            'bookings': '/api/bookings',
            'support': '/api/support',
            'payment': '/api/payment'
        }
    }), 200

# Serve frontend files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return jsonify({
                'message': 'Tambal.In API Server',
                'status': 'Frontend not deployed yet',
                'api_docs': '/api/info'
            }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint tidak ditemukan'
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'success': False,
        'message': 'Method tidak diizinkan'
    }), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Terjadi kesalahan server'
    }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

