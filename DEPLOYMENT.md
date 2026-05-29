# Deployment Guide - Medical GIS Disease Prediction System

## Overview
This guide walks through deploying the Medical GIS system to production with a Python FastAPI backend and Next.js frontend.

## Prerequisites
- GitHub account
- Vercel account (for frontend)
- Railway, Render, or Heroku account (for backend)
- PostgreSQL database (managed service)

## Frontend Deployment (Next.js → Vercel)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Medical GIS system"
git remote add origin https://github.com/yourusername/medical-gis
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Visit https://vercel.com/new
2. Import your GitHub repository
3. Set Environment Variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com/api/v1
   ```
4. Deploy!

### Step 3: Configure API Calls
Update the API base URL in your frontend config once backend is deployed.

## Backend Deployment (FastAPI)

### Option 1: Railway.app

#### Step 1: Create Railway Account
Visit https://railway.app and sign up

#### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub"
3. Authorize and select your repository

#### Step 3: Add PostgreSQL
1. Click "Add Service"
2. Select "PostgreSQL"
3. It will auto-inject `DATABASE_URL`

#### Step 4: Configure Backend Service
1. In the environment variables, add:
   ```
   FASTAPI_SECRET_KEY=your-random-secret-key
   FASTAPI_ALGORITHM=HS256
   ```

2. Set the start command:
   ```
   uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```

3. Point to `backend/requirements.txt` for dependencies

#### Step 5: Add PostGIS Extension
Once PostgreSQL is running:
```bash
# Connect to your Railway PostgreSQL
psql $DATABASE_URL

# Enable PostGIS
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

# Run the schema
\i scripts/init-database.sql
```

### Option 2: Render.com

#### Step 1: Create Web Service
1. Visit https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select "Python" as runtime

#### Step 2: Configure Environment
```
Build Command: pip install -r backend/requirements.txt
Start Command: uvicorn backend.main:app --host 0.0.0.0 --port 10000
```

#### Step 3: Add Environment Variables
```
DATABASE_URL: your-postgresql-url
FASTAPI_SECRET_KEY: your-secret-key
FASTAPI_ALGORITHM: HS256
```

#### Step 4: Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Use the `Internal Database URL` as DATABASE_URL
3. Manually enable PostGIS extension

### Option 3: Docker (Self-Hosted)

#### Create Docker Image
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Build and Run
```bash
docker build -t medical-gis-backend -f backend/Dockerfile .
docker run -e DATABASE_URL="postgresql://..." \
           -e FASTAPI_SECRET_KEY="your-key" \
           -p 8000:8000 \
           medical-gis-backend
```

## Database Setup

### Create PostgreSQL Instance

#### Step 1: Provision Database
Using your cloud provider (Railway, Render, Heroku, AWS RDS, etc.)

#### Step 2: Connect and Initialize
```bash
# Using psql or your DB tool
psql $DATABASE_URL < scripts/init-database.sql
```

#### Step 3: Enable PostGIS
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

### Seed Initial Data (Optional)
```sql
-- Insert sample districts for testing
INSERT INTO districts (name, state, population, area, geometry)
VALUES (
  'Bengaluru',
  'Karnataka',
  8436675,
  2191.00,
  ST_GeomFromText('POLYGON((77.4 13.2, 77.8 13.2, 77.8 12.8, 77.4 12.8, 77.4 13.2))', 4326)
);

-- Add more districts as needed...
```

## Environment Variables Checklist

### Frontend (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/medical_gis
FASTAPI_SECRET_KEY=your-256-bit-random-secret-key
FASTAPI_ALGORITHM=HS256
```

## Post-Deployment Tasks

### 1. Verify Backend Health
```bash
curl https://your-api.com/health
# Should return: {"status": "healthy", "version": "1.0.0"}
```

### 2. Test Authentication
```bash
curl -X POST https://your-api.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"password123"}'
```

### 3. Initialize Database
Ensure all tables are created:
```bash
psql $DATABASE_URL -c "\dt"
```

### 4. Update Frontend API URL
Once backend is live, update `NEXT_PUBLIC_API_BASE_URL` in Vercel environment variables.

### 5. Test End-to-End
1. Visit your Vercel URL
2. Register a new account
3. Log in
4. Navigate dashboards
5. Verify API calls in browser DevTools

## Monitoring & Logs

### Vercel Frontend
- Dashboard: https://vercel.com/dashboard
- Logs: Projects → [Project] → Deployments → View Logs
- Monitor: Edge Functions, Function Logs, Build Logs

### Railway Backend
- Dashboard: https://railway.app/dashboard
- Click your project to view:
  - Service Logs
  - Database connections
  - Environment variables
  - Metrics

### Render Backend
- Dashboard: https://dashboard.render.com
- Click your service to view:
  - Live logs
  - Metrics
  - Build logs
  - Deployment history

## Scaling Considerations

### Database Scaling
- Use connection pooling (PgBouncer)
- Enable read replicas for heavy queries
- Index optimization for spatial queries
- Archive old case data to separate storage

### Backend Scaling
- Use load balancers (Railway/Render do this auto)
- Horizontal scaling with multiple instances
- Cache frequently accessed data
- Optimize ML model inference

### Frontend Scaling
- Vercel auto-scales
- Use CDN for static assets
- Optimize images and code splitting
- Monitor Core Web Vitals

## Backup & Recovery

### Database Backups
```bash
# Automated backups (set up with your provider)
# Manual backup:
pg_dump $DATABASE_URL > backup.sql

# Restore:
psql $DATABASE_URL < backup.sql
```

### Application Backups
- GitHub automatically backs up source code
- Store trained ML models in cloud storage
- Backup configuration files

## Security Checklist

- [ ] Change `FASTAPI_SECRET_KEY` to random 32-character string
- [ ] Enable HTTPS on both frontend and backend
- [ ] Set up CORS correctly for your domain
- [ ] Use environment variables for all secrets
- [ ] Enable database SSL connections
- [ ] Set up API rate limiting
- [ ] Configure firewall rules
- [ ] Enable API authentication checks
- [ ] Regular security patches for dependencies
- [ ] Monitor error logs for suspicious activity

## Troubleshooting

### Backend won't start
```
Check logs for errors
Verify DATABASE_URL is correct
Ensure PostGIS extension is enabled
```

### Frontend can't reach API
```
Check NEXT_PUBLIC_API_BASE_URL
Verify backend is running
Check CORS settings in FastAPI
```

### Database connection issues
```
Verify DATABASE_URL format
Check network connectivity
Ensure firewall allows access
```

### ML Model not loading
```
Check model path in config
Verify model file exists
Check disk space
Review error logs
```

## Performance Optimization

### Database
- Enable query result caching
- Use connection pooling
- Optimize spatial queries with indexes
- Archive historical data

### API
- Implement response caching
- Compress JSON responses
- Use pagination for lists
- Optimize N+1 queries

### Frontend
- Code splitting by route
- Image optimization
- Lazy load components
- Minimize JavaScript bundles

## Maintenance

### Regular Tasks (Weekly)
- Monitor logs for errors
- Check API response times
- Review user feedback

### Regular Tasks (Monthly)
- Update dependencies
- Review security patches
- Optimize slow queries
- Analyze usage metrics

### Regular Tasks (Quarterly)
- Retrain ML models
- Full system audit
- Capacity planning
- Disaster recovery drill

---

For questions or issues, refer to:
- Backend logs on deployment platform
- Frontend logs in browser DevTools
- Database logs from your provider
- README.md for technical details
