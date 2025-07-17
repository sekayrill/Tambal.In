# Tambal.In - Platform Pencarian Bengkel Tambal Ban

Website platform yang membantu pengguna menemukan bengkel tambal ban terdekat dengan mudah dan cepat. Dilengkapi dengan fitur pencarian lokasi, sistem booking, pembayaran online, dan customer service.

## 🚀 Fitur Utama

- **Pencarian Lokasi**: Temukan bengkel tambal ban terdekat menggunakan GPS atau alamat
- **Google Maps Integration**: Tampilan peta interaktif dengan marker bengkel
- **Sistem Booking**: Pesan layanan tambal ban secara online
- **Multi Payment**: Berbagai metode pembayaran (E-wallet, Bank Transfer, Kartu Kredit, Cash)
- **User Authentication**: Sistem login dan registrasi yang aman
- **Customer Service**: Live chat, FAQ, dan support 24/7
- **Responsive Design**: Kompatibel dengan desktop dan mobile
- **Rating & Review**: Sistem penilaian bengkel dari pengguna

## 🛠️ Teknologi yang Digunakan

### Frontend
- **HTML5** - Struktur halaman web
- **CSS3** - Styling dan responsive design
- **JavaScript (Vanilla)** - Interaktivitas dan API integration
- **Google Maps API** - Integrasi peta dan lokasi
- **Font Awesome** - Icon library
- **Google Fonts** - Typography

### Backend
- **Python Flask** - Web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database (development)
- **Flask-CORS** - Cross-origin resource sharing
- **JWT** - Authentication tokens

### Deployment
- **Netlify** - Frontend hosting
- **Heroku/Railway** - Backend hosting (opsional)

## 📁 Struktur Project

```
tambal-in/
├── frontend/                 # Frontend files
│   ├── css/                 # Stylesheets
│   │   ├── style.css       # Main styles
│   │   ├── responsive.css  # Responsive design
│   │   ├── auth.css        # Authentication pages
│   │   ├── search.css      # Search page
│   │   ├── support.css     # Support page
│   │   └── payment.css     # Payment page
│   ├── js/                 # JavaScript files
│   │   ├── main.js         # Main functionality
│   │   ├── auth.js         # Authentication
│   │   ├── search.js       # Search functionality
│   │   ├── map.js          # Google Maps integration
│   │   ├── support.js      # Customer service
│   │   └── payment.js      # Payment processing
│   ├── pages/              # HTML pages
│   │   ├── login.html      # Login page
│   │   ├── register.html   # Registration page
│   │   ├── search.html     # Search locations
│   │   ├── support.html    # Customer service
│   │   └── payment.html    # Payment page
│   ├── images/             # Image assets
│   ├── index.html          # Homepage
│   └── netlify.toml        # Netlify configuration
├── backend/                # Backend API
│   └── tambal_in_api/      # Flask application
│       ├── src/            # Source code
│       │   ├── models/     # Database models
│       │   ├── routes/     # API routes
│       │   └── main.py     # Main application
│       ├── venv/           # Virtual environment
│       └── requirements.txt # Python dependencies
├── database/               # Database files
│   └── schema.sql          # Database schema
├── docs/                   # Documentation
│   └── project-plan.md     # Project planning
└── README.md               # This file
```

## 🚀 Cara Menjalankan Project

### Prerequisites
- Python 3.8+
- Node.js (opsional, untuk development tools)
- Google Maps API Key

### Setup Backend

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd tambal-in/backend/tambal_in_api
   ```

2. **Buat virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # atau
   venv\Scripts\activate     # Windows
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Jalankan server**
   ```bash
   python src/main.py
   ```
   Server akan berjalan di `http://localhost:5000`

### Setup Frontend

1. **Buka folder frontend**
   ```bash
   cd tambal-in/frontend
   ```

2. **Setup Google Maps API**
   - Dapatkan API key dari [Google Cloud Console](https://console.cloud.google.com/)
   - Edit file `pages/search.html`
   - Ganti `YOUR_API_KEY` dengan API key Anda:
     ```html
     <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initMap"></script>
     ```

3. **Konfigurasi API endpoint**
   - Edit file `js/main.js`
   - Update `API_BASE_URL` sesuai dengan backend URL:
     ```javascript
     const API_BASE_URL = 'http://localhost:5000/api';
     ```

4. **Jalankan dengan web server**
   ```bash
   # Menggunakan Python
   python -m http.server 8000
   
   # Atau menggunakan Node.js
   npx serve .
   ```

## 🌐 Deployment

### Deploy ke Netlify

1. **Persiapan file**
   - Pastikan semua file frontend sudah siap
   - Update API endpoint ke production URL
   - Konfigurasi Google Maps API key

2. **Deploy via Netlify Dashboard**
   - Login ke [Netlify](https://netlify.com)
   - Drag & drop folder `frontend` ke dashboard
   - Atau connect dengan Git repository

3. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   cd frontend
   netlify deploy --prod
   ```

### Deploy Backend (Opsional)

Untuk production, deploy backend ke platform seperti:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repository
- **DigitalOcean**: Deploy dengan Docker
- **AWS/GCP**: Gunakan cloud services

## 🔧 Konfigurasi

### Environment Variables

Untuk production, set environment variables berikut:

**Backend:**
```
FLASK_ENV=production
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
```

**Frontend:**
```
GOOGLE_MAPS_API_KEY=your-google-maps-key
API_BASE_URL=your-backend-url
```

### Database

Project menggunakan SQLite untuk development. Untuk production, ganti ke PostgreSQL atau MySQL:

```python
# src/main.py
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:pass@host:port/db'
```

## 📱 Fitur Mobile

Website sudah responsive dan mendukung:
- Touch navigation
- Mobile-optimized forms
- GPS location access
- Mobile payment methods
- Responsive map interface

## 🔒 Keamanan

- Input validation dan sanitization
- SQL injection protection
- XSS protection
- CSRF protection
- Secure password hashing
- JWT token authentication
- HTTPS enforcement (production)

## 🧪 Testing

### Manual Testing
1. Test semua halaman di berbagai browser
2. Test responsive design di mobile
3. Test form validation
4. Test API endpoints
5. Test payment flow (simulation)

### Automated Testing (Future)
```bash
# Backend testing
python -m pytest tests/

# Frontend testing
npm test
```

## 📈 Performance

- Optimized images dan assets
- CSS/JS minification (production)
- CDN untuk static files
- Database query optimization
- Caching strategy
- Lazy loading untuk maps

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

- Email: support@tambal.in
- Phone: +62 812-3456-7890
- Website: https://tambal.in

## 🙏 Acknowledgments

- Google Maps API
- Font Awesome icons
- Flask framework
- Netlify hosting
- Open source community

---

**Tambal.In** - Solusi cepat untuk tambal ban Anda! 🚗🏍️

