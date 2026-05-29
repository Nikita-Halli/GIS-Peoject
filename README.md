# Medical GIS Disease Prediction System

A comprehensive, professional medical geospatial platform for disease risk prediction and management with role-based dashboards, interactive mapping, and ML-powered analytics.

## 🚀 Features

### Core Functionality
- **Role-Based Access Control**: Separate dashboards for Doctors, Administrators, and Public Health Societies
- **Real-Time Disease Tracking**: Report and monitor disease cases with geospatial coordinates
- **AI-Powered Risk Predictions**: XGBoost machine learning models for disease risk forecasting
- **Interactive GIS Map**: Visualize disease hotspots and risk levels across Karnataka districts
- **Live Alerts & Notifications**: Critical risk level notifications with actionable insights
- **Advanced Analytics**: Comprehensive dashboards with key metrics and trends

### User Roles

#### 👨‍⚕️ Doctors
- Report disease cases with location, symptoms, and severity
- View local disease risk assessments
- Access alerts for high-risk areas
- Track case history and trends

#### 🔐 Administrators
- Manage user accounts (create, activate, deactivate)
- Monitor system health and metrics
- Retrain ML models with new data
- View comprehensive system analytics

#### 🏥 Public Health Societies
- Monitor public health statistics
- Track disease trends and population impact
- View risk assessments for public health planning
- Access public educational resources

## 📋 Architecture

### Frontend (Next.js 15)
```
app/
├── (protected)/          # Protected routes requiring auth
│   ├── dashboard/        # Role-specific dashboards
│   ├── map/             # Interactive GIS map
│   ├── admin/           # Admin management pages
│   └── doctor/          # Doctor case management
├── login/               # Authentication pages
├── register/
├── api/                 # API routes for auth & data
└── context/             # Auth context provider

components/
├── navbar.tsx           # Animated navigation bar
└── gis-map.tsx         # Interactive mapping component
```

### Backend (Python FastAPI)
```
backend/
├── main.py             # FastAPI application & routes
├── models.py           # SQLAlchemy ORM models
├── schemas.py          # Pydantic request/response schemas
├── auth.py             # JWT authentication & authorization
├── config.py           # Configuration settings
├── database.py         # Database connection setup
└── ml_trainer.py       # ML model training & prediction
```

### Database (PostgreSQL + PostGIS)
- PostGIS enabled for geospatial queries
- Full-text search support
- Spatial indexing for performance
- Row-level security (RLS) policies

## 🎨 Design System

### Colors
- **Primary (Blue)**: Clinical trust and authority
- **Accent (Purple)**: Action and engagement
- **Risk Gradient**: Green (Low) → Yellow → Orange → Red (Critical)
- **Neutral**: Professional grays for UI elements

### Typography
- **Headlines**: Inter (700, 600 weights)
- **Body**: Inter (400, 500 weights)  
- **Monospace**: JetBrains Mono

### Animations
- Smooth page transitions
- Staggered card animations
- Hover state transitions
- Loading spinners
- Error shake animations

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth with role claims
- **Password Hashing**: bcrypt with salt for password security
- **CORS Protection**: Restricted cross-origin requests
- **Input Validation**: Pydantic schemas for all endpoints
- **SQL Injection Prevention**: Parameterized queries via SQLAlchemy
- **Authorization**: Role-based access control (RBAC)
- **HTTP-Only Cookies**: Session management best practices

## 🤖 Machine Learning

### Model: XGBoost Disease Risk Predictor
**Features**:
- Case count in 7, 14, 30-day windows
- Average disease severity score
- Population density of region
- Historical risk scores
- Epidemic trend indicators

**Output**: Risk score (0-100) with confidence interval

**Training Pipeline**:
1. Data collection from disease cases
2. Feature engineering from geospatial & temporal data
3. XGBoost model training with 80/20 split
4. Cross-validation and accuracy assessment
5. Model persistence and versioning

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Doctor Routes
- `POST /api/v1/cases` - Report new disease case
- `GET /api/v1/cases` - Get doctor's cases
- `PUT /api/v1/cases/{id}` - Update case
- `GET /api/v1/dashboard/doctor` - Doctor dashboard metrics

### Admin Routes
- `GET /api/v1/users` - List all users
- `PUT /api/v1/users/{id}/activate` - Toggle user status
- `GET /api/v1/dashboard/admin` - Admin dashboard
- `POST /api/v1/ml/retrain` - Retrain ML model
- `GET /api/v1/ml/models` - List trained models

### Society Routes
- `GET /api/v1/dashboard/society` - Public health dashboard
- `GET /api/v1/districts` - List all districts
- `GET /api/v1/districts/{id}/risks` - Risk predictions

