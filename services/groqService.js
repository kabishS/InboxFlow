const Groq = require('groq-sdk');
const db = require('./supabaseService');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Models in priority order with automatic fallback on rate limit (429) or error
const FALLBACK_MODELS = [
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'groq/compound-mini',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b'
];

// In-memory cache for ultra-fast repeated loads without token consumption
const memoryCache = new Map();

/**
 * Execute chat completion with multi-model fallback and error recovery
 */
async function callGroqWithFallback(messages, options = {}) {
  const preferredModel = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
  const modelsToTry = [preferredModel, ...FALLBACK_MODELS.filter(m => m !== preferredModel)];

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      const completion = await groq.chat.completions.create({
        messages,
        model,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens ?? 1024
      });
      return completion.choices[0]?.message?.content?.trim() || '';
    } catch (err) {
      lastError = err;
      console.warn(`[Groq Warning] Model ${model} failed (${err.status || err.message}). Trying next fallback...`);
      // If 429 rate limit or 404 or decommissioned, continue to next model immediately
      continue;
    }
  }

  throw lastError || new Error('All Groq AI models exhausted');
}

/**
 * Helper to extract clean JSON even if model includes thoughts or markdown
 */
function extractJSON(rawText) {
  if (!rawText) return null;
  // Remove reasoning thoughts like <think>...</think>
  let clean = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Match the first JSON block {...}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e) {
      // Ignore parse failure
    }
  }
  return null;
}

/**
 * Analyze an email thread - returns priority, summary, tasks, deadline, intent, sentiment
 */
async function analyzeThread(threadData, threadId = null) {
  // Check in-memory cache first
  if (threadId && memoryCache.has(threadId)) {
    return memoryCache.get(threadId);
  }

  // Check Supabase cached analysis
  if (threadId) {
    try {
      const { data: cached } = await db.getCachedAnalysis(threadId);
      if (cached && cached.summary) {
        const result = {
          priority: cached.priority || 'MEDIUM',
          priority_score: cached.priority_score || 50,
          intent: cached.intent || 'Info',
          sentiment: cached.sentiment || 'NEUTRAL',
          summary: Array.isArray(cached.summary) ? cached.summary : [cached.summary],
          tasks: Array.isArray(cached.tasks) ? cached.tasks : [],
          deadline: cached.deadline || null,
          deadline_label: cached.deadline_label || null,
          category: cached.category || 'WORK'
        };
        memoryCache.set(threadId, result);
        return result;
      }
    } catch (e) {
      // Ignore cache lookup error
    }
  }

  // Optimize payload: Take only the last 2 messages and truncate long bodies to save tokens
  const msgs = (threadData.messages || []).slice(-2);
  const truncatedMessages = msgs.map(m => {
    const sender = (m.from || '').slice(0, 100);
    const date = (m.date || '').slice(0, 50);
    const bodySnippet = (m.body || '').replace(/\s+/g, ' ').slice(0, 1200);
    return `From: ${sender}\nDate: ${date}\n${bodySnippet}`;
  }).join('\n\n---\n\n');

  const prompt = `You are an AI email analyst. Analyze this email thread and return ONLY a valid JSON object without markdown:

{
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "priority_score": 75,
  "intent": "Action Required",
  "sentiment": "NEUTRAL",
  "summary": ["Point 1", "Point 2", "Point 3"],
  "tasks": ["Task 1 if any"],
  "deadline": "YYYY-MM-DD or null",
  "deadline_label": "Human readable date or null",
  "category": "WORK" | "PERSONAL" | "FINANCE" | "NEWSLETTER"
}

Email Thread:
${truncatedMessages}`;

  let analysis = null;
  try {
    const raw = await callGroqWithFallback(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, max_tokens: 500 }
    );
    analysis = extractJSON(raw);
  } catch (err) {
    console.error('[Groq Error] analyzeThread:', err.message);
  }

  // Safe fallback if Groq is completely unavailable
  if (!analysis) {
    const firstSnippet = (threadData.messages?.[0]?.body || '').slice(0, 150);
    analysis = {
      priority: 'MEDIUM',
      priority_score: 55,
      intent: 'Update / Info',
      sentiment: 'NEUTRAL',
      summary: [firstSnippet ? firstSnippet + '...' : 'Email received and analyzed.'],
      tasks: [],
      deadline: null,
      deadline_label: null,
      category: 'WORK'
    };
  }

  // Save to memory cache
  if (threadId) {
    memoryCache.set(threadId, analysis);
    // Background persist to Supabase
    db.upsertAnalysis({
      thread_id: threadId,
      priority: analysis.priority,
      priority_score: analysis.priority_score,
      intent: analysis.intent,
      sentiment: analysis.sentiment,
      summary: analysis.summary,
      tasks: analysis.tasks,
      deadline: analysis.deadline,
      deadline_label: analysis.deadline_label,
      category: analysis.category
    }).catch(() => {});
  }

  return analysis;
}

