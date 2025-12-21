<div align="center">

# 🎓 School SAS - Student Administration System

### Modern, Scalable School Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**School SAS** is a comprehensive, modern school management system built with cutting-edge technologies. It streamlines administrative tasks, enhances communication between stakeholders, and provides real-time insights into student performance and school operations.

### 🎯 Built For

- 🏫 **Schools & Educational Institutions**
- 👨‍🏫 **Teachers & Administrators**
- 👨‍👩‍👧‍👦 **Parents & Students**
- 💼 **Accountants & Staff**

---

## ✨ Features

### 👨‍🎓 For Students
- 📊 **Real-time Progress Tracking** - View grades, attendance, and performance analytics
- 📚 **Digital Learning Resources** - Access study materials, textbooks, and previous year questions
- 📅 **Smart Calendar** - Stay updated with events, exams, and holidays
- 📔 **Digital Diary** - Daily homework and class notes
- 🎯 **Syllabus Tracker** - Track completed topics and upcoming lessons

### 👨‍👩‍👧‍👦 For Parents
- 👀 **Child Monitoring** - Track attendance, grades, and overall performance
- 💳 **Online Fee Payment** - Secure payments via Razorpay (UPI, Cards, Net Banking)
- 📱 **Real-time Notifications** - Get instant updates about your child
- 📊 **Progress Reports** - Detailed academic performance insights
- 💬 **Direct Communication** - Connect with teachers and school administration

### 👨‍🏫 For Teachers
- ✅ **Attendance Management** - Quick and easy attendance marking
- 📝 **Marks Entry** - Digital mark sheets and grade management
- 📔 **Digital Diary** - Assign homework and share class notes
- 📚 **Content Management** - Upload study materials and resources
- 📊 **Analytics Dashboard** - Class performance insights

### 💼 For Administrators
- 👥 **Student Management** - Complete student lifecycle management
- 💰 **Fee Management** - Track payments, generate invoices, create ad-hoc fees
- 📈 **Analytics & Reports** - Comprehensive school performance metrics
- 🎓 **Admissions Portal** - Streamlined student onboarding process
- 🔐 **Role-based Access** - Secure, granular permissions

### 💳 Payment Integration
- ✅ **Razorpay Integration** - Secure online payments
- 💳 Multiple payment methods (UPI, Cards, Net Banking, Wallets)
- 🔒 PCI DSS compliant payment processing
- 📊 Real-time payment tracking and reconciliation
- 🧾 Automatic receipt generation

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** CSS Modules, Tailwind CSS
- **State Management:** React Hooks
- **Charts:** Recharts
- **Animations:** Framer Motion

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **API:** RESTful APIs

### Database
- **Primary:** MySQL 8.0
- **ORM:** mysql2 (native driver)
- **Migrations:** SQL scripts

### Payment Gateway
- **Provider:** Razorpay
- **Features:** Orders, Payments, Refunds, Webhooks
- **Security:** HMAC SHA256 signature verification

### DevOps & Tools
- **Package Manager:** npm workspaces
- **Version Control:** Git
- **CI/CD:** GitHub Actions (optional)
- **Containerization:** Docker (optional)
- **Logging:** Pino

### Architecture
- **Pattern:** Monorepo with workspaces
- **Apps:** Multiple Next.js applications
- **Services:** Microservices architecture
- **Packages:** Shared libraries

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/))
- **npm** 9+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vivekk0712/SaaS_Main.git
   cd SaaS_Main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MySQL database**
   ```bash
   # Login to MySQL
   mysql -u root -p

   # Create database and user
   CREATE DATABASE sas;
   CREATE USER 'sas_app'@'localhost' IDENTIFIED BY '9482824040';
   GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;

   # Import schema
   mysql -u sas_app -p9482824040 sas < schema.sql
   ```

4. **Configure environment variables**
   ```bash
   # Copy example env files
   cp .env.example .env
   cp apps/frontend-next/.env.local.example apps/frontend-next/.env.local
   cp razorpay_plugin/.env.example razorpay_plugin/.env

   # Edit .env files with your configuration
   ```

5. **Set up Razorpay (for payments)**
   ```bash
   cd razorpay_plugin
   npm install
   
   # Add Razorpay tables to database
   cd ..
   mysql -u sas_app -p9482824040 sas < razorpay-tables.sql
   ```

6. **Start the development servers**
   ```bash
   # Terminal 1: Start main apps
   npm run dev:stack

   # Terminal 2: Start Razorpay plugin
   cd razorpay_plugin
   npm run dev
   ```

7. **Access the applications**
   - **Main App:** http://localhost:3000
   - **Razorpay Plugin:** http://localhost:5002
   - **Study Service:** http://localhost:3002
   - **Onboarding Service:** http://localhost:3005

---

## 📁 Project Structure

