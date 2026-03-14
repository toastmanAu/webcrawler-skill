#!/bin/bash
# FiberQuest Database Setup
# Run once on fresh Pi to initialize PostgreSQL

set -e

echo "=== FiberQuest Database Setup ==="
echo ""

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
echo "✅ PostgreSQL started and enabled"

# Create database + user
sudo -u postgres psql << EOF
CREATE DATABASE IF NOT EXISTS fiberquest;
CREATE USER IF NOT EXISTS fiberquest WITH PASSWORD 'fiberquest_dev_local_only';
ALTER USER fiberquest CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE fiberquest TO fiberquest;
\c fiberquest
GRANT ALL ON SCHEMA public TO fiberquest;
EOF

echo "✅ Database 'fiberquest' created"
echo "✅ User 'fiberquest' created"

# Test connection
psql -h localhost -U fiberquest -d fiberquest -c "SELECT version();" || echo "Test connection failed"

echo ""
echo "Connection string:"
echo "postgres://fiberquest:fiberquest_dev_local_only@localhost/fiberquest"
echo ""
echo "Next: Run migrations in the agent or website"
