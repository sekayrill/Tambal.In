// Payment page JavaScript
// Handles payment processing, form validation, and payment gateway integration

let bookingData = null;
let selectedPaymentMethod = null;

document.addEventListener('DOMContentLoaded', function() {
    initPaymentPage();
    initPaymentMethods();
    initCreditCardForm();
    initPaymentButton();
    initModals();
    loadBookingData();
});

// Initialize payment page
function initPaymentPage() {
    // Check if user is logged in
    const user = storage.get('user');
    if (!user) {
        showToast('Anda harus login terlebih dahulu', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // Update auth link
    const authLink = document.getElementById('authLink');
    if (authLink && user) {
        authLink.textContent = user.full_name || user.username;
        authLink.href = '#';
        authLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Load booking data from URL parameters or localStorage
function loadBookingData() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('booking');
    
    if (bookingId) {
        // Load from API (simulate for now)
        loadBookingFromAPI(bookingId);
    } else {
        // Load from localStorage (for direct booking flow)
        const storedBooking = storage.get('pendingBooking');
        if (storedBooking) {
            bookingData = storedBooking;
            displayBookingDetails();
        } else {
            showToast('Data booking tidak ditemukan', 'error');
            setTimeout(() => {
                window.location.href = 'search.html';
            }, 2000);
        }
    }
}

// Load booking data from API
async function loadBookingFromAPI(bookingId) {
    try {
        const user = storage.get('user');
        const response = await apiCall(`/api/bookings/${bookingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        
        if (response.success) {
            bookingData = response.booking;
            displayBookingDetails();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error loading booking:', error);
        showToast('Gagal memuat data booking', 'error');
        setTimeout(() => {
            window.location.href = 'search.html';
        }, 2000);
    }
}

// Display booking details
function displayBookingDetails() {
    if (!bookingData) return;
    
    // Update booking details
    document.getElementById('workshopName').textContent = bookingData.location?.name || 'Loading...';
    document.getElementById('workshopAddress').textContent = bookingData.location?.address || 'Loading...';
    document.getElementById('serviceType').textContent = formatServiceType(bookingData.service_type, bookingData.service_description);
    document.getElementById('bookingDateTime').textContent = formatDateTime(bookingData.booking_date);
    document.getElementById('bookingNotes').textContent = bookingData.notes || '-';
    
    // Update price breakdown
    const servicePrice = bookingData.total_price - 2500; // Subtract admin fee
    document.getElementById('servicePrice').textContent = formatCurrency(servicePrice);
    document.getElementById('totalPrice').textContent = formatCurrency(bookingData.total_price);
}

// Format service type
function formatServiceType(type, description) {
    const typeMap = {
        'mobil': 'Mobil',
        'motor': 'Motor'
    };
    
    const baseType = typeMap[type] || type;
    return description ? `${baseType} - ${description}` : baseType;
}

// Format date time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
}

// Initialize payment methods
function initPaymentMethods() {
    const paymentOptions = document.querySelectorAll('input[name="payment_method"]');
    const creditCardForm = document.getElementById('creditCardForm');
    const payButton = document.getElementById('payButton');
    
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            selectedPaymentMethod = this.value;
            
            // Show/hide credit card form
            if (this.value === 'credit_card') {
                creditCardForm.style.display = 'block';
                validateCreditCardForm(); // Check if form is valid
            } else {
                creditCardForm.style.display = 'none';
                payButton.disabled = false;
            }
            
            // Update pay button text
            updatePayButtonText(this.value);
        });
    });
}

// Update pay button text based on payment method
function updatePayButtonText(method) {
    const payButton = document.getElementById('payButton');
    const btnText = payButton.querySelector('.btn-text');
    
    const buttonTexts = {
        'gopay': 'Bayar dengan GoPay',
        'ovo': 'Bayar dengan OVO',
        'dana': 'Bayar dengan DANA',
        'bca': 'Transfer ke BCA',
        'mandiri': 'Transfer ke Mandiri',
        'bni': 'Transfer ke BNI',
        'credit_card': 'Bayar dengan Kartu',
        'cash': 'Konfirmasi Pesanan'
    };
    
    btnText.textContent = buttonTexts[method] || 'Bayar Sekarang';
}

// Initialize credit card form
function initCreditCardForm() {
    const cardNumber = document.getElementById('cardNumber');
    const expiryDate = document.getElementById('expiryDate');
    const cvv = document.getElementById('cvv');
    const cardName = document.getElementById('cardName');
    
    // Card number formatting
    if (cardNumber) {
        cardNumber.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            this.value = value;
            validateCardNumber();
        });
    }
    
    // Expiry date formatting
    if (expiryDate) {
        expiryDate.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            this.value = value;
            validateExpiryDate();
        });
    }
    
    // CVV validation
    if (cvv) {
        cvv.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
            validateCVV();
        });
    }
    
    // Card name validation
    if (cardName) {
        cardName.addEventListener('input', validateCardName);
    }
    
    // Real-time validation
    [cardNumber, expiryDate, cvv, cardName].forEach(field => {
        if (field) {
            field.addEventListener('blur', validateCreditCardForm);
            field.addEventListener('input', debounce(validateCreditCardForm, 300));
        }
    });
}

// Validate card number
function validateCardNumber() {
    const cardNumber = document.getElementById('cardNumber');
    const errorElement = document.getElementById('cardNumberError');
    const value = cardNumber.value.replace(/\s/g, '');
    
    if (value.length === 0) {
        showFieldError(cardNumber, errorElement, 'Nomor kartu harus diisi');
        return false;
    }
    
    if (value.length < 13 || value.length > 19) {
        showFieldError(cardNumber, errorElement, 'Nomor kartu tidak valid');
        return false;
    }
    
    // Luhn algorithm validation
    if (!isValidCardNumber(value)) {
        showFieldError(cardNumber, errorElement, 'Nomor kartu tidak valid');
        return false;
    }
    
    hideFieldError(cardNumber, errorElement);
    return true;
}

// Validate expiry date
function validateExpiryDate() {
    const expiryDate = document.getElementById('expiryDate');
    const errorElement = document.getElementById('expiryDateError');
    const value = expiryDate.value;
    
    if (value.length === 0) {
        showFieldError(expiryDate, errorElement, 'Tanggal kadaluarsa harus diisi');
        return false;
    }
    
    if (!/^\d{2}\/\d{2}$/.test(value)) {
        showFieldError(expiryDate, errorElement, 'Format tanggal tidak valid (MM/YY)');
        return false;
    }
    
    const [month, year] = value.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (parseInt(month) < 1 || parseInt(month) > 12) {
        showFieldError(expiryDate, errorElement, 'Bulan tidak valid');
        return false;
    }
    
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        showFieldError(expiryDate, errorElement, 'Kartu sudah kadaluarsa');
        return false;
    }
    
    hideFieldError(expiryDate, errorElement);
    return true;
}

// Validate CVV
function validateCVV() {
    const cvv = document.getElementById('cvv');
    const errorElement = document.getElementById('cvvError');
    const value = cvv.value;
    
    if (value.length === 0) {
        showFieldError(cvv, errorElement, 'CVV harus diisi');
        return false;
    }
    
    if (value.length < 3 || value.length > 4) {
        showFieldError(cvv, errorElement, 'CVV tidak valid');
        return false;
    }
    
    hideFieldError(cvv, errorElement);
    return true;
}

// Validate card name
function validateCardName() {
    const cardName = document.getElementById('cardName');
    const errorElement = document.getElementById('cardNameError');
    const value = cardName.value.trim();
    
    if (value.length === 0) {
        showFieldError(cardName, errorElement, 'Nama di kartu harus diisi');
        return false;
    }
    
    if (value.length < 2) {
        showFieldError(cardName, errorElement, 'Nama terlalu pendek');
        return false;
    }
    
    hideFieldError(cardName, errorElement);
    return true;
}

// Validate entire credit card form
function validateCreditCardForm() {
    const creditCardForm = document.getElementById('creditCardForm');
    const payButton = document.getElementById('payButton');
    
    if (creditCardForm.style.display === 'none') {
        return true;
    }
    
    const isValid = validateCardNumber() && 
                   validateExpiryDate() && 
                   validateCVV() && 
                   validateCardName();
    
    payButton.disabled = !isValid;
    return isValid;
}

// Luhn algorithm for card number validation
function isValidCardNumber(cardNumber) {
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i));
        
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
}

// Initialize payment button
function initPaymentButton() {
    const payButton = document.getElementById('payButton');
    
    if (payButton) {
        payButton.addEventListener('click', processPayment);
    }
}

// Process payment
async function processPayment() {
    if (!selectedPaymentMethod) {
        showToast('Pilih metode pembayaran terlebih dahulu', 'error');
        return;
    }
    
    if (!bookingData) {
        showToast('Data booking tidak ditemukan', 'error');
        return;
    }
    
    // Validate credit card if selected
    if (selectedPaymentMethod === 'credit_card' && !validateCreditCardForm()) {
        showToast('Lengkapi informasi kartu kredit', 'error');
        return;
    }
    
    const payButton = document.getElementById('payButton');
    showLoading(payButton);
    
    try {
        // Show processing modal
        showModal('processingModal');
        
        // Prepare payment data
        const paymentData = {
            booking_id: bookingData.id,
            payment_method: selectedPaymentMethod,
            amount: bookingData.total_price
        };
        
        // Add credit card data if applicable
        if (selectedPaymentMethod === 'credit_card') {
            paymentData.card_data = {
                number: document.getElementById('cardNumber').value.replace(/\s/g, ''),
                expiry: document.getElementById('expiryDate').value,
                cvv: document.getElementById('cvv').value,
                name: document.getElementById('cardName').value
            };
        }
        
        // Simulate payment processing
        const result = await simulatePaymentProcessing(paymentData);
        
        // Close processing modal
        closeModal('processingModal');
        
        if (result.success) {
            // Show success modal
            document.getElementById('finalBookingId').textContent = result.booking_id || bookingData.id;
            showModal('successModal');
            
            // Clear pending booking data
            storage.remove('pendingBooking');
            
        } else {
            // Show failure modal
            document.getElementById('failureReason').textContent = result.message || 'Pembayaran gagal diproses';
            showModal('failedModal');
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        closeModal('processingModal');
        
        document.getElementById('failureReason').textContent = 'Terjadi kesalahan sistem. Silakan coba lagi.';
        showModal('failedModal');
        
    } finally {
        hideLoading(payButton);
    }
}

// Simulate payment processing
async function simulatePaymentProcessing(paymentData) {
    return new Promise((resolve) => {
        // Simulate different processing times and results
        const processingTime = Math.random() * 3000 + 2000; // 2-5 seconds
        
        setTimeout(() => {
            // Simulate success/failure (90% success rate)
            const isSuccess = Math.random() > 0.1;
            
            if (isSuccess) {
                resolve({
                    success: true,
                    booking_id: 'BK' + Date.now(),
                    transaction_id: 'TXN' + Date.now(),
                    message: 'Pembayaran berhasil'
                });
            } else {
                // Simulate different failure reasons
                const failureReasons = [
                    'Kartu ditolak oleh bank',
                    'Saldo tidak mencukupi',
                    'Koneksi ke payment gateway terputus',
                    'Kartu sudah kadaluarsa',
                    'CVV tidak valid'
                ];
                
                const randomReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
                
                resolve({
                    success: false,
                    message: randomReason
                });
            }
        }, processingTime);
    });
}

// Initialize modals
function initModals() {
    // View booking button
    const viewBookingBtn = document.getElementById('viewBookingBtn');
    if (viewBookingBtn) {
        viewBookingBtn.addEventListener('click', function() {
            window.location.href = '../index.html'; // Or booking history page
        });
    }
    
    // Close failed modal
    const closeFailedBtn = document.getElementById('closeFailedBtn');
    if (closeFailedBtn) {
        closeFailedBtn.addEventListener('click', function() {
            closeModal('failedModal');
        });
    }
    
    // Retry payment
    const retryPaymentBtn = document.getElementById('retryPaymentBtn');
    if (retryPaymentBtn) {
        retryPaymentBtn.addEventListener('click', function() {
            closeModal('failedModal');
            // Reset payment method selection
            const selectedOption = document.querySelector('input[name="payment_method"]:checked');
            if (selectedOption) {
                selectedOption.checked = false;
            }
            selectedPaymentMethod = null;
            document.getElementById('payButton').disabled = true;
            document.querySelector('.btn-text').textContent = 'Bayar Sekarang';
        });
    }
}

// Show field error
function showFieldError(field, errorElement, message) {
    field.classList.add('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Hide field error
function hideFieldError(field, errorElement) {
    field.classList.remove('error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
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

// Handle page unload (warn about unsaved changes)
window.addEventListener('beforeunload', function(e) {
    if (selectedPaymentMethod && bookingData) {
        e.preventDefault();
        e.returnValue = 'Anda memiliki pembayaran yang belum selesai. Yakin ingin meninggalkan halaman?';
    }
});

// Handle back button
window.addEventListener('popstate', function(e) {
    if (selectedPaymentMethod && bookingData) {
        const confirmLeave = confirm('Anda memiliki pembayaran yang belum selesai. Yakin ingin kembali?');
        if (!confirmLeave) {
            history.pushState(null, null, window.location.href);
        }
    }
});

// Auto-save payment method selection
function savePaymentState() {
    if (selectedPaymentMethod && bookingData) {
        storage.set('paymentState', {
            method: selectedPaymentMethod,
            bookingId: bookingData.id,
            timestamp: Date.now()
        });
    }
}

// Restore payment state
function restorePaymentState() {
    const paymentState = storage.get('paymentState');
    if (paymentState && bookingData && paymentState.bookingId === bookingData.id) {
        // Check if state is not too old (30 minutes)
        if (Date.now() - paymentState.timestamp < 30 * 60 * 1000) {
            const methodOption = document.querySelector(`input[value="${paymentState.method}"]`);
            if (methodOption) {
                methodOption.checked = true;
                methodOption.dispatchEvent(new Event('change'));
            }
        } else {
            storage.remove('paymentState');
        }
    }
}

// Initialize payment state management
document.addEventListener('DOMContentLoaded', function() {
    // Restore state after booking data is loaded
    setTimeout(restorePaymentState, 1000);
    
    // Save state on method change
    document.addEventListener('change', function(e) {
        if (e.target.name === 'payment_method') {
            savePaymentState();
        }
    });
});

