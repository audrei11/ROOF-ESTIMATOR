import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SUGGESTIONS = [
  'Go to Proposals',
  'Show me my contacts',
  'Open Measurements',
  'Go to Jobs',
  'Open Calendar',
  'Go to Invoices',
];

// Simple rule-based engine (will be replaced by Claude API)
function processCommand(input, navigate) {
  const msg = input.toLowerCase().trim();

  const routes = [
    { keywords: ['home', 'dashboard'],             path: '/',               label: 'Home' },
    { keywords: ['job', 'jobs', 'pipeline'],        path: '/jobs',           label: 'Jobs' },
    { keywords: ['calendar', 'schedule'],           path: '/calendar',       label: 'Calendar' },
    { keywords: ['measurement', 'measure', 'roof'], path: '/measurements',   label: 'Measurements' },
    { keywords: ['proposal', 'proposals', 'quote'], path: '/proposals',      label: 'Proposals' },
    { keywords: ['new proposal', 'create proposal'],path: '/proposals/new',  label: 'New Proposal' },
    { keywords: ['pdf', 'signer', 'sign'],          path: '/pdf-signer',     label: 'PDF Signer' },
    { keywords: ['material', 'order', 'orders'],    path: '/material-orders',label: 'Material Orders' },
    { keywords: ['work order'],                     path: '/work-orders',    label: 'Work Orders' },
    { keywords: ['invoice', 'invoices', 'billing'], path: '/invoices',       label: 'Invoices' },
    { keywords: ['contact', 'contacts', 'lead'],    path: '/contacts',       label: 'Contacts' },
    { keywords: ['file', 'manager', 'files'],       path: '/file-manager',   label: 'File Manager' },
    { keywords: ['communication', 'message'],       path: '/communications', label: 'Communications' },
    { keywords: ['performance', 'analytics'],       path: '/performance',    label: 'Performance' },
    { keywords: ['setting', 'settings'],            path: '/settings',       label: 'Settings' },
  ];

  for (const route of routes) {
    if (route.keywords.some(k => msg.includes(k))) {
      setTimeout(() => navigate(route.path), 800);
      return {
        text: `Navigating to **${route.label}**...`,
        action: 'navigate',
        path: route.path,
      };
    }
  }

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return { text: "Hello! I'm JARVIS, your roofing business assistant. How can I help you today?" };
  }
  if (msg.includes('help') || msg.includes('what can you do')) {
    return {
      text: `Here's what I can do right now:\n\n• **Navigate** — "Go to Proposals", "Open Contacts"\n• **Create** — "New Proposal", "Add Contact"\n• **Search** — coming soon\n• **AI Actions** — coming soon (needs API key)`,
    };
  }
  if (msg.includes('thank')) {
    return { text: "You're welcome! Anything else I can help with?" };
  }

  return {
    text: `I understood: "${input}"\n\nFull AI capabilities coming soon. For now I can navigate the app — try saying **"Go to Contacts"** or **"Open Proposals"**.`,
  };
}

export default function Jarvis() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1, role: 'jarvis',
      text: "Hello! I'm **JARVIS**, your AI assistant for Precision Roofing.\n\nI can navigate the app, manage your contacts, create proposals, and more.\n\nWhat would you like to do today?",
      time: now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText) return;

    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userText, time: now() }]);
    setLoading(true);

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    const result = processCommand(userText, navigate);
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'jarvis', text: result.text, time: now() }]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="jarvis-page">

      {/* ── Header ── */}
      <div className="jarvis-header">
        <div className="jarvis-header-left">
          <div className="jarvis-orb">
            <div className="jarvis-orb-ring" />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
          </div>
          <div>
            <h1 className="jarvis-title">JARVIS</h1>
            <p className="jarvis-subtitle">Just A Rather Very Intelligent System</p>
          </div>
        </div>
        <span className="jarvis-status">
          <span className="jarvis-status-dot" />
          Online
        </span>
      </div>

      {/* ── Chat Window ── */}
      <div className="jarvis-chat">

        {/* Messages */}
        <div className="jarvis-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`jarvis-msg jarvis-msg-${msg.role}`}>
              {msg.role === 'jarvis' && (
                <div className="jarvis-msg-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                  </svg>
                </div>
              )}
              <div className="jarvis-msg-body">
                <div className="jarvis-msg-bubble">
                  <FormattedText text={msg.text} />
                </div>
                <span className="jarvis-msg-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="jarvis-msg jarvis-msg-jarvis">
              <div className="jarvis-msg-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                </svg>
              </div>
              <div className="jarvis-msg-body">
                <div className="jarvis-msg-bubble jarvis-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="jarvis-suggestions">
          {SUGGESTIONS.map(s => (
            <button key={s} className="jarvis-suggestion-chip" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="jarvis-input-wrap">
          <textarea
            ref={inputRef}
            className="jarvis-input"
            placeholder="Ask JARVIS anything... (Enter to send)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            className="jarvis-send-btn"
            onClick={() => send()}
            disabled={!input.trim() || loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <p className="jarvis-disclaimer">
          JARVIS is currently in basic mode. Connect a Claude API key to unlock full AI capabilities.
        </p>
      </div>
    </div>
  );
}

function FormattedText({ text }) {
  // Bold **text** support
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : part
      )}
    </p>
  );
}

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
