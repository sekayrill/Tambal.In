// Authentication JavaScript for login and register pages
// Handles form validation, submission, and user authentication

document.addEventListener('DOMContentLoaded', function() {
    initAuthForms();
    initPasswordToggles();
    initSocialAuth();
});

// Initialize authentication forms
function initAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        initLoginForm(loginForm);
    }

    if (registerForm) {
        initRegisterForm(registerForm);
    }
}

// Initialize login form
function initLoginForm(form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe');
        
        // Validate form
        if (!validateLoginForm(email, password)) {
            return;
        }
        
        const submitBtn = document.getElementById('loginBtn');
        showLoading(submitBtn);
        
        try {
            // Simulate API call (replace with actual API endpoint)
            const response = await simulateLogin(email, password);
            
            if (response.success) {
                // Store user data
                const userData = {
                    id: response.user.id,
                    email: response.user.email,
                    name: response.user.name,
                    token: response.token
                };
                
                storage.set('user', userData);
                if (rememberMe) {
                    storage.set('rememberMe', true);
                }
                
                // Show success modal
                showModal('successModal');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
                
            } else {
                throw new Error(response.message || 'Login gagal');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showLoginError(error.message);
        } finally {
            hideLoading(submitBtn);
        }
    });
    
    // Continue button in success modal
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            window.location.href = '../index.html';
        });
    }
}

// Initialize register form
function initRegisterForm(form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            agreeTerms: formData.get('agreeTerms'),
            newsletter: formData.get('newsletter')
        };
        
        // Validate form
        if (!validateRegisterForm(userData)) {
            return;
        }
        
        const submitBtn = document.getElementById('registerBtn');
        showLoading(submitBtn);
        
        try {
            // Simulate API call (replace with actual API endpoint)
            const response = await simulateRegister(userData);
            
            if (response.success) {
                // Show success modal
                showModal('successModal');
                
                // Clear form
                form.reset();
                
            } else {
                throw new Error(response.message || 'Pendaftaran gagal');
            }
            
        } catch (error) {
            console.error('Register error:', error);
            showRegisterError(error.message);
        } finally {
            hideLoading(submitBtn);
        }
    });
    
    // Continue button in success modal (redirect to login)
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }
}

// Validate login form
function validateLoginForm(email, password) {
    let isValid = true;
    
    // Email validation
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    
    if (!email) {
        showFieldError(emailInput, emailError, 'Email harus diisi');
        isValid = false;
    } else if (!validateEmail(emailInput)) {
        isValid = false;
    }
    
    // Password validation
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    
    if (!password) {
        showFieldError(passwordInput, passwordError, 'Password harus diisi');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError(passwordInput, passwordError, 'Password minimal 6 karakter');
        isValid = false;
    } else {
        hideFieldError(passwordInput, passwordError);
    }
    
    return isValid;
}

