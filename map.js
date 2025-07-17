// Google Maps integration for Tambal.In
// Handles map initialization, location search, and marker management

let map;
let userLocation = null;
let markers = [];
let infoWindow;
let directionsService;
let directionsRenderer;
let placesService;
let geocoder;

// Sample locations data (in production, this would come from API)
const sampleLocations = [
    {
        id: 1,
        name: 'Tambal Ban Jaya',
        address: 'Jl. Sudirman No. 123, Jakarta Pusat',
        lat: -6.2088,
        lng: 106.8456,
        phone: '021-12345678',
        rating: 4.5,
        reviews: 25,
        services: ['Mobil', 'Motor', 'Ban Tubeless', 'Balancing'],
        hours: 'Senin-Sabtu: 08:00-17:00',
        prices: {
            'tambal_ban_motor': 15000,
            'tambal_ban_mobil': 25000,
            'ganti_ban_motor': 50000,
            'ganti_ban_mobil': 100000,
            'balancing': 35000
        }
    },
    {
        id: 2,
        name: 'Bengkel Ban Merdeka',
        address: 'Jl. Merdeka Raya No. 45, Jakarta Selatan',
        lat: -6.2615,
        lng: 106.8106,
        phone: '021-87654321',
        rating: 4.2,
        reviews: 18,
        services: ['Mobil', 'Motor', 'Balancing', 'Spooring'],
        hours: 'Senin-Minggu: 07:00-18:00',
        prices: {
            'tambal_ban_motor': 12000,
            'tambal_ban_mobil': 22000,
            'ganti_ban_motor': 45000,
            'ganti_ban_mobil': 95000,
            'balancing': 30000,
            'spooring': 75000
        }
    },
    {
        id: 3,
        name: 'Tambal Ban 24 Jam',
        address: 'Jl. Gatot Subroto No. 67, Jakarta Selatan',
        lat: -6.2297,
        lng: 106.8253,
        phone: '021-11223344',
        rating: 4.8,
        reviews: 42,
        services: ['Mobil', 'Motor', '24 Jam', 'Panggilan', 'Emergency'],
        hours: '24 Jam',
        prices: {
            'tambal_ban_motor': 20000,
            'tambal_ban_mobil': 30000,
            'ganti_ban_motor': 60000,
            'ganti_ban_mobil': 120000,
            'emergency': 50000
        }
    },
    {
        id: 4,
        name: 'Ban Center Kemang',
        address: 'Jl. Kemang Raya No. 89, Jakarta Selatan',
        lat: -6.2633,
        lng: 106.8167,
        phone: '021-55667788',
        rating: 4.3,
        reviews: 31,
        services: ['Mobil', 'Motor', 'Ganti Ban', 'Balancing', 'Nitrogen'],
        hours: 'Senin-Sabtu: 08:00-17:00',
        prices: {
            'tambal_ban_motor': 15000,
            'tambal_ban_mobil': 25000,
            'ganti_ban_motor': 55000,
            'ganti_ban_mobil': 110000,
            'balancing': 40000,
            'nitrogen': 10000
        }
    },
    {
        id: 5,
        name: 'Quick Fix Tire',
        address: 'Jl. Casablanca No. 12, Jakarta Selatan',
        lat: -6.2244,
        lng: 106.8412,
        phone: '021-99887766',
        rating: 4.1,
        reviews: 15,
        services: ['Mobil', 'Motor', 'Express Service', 'Tambal Tubeless'],
        hours: 'Senin-Sabtu: 09:00-18:00',
        prices: {
            'tambal_ban_motor': 18000,
            'tambal_ban_mobil': 28000,
            'ganti_ban_motor': 52000,
            'ganti_ban_mobil': 105000,
            'express': 35000
        }
    }
];

// Initialize Google Maps
function initMap() {
    // Default location (Jakarta)
    const defaultLocation = { lat: -6.2088, lng: 106.8456 };
    
    // Initialize map
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: defaultLocation,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });
    
    // Initialize services
    infoWindow = new google.maps.InfoWindow();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#2563eb',
            strokeWeight: 4
        }
    });
    directionsRenderer.setMap(map);
    placesService = new google.maps.places.PlacesService(map);
    geocoder = new google.maps.Geocoder();
    
    // Get user location
    getUserLocation();
    
    // Load sample locations
    loadLocations(sampleLocations);
    
    // Initialize search functionality
    initializeSearch();
}

// Get user's current location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Center map on user location
                map.setCenter(userLocation);
                
                // Add user location marker
                addUserLocationMarker();
                
                // Update location input
                updateLocationInput(userLocation);
                
                // Search nearby locations
                searchNearbyLocations();
                
            },
            (error) => {
                console.warn('Geolocation error:', error);
                showToast('Tidak dapat mengakses lokasi. Menggunakan lokasi default.', 'warning');
                
                // Use default location
                userLocation = { lat: -6.2088, lng: 106.8456 };
                addUserLocationMarker();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    } else {
        showToast('Browser tidak mendukung geolocation', 'error');
        userLocation = { lat: -6.2088, lng: 106.8456 };
        addUserLocationMarker();
    }
}

