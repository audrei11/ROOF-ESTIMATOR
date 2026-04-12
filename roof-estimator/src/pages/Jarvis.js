import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { gatherContext } from '../utils/jarvisContext';
import { executeActions } from '../utils/jarvisActions';

/* ── Quick suggestion chips ──────────────────────────────────────────── */
const SUGGESTIONS = [
  'Show me all contacts',
  'How many leads do we have?',
  'Who is available for work?',
  'Show me the pipeline status',
  'Open proposals',
  'Log a call with a client',
  'Move a contact to Signed',
  'Create a new contact',
  'Show recent activities',
  'What proposals are pending?',
];

/* ══════════════════════════════════════════════════════════════════════
   JARVIS Page Component
   ══════════════════════════════════════════════════════════════════════ */
export default function Jarvis() {
  const navigate  = useNavigate();
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'jarvis',
      text: "Hello! I'm **JARVIS** — your AI assistant for Ahjin Roofing System.\n\nI have live access to your contacts, pipeline, proposals, employees, workflows, and more. I can answer questions, take actions, and navigate the app for you.\n\nWhat would you like to do?",
      time: now(),
    },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  // Conversation history for multi-turn context (role/content pairs sent to backend)
  const [history, setHistory] = useState([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Send message ──────────────────────────────────────────────────── */
  const send = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput('');
    const userMsg = { id: Date.now(), role: 'user', text: userText, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Gather live app data
      const context = await gatherContext();

      // Call JARVIS backend
      const resp = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, context, history }),
      });

      let data;
      if (resp.ok) {
        data = await resp.json();
      } else {
        data = {
          message: "I couldn't reach the server. Make sure the backend server is running (`npm run start:server`).",
          actions: [],
        };
      }

      const jarvisMsg = {
        id: Date.now() + 1,
        role: 'jarvis',
        text: data.message || "I didn't get a response. Please try again.",
        time: now(),
      };

      setMessages(prev => [...prev, jarvisMsg]);

      // Update conversation history for multi-turn context
      setHistory(prev => [
        ...prev.slice(-14), // keep last 7 turns (14 messages)
        { role: 'user',      content: userText },
        { role: 'assistant', content: data.message || '' },
      ]);

      // Execute any actions (localStorage writes, navigation)
      if (data.actions?.length) {
        executeActions(data.actions, navigate);
      }

    } catch (err) {
      console.error('[JARVIS] fetch error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'jarvis',
          text: "I'm having trouble connecting. Check that the backend server is running on port 3001.",
          time: now(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, history, navigate]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  /* ── Render ────────────────────────────────────────────────────────── */
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="jarvis-status">
            <span className="jarvis-status-dot" />
            AI Online
          </span>
          {history.length > 0 && (
            <button
              onClick={() => { setHistory([]); setMessages(prev => prev.slice(0, 1)); }}
              style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
              title="Clear conversation"
            >
              Clear
            </button>
          )}
        </div>
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

          {/* Typing indicator */}
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
            <button key={s} className="jarvis-suggestion-chip" onClick={() => send(s)} disabled={loading}>
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="jarvis-input-wrap">
          <textarea
            ref={inputRef}
            className="jarvis-input"
            placeholder="Ask JARVIS anything... (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={loading}
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
          JARVIS has live access to your contacts, pipeline, proposals, employees, and workflows.
        </p>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function FormattedText({ text }) {
  // Support **bold**, newlines, and bullet points
  const lines = (text || '').split('\n');
  return (
    <div style={{ margin: 0, lineHeight: 1.7 }}>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const formatted = parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={i}>{part.slice(2, -2)}</strong>
            : part
        );
        return <p key={li} style={{ margin: li === 0 ? 0 : '4px 0 0' }}>{formatted}</p>;
      })}
    </div>
  );
}

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