/**
 * Generate a reply draft based on conversation context and tone
 */
async function generateReply(threadData, tone = 'Professional') {
  const msgs = (threadData.messages || []).slice(-2);
  const truncatedMessages = msgs.map(m => {
    const sender = (m.from || '').slice(0, 100);
    const bodySnippet = (m.body || '').replace(/\s+/g, ' ').slice(0, 1000);
    return `From: ${sender}\n${bodySnippet}`;
  }).join('\n\n---\n\n');

  const toneInstructions = {
    Professional: 'Write in a professional, clear and concise business tone.',
    Friendly: 'Write in a warm, approachable and friendly tone.',
    Formal: 'Write in a formal, structured and highly professional tone.',
    Short: 'Write a very short, direct reply in 2-3 sentences maximum.'
  };

  const prompt = `You are an expert email assistant. ${toneInstructions[tone] || toneInstructions.Professional}

Based on this email thread, write ONLY the reply email body (no subject, no headers, no meta explanation). Use "[Your Name]" as signoff placeholder.

Thread:
${truncatedMessages}

Reply:`;

  try {
    const reply = await callGroqWithFallback(
      [{ role: 'user', content: prompt }],
      { temperature: 0.4, max_tokens: 350 }
    );
    // Clean any thoughts if present
    return reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  } catch (err) {
    console.error('[Groq Error] generateReply:', err.message);
    return `Hi,\n\nThank you for your message. I have reviewed the details and will follow up with you shortly.\n\nBest regards,\n[Your Name]`;
  }
}

/**
 * Answer a copilot question using inbox context
 */
async function copilotQuery(question, inboxContext) {
  const context = (inboxContext || []).slice(0, 8).map((t, i) =>
    `[Email ${i + 1}] Subject: ${(t.subject || '').slice(0, 60)} | From: ${(t.from || '').slice(0, 50)} | Snippet: ${(t.snippet || '').slice(0, 100)}`
  ).join('\n');

  const prompt = `You are InboxFlow's AI Copilot. Use this inbox summary to answer the user's question clearly and concisely.

Inbox Context:
${context}

User Question: ${question}

Answer:`;

  try {
    const answer = await callGroqWithFallback(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, max_tokens: 400 }
    );
    return answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  } catch (err) {
    console.error('[Groq Error] copilotQuery:', err.message);
    return `I apologize, but I am currently experiencing high demand with the AI service. Based on your recent emails, please check your urgent tasks and deadlines in the dashboard.`;
  }
}

/**
 * Compose a new email draft based on prompt, tone, and context
 */
async function composeEmail({ to = '', subject = '', prompt: userPrompt = '', tone = 'Professional', keyPoints = '' }) {
  const toneInstructions = {
    Professional: 'Write in a polished, professional, and courteous business tone.',
    Friendly: 'Write in a warm, approachable, collaborative, and friendly tone.',
    Formal: 'Write in an executive, formal, structured, and diplomatic tone.',
    Short: 'Write a very concise, direct email in 2-3 sentences maximum.',
    Executive: 'Write a high-level executive summary style email focused on results and clear decisions.',
    Persuasive: 'Write a persuasive, compelling email highlighting value and clear call to action.'
  };

  const systemPrompt = `You are InboxFlow's AI Email Writer. ${toneInstructions[tone] || toneInstructions.Professional}
Write ONLY the email body. Do not include headers, subject lines, or metadata. Use "[Your Name]" as signoff placeholder.`;

  const userContent = `Recipient: ${to || 'Colleague'}
Subject / Topic: ${subject || 'General'}
User Instructions / Purpose: ${userPrompt}
${keyPoints ? `Key Points to Include:\n${keyPoints}` : ''}

Please write the email body:`;

  try {
    const draft = await callGroqWithFallback(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      { temperature: 0.4, max_tokens: 500 }
    );
    return draft.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  } catch (err) {
    console.error('[Groq Error] composeEmail:', err.message);
    return `Hi,\n\nI am writing regarding ${subject || 'our project'}.\n\n${userPrompt || 'Please let me know if you have any questions.'}\n\nBest regards,\n[Your Name]`;
  }
}

