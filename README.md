# 📥 InboxFlow — AI-Powered Smart Email & Productivity Assistant

> Transform your email into an actionable task and intelligence engine with lightning-fast AI analysis.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-Llama%203%20%2F%20Mixtral-orange.svg)](https://groq.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)
[![Gmail API](https://img.shields.io/badge/Gmail%20API-OAuth2-EA4335.svg)](https://developers.google.com/gmail/api)

---

## 🌟 Overview

**InboxFlow** is an intelligent, high-utility SaaS email productivity dashboard. It leverages **Groq AI** for ultra-fast email analysis and **Gmail API** integration to convert endless email chains into structured executive summaries, auto-extracted tasks, deadline timelines, follow-up alerts, and context-aware replies.

---

## 🚀 Key Features

- 📥 **Smart AI Inbox**: Real-time email list with automatic AI priority tagging (HIGH, MEDIUM, LOW) and category categorization.
- 🧠 **Thread Intelligence**: Instant executive summaries, key takeaways, action items, and sentiment analysis for complex email chains.
- 📋 **Automated Task Management**: Automatically extract actionable tasks with assignees and statuses (To Do, In Progress, Completed).
- ⏰ **Deadline View**: Chronological tracker of date-sensitive deliverables with urgency badges.
- 🔁 **Follow-Ups Engine**: Detects outgoing emails awaiting replies with one-click follow-up draft generation.
- ✍️ **AI Reply Generator**: Context-aware draft generator with selectable tones (*Professional*, *Direct*, *Empathetic*, *Decline politely*).
- 🤖 **AI Copilot Assistant**: Natural language assistant to query your inbox (e.g., *"What were the budget decisions in yesterday's meeting?"*).
- 📊 **Productivity Analytics**: Real-time stats on response times, tasks completed, and AI hours saved.

---

## 🏗️ Architecture

`
[ Frontend: HTML5 + CSS3 + Bootstrap 5 + Vanilla JS ]
                         │
                         ▼ (REST API / Fetch)
[ Backend: Node.js + Express.js REST API ]
     │                   │                   │
     ▼                   ▼                   ▼
[ Gmail API ]       [ Groq AI ]        [ Supabase ]
(OAuth & Threads)   (Llama 3 / Mixtral (Database &
                     Inference)         Storage)
`

---

## 💻 Local Setup & Installation

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 2. Clone the Repository
`ash
git clone https://github.com/kabishS/InboxFlow.git
cd InboxFlow
`

### 3. Install Dependencies
`ash
npm install
`

### 4. Configure Environment Variables
Copy .env.example to .env and fill in your credentials:
`ash
cp .env.example .env
`

Set the following variables in .env:
`env
PORT=3000
SESSION_SECRET=your_secret_key

# Groq AI API
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b

# Google OAuth / Gmail API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
`

### 5. Run the Server
`ash
npm start
`
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Connect your GitHub repository kabishS/InboxFlow.
3. Set the build configuration:
   - **Runtime**: Node
   - **Build Command**: 
pm install
   - **Start Command**: 
pm start
4. Add your Environment Variables in the Render settings.
5. In your [Google Cloud Console](https://console.cloud.google.com/apis/credentials), add your Render URL callback to Authorized redirect URIs:
   https://<your-render-app-name>.onrender.com/auth/google/callback
6. Click **Deploy**!

---

## 📄 License
MIT License. Feel free to use and customize for your own projects!