// Validate register form
function validateRegisterForm(userData) {
    let isValid = true;
    
    // First name validation
    const firstNameInput = document.getElementById('firstName');
    const firstNameError = document.getElementById('firstNameError');
    
    if (!userData.firstName || userData.firstName.trim().length < 2) {
        showFieldError(firstNameInput, firstNameError, 'Nama depan minimal 2 karakter');
        isValid = false;
    } else {
        hideFieldError(firstNameInput, firstNameError);
    }
    
    // Last name validation
    const lastNameInput = document.getElementById('lastName');
    const lastNameError = document.getElementById('lastNameError');
    
    if (!userData.lastName || userData.lastName.trim().length < 2) {
        showFieldError(lastNameInput, lastNameError, 'Nama belakang minimal 2 karakter');
        isValid = false;
    } else {
        hideFieldError(lastNameInput, lastNameError);
    }
    
    // Email validation
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    
    if (!userData.email) {
        showFieldError(emailInput, emailError, 'Email harus diisi');
        isValid = false;
    } else if (!validateEmail(emailInput)) {
        isValid = false;
    }
    
    // Phone validation
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');
    
    if (!userData.phone) {
        showFieldError(phoneInput, phoneError, 'Nomor telepon harus diisi');
        isValid = false;
    } else if (!validatePhoneNumber(userData.phone)) {
        showFieldError(phoneInput, phoneError, 'Format nomor telepon tidak valid');
        isValid = false;
    } else {
        hideFieldError(phoneInput, phoneError);
    }
    
    // Password validation
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    
    if (!userData.password) {
        showFieldError(passwordInput, passwordError, 'Password harus diisi');
        isValid = false;
    } else if (userData.password.length < 8) {
        showFieldError(passwordInput, passwordError, 'Password minimal 8 karakter');
        isValid = false;
    } else {
        hideFieldError(passwordInput, passwordError);
    }
    
    // Confirm password validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    
    if (!userData.confirmPassword) {
        showFieldError(confirmPasswordInput, confirmPasswordError, 'Konfirmasi password harus diisi');
        isValid = false;
    } else if (userData.password !== userData.confirmPassword) {
        showFieldError(confirmPasswordInput, confirmPasswordError, 'Password tidak cocok');
        isValid = false;
    } else {
        hideFieldError(confirmPasswordInput, confirmPasswordError);
    }
    
    // Terms agreement validation
    if (!userData.agreeTerms) {
        showToast('Anda harus menyetujui syarat dan ketentuan', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Validate phone number
function validatePhoneNumber(phone) {
    // Remove all non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indonesian phone number
    return cleanPhone.length >= 10 && cleanPhone.length <= 15 && 
           (cleanPhone.startsWith('62') || cleanPhone.startsWith('0'));
}

// Initialize password toggles
function initPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

// Initialize social authentication
function initSocialAuth() {
    // Google login
    const googleLoginBtn = document.getElementById('googleLogin');
    const googleRegisterBtn = document.getElementById('googleRegister');
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function() {
            handleSocialAuth('google', 'login');
        });
    }
    
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', function() {
            handleSocialAuth('google', 'register');
        });
    }
    
    // Facebook login
    const facebookLoginBtn = document.getElementById('facebookLogin');
    const facebookRegisterBtn = document.getElementById('facebookRegister');
    
    if (facebookLoginBtn) {
        facebookLoginBtn.addEventListener('click', function() {
            handleSocialAuth('facebook', 'login');
        });
    }
    
    if (facebookRegisterBtn) {
        facebookRegisterBtn.addEventListener('click', function() {
            handleSocialAuth('facebook', 'register');
        });
    }
}

// Handle social authentication
async function handleSocialAuth(provider, action) {
    try {
        showToast(`Menghubungkan dengan ${provider}...`, 'info');
        
        // Simulate social auth (replace with actual implementation)
        const response = await simulateSocialAuth(provider, action);
        
        if (response.success) {
            storage.set('user', response.user);
            showToast(`Berhasil ${action === 'login' ? 'masuk' : 'daftar'} dengan ${provider}`, 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } else {
            throw new Error(response.message);
        }
        
    } catch (error) {
        console.error('Social auth error:', error);
        showToast(`Gagal ${action === 'login' ? 'masuk' : 'daftar'} dengan ${provider}`, 'error');
    }
}

// Show login error
function showLoginError(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    
    showModal('errorModal');
}

// Show register error
function showRegisterError(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    
    showModal('errorModal');
}

// Simulate login API call (replace with actual API)
async function simulateLogin(email, password) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate different responses
            if (email === 'test@example.com' && password === 'password123') {
                resolve({
                    success: true,
                    user: {
                        id: 1,
                        email: email,
                        name: 'Test User'
                    },
                    token: 'fake-jwt-token'
                });
            } else {
                resolve({
                    success: false,
                    message: 'Email atau password salah'
                });
            }
        }, 1500);
    });
}

// Simulate register API call (replace with actual API)
async function simulateRegister(userData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate email already exists
            if (userData.email === 'existing@example.com') {
                resolve({
                    success: false,
                    message: 'Email sudah terdaftar'
                });
            } else {
                resolve({
                    success: true,
                    message: 'Pendaftaran berhasil'
                });
            }
        }, 2000);
    });
}

// Simulate social auth API call (replace with actual implementation)
async function simulateSocialAuth(provider, action) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                user: {
                    id: 2,
                    email: `user@${provider}.com`,
                    name: `${provider} User`,
                    provider: provider
                },
                token: 'fake-social-jwt-token'
            });
        }, 1000);
    });
}

// Check if user is already logged in
function checkAuthStatus() {
    const user = storage.get('user');
    if (user && user.token) {
        // User is logged in, redirect to dashboard or home
        const currentPage = window.location.pathname;
        if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
            window.location.href = '../index.html';
        }
    }
}

// Logout function
window.logout = function() {
    storage.remove('user');
    storage.remove('rememberMe');
    showToast('Anda telah logout', 'info');
    setTimeout(() => {
        window.location.href = 'pages/login.html';
    }, 1000);
};

// Initialize auth status check
checkAuthStatus();

