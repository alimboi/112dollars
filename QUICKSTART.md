# 237DOLLARS - QUICK START GUIDE

## 🚀 Get Started in 5 Minutes

### Step 1: Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS (with Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### Step 2: Create Database

```bash
# Access PostgreSQL
sudo -u postgres psql

# Run these commands in PostgreSQL prompt:
CREATE USER "237dollar" WITH PASSWORD 'ihave237dollars';
CREATE DATABASE dataforapp OWNER "237dollar";
GRANT ALL PRIVILEGES ON DATABASE dataforapp TO "237dollar";
\q
```

### Step 3: Install Backend Dependencies

```bash
cd 237dollars-backend
npm install
```

This will install all required packages including:
- NestJS framework
- TypeORM & PostgreSQL driver
- JWT & bcrypt for authentication
- Nodemailer for emails
- AWS SDK for file uploads
- And more...

### Step 4: Run Database Seed

```bash
npm run seed
```

This creates:
- ✅ Super Admin account (admin@237dollars.com / Admin@237dollars)
- ✅ 3 Majors (Korean, English, Coding)
- ✅ 24 Topics across all majors

### Step 5: Start Backend Server

```bash
npm run start:dev
```

Server runs on: http://localhost:3000/api

### Step 6: Test It Works

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"...","service":"237dollars-backend"}
```

## ✅ YOU'RE DONE!

Backend foundation is running. Now you can:

1. **Test with tools like Postman/Insomnia**
2. **Continue development** (add more modules)
3. **Build the frontend** (Angular 17)

## 📦 WHAT'S INCLUDED SO FAR

### ✓ Backend Core
- NestJS project structure
- TypeORM configuration
- PostgreSQL database setup
- 18 database entities (tables)
- Seed script with initial data

### ✓ Utilities
- Password service (bcrypt hashing)
- Email service (Gmail/nodemailer)
- AWS S3 service (file uploads)
- Telegram service (notifications)

### ✓ Constants & Decorators
- User roles management
- Error messages
- Public/Roles decorators

## ⏭️ NEXT STEPS

The project foundation is ready! Next we need to build:

1. **Authentication Module** - Login, register, JWT
2. **User Modules** - Users, students, enrollments
3. **Content Modules** - References, quizzes, blog
4. **Admin Modules** - Management, analytics
5. **Frontend** - Angular 17 app

## 🔧 CONFIGURATION

### Required (for full functionality):

**Gmail App Password:**
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate App Password
4. Add to `.env`: `GMAIL_APP_PASSWORD=your-app-password`

**AWS S3 (for file uploads):**
1. Create AWS account
2. Create S3 bucket in ap-south-1 (Mumbai)
3. Get Access Key ID and Secret
4. Add to `.env`:
   ```
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   ```

**Telegram Bot (optional):**
1. Create bot with @BotFather
2. Get bot token
3. Get your chat ID
4. Add to `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your-token
   TELEGRAM_ADMIN_CHAT_ID=your-chat-id
   ```

## 🐛 TROUBLESHOOTING

**Database connection failed?**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if database exists
psql -U 237dollar -d dataforapp -h localhost
```

**Port 3000 already in use?**
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

**Seed script fails?**
```bash
# Make sure database is empty first
# Or the script will skip existing data
```

## 📚 USEFUL COMMANDS

```bash
# Development
npm run start:dev        # Start with hot-reload
npm run build            # Build for production
npm run start:prod       # Run production build

# Database
npm run seed             # Seed initial data
npm run typeorm          # Run TypeORM CLI

# Testing
npm run test             # Run tests
npm run test:watch       # Watch mode
```

## 🎯 DEFAULT LOGIN

After seeding:
- **Email:** admin@237dollars.com
- **Password:** Admin@237dollars

⚠️ Change this in production!

## 📞 NEED HELP?

Check the full README.md for detailed documentation.

---

**Happy Coding! 🚀**