/**
 * Compress an email or long thread into a high-signal digest
 */
async function compressEmail(content) {
  const rawText = typeof content === 'string' ? content : JSON.stringify(content);
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;

  const prompt = `You are an AI Email Compressor and Executive Digest specialist.
Your job is to compress this long email or thread into an ultra-dense, high-signal executive digest.

Return ONLY a valid JSON object matching this exact schema:
{
  "tldr": "1-2 sentence core bottom-line message",
  "key_points": ["Key takeaway point 1", "Key takeaway point 2", "Key takeaway point 3"],
  "action_items": ["Action item with assignee if mentioned"],
  "decision_needed": "What decision or approval is required (or 'None' if purely informational)",
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "suggested_reply": "A concise, ready-to-send 2-sentence response draft"
}

Email Content to Compress:
${rawText.slice(0, 3500)}`;

  try {
    const raw = await callGroqWithFallback(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, max_tokens: 600 }
    );
    const parsed = extractJSON(raw);
    if (parsed) {
      const compressedText = (parsed.tldr || '') + ' ' + (parsed.key_points || []).join(' ');
      const compressedWords = compressedText.trim().split(/\s+/).filter(Boolean).length || 30;
      const reductionPercent = Math.max(10, Math.min(95, Math.round((1 - (compressedWords / Math.max(wordCount, 1))) * 100)));
      const readingMinutesSaved = Math.max(1, Math.round((wordCount - compressedWords) / 200 * 10) / 10);

      return {
        ...parsed,
        original_words: wordCount,
        compressed_words: compressedWords,
        reduction_percent: reductionPercent > 0 ? reductionPercent : 75,
        time_saved_mins: readingMinutesSaved > 0 ? readingMinutesSaved : 2.5
      };
    }
  } catch (err) {
    console.error('[Groq Error] compressEmail:', err.message);
  }

  // Fallback digest
  return {
    tldr: rawText.slice(0, 180) + '...',
    key_points: ['Summary of email discussion', 'Key details reviewed', 'Awaiting next steps'],
    action_items: ['Review correspondence and respond as needed'],
    decision_needed: 'Review required',
    urgency: 'MEDIUM',
    suggested_reply: 'Thanks for the update. I have reviewed the details and will follow up shortly.',
    original_words: wordCount,
    compressed_words: Math.round(wordCount * 0.25) || 25,
    reduction_percent: 75,
    time_saved_mins: 2.0
  };
}

/**
 * Detect if a sent email needs a follow-up
 */
async function detectFollowUp(thread) {
  const msgs = (thread.messages || []).slice(-1);
  const snippet = msgs[0]?.body || thread.snippet || '';
  const truncated = snippet.replace(/\s+/g, ' ').slice(0, 800);

  const prompt = `Analyze this sent email and return ONLY valid JSON:
{
  "needs_followup": true,
  "urgency": "URGENT" | "STANDARD" | "LOW",
  "suggested_action": "Action summary",
  "days_pending": 2
}

Sent email:
${truncated}`;

  try {
    const raw = await callGroqWithFallback(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, max_tokens: 200 }
    );
    const result = extractJSON(raw);
    if (result) return result;
  } catch (err) {
    // Ignore fallback
  }

  return { needs_followup: false, urgency: 'LOW', suggested_action: '', days_pending: 0 };
}

module.exports = {
  analyzeThread,
  generateReply,
  copilotQuery,
  detectFollowUp,
  composeEmail,
  compressEmail
};