// Add user location marker
function addUserLocationMarker() {
    if (!userLocation) return;
    
    const userMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Lokasi Anda',
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="#ffffff"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
        },
        zIndex: 1000
    });
    
    userMarker.addListener('click', () => {
        infoWindow.setContent(`
            <div class="info-window">
                <h4>Lokasi Anda</h4>
                <p>Koordinat: ${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}</p>
            </div>
        `);
        infoWindow.open(map, userMarker);
    });
}

// Load locations and add markers
function loadLocations(locations) {
    clearMarkers();
    
    locations.forEach(location => {
        addLocationMarker(location);
    });
    
    // Update results list
    updateResultsList(locations);
}

// Add location marker
function addLocationMarker(location) {
    const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2C10.48 2 6 6.48 6 12C6 20 16 30 16 30C16 30 26 20 26 12C26 6.48 21.52 2 16 2Z" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="16" cy="12" r="4" fill="#ffffff"/>
                    <path d="M14 10L18 14L14 18" stroke="#dc2626" stroke-width="2" fill="none"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 30)
        }
    });
    
    // Add click listener
    marker.addListener('click', () => {
        showLocationInfo(location, marker);
    });
    
    // Store marker reference
    marker.locationData = location;
    markers.push(marker);
}

// Show location info window
function showLocationInfo(location, marker) {
    const distance = userLocation ? 
        calculateDistance(userLocation.lat, userLocation.lng, location.lat, location.lng) : 
        null;
    
    const distanceText = distance ? `<p><i class="fas fa-route"></i> ${distance.toFixed(1)} km dari Anda</p>` : '';
    
    const servicesHtml = location.services.map(service => 
        `<span class="service-tag">${service}</span>`
    ).join('');
    
    const content = `
        <div class="info-window">
            <h4>${location.name}</h4>
            <div class="rating">
                ${generateStars(location.rating)}
                <span>${location.rating} (${location.reviews} ulasan)</span>
            </div>
            <p><i class="fas fa-map-marker-alt"></i> ${location.address}</p>
            <p><i class="fas fa-phone"></i> ${location.phone}</p>
            <p><i class="fas fa-clock"></i> ${location.hours}</p>
            ${distanceText}
            <div class="services">
                <strong>Layanan:</strong><br>
                ${servicesHtml}
            </div>
            <div class="info-actions">
                <button onclick="showDirections(${location.lat}, ${location.lng})" class="btn-sm btn-secondary">
                    <i class="fas fa-directions"></i> Rute
                </button>
                <button onclick="openLocationModal(${location.id})" class="btn-sm btn-primary">
                    <i class="fas fa-info-circle"></i> Detail
                </button>
            </div>
        </div>
    `;
    
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}

// Calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHtml = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
}

// Show directions to location
function showDirections(lat, lng) {
    if (!userLocation) {
        showToast('Lokasi Anda tidak diketahui', 'error');
        return;
    }
    
    const request = {
        origin: userLocation,
        destination: { lat: lat, lng: lng },
        travelMode: google.maps.TravelMode.DRIVING
    };
    
    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // Show route info
            const route = result.routes[0];
            const leg = route.legs[0];
            
            showToast(`Jarak: ${leg.distance.text}, Waktu: ${leg.duration.text}`, 'info');
        } else {
            showToast('Tidak dapat menampilkan rute', 'error');
        }
    });
}

// Initialize search functionality
function initializeSearch() {
    const locationInput = document.getElementById('locationInput');
    const searchBtn = document.getElementById('searchBtn');
    const currentLocationBtn = document.getElementById('currentLocationBtn');
    
    if (locationInput) {
        // Initialize autocomplete
        const autocomplete = new google.maps.places.Autocomplete(locationInput, {
            types: ['geocode'],
            componentRestrictions: { country: 'ID' }
        });
        
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                searchLocation(place.geometry.location);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    if (currentLocationBtn) {
        currentLocationBtn.addEventListener('click', () => {
            if (userLocation) {
                map.setCenter(userLocation);
                map.setZoom(15);
                searchNearbyLocations();
            } else {
                getUserLocation();
            }
        });
    }
}

// Perform search
function performSearch() {
    const locationInput = document.getElementById('locationInput');
    const serviceFilter = document.getElementById('serviceFilter');
    const radiusFilter = document.getElementById('radiusFilter');
    
    const query = locationInput?.value.trim();
    const service = serviceFilter?.value;
    const radius = parseInt(radiusFilter?.value) || 10;
    
    if (query) {
        // Geocode the address
        geocoder.geocode({ address: query }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                searchLocation(location, service, radius);
            } else {
                showToast('Lokasi tidak ditemukan', 'error');
            }
        });
    } else {
        // Search from current location
        if (userLocation) {
            searchLocation(new google.maps.LatLng(userLocation.lat, userLocation.lng), service, radius);
        } else {
            showToast('Masukkan lokasi atau aktifkan GPS', 'error');
        }
    }
}

