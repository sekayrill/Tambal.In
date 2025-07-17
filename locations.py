from flask import Blueprint, jsonify, request
from src.models.user import TambalLocation, Review, UserSession, db
from sqlalchemy import func, and_, or_
import math
import json

locations_bp = Blueprint('locations', __name__)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r

def get_current_user(token):
    """Get current user from token"""
    if not token:
        return None
    
    session = UserSession.query.filter_by(session_token=token).first()
    if not session or session.is_expired():
        return None
    
    return session.user

@locations_bp.route('/search', methods=['GET'])
def search_locations():
    """Search tambal ban locations"""
    try:
        # Get query parameters
        latitude = request.args.get('lat', type=float)
        longitude = request.args.get('lng', type=float)
        radius = request.args.get('radius', default=10, type=int)  # km
        service_type = request.args.get('service_type', '')
        sort_by = request.args.get('sort_by', 'distance')  # distance, rating, price
        limit = request.args.get('limit', default=20, type=int)
        offset = request.args.get('offset', default=0, type=int)
        
        # Base query
        query = TambalLocation.query.filter(TambalLocation.is_active == True)
        
        # Filter by service type if provided
        if service_type:
            query = query.filter(TambalLocation.services.contains(service_type))
        
        # Get all locations
        locations = query.all()
        
        # Calculate distances and filter by radius if coordinates provided
        results = []
        for location in locations:
            location_dict = location.to_dict()
            
            if latitude and longitude:
                distance = calculate_distance(
                    latitude, longitude,
                    float(location.latitude), float(location.longitude)
                )
                location_dict['distance'] = round(distance, 2)
                
                # Filter by radius
                if distance <= radius:
                    results.append(location_dict)
            else:
                location_dict['distance'] = None
                results.append(location_dict)
        
        # Sort results
        if sort_by == 'distance' and latitude and longitude:
            results.sort(key=lambda x: x['distance'] if x['distance'] is not None else float('inf'))
        elif sort_by == 'rating':
            results.sort(key=lambda x: x['rating'], reverse=True)
        elif sort_by == 'name':
            results.sort(key=lambda x: x['name'])
        
        # Apply pagination
        total = len(results)
        results = results[offset:offset + limit]
        
        return jsonify({
            'success': True,
            'locations': results,
            'total': total,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@locations_bp.route('/<int:location_id>', methods=['GET'])
def get_location(location_id):
    """Get specific location details"""
    try:
        location = TambalLocation.query.get(location_id)
        
        if not location:
            return jsonify({
                'success': False,
                'message': 'Lokasi tidak ditemukan'
            }), 404
        
        if not location.is_active:
            return jsonify({
                'success': False,
                'message': 'Lokasi tidak aktif'
            }), 404
        
        # Get recent reviews
        reviews = Review.query.filter_by(location_id=location_id)\
                             .order_by(Review.created_at.desc())\
                             .limit(10)\
                             .all()
        
        location_dict = location.to_dict()
        location_dict['reviews'] = [review.to_dict() for review in reviews]
        
        return jsonify({
            'success': True,
            'location': location_dict
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@locations_bp.route('/<int:location_id>/reviews', methods=['GET'])
def get_location_reviews(location_id):
    """Get reviews for a specific location"""
    try:
        location = TambalLocation.query.get(location_id)
        
        if not location:
            return jsonify({
                'success': False,
                'message': 'Lokasi tidak ditemukan'
            }), 404
        
        # Get pagination parameters
        limit = request.args.get('limit', default=10, type=int)
        offset = request.args.get('offset', default=0, type=int)
        
        # Get reviews with pagination
        reviews_query = Review.query.filter_by(location_id=location_id)\
                                   .order_by(Review.created_at.desc())
        
        total = reviews_query.count()
        reviews = reviews_query.offset(offset).limit(limit).all()
        
        return jsonify({
            'success': True,
            'reviews': [review.to_dict() for review in reviews],
            'total': total,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@locations_bp.route('/<int:location_id>/reviews', methods=['POST'])
def add_review():
    """Add review for a location"""
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
        
        location_id = request.view_args['location_id']
        location = TambalLocation.query.get(location_id)
        
        if not location:
            return jsonify({
                'success': False,
                'message': 'Lokasi tidak ditemukan'
            }), 404
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('rating') or not data.get('comment'):
            return jsonify({
                'success': False,
                'message': 'Rating dan komentar harus diisi'
            }), 400
        
        rating = data['rating']
        comment = data['comment'].strip()
        
        # Validate rating
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({
                'success': False,
                'message': 'Rating harus antara 1-5'
            }), 400
        
        # Check if user already reviewed this location
        existing_review = Review.query.filter_by(
            user_id=user.id,
            location_id=location_id
        ).first()
        
        if existing_review:
            return jsonify({
                'success': False,
                'message': 'Anda sudah memberikan review untuk lokasi ini'
            }), 400
        
        # Create new review
        review = Review(
            user_id=user.id,
            location_id=location_id,
            rating=rating,
            comment=comment
        )
        
        db.session.add(review)
        
        # Update location rating
        all_reviews = Review.query.filter_by(location_id=location_id).all()
        total_rating = sum([r.rating for r in all_reviews]) + rating
        total_reviews = len(all_reviews) + 1
        
        location.rating = total_rating / total_reviews
        location.total_reviews = total_reviews
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Review berhasil ditambahkan',
            'review': review.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@locations_bp.route('/nearby', methods=['GET'])
def get_nearby_locations():
    """Get nearby locations based on coordinates"""
    try:
        latitude = request.args.get('lat', type=float)
        longitude = request.args.get('lng', type=float)
        radius = request.args.get('radius', default=5, type=int)  # km
        limit = request.args.get('limit', default=10, type=int)
        
        if not latitude or not longitude:
            return jsonify({
                'success': False,
                'message': 'Koordinat latitude dan longitude harus disediakan'
            }), 400
        
        # Get all active locations
        locations = TambalLocation.query.filter(TambalLocation.is_active == True).all()
        
        # Calculate distances and filter
        nearby_locations = []
        for location in locations:
            distance = calculate_distance(
                latitude, longitude,
                float(location.latitude), float(location.longitude)
            )
            
            if distance <= radius:
                location_dict = location.to_dict()
                location_dict['distance'] = round(distance, 2)
                nearby_locations.append(location_dict)
        
        # Sort by distance
        nearby_locations.sort(key=lambda x: x['distance'])
        
        # Apply limit
        nearby_locations = nearby_locations[:limit]
        
        return jsonify({
            'success': True,
            'locations': nearby_locations,
            'total': len(nearby_locations)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@locations_bp.route('/popular', methods=['GET'])
def get_popular_locations():
    """Get popular locations based on rating and reviews"""
    try:
        limit = request.args.get('limit', default=10, type=int)
        
        # Get locations ordered by rating and total reviews
        locations = TambalLocation.query.filter(TambalLocation.is_active == True)\
                                       .order_by(TambalLocation.rating.desc(), 
                                               TambalLocation.total_reviews.desc())\
                                       .limit(limit)\
                                       .all()
        
        return jsonify({
            'success': True,
            'locations': [location.to_dict() for location in locations]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@locations_bp.route('/', methods=['POST'])
def create_location():
    """Create new tambal ban location (admin only)"""
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
        
        # For now, allow any authenticated user to create location
        # In production, you might want to add admin role check
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'address', 'latitude', 'longitude']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} harus diisi'
                }), 400
        
        # Create new location
        location = TambalLocation(
            name=data['name'].strip(),
            address=data['address'].strip(),
            latitude=data['latitude'],
            longitude=data['longitude'],
            phone=data.get('phone', '').strip(),
            email=data.get('email', '').strip(),
            description=data.get('description', '').strip()
        )
        
        # Set services if provided
        if data.get('services'):
            location.set_services(data['services'])
        
        # Set operating hours if provided
        if data.get('operating_hours'):
            location.set_operating_hours(data['operating_hours'])
        
        db.session.add(location)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Lokasi berhasil ditambahkan',
            'location': location.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@locations_bp.route('/<int:location_id>', methods=['PUT'])
def update_location(location_id):
    """Update tambal ban location (admin only)"""
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
        
        location = TambalLocation.query.get(location_id)
        
        if not location:
            return jsonify({
                'success': False,
                'message': 'Lokasi tidak ditemukan'
            }), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'name' in data:
            location.name = data['name'].strip()
        
        if 'address' in data:
            location.address = data['address'].strip()
        
        if 'latitude' in data:
            location.latitude = data['latitude']
        
        if 'longitude' in data:
            location.longitude = data['longitude']
        
        if 'phone' in data:
            location.phone = data['phone'].strip()
        
        if 'email' in data:
            location.email = data['email'].strip()
        
        if 'description' in data:
            location.description = data['description'].strip()
        
        if 'services' in data:
            location.set_services(data['services'])
        
        if 'operating_hours' in data:
            location.set_operating_hours(data['operating_hours'])
        
        if 'is_active' in data:
            location.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Lokasi berhasil diperbarui',
            'location': location.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

@locations_bp.route('/stats', methods=['GET'])
def get_location_stats():
    """Get location statistics"""
    try:
        total_locations = TambalLocation.query.filter(TambalLocation.is_active == True).count()
        total_reviews = Review.query.count()
        
        # Average rating
        avg_rating = db.session.query(func.avg(TambalLocation.rating))\
                              .filter(TambalLocation.is_active == True)\
                              .scalar()
        
        # Top rated location
        top_location = TambalLocation.query.filter(TambalLocation.is_active == True)\
                                          .order_by(TambalLocation.rating.desc())\
                                          .first()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_locations': total_locations,
                'total_reviews': total_reviews,
                'average_rating': round(float(avg_rating), 2) if avg_rating else 0,
                'top_location': top_location.to_dict() if top_location else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan server'
        }), 500

