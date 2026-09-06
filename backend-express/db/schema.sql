-- db/schema.sql

CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS sync_idempotency CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS ai_suggestions CASCADE;
DROP TABLE IF EXISTS media_files CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS rollup_cache CASCADE;
DROP TABLE IF EXISTS wbs_nodes CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'project_manager', 'field_worker')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wbs_nodes (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id INT REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level BETWEEN 1 AND 6),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50) DEFAULT '%',
    planned_qty FLOAT DEFAULT 0,
    weight FLOAT DEFAULT 1.0,
    planned_start DATE,
    planned_end DATE,
    status VARCHAR(50) DEFAULT 'NOT_STARTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, code)
);

CREATE TABLE rollup_cache (
    wbs_node_id INT PRIMARY KEY REFERENCES wbs_nodes(id) ON DELETE CASCADE,
    pct_complete FLOAT DEFAULT 0,
    actual_qty FLOAT DEFAULT 0,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    wbs_node_id INT REFERENCES wbs_nodes(id),
    user_id INT REFERENCES users(id),
    pct_complete FLOAT NOT NULL CHECK (pct_complete >= 0 AND pct_complete <= 100),
    qty FLOAT,
    notes TEXT,
    location GEOGRAPHY(POINT, 4326),
    gps_lat FLOAT,
    gps_lng FLOAT,
    captured_at TIMESTAMP NOT NULL,
    sync_status VARCHAR(50) DEFAULT 'SYNCED',
    device_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media_files (
    id SERIAL PRIMARY KEY,
    submission_id INT REFERENCES submissions(id),
    project_id INT REFERENCES projects(id),
    wbs_node_id INT REFERENCES wbs_nodes(id),
    uploader_id INT REFERENCES users(id),
    bucket VARCHAR(255) DEFAULT 'project-media',
    storage_path TEXT NOT NULL,
    media_type VARCHAR(50) CHECK (media_type IN ('photo', 'audio', 'document')),
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    gps_lat FLOAT,
    gps_lng FLOAT,
    upload_status VARCHAR(50) DEFAULT 'UPLOADED',
    captured_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_suggestions (
    id SERIAL PRIMARY KEY,
    submission_id INT REFERENCES submissions(id),
    media_file_id INT REFERENCES media_files(id),
    model_name VARCHAR(100),
    suggestion_type VARCHAR(50) CHECK (suggestion_type IN ('vision', 'voice')),
    raw_output JSONB,
    suggested_pct_complete FLOAT,
    suggested_notes TEXT,
    confidence FLOAT,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by INT REFERENCES users(id),
    review_reason TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100),
    target_id INT,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sync_idempotency (
    idempotency_key VARCHAR(255) PRIMARY KEY,
    submission_id INT REFERENCES submissions(id),
    user_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