// Search location
function searchLocation(location, service = '', radius = 10) {
    map.setCenter(location);
    map.setZoom(14);
    
    // Filter locations based on criteria
    let filteredLocations = sampleLocations.filter(loc => {
        const distance = calculateDistance(
            location.lat(), location.lng(),
            loc.lat, loc.lng
        );
        
        const withinRadius = distance <= radius;
        const hasService = !service || loc.services.some(s => 
            s.toLowerCase().includes(service.toLowerCase())
        );
        
        return withinRadius && hasService;
    });
    
    // Sort by distance
    filteredLocations = filteredLocations.map(loc => ({
        ...loc,
        distance: calculateDistance(location.lat(), location.lng(), loc.lat, loc.lng)
    })).sort((a, b) => a.distance - b.distance);
    
    // Load filtered locations
    loadLocations(filteredLocations);
    
    if (filteredLocations.length === 0) {
        showToast('Tidak ada bengkel ditemukan dengan kriteria tersebut', 'info');
    }
}

// Search nearby locations
function searchNearbyLocations() {
    if (!userLocation) return;
    
    searchLocation(new google.maps.LatLng(userLocation.lat, userLocation.lng));
}

// Update location input with coordinates
function updateLocationInput(location) {
    geocoder.geocode({ location: location }, (results, status) => {
        if (status === 'OK' && results[0]) {
            const locationInput = document.getElementById('locationInput');
            if (locationInput) {
                locationInput.value = results[0].formatted_address;
            }
        }
    });
}

// Update results list
function updateResultsList(locations) {
    const resultsList = document.getElementById('resultsList');
    if (!resultsList) return;
    
    if (locations.length === 0) {
        resultsList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Tidak ada hasil ditemukan</h3>
                <p>Coba ubah kriteria pencarian atau perluas radius pencarian</p>
            </div>
        `;
        return;
    }
    
    resultsList.innerHTML = locations.map(location => {
        const distance = location.distance ? 
            `<span class="distance">${location.distance.toFixed(1)} km</span>` : '';
        
        const servicesHtml = location.services.slice(0, 3).map(service => 
            `<span class="service-tag">${service}</span>`
        ).join('');
        
        return `
            <div class="result-item" onclick="focusLocation(${location.id})">
                <div class="result-header">
                    <h3>${location.name}</h3>
                    ${distance}
                </div>
                
                <div class="result-rating">
                    <div class="stars">${generateStars(location.rating)}</div>
                    <span class="rating-text">${location.rating}</span>
                    <span class="review-count">(${location.reviews} ulasan)</span>
                </div>
                
                <div class="result-info">
                    <p><i class="fas fa-map-marker-alt"></i> ${location.address}</p>
                    <p><i class="fas fa-clock"></i> ${location.hours}</p>
                </div>
                
                <div class="result-services">
                    ${servicesHtml}
                    ${location.services.length > 3 ? `<span class="more-services">+${location.services.length - 3} lainnya</span>` : ''}
                </div>
                
                <div class="result-actions">
                    <button onclick="event.stopPropagation(); showDirections(${location.lat}, ${location.lng})" class="btn-sm btn-secondary">
                        <i class="fas fa-directions"></i> Rute
                    </button>
                    <button onclick="event.stopPropagation(); openLocationModal(${location.id})" class="btn-sm btn-primary">
                        <i class="fas fa-info-circle"></i> Detail
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Focus on location marker
function focusLocation(locationId) {
    const marker = markers.find(m => m.locationData.id === locationId);
    if (marker) {
        map.setCenter(marker.getPosition());
        map.setZoom(16);
        
        // Trigger marker click
        google.maps.event.trigger(marker, 'click');
    }
}

// Open location modal (this function should be defined in search.js)
function openLocationModal(locationId) {
    if (typeof window.openLocationModal === 'function') {
        window.openLocationModal(locationId);
    } else {
        console.warn('openLocationModal function not found in search.js');
    }
}

// Handle map errors
window.gm_authFailure = function() {
    showToast('Google Maps API key tidak valid', 'error');
    console.error('Google Maps authentication failed');
};

// Export functions for use in other scripts
window.mapFunctions = {
    initMap,
    showDirections,
    focusLocation,
    searchLocation,
    getUserLocation
};

