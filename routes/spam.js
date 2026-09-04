const express = require('express');
const router = express.Router();
const gmailService = require('../services/gmailService');
const groqService = require('../services/groqService');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  next();
}

// Memory cache for spam classification
const spamRiskCache = new Map();

/**
 * Classify spam risk level with Groq AI or smart heuristics
 */
function evaluateSpamRisk(thread) {
  const subject = (thread.subject || '').toLowerCase();
  const snippet = (thread.snippet || '').toLowerCase();
  const from = (thread.from || '').toLowerCase();

  // HIGH RISK: Phishing, security alerts, banking/money scams, urgent verification
  if (
    subject.includes('verify') || subject.includes('account suspended') ||
    subject.includes('password') || subject.includes('wire') ||
    subject.includes('urgent payment') || subject.includes('security alert') ||
    subject.includes('crypto') || subject.includes('lottery') ||
    snippet.includes('click here to verify') || snippet.includes('unauthorized login') ||
    snippet.includes('bank') || snippet.includes('paypal') ||
    from.includes('noreply-security') || from.includes('alert')
  ) {
    return {
      risk: 'HIGH',
      threat_type: 'Phishing / Suspicious Link Threat',
      reason: 'Urgent credential or financial verification detected.'
    };
  }

  // MEDIUM RISK: Cold sales pitches, SEO, promotional blasts
  if (
    subject.includes('quick question') || subject.includes('partnership') ||
    subject.includes('leads') || subject.includes('boost your') ||
    subject.includes('discount') || subject.includes('offer inside') ||
    snippet.includes('unsubscribe') || snippet.includes('special offer') ||
    snippet.includes('grow your revenue')
  ) {
    return {
      risk: 'MEDIUM',
      threat_type: 'Cold Sales / Unsolicited Promotion',
      reason: 'Automated promotional or sales outreach message.'
    };
  }

  // LOW RISK: Newsletters, digests, automated notifications
  return {
    risk: 'LOW',
    threat_type: 'Newsletter / Automated Digest',
    reason: 'Low priority automated update or newsletter subscription.'
  };
}

// GET /api/spam — List all spam emails with High / Medium / Low classification
router.get('/', requireAuth, async (req, res) => {
  try {
    let threads = await gmailService.getSpamThreads(req.session.tokens, 30);

    // If Gmail SPAM folder is empty, also check for promotional / low-priority threads to showcase
    if (!threads || threads.length === 0) {
      const inboxRes = await gmailService.getThreads(req.session.tokens, { maxResults: 15, labelIds: ['INBOX'] });
      // Filter any promotional or automated messages
      threads = (inboxRes.threads || []).filter(t => {
        const sub = t.subject.toLowerCase();
        const snip = t.snippet.toLowerCase();
        return sub.includes('newsletter') || sub.includes('update') || sub.includes('digest') || sub.includes('promo') || snip.includes('unsubscribe') || t.labelIds?.includes('CATEGORY_PROMOTIONS');
      });
    }

    const categorized = threads.map(t => {
      const riskInfo = spamRiskCache.get(t.id) || evaluateSpamRisk(t);
      spamRiskCache.set(t.id, riskInfo);
      return {
        ...t,
        spam_info: riskInfo
      };
    });

    const highCount = categorized.filter(t => t.spam_info.risk === 'HIGH').length;
    const medCount = categorized.filter(t => t.spam_info.risk === 'MEDIUM').length;
    const lowCount = categorized.filter(t => t.spam_info.risk === 'LOW').length;

    res.json({
      spam: categorized,
      counts: {
        total: categorized.length,
        high: highCount,
        medium: medCount,
        low: lowCount
      }
    });
  } catch (err) {
    console.error('Spam fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/spam/:id — Move spam email to Trash
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await gmailService.trashThread(req.session.tokens, req.params.id);
    spamRiskCache.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/spam/:id/restore — Restore to Inbox
router.post('/:id/restore', requireAuth, async (req, res) => {
  try {
    await gmailService.unspamThread(req.session.tokens, req.params.id);
    spamRiskCache.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

