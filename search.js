// Search page JavaScript for location search and filtering
// Handles search functionality, filters, and result display

let currentLocation = null;
let searchResults = [];
let selectedLocation = null;

document.addEventListener('DOMContentLoaded', function() {
    initSearchPage();
    initSearchForm();
    initFilters();
    initLocationModal();
    initBookingModal();
    loadInitialResults();
});

// Initialize search page
function initSearchPage() {
    // Get user's current location
    getCurrentLocation();
    
    // Initialize search input autocomplete
    initSearchAutocomplete();
    
    // Initialize result list interactions
    initResultInteractions();
}

// Get user's current location
function getCurrentLocation() {
    const currentLocationBtn = document.getElementById('currentLocationBtn');
    
    if (currentLocationBtn) {
        currentLocationBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        currentLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        
                        // Update search input with current location
                        updateLocationInput('Lokasi saat ini');
                        
                        // Perform search
                        performSearch();
                        
                        currentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                    },
                    function(error) {
                        console.error('Geolocation error:', error);
                        showToast('Tidak dapat mengakses lokasi Anda', 'error');
                        currentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                    }
                );
            } else {
                showToast('Geolocation tidak didukung browser Anda', 'error');
            }
        });
    }
}

// Initialize search form
function initSearchForm() {
    const searchBtn = document.getElementById('searchBtn');
    const locationInput = document.getElementById('locationInput');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    if (locationInput) {
        locationInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// Initialize search autocomplete
function initSearchAutocomplete() {
    const locationInput = document.getElementById('locationInput');
    
    if (locationInput) {
        // Debounced search suggestions
        const debouncedSearch = debounce(function(query) {
            if (query.length > 2) {
                searchLocationSuggestions(query);
            }
        }, 300);
        
        locationInput.addEventListener('input', function() {
            debouncedSearch(this.value);
        });
    }
}

// Search location suggestions
async function searchLocationSuggestions(query) {
    try {
        // Simulate API call for location suggestions
        const suggestions = await getLocationSuggestions(query);
        showLocationSuggestions(suggestions);
    } catch (error) {
        console.error('Error getting location suggestions:', error);
    }
}

// Show location suggestions
function showLocationSuggestions(suggestions) {
    // Remove existing suggestions
    const existingSuggestions = document.querySelector('.location-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    if (suggestions.length === 0) return;
    
    const locationInput = document.getElementById('locationInput');
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'location-suggestions';
    suggestionsContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        max-height: 200px;
        overflow-y: auto;
    `;
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.style.cssText = `
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid var(--gray-100);
            transition: background-color 0.2s;
        `;
        item.innerHTML = `
            <div style="font-weight: 500; color: var(--gray-900);">${suggestion.name}</div>
            <div style="font-size: 0.875rem; color: var(--gray-500);">${suggestion.address}</div>
        `;
        
        item.addEventListener('click', function() {
            locationInput.value = suggestion.name;
            currentLocation = suggestion.coordinates;
            suggestionsContainer.remove();
            performSearch();
        });
        
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--gray-100)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'white';
        });
        
        suggestionsContainer.appendChild(item);
    });
    
    locationInput.parentElement.style.position = 'relative';
    locationInput.parentElement.appendChild(suggestionsContainer);
    
    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!locationInput.parentElement.contains(e.target)) {
            suggestionsContainer.remove();
        }
    });
}

// Initialize filters
function initFilters() {
    const serviceType = document.getElementById('serviceType');
    const radius = document.getElementById('radius');
    const sortBy = document.getElementById('sortBy');
    
    [serviceType, radius, sortBy].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', performSearch);
        }
    });
}

// Perform search
async function performSearch() {
    const locationInput = document.getElementById('locationInput');
    const serviceType = document.getElementById('serviceType');
    const radius = document.getElementById('radius');
    const sortBy = document.getElementById('sortBy');
    const loadingState = document.getElementById('loadingState');
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');
    
    // Show loading state
    if (loadingState) loadingState.style.display = 'flex';
    if (resultsList) {
        Array.from(resultsList.children).forEach(child => {
            if (!child.classList.contains('loading-state')) {
                child.style.display = 'none';
            }
        });
    }
    
    try {
        const searchParams = {
            location: locationInput ? locationInput.value : '',
            coordinates: currentLocation,
            serviceType: serviceType ? serviceType.value : '',
            radius: radius ? parseInt(radius.value) : 10,
            sortBy: sortBy ? sortBy.value : 'distance'
        };
        
        // Simulate API call
        const results = await searchTambalBanLocations(searchParams);
        searchResults = results;
        
        // Update results count
        if (resultsCount) {
            resultsCount.textContent = `${results.length} bengkel ditemukan`;
        }
        
        // Display results
        displaySearchResults(results);
        
        // Update map markers (if map is initialized)
        if (window.updateMapMarkers) {
            window.updateMapMarkers(results);
        }
        
    } catch (error) {
        console.error('Search error:', error);
        showToast('Terjadi kesalahan saat mencari lokasi', 'error');
        
        if (resultsCount) {
            resultsCount.textContent = 'Pencarian gagal';
        }
        
        displayEmptyState();
    } finally {
        // Hide loading state
        if (loadingState) loadingState.style.display = 'none';
    }
}

// Display search results
function displaySearchResults(results) {
    const resultsList = document.getElementById('resultsList');
    
    if (!resultsList) return;
    
    // Clear existing results
    resultsList.innerHTML = '';
    
    if (results.length === 0) {
        displayEmptyState();
        return;
    }
    
    results.forEach((location, index) => {
        const resultItem = createResultItem(location, index);
        resultsList.appendChild(resultItem);
    });
}

// Create result item element
function createResultItem(location, index) {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.dataset.locationId = location.id;
    
    // Generate stars
    const starsHtml = generateStarsHtml(location.rating);
    
    // Generate service tags
    const servicesHtml = location.services.map(service => 
        `<span class="service-tag">${service}</span>`
    ).join('');
    
    item.innerHTML = `
        <div class="result-header">
            <div>
                <div class="result-title">${location.name}</div>
                <div class="result-distance">${location.distance} km</div>
            </div>
        </div>
        
        <div class="result-rating">
            <div class="stars">${starsHtml}</div>
            <span class="rating-text">${location.rating}</span>
            <span class="review-count">(${location.totalReviews} ulasan)</span>
        </div>
        
        <div class="result-address">
            <i class="fas fa-map-marker-alt"></i>
            ${location.address}
        </div>
        
        <div class="result-services">
            ${servicesHtml}
        </div>
        
        <div class="result-price">
            Mulai dari ${formatCurrency(location.startingPrice)}
        </div>
        
        <div class="result-status ${location.isOpen ? '' : 'closed'}"></div>
    `;
    
    // Add click event
    item.addEventListener('click', function() {
        selectLocation(location);
        showLocationModal(location);
    });
    
    return item;
}

// Generate stars HTML
function generateStarsHtml(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt star"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star star empty"></i>';
    }
    
    return starsHtml;
}

// Select location
function selectLocation(location) {
    selectedLocation = location;
    
    // Update active state
    document.querySelectorAll('.result-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const selectedItem = document.querySelector(`[data-location-id="${location.id}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    // Update map center (if map is initialized)
    if (window.centerMapOnLocation) {
        window.centerMapOnLocation(location);
    }
}

// Display empty state
function displayEmptyState() {
    const resultsList = document.getElementById('resultsList');
    
    if (!resultsList) return;
    
    resultsList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>Tidak ada hasil ditemukan</h3>
            <p>Coba ubah kata kunci pencarian atau perluas radius pencarian Anda.</p>
        </div>
    `;
}

// Initialize result interactions
function initResultInteractions() {
    // This will be handled by individual result items
}

// Initialize location modal
function initLocationModal() {
    const modal = document.getElementById('locationModal');
    const closeBtn = document.getElementById('modalClose');
    const directionsBtn = document.getElementById('directionsBtn');
    const bookNowBtn = document.getElementById('bookNowBtn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal('locationModal');
        });
    }
    
    if (directionsBtn) {
        directionsBtn.addEventListener('click', function() {
            if (selectedLocation) {
                openDirections(selectedLocation);
            }
        });
    }
    
    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', function() {
            if (selectedLocation) {
                closeModal('locationModal');
                showBookingModal(selectedLocation);
            }
        });
    }
}

// Show location modal
function showLocationModal(location) {
    const modal = document.getElementById('locationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMainImage = document.getElementById('modalMainImage');
    const modalStars = document.getElementById('modalStars');
    const modalRating = document.getElementById('modalRating');
    const modalReviews = document.getElementById('modalReviews');
    const modalAddress = document.getElementById('modalAddress');
    const modalPhone = document.getElementById('modalPhone');
    const modalHours = document.getElementById('modalHours');
    const modalDistance = document.getElementById('modalDistance');
    const modalServices = document.getElementById('modalServices');
    const modalPrices = document.getElementById('modalPrices');
    
    // Populate modal content
    if (modalTitle) modalTitle.textContent = location.name;
    if (modalMainImage) {
        modalMainImage.src = location.image || 'https://via.placeholder.com/600x200?text=Bengkel+Tambal+Ban';
        modalMainImage.alt = location.name;
    }
    if (modalStars) modalStars.innerHTML = generateStarsHtml(location.rating);
    if (modalRating) modalRating.textContent = location.rating;
    if (modalReviews) modalReviews.textContent = `(${location.totalReviews} ulasan)`;
    if (modalAddress) modalAddress.textContent = location.address;
    if (modalPhone) modalPhone.textContent = location.phone || 'Tidak tersedia';
    if (modalHours) modalHours.textContent = location.operatingHours || 'Senin - Minggu: 08:00 - 17:00';
    if (modalDistance) modalDistance.textContent = `${location.distance} km dari lokasi Anda`;
    
    // Services
    if (modalServices) {
        modalServices.innerHTML = location.services.map(service => 
            `<span class="service-tag">${service}</span>`
        ).join('');
    }
    
    // Prices
    if (modalPrices) {
        const prices = location.prices || [
            { service: 'Tambal Ban Motor', price: 15000 },
            { service: 'Tambal Ban Mobil', price: 25000 },
            { service: 'Ganti Ban Baru', price: 'Sesuai harga ban' }
        ];
        
        modalPrices.innerHTML = prices.map(price => `
            <div class="price-item">
                <span>${price.service}</span>
                <span>${typeof price.price === 'number' ? formatCurrency(price.price) : price.price}</span>
            </div>
        `).join('');
    }
    
    showModal('locationModal');
}

// Open directions
function openDirections(location) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
}

// Initialize booking modal
function initBookingModal() {
    const modal = document.getElementById('bookingModal');
    const closeBtn = document.getElementById('bookingModalClose');
    const cancelBtn = document.getElementById('cancelBookingBtn');
    const bookingForm = document.getElementById('bookingForm');
    const vehicleType = document.getElementById('vehicleType');
    const serviceNeeded = document.getElementById('serviceNeeded');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal('bookingModal');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeModal('bookingModal');
        });
    }
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }
    
    // Update price when service changes
    if (vehicleType && serviceNeeded) {
        [vehicleType, serviceNeeded].forEach(select => {
            select.addEventListener('change', updateBookingPrice);
        });
    }
}

// Show booking modal
function showBookingModal(location) {
    const modal = document.getElementById('bookingModal');
    
    // Set minimum date to today
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) {
        const now = new Date();
        const minDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        bookingDate.min = minDate;
    }
    
    // Reset form
    const form = document.getElementById('bookingForm');
    if (form) form.reset();
    
    updateBookingPrice();
    showModal('bookingModal');
}

// Update booking price
function updateBookingPrice() {
    const vehicleType = document.getElementById('vehicleType');
    const serviceNeeded = document.getElementById('serviceNeeded');
    const servicePrice = document.getElementById('servicePrice');
    const totalPrice = document.getElementById('totalPrice');
    
    if (!vehicleType || !serviceNeeded || !servicePrice || !totalPrice) return;
    
    const prices = {
        'mobil': {
            'tambal_ban': 25000,
            'ganti_ban': 100000,
            'balancing': 50000,
            'spooring': 75000
        },
        'motor': {
            'tambal_ban': 15000,
            'ganti_ban': 50000,
            'balancing': 25000,
            'spooring': 35000
        }
    };
    
    const vehicle = vehicleType.value;
    const service = serviceNeeded.value;
    const adminFee = 2500;
    
    if (vehicle && service && prices[vehicle] && prices[vehicle][service]) {
        const price = prices[vehicle][service];
        servicePrice.textContent = formatCurrency(price);
        totalPrice.textContent = formatCurrency(price + adminFee);
    } else {
        servicePrice.textContent = 'Rp 0';
        totalPrice.textContent = formatCurrency(adminFee);
    }
}

// Handle booking submit
async function handleBookingSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const bookingData = {
        locationId: selectedLocation.id,
        vehicleType: formData.get('vehicleType'),
        serviceNeeded: formData.get('serviceNeeded'),
        bookingDate: formData.get('bookingDate'),
        notes: formData.get('notes')
    };
    
    // Validate booking data
    if (!validateBookingData(bookingData)) {
        return;
    }
    
    const submitBtn = document.getElementById('confirmBookingBtn');
    showLoading(submitBtn);
    
    try {
        // Simulate API call
        const response = await submitBooking(bookingData);
        
        if (response.success) {
            closeModal('bookingModal');
            showToast('Pesanan berhasil dibuat! Anda akan diarahkan ke halaman pembayaran.', 'success');
            
            // Redirect to payment page after delay
            setTimeout(() => {
                window.location.href = 'payment.html?booking=' + response.bookingId;
            }, 2000);
        } else {
            throw new Error(response.message || 'Gagal membuat pesanan');
        }
        
    } catch (error) {
        console.error('Booking error:', error);
        showToast('Terjadi kesalahan saat membuat pesanan', 'error');
    } finally {
        hideLoading(submitBtn);
    }
}

// Validate booking data
function validateBookingData(data) {
    if (!data.vehicleType) {
        showToast('Pilih jenis kendaraan', 'error');
        return false;
    }
    
    if (!data.serviceNeeded) {
        showToast('Pilih layanan yang dibutuhkan', 'error');
        return false;
    }
    
    if (!data.bookingDate) {
        showToast('Pilih tanggal dan waktu', 'error');
        return false;
    }
    
    // Check if booking date is in the future
    const bookingDateTime = new Date(data.bookingDate);
    const now = new Date();
    
    if (bookingDateTime <= now) {
        showToast('Pilih tanggal dan waktu di masa depan', 'error');
        return false;
    }
    
    return true;
}

// Load initial results
function loadInitialResults() {
    // Load popular locations or nearby locations
    performSearch();
}

// Update location input
function updateLocationInput(text) {
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.value = text;
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// API simulation functions (replace with actual API calls)

async function getLocationSuggestions(query) {
    return new Promise(resolve => {
        setTimeout(() => {
            const suggestions = [
                {
                    name: 'Jakarta Pusat',
                    address: 'DKI Jakarta, Indonesia',
                    coordinates: { lat: -6.2088, lng: 106.8456 }
                },
                {
                    name: 'Bandung',
                    address: 'Jawa Barat, Indonesia',
                    coordinates: { lat: -6.9175, lng: 107.6191 }
                },
                {
                    name: 'Surabaya',
                    address: 'Jawa Timur, Indonesia',
                    coordinates: { lat: -7.2575, lng: 112.7521 }
                }
            ].filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
            
            resolve(suggestions);
        }, 300);
    });
}

async function searchTambalBanLocations(params) {
    return new Promise(resolve => {
        setTimeout(() => {
            const mockResults = [
                {
                    id: 1,
                    name: 'Tambal Ban Jaya',
                    address: 'Jl. Sudirman No. 123, Jakarta Pusat',
                    latitude: -6.2088,
                    longitude: 106.8456,
                    phone: '021-12345678',
                    rating: 4.5,
                    totalReviews: 25,
                    distance: 1.2,
                    services: ['Mobil', 'Motor', 'Ban Tubeless'],
                    startingPrice: 15000,
                    isOpen: true,
                    operatingHours: 'Senin - Sabtu: 08:00 - 17:00',
                    image: 'https://via.placeholder.com/600x200?text=Tambal+Ban+Jaya'
                },
                {
                    id: 2,
                    name: 'Bengkel Ban Merdeka',
                    address: 'Jl. Merdeka Raya No. 45, Jakarta Selatan',
                    latitude: -6.2615,
                    longitude: 106.8106,
                    phone: '021-87654321',
                    rating: 4.2,
                    totalReviews: 18,
                    distance: 2.5,
                    services: ['Mobil', 'Motor', 'Balancing'],
                    startingPrice: 20000,
                    isOpen: true,
                    operatingHours: 'Senin - Minggu: 07:00 - 18:00',
                    image: 'https://via.placeholder.com/600x200?text=Bengkel+Ban+Merdeka'
                },
                {
                    id: 3,
                    name: 'Tambal Ban 24 Jam',
                    address: 'Jl. Gatot Subroto No. 67, Jakarta Selatan',
                    latitude: -6.2297,
                    longitude: 106.8253,
                    phone: '021-11223344',
                    rating: 4.8,
                    totalReviews: 42,
                    distance: 3.1,
                    services: ['Mobil', 'Motor', '24 Jam', 'Panggilan'],
                    startingPrice: 25000,
                    isOpen: true,
                    operatingHours: '24 Jam',
                    image: 'https://via.placeholder.com/600x200?text=Tambal+Ban+24+Jam'
                }
            ];
            
            // Apply filters
            let filteredResults = mockResults;
            
            if (params.serviceType) {
                filteredResults = filteredResults.filter(location => 
                    location.services.some(service => 
                        service.toLowerCase().includes(params.serviceType.toLowerCase())
                    )
                );
            }
            
            // Sort results
            if (params.sortBy === 'rating') {
                filteredResults.sort((a, b) => b.rating - a.rating);
            } else if (params.sortBy === 'price') {
                filteredResults.sort((a, b) => a.startingPrice - b.startingPrice);
            } else {
                filteredResults.sort((a, b) => a.distance - b.distance);
            }
            
            resolve(filteredResults);
        }, 1000);
    });
}

async function submitBooking(bookingData) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                success: true,
                bookingId: 'BK' + Date.now(),
                message: 'Booking berhasil dibuat'
            });
        }, 1500);
    });
}

