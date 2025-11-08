# 237DOLLARS - Educational Learning Platform

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Master Korean, English & Coding for just $237**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Screenshots](#-screenshots)

</div>

---

## 📖 Overview

237DOLLARS is a comprehensive full-stack educational platform designed to help students master Korean, English, and Programming skills. The platform features a complete learning management system with gamification, analytics, multilingual support, and an intuitive user interface.

### 🎯 Key Highlights

- ✅ **100% Complete** - Full-featured production-ready platform
- 🌍 **Multilingual** - Support for 4 languages (EN, UZ, RU, KO)
- 🎮 **Gamified Learning** - Points system with leaderboards and rewards
- 📊 **Advanced Analytics** - Interactive charts and data visualization
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile
- 🔒 **Secure Authentication** - JWT-based auth with password reset
- 📧 **Professional Emails** - Beautiful HTML email templates
- 🎨 **Modern UI/UX** - Dark mode theme with smooth animations

---

## ✨ Features

### For Students

- 🎓 **Personalized Dashboard** - Real-time stats, quick actions, and progress tracking
- 📚 **Interactive Learning** - Browse references by major → topic → detailed content
- ✍️ **Quiz System** - Timed quizzes with instant scoring and feedback
- 🏆 **Points & Leaderboard** - Earn points, compete with peers, win medals
- 🎁 **Discount System** - Earn discount codes based on performance
- 📄 **Document Management** - Upload and manage student documents
- 🔐 **Password Recovery** - Two-step email verification for secure reset
- 🌐 **Language Switching** - Switch between 4 languages seamlessly

### For Administrators

- 📊 **Analytics Dashboard** - Interactive Chart.js visualizations
  - User activity breakdown (doughnut chart)
  - Enrollment status tracking (bar chart)
  - Content overview (line chart)
- 👥 **Student Management** - Approve/reject enrollments with notifications
- 📧 **Email Notifications** - Automated emails for key events
- 📈 **System Monitoring** - Track activity and export data
- ⚙️ **Content Management** - Manage references, quizzes, and blog posts

### For Content Managers

- 📝 **Content Creation** - Rich content editor with multiple block types
- 🧩 **Quiz Builder** - Create quizzes with multiple questions
- 📰 **Blog Publishing** - Publish/unpublish blog posts
- 📊 **Content Analytics** - View engagement metrics

---

## 🛠 Tech Stack

### Backend

- **Framework:** NestJS (Node.js + TypeScript)
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT (Access + Refresh tokens)
- **Email:** Gmail integration
- **Storage:** AWS S3
- **Notifications:** Telegram Bot API
- **Validation:** class-validator, class-transformer

### Frontend

- **Framework:** Angular 17 (Standalone Components)
- **Styling:** SCSS + Bootstrap 5
- **Animations:** Three.js, GSAP
- **Charts:** Chart.js
- **i18n:** @ngx-translate/core
- **HTTP:** HttpClient with interceptors
- **Routing:** Lazy-loaded routes with guards

### Infrastructure

- **Version Control:** Git
- **Package Manager:** npm
- **Environment:** dotenv
- **API Documentation:** RESTful endpoints

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- Angular CLI (`npm install -g @angular/cli`)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/237dollars.git
cd 237dollars
```

### 2. Backend Setup

```bash
cd 237dollars-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Create database
createdb dataforapp

# Run seed script (creates admin + sample data)
npm run seed

# Start development server
npm run start:dev
```

Backend will run on `http://localhost:3000`

**Default Admin:**
- Email: `admin@237dollars.com`
- Password: `Admin@237dollars`

### 3. Frontend Setup

```bash
cd 237dollars-frontend

# Install dependencies
npm install

# Start development server
ng serve
```

Frontend will run on `http://localhost:4200`

### 4. Open Browser

Navigate to `http://localhost:4200` and explore the platform!

---

## 📂 Project Structure

```
237dollars/
├── 237dollars-backend/          # NestJS Backend
│   ├── src/
│   │   ├── modules/            # Feature modules (13 modules)
│   │   ├── common/             # Shared utilities, guards, decorators
│   │   ├── config/             # Configuration files
│   │   └── main.ts             # Application entry point
│   └── package.json
│
├── 237dollars-frontend/         # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Services, guards, interceptors
│   │   │   ├── pages/         # Feature pages (20+ components)
│   │   │   ├── shared/        # Shared components (navbar, footer)
│   │   │   └── app.routes.ts  # Route configuration
│   │   └── assets/
│   │       └── i18n/          # Translation files (4 languages)
│   └── package.json
│
├── DEPLOYMENT_GUIDE.md          # Comprehensive deployment guide
└── README.md                    # This file
```

---

## 📚 Documentation

### API Endpoints

**Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/verify` - Verify reset code

**Students**
- `GET /api/students` - List students (admin)
- `POST /api/students` - Create student (admin)
- `POST /api/students/match` - Match student by details
- `POST /api/students/upload` - Upload document

**Learning**
- `GET /api/references/majors` - Get all majors
- `GET /api/references/majors/:id/topics` - Get topics by major
- `GET /api/references/:id` - Get reference with content
- `GET /api/quizzes/:referenceId` - Get quiz
- `POST /api/quizzes/:id/submit` - Submit quiz answers

**Points & Discounts**
- `GET /api/points/my-points` - Get user points
- `GET /api/points/leaderboard` - Get top students
- `POST /api/discounts/apply` - Apply for discount
- `GET /api/discounts/my-discounts` - Get user discounts

**Analytics**
- `GET /api/analytics/dashboard` - Dashboard stats (admin)
- `GET /api/analytics/students` - Student analytics
- `GET /api/analytics/export` - Export data

For complete API documentation, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🎨 Screenshots

### Student Dashboard
Personalized overview with real-time stats, quick actions, and recent activity.

### Interactive Learning
Browse majors → topics → detailed references with rich content blocks.

### Quiz System
Timed quizzes with instant scoring, progress tracking, and points rewards.

### Points & Leaderboard
Track your progress and compete with peers for top rankings.

### Admin Analytics
Interactive Chart.js visualizations for data-driven decisions.

---

## 🌍 Supported Languages

- 🇺🇸 **English** - Full support
- 🇺🇿 **Uzbek** - O'zbekcha
- 🇷🇺 **Russian** - Русский
- 🇰🇷 **Korean** - 한국어

Over **1000+ translation keys** across all features.

---

## 📊 Platform Statistics

- **Backend Modules:** 13 feature modules
- **Backend Files:** 150+ TypeScript files
- **Frontend Components:** 20+ pages
- **Frontend Files:** 90+ component files
- **Total Lines of Code:** ~20,000+
- **Database Entities:** 18 tables
- **API Endpoints:** 50+ RESTful endpoints
- **Translation Keys:** 1000+ across 4 languages
- **Email Templates:** 5 professional HTML templates
- **Interactive Charts:** 3 Chart.js visualizations

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=237dollar
DB_PASSWORD=ihave237dollars
DB_NAME=dataforapp

# JWT
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key

# Email
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Telegram (Optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

---

## 👥 User Roles

1. **STUDENT** - Access learning materials, take quizzes, earn points
2. **ADMIN** - Full system access and management
3. **SUPER_ADMIN** - Can create other administrators
4. **STUDENT_MANAGER** - Manage students and enrollments
5. **CONTENT_MANAGER** - Manage references, quizzes, and blog

---

## 🧪 Testing

```bash
# Backend tests
cd 237dollars-backend
npm run test

# Frontend tests
cd 237dollars-frontend
ng test
```

---

## 🚢 Deployment

### Backend (Railway, Heroku, DigitalOcean)

```bash
npm run build
npm run start:prod
```

### Frontend (Vercel, Netlify, Firebase)

```bash
ng build --configuration production
```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 📝 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For support, email info@237dollars.com or open an issue in the repository.

---

## ✅ Version History

### v2.0.0 (January 2025)
- ✨ Added comprehensive student dashboard
- 🔐 Implemented password reset flow
- 📊 Integrated Chart.js analytics
- 🌐 Enhanced navigation with i18n
- 🎁 Added discount code management
- 📄 Added document upload system
- 🏆 Enhanced points & leaderboard

### v1.0.0 (November 2024)
- 🎉 Initial release
- ✅ Core learning management system
- ✅ Quiz system with scoring
- ✅ Basic points tracking
- ✅ Blog and contact features
- ✅ Admin dashboard

---

<div align="center">

**Built with ❤️ using NestJS, Angular 17, PostgreSQL, TypeScript, Chart.js**

⭐ **Star this repository if you find it useful!** ⭐

</div>
