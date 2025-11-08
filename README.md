# 237DOLLARS EDUCATIONAL PLATFORM

A complete full-stack educational platform for teaching Frontend, Backend, Korean, and English with gamification for free users and an enrollment system for paid students.

## 🚀 PROJECT OVERVIEW

### Tech Stack

**Backend:**
- Framework: NestJS (Node.js + TypeScript)
- Database: PostgreSQL
- ORM: TypeORM
- Authentication: JWT + bcrypt
- Email: Gmail (nodemailer)
- File Storage: AWS S3 (planned)

**Frontend:**
- Framework: Angular 17 (planned)
- UI: Bootstrap 5
- Animations: GSAP + Three.js
- Language Support: UZ, EN, RU, KOR

## 📁 PROJECT STRUCTURE

```
237dollars/
├── 237dollars-backend/          # NestJS Backend
│   ├── src/
│   │   ├── config/               # Configuration files
│   │   ├── database/
│   │   │   ├── entities/         # 18 TypeORM entities
│   │   │   ├── migrations/       # Database migrations
│   │   │   └── seeds/            # Seed data (majors, topics, admin)
│   │   ├── modules/              # Feature modules (pending)
│   │   ├── common/               # Shared utilities (pending)
│   │   └── types/                # TypeScript enums
│   ├── .env                      # Environment variables
│   └── package.json
└── 237dollars-frontend/          # Angular Frontend (pending)
```

## ✅ COMPLETED FEATURES

### Backend Core Setup ✓
- [x] NestJS project initialization
- [x] TypeScript configuration
- [x] TypeORM + PostgreSQL configuration
- [x] Environment variables setup
- [x] Database entities (18 tables):
  - Users (authentication, roles, preferences)
  - Students (enrollment data, pictures)
  - Enrollments (approval workflow)
  - Majors & Topics (Korean, English, Coding)
  - References & ContentBlocks (educational content)
  - Quizzes, QuizQuestions, QuizAttempts
  - UserPoints (gamification)
  - ReadingProgress (tracking)
  - DiscountEligibility & DiscountApplications
  - BlogPosts
  - ContactMessages
  - AdminActivityLog
  - SystemSettings

### Database Seed Script ✓
- [x] Create default majors (Korean, English, Coding)
- [x] Create topics for each major
- [x] Create super admin user

## 🔄 IN PROGRESS / PENDING

### Backend Modules (Next Steps)
- [ ] Authentication Module (JWT, guards, strategies)
- [ ] Users Module (profile, preferences)
- [ ] Students Module (CRUD, pictures upload)
- [ ] Enrollments Module (approval workflow)
- [ ] References Module (content management)
- [ ] Quizzes Module (creation, submission)
- [ ] Reading Progress Module (tracking, validation)
- [ ] Points Module (gamification logic)
- [ ] Discounts Module (eligibility, applications)
- [ ] Blog Module (content management)
- [ ] Contact Module (message handling)
- [ ] Admin Module (activity logging)
- [ ] Analytics Module (reporting)

### Common Utilities
- [ ] Email Service (Gmail)
- [ ] AWS S3 Service (file uploads)
- [ ] Password Service (bcrypt utilities)
- [ ] Telegram Service (optional notifications)

### Frontend
- [ ] Angular 17 project initialization
- [ ] Routing & layouts
- [ ] Authentication pages (login, register, password reset)
- [ ] Home page with Matrix animation
- [ ] References pages (two-column layout)
- [ ] Quiz component with timer
- [ ] Blog pages
- [ ] Contact page
- [ ] Admin dashboard (3 role types)
- [ ] Internationalization (i18n)
- [ ] Dark mode toggle

## 🛠️ SETUP INSTRUCTIONS

### Prerequisites

1. **Install Node.js** (v18+ recommended)
2. **Install PostgreSQL** (v12+ recommended)
3. **Install npm or yarn**

### Step 1: Database Setup

```bash
# Install PostgreSQL (if not installed)
# On Ubuntu/Debian:
sudo apt update
sudo apt install postgresql postgresql-contrib

# On macOS (using Homebrew):
brew install postgresql
brew services start postgresql

# On Windows: Download installer from postgresql.org

# Create database user and database
sudo -u postgres psql

# Inside PostgreSQL prompt:
CREATE USER "237dollar" WITH PASSWORD 'ihave237dollars';
CREATE DATABASE dataforapp OWNER "237dollar";
GRANT ALL PRIVILEGES ON DATABASE dataforapp TO "237dollar";
\q
```

### Step 2: Backend Setup

```bash
# Navigate to backend folder
cd 237dollars-backend

# Install dependencies
npm install

# The .env file is already created with default values
# Update it if needed (Gmail app password, AWS credentials later)

# Run database seed (creates majors, topics, super admin)
npm run seed

# Start development server
npm run start:dev

# Backend will run on http://localhost:3000/api
```