### Shared Routes
- `GET /api/v1/alerts` - Get user alerts
- `PUT /api/v1/alerts/{id}` - Mark alert as read
- `GET /api/v1/taluks/{district_id}` - Get sub-districts

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL with PostGIS
- pnpm (recommended)

### Frontend Setup
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

### Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:password@localhost:5432/medical_gis"
export FASTAPI_SECRET_KEY="your-secret-key"

# Run migrations
python scripts/init-database.sql

# Start server
python -m uvicorn backend.main:app --reload --port 8000
```

## 📱 Demo Credentials

```
Doctor:  doctor@example.com / password123
Admin:   admin@example.com / password123
Society: society@example.com / password123
```

## 🎯 Workflows

### Case Reporting Workflow
1. Doctor logs in
2. Navigate to "Report Case"
3. Fill case details (patient, location, disease, severity)
4. System geolocalizes and stores case
5. ML model updates risk predictions
6. Alerts generated for high-risk areas

### Risk Assessment Workflow
1. System aggregates disease cases
2. ML model extracts features
3. XGBoost predicts district risk scores
4. Risk visualization updated on map
5. Alerts sent to relevant stakeholders

### User Management Workflow
1. Admin views all registered users
2. Filter by role (doctor/society)
3. Activate/deactivate accounts
4. Monitor user activity

## 📊 Data Visualization

### Interactive GIS Map
- Canvas-based rendering for performance
- Risk gradient colors
- District hotspot visualization
- Click-to-inspect district details
- Risk score heatmap overlay
- Legend with risk level indicators

### Dashboard Metrics
- Key performance indicators (KPIs)
- Trend charts and graphs
- Status indicators
- Alert summaries
- Model accuracy metrics

## 🔄 Real-Time Features

- Live case reporting
- Immediate risk score updates
- Notification alerts
- Real-time map updates
- Dashboard metrics refresh

## 📈 Performance Optimizations

- Spatial indexing with PostGIS GIST
- Lazy loading of components
- Client-side caching
- API response compression
- Database query optimization
- Model caching and persistence

## 🧪 Testing

### Mock Data
Demo mode includes sample data for all dashboards and map visualization

### Test Accounts
Pre-configured user accounts for testing each role

## 📝 Database Schema

### Key Tables
- `users` - Authentication & profile data
- `districts` - Geographic boundaries with PostGIS geometry
- `taluks` - Sub-district data
- `disease_cases` - Reported cases with location
- `risk_predictions` - ML model outputs
- `alerts` - User notifications
- `ml_models` - Model metadata & versions

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with semantic design tokens
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **Maps**: Canvas-based with Leaflet integration ready
- **Icons**: Lucide React

### Backend
- **Framework**: Python FastAPI
- **Database**: PostgreSQL with PostGIS
- **ORM**: SQLAlchemy 2.0
- **Auth**: JWT with jose/python-jose
- **ML**: XGBoost, scikit-learn, pandas
- **Validation**: Pydantic 2.0

### DevOps
- **Frontend Hosting**: Vercel
- **Backend**: Docker-ready
- **Database**: PostgreSQL managed service
- **CI/CD**: GitHub Actions ready

## 📖 Documentation

- API documentation: Available at `/api/v1/docs` (when backend running)
- Component storybook: Ready for shadcn/ui components
- Database schema: See `scripts/init-database.sql`

## 🤝 Contributing

1. Clone repository
2. Create feature branch
3. Make changes following code style
4. Submit pull request

## 📄 License

MIT License - See LICENSE file

## 🎓 Learning Resources

- PostGIS Tutorial: https://postgis.net/workshops/
- XGBoost Documentation: https://xgboost.readthedocs.io/
- FastAPI Guide: https://fastapi.tiangolo.com/
- Next.js Documentation: https://nextjs.org/docs

## 🐛 Known Issues & Roadmap

### Current Limitations
- Map uses canvas rendering (ready for Leaflet upgrade)
- Mock data for demo (integration with backend API needed)
- Local storage for auth tokens (consider secure session cookies)

### Future Enhancements
- Real-time WebSocket alerts
- Advanced filtering & search
- Bulk case import/export
- Mobile app (React Native)
- Multi-language support (i18n)
- Advanced ML model ensembles
- Predictive maintenance alerts
- API rate limiting
- Advanced analytics dashboards

## 📞 Support

For issues, feature requests, or questions:
1. Check existing GitHub issues
2. Create detailed bug report
3. Include reproduction steps
4. Attach relevant logs

---

**Built with ❤️ for public health**
