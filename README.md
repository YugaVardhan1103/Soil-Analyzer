# TerraScan: Soil Intelligence Platform 🌍🌾

TerraScan is a professional, data-driven soil analysis and agricultural advisory platform. It connects farmers with experts and provides administrators with bird's-eye oversight of regional agricultural health.

## 🚀 Features

### For Farmers
- **Precision Analysis**: Get instant crop recommendations based on N, P, K, and pH levels.
- **Expert Inbox**: Receive direct, actionable advisories from certified agricultural experts.
- **Soil History**: Track the progression of your land's health over time.

### For Experts
- **Data-Driven Dashboard**: Real-time KPIs for pending reports, advisory coverage, and farmer engagement.
- **High-Fidelity Analytics**: Regional trends for Nitrogen levels, crop distribution, and pH shifts (Month-by-month and Daily).
- **Global Broadcast**: Send urgent, system-wide alerts to all farmers with one click.

### For Administrators
- **System Governance**: Manage users (Farmers & Experts) and audit all system activities.
- **Audit Logging**: Traceable record of every administrative action for maximum accountability.
- **Global Communication**: Target specific roles for critical system updates.

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Styling**: Premium Glassmorphism UI (Vanilla CSS)
- **Security**: Role-Based Access Control (RBAC), bcrypt encryption.

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YourUsername/Soil-Analyzer.git
   cd Soil-Analyzer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_secret_key
   SEED_DB=true # Set to true on first run to populate demo data
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

## 🌐 Deployment
This project is production-ready for **Render**, **Vercel**, or **Heroku**.
- **Render**: Connect your GitHub repo; it will automatically use `npm start`.
- **Vercel**: Use the provided `vercel.json` for serverless deployment.