```
SaaS_Main/
├── apps/
│   ├── frontend-next/          # Main school ERP application
│   ├── onboarding-next/         # Student admissions portal
│   ├── students-next/           # Student-specific features
│   └── admissions-form-next/    # Public admission form
├── services/
│   ├── auth-service/            # Authentication service
│   ├── notification-service/    # Notifications & alerts
│   ├── payment-service/         # Payment processing
│   ├── study-service/           # Academic content
│   └── onboarding-service/      # Admissions workflow
├── packages/
│   └── shared-lib/              # Shared utilities & types
├── razorpay_plugin/             # Razorpay payment integration
│   ├── src/
│   │   ├── config/              # Configuration
│   │   ├── domain/              # Domain types
│   │   ├── repositories/        # Database layer
│   │   ├── routes/              # API routes
│   │   └── services/            # Business logic
│   └── sql/                     # Database schema
├── scripts/                     # Utility scripts
├── docs/                        # Documentation
├── .github/                     # GitHub workflows
├── schema.sql                   # Main database schema
├── razorpay-tables.sql         # Razorpay tables
└── README.md                    # You are here!
```

---

## 🎨 User Roles & Access

| Role | Access Level | Key Features |
|------|-------------|--------------|
| **Student** | View Only | Progress, Attendance, Materials, Calendar |
| **Parent** | View + Pay | Child's Progress, Fee Payment, Communication |
| **Teacher** | View + Edit | Attendance, Marks, Diary, Materials |
| **Accountant** | Financial | Fee Management, Payments, Invoices |
| **Admin/Principal** | Full Access | All Features + User Management |
| **Admissions Staff** | Onboarding | Application Review, Fee Setup |

---

## 💳 Payment Setup

### Razorpay Configuration

1. **Get Razorpay API Keys**
   - Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Get your Test/Live API keys

2. **Configure Keys**
   ```env
   # .env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   RAZORPAY_PLUGIN_URL=http://localhost:5002

   # razorpay_plugin/.env
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   PORT=5002
   ```

3. **Test Payment Flow**
   - Login as parent
   - Navigate to Payments page
   - Click "Pay Now" on any fee
   - Use test card: `4111 1111 1111 1111`
   - Complete payment

For detailed setup, see [RAZORPAY_SETUP_GUIDE.md](RAZORPAY_SETUP_GUIDE.md)

---

## 📚 Documentation

- **[Quick Start Guide](RAZORPAY_QUICK_START.md)** - Get up and running in 5 minutes
- **[Setup Guide](SIMPLE_SETUP_GUIDE.md)** - Detailed installation instructions
- **[Architecture](ARCHITECTURE_SIMPLE.md)** - System architecture overview
- **[Razorpay Integration](RAZORPAY_SETUP_GUIDE.md)** - Payment gateway setup
- **[Project Guide](PROJECT_GUIDE.md)** - Development guidelines

---

## 🧪 Testing

### Test Credentials
  
  **Parent Login:**
- Phone: `8431536379`
  - OTP: Any 6 digits (in dev mode)

**Accountant Login:**
- Use credentials from database

**Teacher Login:**
- Use credentials from database

### Test Payment Cards (Razorpay Test Mode)

| Card Number | Result | CVV | Expiry |
|-------------|--------|-----|--------|
| 4111 1111 1111 1111 | ✅ Success | 123 | 12/25 |
| 5555 5555 5555 4444 | ✅ Success | 123 | 12/25 |
| 4000 0000 0000 0002 | ❌ Failure | 123 | 12/25 |

**UPI Test ID:** `success@razorpay`

---

## 🔧 Development

### Available Scripts

```bash
# Install all dependencies
npm install

# Start all development servers
npm run dev:stack

# Build all workspaces
npm run build --workspaces

# Clean all build artifacts
npm run clean

# Run tests (if configured)
npm test
```

### Adding New Features

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check MySQL is running
mysql -u sas_app -p9482824040 -e "SELECT 1"

# Verify credentials in .env file
```

**Port Already in Use**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <process_id> /F
```

**Razorpay Plugin Not Starting**
```bash
cd razorpay_plugin
npm install
npm run dev
```

**Payment Modal Not Opening**
- Check Razorpay plugin is running on port 5002
- Verify Razorpay keys in `.env.local`
- Check browser console for errors

For more troubleshooting, see [FIXED_SETUP.md](FIXED_SETUP.md)

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure code passes linting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Developer:** Vivek Kumar
- **GitHub:** [@Vivekk0712](https://github.com/Vivekk0712)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Razorpay](https://razorpay.com/) - Payment gateway
- [MySQL](https://www.mysql.com/) - Database
- [Vercel](https://vercel.com/) - Deployment platform

---

## 📞 Support

Need help? Here's how to get support:

- 📧 **Email:** support@schoolsas.com
- 💬 **Issues:** [GitHub Issues](https://github.com/Vivekk0712/SaaS_Main/issues)
- 📖 **Documentation:** Check the `/docs` folder
- 💡 **Discussions:** [GitHub Discussions](https://github.com/Vivekk0712/SaaS_Main/discussions)

---

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ Student & Parent portals
- ✅ Teacher dashboard
- ✅ Fee management
- ✅ Razorpay payment integration
- ✅ Attendance tracking
- ✅ Marks management

### Upcoming Features
- 🔄 Mobile app (React Native)
- 🔄 SMS notifications
- 🔄 Email integration
- 🔄 Advanced analytics
- 🔄 AI-powered insights
- 🔄 Multi-language support

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=Vivekk0712/SaaS_Main&type=Date)](https://star-history.com/#Vivekk0712/SaaS_Main&Date)

---

<div align="center">

### Made with ❤️ for Education

**[⬆ Back to Top](#-school-sas---student-administration-system)**

</div>
