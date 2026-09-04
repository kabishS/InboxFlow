const { google } = require('googleapis');

/**
 * Build authenticated Gmail client from session tokens
 */
function getGmailClient(tokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Fetch inbox threads with metadata
 */
async function getThreads(tokens, { maxResults = 20, labelIds = ['INBOX'], pageToken = null } = {}) {
  const gmail = getGmailClient(tokens);
  const params = { userId: 'me', maxResults, labelIds };
  if (pageToken) params.pageToken = pageToken;

  const { data } = await gmail.users.threads.list(params);
  if (!data.threads || data.threads.length === 0) return { threads: [], nextPageToken: null };

  // Fetch thread details in parallel
  const threadDetails = await Promise.all(
    data.threads.map(t => gmail.users.threads.get({
      userId: 'me',
      id: t.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date', 'To']
    }))
  );

  return {
    threads: threadDetails.map(({ data: td }) => parseThread(td)),
    nextPageToken: data.nextPageToken || null
  };
}

/**
 * Get a single thread with full message bodies
 */
async function getThread(tokens, threadId) {
  const gmail = getGmailClient(tokens);
  const { data } = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full'
  });
  return parseThreadFull(data);
}

/**
 * Send an email reply or new composed message
 */
async function sendReply(tokens, { threadId, to, subject = '', body = '' }) {
  const gmail = getGmailClient(tokens);
  const { data: profile } = await gmail.users.getProfile({ userId: 'me' });
  const from = profile.emailAddress;

  const emailSubject = threadId && !subject.toLowerCase().startsWith('re:')
    ? `Re: ${subject}`
    : (subject || '(No Subject)');

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${emailSubject}`
  ];

  if (threadId) {
    headers.push(`In-Reply-To: ${threadId}`);
    headers.push(`References: ${threadId}`);
  }

  headers.push('Content-Type: text/plain; charset=utf-8');
  headers.push('');
  headers.push(body);

  const rawEmail = headers.join('\n');
  const encoded = Buffer.from(rawEmail).toString('base64url');

  const requestBody = { raw: encoded };
  if (threadId) {
    requestBody.threadId = threadId;
  }

  const { data } = await gmail.users.messages.send({
    userId: 'me',
    requestBody
  });
  return data;
}


/**
 * Get sent messages for follow-up detection
 */
async function getSentThreads(tokens, maxResults = 20) {
  const gmail = getGmailClient(tokens);
  const { data } = await gmail.users.threads.list({
    userId: 'me',
    maxResults,
    labelIds: ['SENT']
  });
  if (!data.threads) return [];

  const details = await Promise.all(
    data.threads.map(t => gmail.users.threads.get({
      userId: 'me',
      id: t.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date', 'To']
    }))
  );
  return details.map(({ data: td }) => parseThread(td));
}

/**
 * Parse thread metadata into clean object
 */
function parseThread(thread) {
  const msg = thread.messages[thread.messages.length - 1];
  const headers = msg.payload.headers;
  const get = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  return {
    id: thread.id,
    subject: get('Subject') || '(No Subject)',
    from: get('From'),
    to: get('To'),
    date: get('Date'),
    snippet: thread.messages[thread.messages.length - 1].snippet || '',
    messageCount: thread.messages.length,
    labelIds: msg.labelIds || []
  };
}

/**
 * Parse full thread with decoded message bodies
 */
function parseThreadFull(thread) {
  return {
    id: thread.id,
    messages: thread.messages.map(msg => {
      const headers = msg.payload.headers;
      const get = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      return {
        id: msg.id,
        from: get('From'),
        to: get('To'),
        date: get('Date'),
        subject: get('Subject'),
        body: decodeBody(msg.payload),
        labelIds: msg.labelIds || []
      };
    })
  };
}

/**
 * Recursively decode email body from MIME parts
 */
function decodeBody(payload) {
  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
    for (const part of payload.parts) {
      const result = decodeBody(part);
      if (result) return result;
    }
  }
  return '';
}

/**
 * Fetch spam messages from Gmail
 */
async function getSpamThreads(tokens, maxResults = 25) {
  const gmail = getGmailClient(tokens);
  try {
    const { data } = await gmail.users.threads.list({
      userId: 'me',
      maxResults,
      labelIds: ['SPAM']
    });
    if (!data.threads || data.threads.length === 0) return [];

    const details = await Promise.all(
      data.threads.map(t => gmail.users.threads.get({
        userId: 'me',
        id: t.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date', 'To']
      }))
    );
    return details.map(({ data: td }) => parseThread(td));
  } catch (err) {
    return [];
  }
}

/**
 * Delete a thread / move to trash
 */
async function trashThread(tokens, threadId) {
  const gmail = getGmailClient(tokens);
  return gmail.users.threads.trash({
    userId: 'me',
    id: threadId
  });
}

/**
 * Remove SPAM label and add INBOX label (Restore)
 */
async function unspamThread(tokens, threadId) {
  const gmail = getGmailClient(tokens);
  return gmail.users.threads.modify({
    userId: 'me',
    id: threadId,
    requestBody: {
      addLabelIds: ['INBOX'],
      removeLabelIds: ['SPAM']
    }
  });
}

module.exports = {
  getThreads, getThread, sendReply, getSentThreads,
  getSpamThreads, trashThread, unspamThread
};