### Step 3: Test Backend

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"...","service":"237dollars-backend"}
```

## 🔐 DEFAULT CREDENTIALS

After running the seed script:

**Super Admin:**
- Email: `admin@237dollars.com`
- Password: `Admin@237dollars`

⚠️ **IMPORTANT:** Change this password in production!

## 📊 DATABASE ENTITIES (18 Tables)

1. **users** - User accounts (students, admins, super admin)
2. **students** - Student information (name, phone, pictures)
3. **enrollments** - Enrollment applications
4. **majors** - Main categories (Korean, English, Coding)
5. **topics** - Subtopics within majors
6. **references** - Educational content
7. **content_blocks** - Content structure (text, images, videos)
8. **quizzes** - Quiz configuration
9. **quiz_questions** - Quiz questions with options
10. **quiz_attempts** - User quiz submissions
11. **user_points** - Gamification points
12. **reading_progress** - Content reading tracking
13. **discount_eligibility** - Discount codes for users
14. **discount_applications** - User discount requests
15. **blog_posts** - Blog content
16. **contact_messages** - Contact form submissions
17. **admin_activity_log** - Admin action tracking
18. **system_settings** - System configuration

## 🎯 USER TYPES & ACCESS CONTROL

### 1. Free Users
- Read up to 8% of references
- Sign up to unlock full content (add 5 people to Telegram)
- Take quizzes
- Earn points (reading + quiz)
- Eligible for discount after completing topic

### 2. Enrolled Students (Paid)
- Full access to enrolled major
- No points tracking
- To access other majors: enroll OR add 5 people

### 3. Super Admin
- Full system access
- Create/manage admins
- Manage students
- System settings

### 4. Student Manager Admin
- Upload student data
- Approve/reject enrollments
- Edit student information
- Request deletions (Super Admin approval)

### 5. Content Manager Admin
- Create/edit/delete references
- Drag-drop content blocks
- Create/edit blog posts
- View analytics

## 🗄️ SEEDED DATA

The seed script creates:

**Korean Major:**
- Reading
- Writing
- Level 1-6 Grammar (6 topics)

**English Major:**
- Beginner
- Intermediate
- Advanced
- IELTS

**Coding Major:**
- Frontend Basic (HTML, CSS, JavaScript)
- Frontend Advanced (HTML, CSS, JavaScript, TypeScript, Angular)
- Python
- Backend (Django, Node.js, NestJS)

## ⚙️ ENVIRONMENT VARIABLES

Located in `237dollars-backend/.env`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=237dollar
DB_PASSWORD=ihave237dollars
DB_NAME=dataforapp

# JWT
JWT_SECRET=237dollars-jwt-secret-key-development-only
JWT_REFRESH_SECRET=237dollars-refresh-secret-key-development-only

# Email (Gmail) - TO BE CONFIGURED
GMAIL_EMAIL=1995hvrd@gmail.com
GMAIL_APP_PASSWORD=

# AWS S3 - TO BE CONFIGURED
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=237dollars-bucket
AWS_S3_REGION=ap-south-1

# CORS
CORS_ORIGIN=http://localhost:4200,http://localhost:3000
```

## 🚧 NEXT STEPS

### Immediate (Current Session):
1. ✅ Basic backend structure
2. ✅ Database entities
3. ✅ Seed script
4. 🔄 Create authentication module
5. 🔄 Create user management modules
6. 🔄 Create content management modules

### Short-term:
- Complete all backend modules
- Set up common utilities (email, S3)
- Initialize Angular frontend
- Create basic UI pages

### Medium-term:
- Implement Matrix animation on homepage
- Build reference content system
- Create quiz system
- Implement gamification

### Long-term:
- Add Telegram bot integration
- Mobile apps (Android/iOS)
- Live classes
- Video courses

## 🐛 TROUBLESHOOTING

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U 237dollar -d dataforapp -h localhost
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Dependencies Installation Failed

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 DEVELOPMENT NOTES

### TypeORM Synchronize
Currently set to `true` in development for auto-schema sync. Set to `false` in production and use migrations.

### Password Hashing
Using bcrypt with 12 rounds. All passwords are hashed before storage.

### JWT Tokens
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry

## 🤝 CONTRIBUTING

This is a private educational platform project. Development is ongoing.

## 📄 LICENSE

Proprietary - All Rights Reserved

---

## 📞 SUPPORT

For setup issues or questions during development, refer to:
- NestJS Documentation: https://docs.nestjs.com
- TypeORM Documentation: https://typeorm.io
- PostgreSQL Documentation: https://www.postgresql.org/docs

---

**Last Updated:** November 2025
**Status:** Backend Core Setup Complete - Modules In Progress
