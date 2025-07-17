// Support page JavaScript for customer service functionality
// Handles contact form, FAQ interactions, and live chat

document.addEventListener('DOMContentLoaded', function() {
    initSupportPage();
    initContactForm();
    initFAQ();
    initLiveChat();
});

// Initialize support page
function initSupportPage() {
    // Initialize help cards interactions
    initHelpCards();
    
    // Initialize form category changes
    initCategoryChanges();
    
    // Check for URL parameters (e.g., pre-filled category)
    checkURLParameters();
}

// Initialize help cards
function initHelpCards() {
    const helpCards = document.querySelectorAll('.help-card');
    
    helpCards.forEach(card => {
        card.addEventListener('click', function() {
            // Add click animation
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Initialize contact form
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
        
        // Real-time validation
        const requiredFields = contactForm.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', function() {
                validateField(this);
            });
            
            field.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });
    }
}

// Handle contact form submission
async function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        category: formData.get('category'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        priority: formData.get('priority'),
        newsletter: formData.get('newsletter')
    };
    
    // Validate form
    if (!validateContactForm(contactData)) {
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    showLoading(submitBtn);
    
    try {
        // Simulate API call
        const response = await submitSupportTicket(contactData);
        
        if (response.success) {
            // Show success modal
            showModal('successModal');
            
            // Clear form
            e.target.reset();
            
            // Show success toast
            showToast('Pesan Anda telah terkirim! Tim support akan merespon segera.', 'success');
            
        } else {
            throw new Error(response.message || 'Gagal mengirim pesan');
        }
        
    } catch (error) {
        console.error('Contact form error:', error);
        showToast('Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.', 'error');
    } finally {
        hideLoading(submitBtn);
    }
}

