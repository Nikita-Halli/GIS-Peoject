-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('doctor', 'admin', 'society')),
    phone VARCHAR(20),
    organization VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Districts table with geometry
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    state VARCHAR(255) DEFAULT 'Karnataka',
    population INTEGER,
    area NUMERIC,
    geometry GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Taluks (sub-districts) with geometry
CREATE TABLE IF NOT EXISTS taluks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district_id INTEGER NOT NULL REFERENCES districts(id),
    population INTEGER,
    geometry GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disease cases reported by doctors
CREATE TABLE IF NOT EXISTS disease_cases (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES users(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER,
    patient_gender VARCHAR(10),
    disease_type VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    case_date DATE NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe')),
    location_geometry GEOMETRY(POINT, 4326),
    symptoms TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk predictions table (pre-computed by ML model)
CREATE TABLE IF NOT EXISTS risk_predictions (
    id SERIAL PRIMARY KEY,
    district_id INTEGER NOT NULL REFERENCES districts(id),
    taluk_id INTEGER REFERENCES taluks(id),
    disease_type VARCHAR(100) NOT NULL,
    risk_score NUMERIC(5, 2) CHECK (risk_score >= 0 AND risk_score <= 100),
    confidence NUMERIC(5, 2),
    prediction_date DATE NOT NULL,
    model_version VARCHAR(50),
    factors JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts/notifications
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    alert_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    related_district_id INTEGER REFERENCES districts(id),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML Model metadata
CREATE TABLE IF NOT EXISTS ml_models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(50) UNIQUE NOT NULL,
    model_path VARCHAR(500),
    training_date DATE,
    accuracy NUMERIC(5, 2),
    features JSON,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial indexes for performance
CREATE INDEX IF NOT EXISTS idx_districts_geometry ON districts USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_taluks_geometry ON taluks USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_disease_cases_geometry ON disease_cases USING GIST(location_geometry);
CREATE INDEX IF NOT EXISTS idx_disease_cases_date ON disease_cases(case_date);
CREATE INDEX IF NOT EXISTS idx_disease_cases_doctor ON disease_cases(doctor_id);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_date ON risk_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_disease_cases_disease ON disease_cases(disease_type);
