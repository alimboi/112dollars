# PostgreSQL Setup Guide for 237DOLLARS

## 1. Install PostgreSQL

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### macOS:
```bash
brew install postgresql
brew services start postgresql
```

### Windows:
Download and install from: https://www.postgresql.org/download/windows/

## 2. Create Database and User

After installation, connect to PostgreSQL:

```bash
sudo -u postgres psql
```

Then run these SQL commands:

```sql
-- Create user
CREATE USER "237dollar" WITH PASSWORD 'ihave237dollars';

-- Create database
CREATE DATABASE dataforapp;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE dataforapp TO "237dollar";

-- Connect to the database
\c dataforapp

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO "237dollar";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "237dollar";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "237dollar";

-- Exit
\q
```

## 3. Verify Connection

Test the connection:

```bash
psql -U 237dollar -d dataforapp -h localhost
```

Enter password when prompted: `ihave237dollars`

## 4. Backend Environment Setup

The backend `.env` file is already configured:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=237dollar
DB_PASSWORD=ihave237dollars
DB_NAME=dataforapp
```

## 5. Run Database Migrations

From the backend directory:

```bash
cd 237dollars-backend
npm run migration:run
```

## 6. Start the Backend

```bash
npm run start:dev
```

The backend will:
- Connect to PostgreSQL
- Auto-sync database schema (in development mode)
- Create all necessary tables

## 7. Create Your Admin Account

### Method 1: Register and Update Database

1. Register a normal account through the frontend
2. Connect to PostgreSQL:
```bash
psql -U 237dollar -d dataforapp -h localhost
```

3. Update your user role to ADMIN:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

4. Verify the change:
```sql
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
```

### Method 2: Create Admin Directly

```bash
psql -U 237dollar -d dataforapp -h localhost
```

```sql
-- Insert admin user (password is hashed for "Admin123!")
INSERT INTO users (email, password, role, first_name, last_name, is_active, language, dark_mode)
VALUES (
  'admin@237dollars.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eidxQvbHaY/u',
  'super_admin',
  'Admin',
  'User',
  true,
  'en',
  true
);
```

Login credentials:
- Email: `admin@237dollars.com`
- Password: `Admin123!`

**IMPORTANT:** Change this password immediately after first login!

## 8. Useful PostgreSQL Commands

```bash
# List all databases
\l

# Connect to database
\c dataforapp

# List all tables
\dt

# Describe a table
\d users

# View all users
SELECT id, email, role, created_at FROM users;

# View all references
SELECT id, title, is_published, created_at FROM references;

# Exit PostgreSQL
\q
```

## 9. Password Hashing (For Manual User Creation)

If you need to create a user with a custom password, use the backend PasswordService or bcrypt:

```javascript
const bcrypt = require('bcrypt');
const password = 'YourPassword123!';
bcrypt.hash(password, 12).then(hash => console.log(hash));
```

## 10. Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

### Permission Denied
```bash
# Run as postgres user
sudo -u postgres psql
```

### Reset Password
```sql
ALTER USER "237dollar" WITH PASSWORD 'new-password';
```

---

## Quick Start Summary

```bash
# 1. Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# 2. Create database and user
sudo -u postgres psql
CREATE USER "237dollar" WITH PASSWORD 'ihave237dollars';
CREATE DATABASE dataforapp;
GRANT ALL PRIVILEGES ON DATABASE dataforapp TO "237dollar";
\c dataforapp
GRANT ALL ON SCHEMA public TO "237dollar";
\q

# 3. Start backend
cd 237dollars-backend
npm run start:dev

# 4. Create admin account (register, then update role)
psql -U 237dollar -d dataforapp -h localhost
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
\q
```

Your backend is now connected to PostgreSQL and ready to use!
