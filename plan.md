# 📋 InboxFlow — Follow-ups Architecture & Technical Plan.................................

This document explains the design, algorithms, AI prompting, and lifecycle of the **Follow-ups Engine** in InboxFlow.

---

## 1. 🎯 Overview & Purpose

In standard email workflows, once an email is sent, users frequently lose track of threads that require an answer. Important business proposals, client invoices, candidate interview invites, and executive approvals slip through the cracks.

The **Follow-ups Engine** in InboxFlow acts as an automated radar:
1. It continuously monitors your **Sent mailbox** via the **Gmail API**.
2. It detects threads where you asked a question, made a request, or submitted a deliverable, but **have not received a reply**.
3. It estimates how many days the email has been pending, assigns an **Urgency score** (`URGENT`, `STANDARD`, `LOW`), suggests an intelligent **Next Action**, and provides a **1-Click AI Reply Generator** to send a courteous follow-up nudge in seconds.

---

## 2. 🏗️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   1. Ingest Sent Mail                  │
│  Gmail API (/api/gmail/sent) queries labelIds=['SENT'] │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               2. Groq AI Intelligence                  │
│ - Analyzes outgoing intent (question, task, request)   │
│ - Calculates days elapsed without response             │
│ - Assigns urgency: URGENT / STANDARD / LOW             │
│ - Generates suggested nudge action                     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              3. Supabase Database Sync                 │
│  Upserts record into `followups` table with thread_id  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                4. Modern Frontend UI                   │
│  - "Waiting for Me" vs "Waiting for Them" tabs         │
│  - 1-Click "Generate Reply" with Tone selector         │
│  - "Dismiss" action to remove answered items           │
│  - Real-time Follow-up Insights (Response Time, Rate)  │
└────────────────────────────────────────────────────────┘
```

---

## 3. 🔍 Detection Algorithm & AI Prompting

When the user clicks **"Scan Sent"** (or during background sync), the backend executes:

### Step 1: Thread Parsing
The latest outgoing message in each sent thread is extracted, including recipient (`to_email`), subject, date, and message body snippet.

### Step 2: Groq AI LLM Evaluation
The message is evaluated with a targeted prompt:

```json
{
  "needs_followup": true,
  "urgency": "URGENT",
  "suggested_action": "Bump thread: It has been 3 days since Sarah viewed the proposal. A gentle nudge is recommended.",
  "days_pending": 3
}
```

### Step 3: Urgency Classification Rules
- **`URGENT`** (Red Chip): Critical deliverables, executive requests, financial/contract approvals, or items pending > 3 business days.
- **`STANDARD`** (Orange Chip): General business correspondence, internal status updates, pending 1–2 days.
- **`LOW`** (Green Chip): Casual votes, lunch plans, social threads.

---

## 4. ✍️ 1-Click Follow-up Draft Generator

Users can generate personalized follow-up emails in 4 distinct tones:

| Tone | Style & Use Case |
|---|---|
| **Professional** | Standard courteous business reminder (*"Just following up on our previous thread..."*) |
| **Friendly** | Warm and casual (*"Hey Sarah, hope your week is going well! Wanted to quickly check in..."*) |
| **Short** | 1–2 sentence direct nudge (*"Hi Mark, just bumping this to the top of your inbox."*) |
| **Formal** | Structured executive tone suitable for board members and senior clients |

Once generated, the draft can be edited directly in the textarea, copied, or sent immediately using the **Gmail API** (`POST /api/gmail/send`).

---

## 5. 🗄️ Database Schema (`followups` Table in Supabase)

```sql
create table if not exists followups (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text not null,
  thread_id           text not null,
  subject             text,
  to_email            text,
  last_message_date   text,
  urgency             text default 'STANDARD' check (urgency in ('URGENT','STANDARD','LOW')),
  suggested_action    text,
  days_pending        int default 0,
  dismissed           boolean default false,
  created_at          timestamptz default now(),
  unique(user_id, thread_id)
);

create index followups_user_id_idx on followups(user_id);
create index followups_dismissed_idx on followups(dismissed);
```

---

## 6. 📊 Analytics & Insights Panel

The sidebar on the Follow-ups page provides real-time productivity intelligence:
- **Average Response Time**: Average days taken for external contacts to reply to your emails.
- **Success Rate (Nudges)**: Percentage of followed-up emails that successfully receive a response within 48 hours.
- **Pending Total**: Count of currently active unresolved sent items.
- **Activity Distribution**: Visual workload bar breakdown.

---

## 7. 🚀 Lifecycle State Machine

1. **Detected**: New unanswered sent thread detected from Gmail.
2. **Active**: Displayed on `/followups` with suggested action and urgency badge.
3. **Draft Generated**: User triggers AI reply draft with selected tone.
4. **Resolved / Sent**: User approves and sends nudge via Gmail API.
5. **Dismissed**: User clicks "Dismiss" (sets `dismissed: true` in Supabase) or recipient replies.