// Validate contact form
function validateContactForm(data) {
    let isValid = true;
    
    // First name validation
    const firstNameField = document.getElementById('firstName');
    if (!data.firstName || data.firstName.trim().length < 2) {
        showFieldError(firstNameField, 'Nama depan minimal 2 karakter');
        isValid = false;
    } else {
        hideFieldError(firstNameField);
    }
    
    // Last name validation
    const lastNameField = document.getElementById('lastName');
    if (!data.lastName || data.lastName.trim().length < 2) {
        showFieldError(lastNameField, 'Nama belakang minimal 2 karakter');
        isValid = false;
    } else {
        hideFieldError(lastNameField);
    }
    
    // Email validation
    const emailField = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        showFieldError(emailField, 'Format email tidak valid');
        isValid = false;
    } else {
        hideFieldError(emailField);
    }
    
    // Category validation
    const categoryField = document.getElementById('category');
    if (!data.category) {
        showFieldError(categoryField, 'Pilih kategori pertanyaan');
        isValid = false;
    } else {
        hideFieldError(categoryField);
    }
    
    // Subject validation
    const subjectField = document.getElementById('subject');
    if (!data.subject || data.subject.trim().length < 5) {
        showFieldError(subjectField, 'Subjek minimal 5 karakter');
        isValid = false;
    } else {
        hideFieldError(subjectField);
    }
    
    // Message validation
    const messageField = document.getElementById('message');
    if (!data.message || data.message.trim().length < 10) {
        showFieldError(messageField, 'Pesan minimal 10 karakter');
        isValid = false;
    } else {
        hideFieldError(messageField);
    }
    
    return isValid;
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Field ini wajib diisi';
    } else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Format email tidak valid';
        }
    } else if (field.id === 'firstName' || field.id === 'lastName') {
        if (value && value.length < 2) {
            isValid = false;
            errorMessage = 'Minimal 2 karakter';
        }
    } else if (field.id === 'subject') {
        if (value && value.length < 5) {
            isValid = false;
            errorMessage = 'Minimal 5 karakter';
        }
    } else if (field.id === 'message') {
        if (value && value.length < 10) {
            isValid = false;
            errorMessage = 'Minimal 10 karakter';
        }
    }
    
    if (isValid) {
        hideFieldError(field);
    } else {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('error');
    field.style.borderColor = '#ef4444';
    
    // Find or create error element
    let errorElement = field.parentElement.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.style.cssText = `
            color: #ef4444;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: block;
        `;
        field.parentElement.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

// Hide field error
function hideFieldError(field) {
    field.classList.remove('error');
    field.style.borderColor = '';
    
    const errorElement = field.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

// Initialize category changes
function initCategoryChanges() {
    const categorySelect = document.getElementById('category');
    const subjectField = document.getElementById('subject');
    
    if (categorySelect && subjectField) {
        categorySelect.addEventListener('change', function() {
            const category = this.value;
            const suggestions = getCategorySubjectSuggestions(category);
            
            if (suggestions.length > 0 && !subjectField.value) {
                // Show suggestions or auto-fill
                showSubjectSuggestions(suggestions);
            }
        });
    }
}

// Get subject suggestions based on category
function getCategorySubjectSuggestions(category) {
    const suggestions = {
        'technical': [
            'Website tidak dapat diakses',
            'Error saat login',
            'Masalah dengan pencarian lokasi',
            'Aplikasi berjalan lambat'
        ],
        'booking': [
            'Tidak dapat membuat pesanan',
            'Ingin mengubah pesanan',
            'Pesanan tidak muncul',
            'Masalah dengan konfirmasi booking'
        ],
        'payment': [
            'Pembayaran gagal',
            'Uang tidak kembali',
            'Masalah dengan metode pembayaran',
            'Invoice tidak diterima'
        ],
        'account': [
            'Lupa password',
            'Tidak dapat login',
            'Ingin menghapus akun',
            'Masalah dengan profil'
        ],
        'general': [
            'Pertanyaan umum tentang layanan',
            'Cara menggunakan aplikasi',
            'Informasi harga',
            'Lokasi bengkel'
        ],
        'complaint': [
            'Keluhan terhadap bengkel',
            'Layanan tidak memuaskan',
            'Masalah dengan teknisi',
            'Kualitas perbaikan buruk'
        ],
        'suggestion': [
            'Saran perbaikan aplikasi',
            'Fitur baru yang diinginkan',
            'Feedback pengalaman pengguna',
            'Ide pengembangan layanan'
        ]
    };
    
    return suggestions[category] || [];
}

// Show subject suggestions
function showSubjectSuggestions(suggestions) {
    const subjectField = document.getElementById('subject');
    
    // Remove existing suggestions
    const existingSuggestions = document.querySelector('.subject-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    if (suggestions.length === 0) return;
    
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'subject-suggestions';
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
        max-height: 150px;
        overflow-y: auto;
    `;
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--gray-100);
            transition: background-color 0.2s;
            font-size: 0.875rem;
        `;
        item.textContent = suggestion;
        
        item.addEventListener('click', function() {
            subjectField.value = suggestion;
            suggestionsContainer.remove();
        });
        
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--gray-100)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'white';
        });
        
        suggestionsContainer.appendChild(item);
    });
    
    subjectField.parentElement.style.position = 'relative';
    subjectField.parentElement.appendChild(suggestionsContainer);
    
    // Close suggestions when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function(e) {
            if (!subjectField.parentElement.contains(e.target)) {
                suggestionsContainer.remove();
            }
        });
    }, 100);
}

// Initialize FAQ
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            question.addEventListener('click', function() {
                const isActive = this.classList.contains('active');
                
                // Close all other FAQ items
                faqItems.forEach(otherItem => {
                    const otherQuestion = otherItem.querySelector('.faq-question');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    
                    if (otherQuestion && otherAnswer) {
                        otherQuestion.classList.remove('active');
                        otherAnswer.classList.remove('active');
                    }
                });
                
                // Toggle current item
                if (!isActive) {
                    this.classList.add('active');
                    answer.classList.add('active');
                }
            });
        }
    });
}

// Initialize live chat
function initLiveChat() {
    const startChatBtn = document.getElementById('startChatBtn');
    const chatWidget = document.getElementById('chatWidget');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatInputField = document.getElementById('chatInputField');
    const sendChatBtn = document.getElementById('sendChatBtn');
    
    if (startChatBtn) {
        startChatBtn.addEventListener('click', function() {
            showChatWidget();
        });
    }
    
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', function() {
            hideChatWidget();
        });
    }
    
    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', sendChatMessage);
    }
    
    if (chatInputField) {
        chatInputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Initialize chat messages
    initChatMessages();
}

