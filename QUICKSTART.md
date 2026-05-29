# Quick Start Guide - Medical GIS System

Get the Medical GIS Disease Prediction System running in 10 minutes!

## 🚀 5-Minute Frontend Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Development Server
```bash
pnpm dev
```

### 3. Open in Browser
Visit `http://localhost:3000`

### 4. Test Login
Use demo credentials:
- **Email**: doctor@example.com
- **Password**: password123

That's it! The frontend is running with mock data.

---

## 💻 Backend Setup (Optional for Full Features)

If you want to set up the Python backend:

### Prerequisites
- Python 3.9+
- PostgreSQL 13+ with PostGIS
- pip or poetry

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Set Environment Variables
Create a `.env` file in the backend directory:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/medical_gis
FASTAPI_SECRET_KEY=your-random-secret-key-here-min-32-chars
FASTAPI_ALGORITHM=HS256
```

### 4. Start PostgreSQL
Ensure PostgreSQL is running and PostGIS is enabled:
```bash
# Create database
createdb medical_gis

# Enable PostGIS
psql medical_gis -c "CREATE EXTENSION postgis;"
psql medical_gis -c "CREATE EXTENSION postgis_topology;"

# Run schema
psql medical_gis < ../scripts/init-database.sql
```

### 5. Run Backend Server
```bash
python -m uvicorn main:app --reload --port 8000
```

### 6. Check Backend Health
Visit `http://localhost:8000/health`

You should see: `{"status":"healthy","version":"1.0.0"}`

### 7. View API Documentation
Visit `http://localhost:8000/docs` (Swagger UI)

---

## 🎯 What You Can Do Now

### Frontend Only (No Backend)
✅ Sign in/Register  
✅ View role-based dashboards  
✅ See mock disease data  
✅ View interactive map  
✅ Navigate between sections  

### With Full Backend
✅ All of the above, PLUS:  
✅ Report real disease cases  
✅ Save data to database  
✅ Generate ML predictions  
✅ Real-time risk scoring  
✅ User management  
✅ Full API functionality  

---

## 📊 Demo Accounts

### Doctor Account
```
Email: doctor@example.com
Password: password123
Dashboard: Cases, Map, Alerts
```

### Admin Account
```
Email: admin@example.com
Password: password123
Dashboard: Users, Models, System Health
```

### Society Account
```
Email: society@example.com
Password: password123
Dashboard: Public Health Stats, Alerts
```

---

## 🗺️ Interactive Map Features

1. **Click Districts**: Click on any circle to see details
2. **Risk Colors**:
   - 🟢 Green (0-30%): Low Risk
   - 🟡 Yellow (30-50%): Medium Risk
   - 🟠 Orange (50-70%): High Risk
   - 🔴 Red (70%+): Critical Risk

3. **Legend**: View in bottom-right corner

---

## 📁 File Structure

```
medical-gis/
├── app/                      # Next.js app
│   ├── (protected)/         # Auth-required routes
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   ├── api/                 # API routes
│   ├── context/             # Auth context
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
│
├── components/              # Reusable components
│   ├── navbar.tsx          # Animated navbar
│   └── gis-map.tsx         # Interactive map
│
├── backend/                # Python FastAPI
│   ├── main.py            # API server
│   ├── models.py          # Database models
│   ├── auth.py            # Authentication
│   ├── ml_trainer.py      # ML models
│   ├── config.py          # Settings
│   ├── database.py        # DB connection
│   ├── schemas.py         # Data validation
│   └── requirements.txt   # Dependencies
│
├── scripts/
│   └── init-database.sql  # Database schema
│
├── README.md              # Full documentation
├── DEPLOYMENT.md          # Deployment guide
└── QUICKSTART.md          # This file
```

---

## 🔧 Troubleshooting

### Frontend won't load?
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Login not working?
- Check if you're using correct demo credentials
- Ensure browser allows local storage
- Try incognito/private mode

### Backend won't start?
```bash
# Check Python version
python --version  # Should be 3.9+

# Check database
psql -U postgres -c "SELECT version();"

# Check PostGIS
psql medical_gis -c "SELECT PostGIS_version();"
```

### Port already in use?
```bash
# Frontend: use different port
pnpm dev -- -p 3001

# Backend: use different port
python -m uvicorn main:app --port 8001
```

---

## 📚 Next Steps

1. **Explore the Code**: Check out the components and understand the structure
2. **Read Documentation**: See README.md for detailed information
3. **Deploy**: Follow DEPLOYMENT.md for production setup
4. **Extend**: Add your own features and customizations
5. **Connect Backend**: Integrate with real PostgreSQL database

---

## 🎨 Customization

### Change Colors
Edit `app/globals.css` theme variables

### Add New Routes
Create folders in `app/(protected)/`

### Add ML Features
Extend `backend/ml_trainer.py`

### Modify Dashboard
Edit `app/(protected)/dashboard/*/page.tsx`

---

## 📞 Getting Help

- 📖 Read `README.md` for comprehensive docs
- 🚀 Check `DEPLOYMENT.md` for deployment
- 🐛 Review logs in terminal/browser
- 📧 Check validation errors in console

---

## ✨ Key Features at a Glance

| Feature | Status | Location |
|---------|--------|----------|
| Authentication | ✅ | `/login`, `/register` |
| Doctor Dashboard | ✅ | `/dashboard/doctor` |
| Admin Dashboard | ✅ | `/dashboard/admin` |
| Society Dashboard | ✅ | `/dashboard/society` |
| Interactive Map | ✅ | `/map` |
| Case Management | ✅ | `/doctor/cases` |
| User Management | ✅ | `/admin/users` |
| ML Models | ✅ | `/admin/models` |
| Real-time Alerts | ✅ | Dashboard |
| GIS Analysis | ✅ | Map page |

---

## 🎯 Learning Path

1. **Start**: Homepage → Features overview
2. **Authenticate**: Register → Login with demo account
3. **Explore**: Visit role-specific dashboard
4. **Visualize**: Check interactive GIS map
5. **Manage**: Explore case/user management
6. **Deploy**: Follow deployment guide

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Set strong `FASTAPI_SECRET_KEY`
- [ ] Configure CORS properly
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Load test the API
- [ ] Security audit
- [ ] Performance optimization
- [ ] Disaster recovery plan

---

## 📊 Architecture Overview

```
┌─────────────────┐
│   Next.js 15    │
│   Frontend      │
└────────┬────────┘
         │ HTTP/HTTPS
         ↓
┌─────────────────┐
│   FastAPI       │
│   Backend       │
└────────┬────────┘
         │ SQL
         ↓
┌─────────────────┐
│   PostgreSQL    │
│   + PostGIS     │
│   Database      │
└─────────────────┘
```

---

Enjoy using Medical GIS! Happy coding! 🎉

For more information, visit the full README.md documentation.
