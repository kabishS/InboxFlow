# 📥 InboxFlow - AI-Powered Smart Email & Productivity Assistant

InboxFlow is an intelligent, high-utility SaaS email productivity dashboard. It leverages **Groq AI** for lightning-fast email analysis and **Gmail API** integration to transform your inbox into an actionable task and intelligence engine.

---

## 🏗️ Tech Stack & Architecture

```
[ Frontend: HTML5 + CSS3 + Bootstrap 5 + Vanilla JS ]
                         │
                         ▼ (REST API / Fetch)
[ Backend: Node.js + Express.js ]
     │                   │                   │
     ▼                   ▼                   ▼
[ Gmail API ]       [ Groq API ]       [ Supabase ]
(OAuth & Threads)  (AI Summaries &     (Tasks, Deadlines,
                    Task Extraction)    Status & DB)
```

- **Frontend**: HTML5, CSS3 (Custom styling adhering to `DESIGN.md`), Bootstrap 5, Vanilla JavaScript (Modular ES Modules / AJAX API client)
- **Backend API**: Node.js + Express.js REST API
- **Integrations**:
  - 📩 **Gmail API**: OAuth2 authentication, reading email threads, fetching messages, drafting/sending replies.
  - ⚡ **Groq API**: High-speed AI LLM inference (Llama 3 / Mixtral) for email classification, summarization, task extraction, sentiment detection, and draft generation.
  - ⚡ **Supabase**: PostgreSQL database + Auth session storage for synced metadata, generated tasks, deadline tracking, follow-ups, and user settings.

---

## 🎨 UI Modules & Core Features

Based on the design specs in the `/UI` directory, InboxFlow contains 10 core modules:

1. 🔐 **Authentication & OAuth Sync (`login_inbox_flow`)**
   - Google OAuth2 Login with Gmail API scope permissions.
   - Secure session management with Supabase.

2. 📥 **Smart AI Inbox (`smart_inbox_inbox_flow`)**
   - Real-time email thread list with auto-assigned AI priority tags (`HIGH`, `MEDIUM`, `LOW`).
   - Category filtering (`All`, `Important`, `Unread`, `Needs Reply`, `Has Tasks`).
   - Clean, high-contrast Corporate Minimalist layout.

3. 🧠 **Thread Intelligence (`thread_intelligence_inbox_flow`)**
   - Detailed email reader view.
   - Executive AI Summary, Key Takeaways, Action Items, and Sentiment Indicator.

4. 📋 **Task Management (`task_management_inbox_flow`)**
   - Automatically extracted tasks from emails stored in Supabase.
   - Status updates (`To Do`, `In Progress`, `Completed`), assignee, and direct link back to source email thread.

5. ⏰ **Deadline View (`deadline_view_inbox_flow`)**
   - Timeline/Calendar list of date-sensitive action items extracted by Groq AI.
   - Urgency badges and overdue alerts.

6. 🔁 **Follow-ups Engine (`follow_ups_inbox_flow`)**
   - Automated detection of sent emails awaiting responses.
   - Smart reminder triggers and one-click follow-up draft generation.

7. 📊 **Productivity Analytics (`productivity_analytics_inbox_flow`)**
   - Metrics dashboard tracking Email Response Time, Tasks Completed, AI Hours Saved, and Inbox Zero progress.

8. ✍️ **AI Reply Generator (`reply_generator_inbox_flow`)**
   - One-click context-aware response generator (Tones: *Professional*, *Direct*, *Empathetic*, *Decline politely*).

9. 🤖 **AI Copilot Assistant (`ai_copilot_inbox_flow`)**
   - Floating chat bar and drawer allowing natural language queries over your inbox (e.g., *"What did Sarah say about the Q3 budget?"*).

10. 📊 **AI Overview Dashboard (`ai_dashboard_inbox_flow`)**
    - High-level daily briefing summarizing unread priority emails and pending deadlines.

---

## ✨ Proposed Additional Features

Beyond the core requirements, here are recommended high-value features for InboxFlow:

1. 📅 **One-Click Calendar Export (.ics & Google Calendar Sync)**
   - Export extracted deadlines directly to Google Calendar or download an `.ics` file.
2. 🏷️ **Custom AI Classification Rules**
   - Allow users to define custom labels (e.g., *Invoices*, *Recruiting*, *Clients*) for Groq to auto-categorize emails.
3. 🔔 **Smart Push & Email Notifications**
   - Instant alerts for high-priority emails containing urgent deadlines.
4. 🎭 **Custom Tone & Brand Voice Configuration**
   - Save custom response templates and persona settings for the AI Reply Generator.
5. 🔍 **Semantic Vector Search across Emails (via Supabase Vector)**
   - Perform natural language search across past email histories and attachments.

---

## 🛠️ Step-by-Step Implementation Plan

When you say **"process"**, execution will proceed according to the following plan:

### Phase 1: Project Setup & Infrastructure
- Initialize Node.js Express server (`package.json`, environment configurations for Gmail OAuth, Groq API key, Supabase URL/Key).
- Set up Supabase DB schema (`emails`, `tasks`, `deadlines`, `follow_ups`, `user_settings`).
- Configure Bootstrap 5 frontend asset structure (`/public/css`, `/public/js`, `/public/views`).

### Phase 2: Backend Core & Integrations
- **Gmail Service**: Implement OAuth login flow, thread fetcher, message parser, and send/draft handler.
- **Groq AI Service**: Build structured prompt handlers for:
  - Priority & Category Tagging
  - Executive Summaries & Task Extraction
  - Reply Draft Generation
  - Copilot Q&A
- **Supabase Service**: Build CRUD endpoints for storing synced email metadata, tasks, deadlines, and analytics.

### Phase 3: Frontend Development (Bootstrap 5 + JS)
- Build unified responsive layout shell with Fixed Sidebar + Fluid Content Area according to `DESIGN.md`.
- Implement page views:
  - `index.html` / `inbox.html` (Smart Inbox)
  - `thread.html` (Thread Intelligence & Reader)
  - `tasks.html` (Task Board)
  - `deadlines.html` (Deadline Tracker)
  - `followups.html` (Follow-up Manager)
  - `analytics.html` (Productivity Dashboard)
  - `copilot` Drawer & Floating Widget
- Wire up Frontend Vanilla JS client with Express REST API.

### Phase 4: Testing & Verification
- Test Gmail OAuth authorization flow.
- Test Groq AI parsing performance on sample email threads.
- Verify Supabase data persistence and UI responsiveness.

