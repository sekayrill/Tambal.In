// Main JavaScript file for Tambal.In website
// Handles navigation, general interactions, and utility functions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initScrollEffects();
    initAnimations();
    initUtilities();
});

// Navigation functionality
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active navigation highlighting
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) navLink.classList.add('active');
            }
        });
    });
}

// Scroll effects and animations
function initScrollEffects() {
    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
            } else {
                navbar.style.background = 'var(--white)';
                navbar.style.backdropFilter = 'none';
            }
        });
    }

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.service-card, .step-card, .feature-item, .result-item').forEach(el => {
        observer.observe(el);
    });
}

// Initialize animations
function initAnimations() {
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .service-card, .step-card, .feature-item, .result-item {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        
        .service-card:nth-child(2) { transition-delay: 0.1s; }
        .service-card:nth-child(3) { transition-delay: 0.2s; }
        .step-card:nth-child(2) { transition-delay: 0.1s; }
        .step-card:nth-child(3) { transition-delay: 0.2s; }
    `;
    document.head.appendChild(style);

    // Counter animation for stats
    animateCounters();
}

// Animate counter numbers
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = counter.textContent;
        const isNumber = /^\d+/.test(target);
        
        if (isNumber) {
            const finalNumber = parseInt(target.replace(/\D/g, ''));
            const suffix = target.replace(/\d/g, '');
            let current = 0;
            const increment = finalNumber / 50;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= finalNumber) {
                    counter.textContent = finalNumber + suffix;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current) + suffix;
                }
            }, 30);
        }
    });
}

// Utility functions
function initUtilities() {
    // Form utilities
    initFormValidation();
    
    // Modal utilities
    initModals();
    
    // Loading states
    initLoadingStates();
    
    // Toast notifications
    initToastNotifications();
}

// Form validation utilities
function initFormValidation() {
    // Real-time validation for email fields
    document.querySelectorAll('input[type="email"]').forEach(input => {
        input.addEventListener('blur', function() {
            validateEmail(this);
        });
    });

    // Real-time validation for password fields
    document.querySelectorAll('input[type="password"]').forEach(input => {
        input.addEventListener('input', function() {
            if (this.id === 'password') {
                validatePassword(this);
            }
            if (this.id === 'confirmPassword') {
                validatePasswordMatch(this);
            }
        });
    });

    // Phone number formatting
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    });
}

// Email validation
function validateEmail(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errorElement = document.getElementById(input.id + 'Error');
    
    if (email && !emailRegex.test(email)) {
        showFieldError(input, errorElement, 'Format email tidak valid');
        return false;
    } else {
        hideFieldError(input, errorElement);
        return true;
    }
}

// Password validation
function validatePassword(input) {
    const password = input.value;
    const errorElement = document.getElementById(input.id + 'Error');
    const strengthElement = document.getElementById('passwordStrength');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (password.length < 8) {
        showFieldError(input, errorElement, 'Password minimal 8 karakter');
    } else {
        hideFieldError(input, errorElement);
    }
    
    // Password strength indicator
    if (strengthElement && strengthFill && strengthText) {
        const strength = calculatePasswordStrength(password);
        updatePasswordStrength(strengthFill, strengthText, strength);
    }
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    if (score <= 2) return 'weak';
    if (score === 3) return 'fair';
    if (score === 4) return 'good';
    return 'strong';
}

// Update password strength indicator
function updatePasswordStrength(fillElement, textElement, strength) {
    fillElement.className = `strength-fill ${strength}`;
    textElement.className = `strength-text ${strength}`;
    
    const strengthTexts = {
        weak: 'Lemah',
        fair: 'Cukup',
        good: 'Baik',
        strong: 'Kuat'
    };
    
    textElement.textContent = strengthTexts[strength];
}

// Password match validation
function validatePasswordMatch(input) {
    const password = document.getElementById('password').value;
    const confirmPassword = input.value;
    const errorElement = document.getElementById(input.id + 'Error');
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError(input, errorElement, 'Password tidak cocok');
        return false;
    } else {
        hideFieldError(input, errorElement);
        return true;
    }
}

// Phone number formatting
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    // Add country code if not present
    if (value.length > 0 && !value.startsWith('62')) {
        if (value.startsWith('0')) {
            value = '62' + value.substring(1);
        } else {
            value = '62' + value;
        }
    }
    
    // Format the number
    if (value.length > 2) {
        value = value.substring(0, 2) + ' ' + value.substring(2);
    }
    if (value.length > 6) {
        value = value.substring(0, 6) + '-' + value.substring(6);
    }
    if (value.length > 11) {
        value = value.substring(0, 11) + '-' + value.substring(11);
    }
    
    input.value = value;
}

// Show field error
function showFieldError(input, errorElement, message) {
    input.style.borderColor = '#ef4444';
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Hide field error
function hideFieldError(input, errorElement) {
    input.style.borderColor = 'var(--gray-200)';
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// Modal utilities
function initModals() {
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal);
            }
        }
    });

    // Close buttons
    document.querySelectorAll('.modal-close, [id*="close"], [id*="Close"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal);
            }
        });
    });
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Close modal
function closeModal(modal) {
    if (typeof modal === 'string') {
        modal = document.getElementById(modal);
    }
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Loading states
function initLoadingStates() {
    // Show loading state
    window.showLoading = function(button) {
        if (button) {
            const btnText = button.querySelector('.btn-text');
            const btnLoader = button.querySelector('.btn-loader');
            
            if (btnText) btnText.style.opacity = '0';
            if (btnLoader) btnLoader.classList.remove('hidden');
            
            button.disabled = true;
        }
    };

    // Hide loading state
    window.hideLoading = function(button) {
        if (button) {
            const btnText = button.querySelector('.btn-text');
            const btnLoader = button.querySelector('.btn-loader');
            
            if (btnText) btnText.style.opacity = '1';
            if (btnLoader) btnLoader.classList.add('hidden');
            
            button.disabled = false;
        }
    };
}

// Toast notifications
function initToastNotifications() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    // Show toast function
    window.showToast = function(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: var(--white);
            color: var(--gray-900);
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            border-left: 4px solid var(--primary-blue);
            max-width: 350px;
            animation: slideInRight 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        // Set border color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: 'var(--primary-blue)'
        };
        toast.style.borderLeftColor = colors[type] || colors.info;

        // Add icon
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const icon = document.createElement('i');
        icon.className = icons[type] || icons.info;
        icon.style.color = colors[type] || colors.info;
        
        const text = document.createElement('span');
        text.textContent = message;
        text.style.flex = '1';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--gray-500);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
        `;
        
        toast.appendChild(icon);
        toast.appendChild(text);
        toast.appendChild(closeBtn);
        
        document.getElementById('toast-container').appendChild(toast);

        // Auto remove
        const timer = setTimeout(() => {
            removeToast(toast);
        }, duration);

        // Manual close
        closeBtn.addEventListener('click', () => {
            clearTimeout(timer);
            removeToast(toast);
        });
    };

    // Remove toast function
    function removeToast(toast) {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
}

// Utility functions for API calls
window.apiCall = async function(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

// Local storage utilities
window.storage = {
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    },
    
    get: function(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return null;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
        }
    }
};

// Debounce utility
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