// Show chat widget
function showChatWidget() {
    const chatWidget = document.getElementById('chatWidget');
    if (chatWidget) {
        chatWidget.classList.add('show');
        
        // Focus on input field
        const chatInputField = document.getElementById('chatInputField');
        if (chatInputField) {
            setTimeout(() => chatInputField.focus(), 300);
        }
    }
}

// Hide chat widget
function hideChatWidget() {
    const chatWidget = document.getElementById('chatWidget');
    if (chatWidget) {
        chatWidget.classList.remove('show');
    }
}

// Send chat message
function sendChatMessage() {
    const chatInputField = document.getElementById('chatInputField');
    const message = chatInputField.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addChatMessage(message, 'user');
    
    // Clear input
    chatInputField.value = '';
    
    // Simulate agent response
    setTimeout(() => {
        const response = generateAgentResponse(message);
        addChatMessage(response, 'agent');
    }, 1000 + Math.random() * 2000);
}

// Add chat message
function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageElement.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
        <div class="message-time">${timeString}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate agent response
function generateAgentResponse(userMessage) {
    const responses = {
        'halo': 'Halo! Selamat datang di Tambal.In. Ada yang bisa saya bantu?',
        'help': 'Tentu! Saya siap membantu Anda. Apa yang ingin Anda tanyakan?',
        'booking': 'Untuk membuat pesanan, Anda bisa menggunakan fitur pencarian lokasi di website kami. Apakah Anda memerlukan bantuan untuk mencari bengkel terdekat?',
        'payment': 'Kami menerima berbagai metode pembayaran termasuk kartu kredit, transfer bank, dan e-wallet. Ada masalah dengan pembayaran Anda?',
        'location': 'Anda bisa mencari bengkel terdekat menggunakan fitur pencarian di halaman utama. Masukkan alamat atau gunakan lokasi saat ini.',
        'price': 'Harga layanan bervariasi tergantung jenis kendaraan dan layanan. Untuk tambal ban motor mulai dari Rp 15.000, dan mobil mulai dari Rp 25.000.',
        'hours': 'Jam operasional bengkel berbeda-beda. Sebagian besar buka dari pukul 08:00-17:00, dan ada juga yang melayani 24 jam.',
        'contact': 'Anda bisa menghubungi kami melalui telepon di +62 812-3456-7890, email support@tambal.in, atau WhatsApp.',
        'default': 'Terima kasih atas pertanyaan Anda. Tim support kami akan membantu menyelesaikan masalah Anda. Apakah ada hal lain yang bisa saya bantu?'
    };
    
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
        if (key !== 'default' && lowerMessage.includes(key)) {
            return response;
        }
    }
    
    return responses.default;
}

// Initialize chat messages
function initChatMessages() {
    // Add initial welcome message if chat is opened
    const chatWidget = document.getElementById('chatWidget');
    if (chatWidget) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (chatWidget.classList.contains('show')) {
                        // Chat opened, ensure welcome message exists
                        const chatMessages = document.getElementById('chatMessages');
                        if (chatMessages && chatMessages.children.length <= 1) {
                            // Add typing indicator
                            setTimeout(() => {
                                addChatMessage('Ada yang bisa saya bantu hari ini?', 'agent');
                            }, 500);
                        }
                    }
                }
            });
        });
        
        observer.observe(chatWidget, { attributes: true });
    }
}

// Check URL parameters
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const subject = urlParams.get('subject');
    
    if (category) {
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.value = category;
        }
    }
    
    if (subject) {
        const subjectField = document.getElementById('subject');
        if (subjectField) {
            subjectField.value = decodeURIComponent(subject);
        }
    }
}

// Success modal close handler
document.addEventListener('DOMContentLoaded', function() {
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', function() {
            closeModal('successModal');
        });
    }
});

// API simulation functions (replace with actual API calls)

async function submitSupportTicket(data) {
    return new Promise(resolve => {
        setTimeout(() => {
            // Simulate successful submission
            resolve({
                success: true,
                ticketId: 'TK' + Date.now(),
                message: 'Tiket support berhasil dibuat'
            });
        }, 1500);
    });
}

// Utility function to format time
function formatTime(date) {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export functions for external use
window.supportFunctions = {
    showChatWidget,
    hideChatWidget,
    addChatMessage
};

