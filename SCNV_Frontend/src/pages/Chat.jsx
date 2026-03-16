import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Loader2, Plus, MessageSquare, ChevronLeft, Upload } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import WelcomeScreen from '../components/WelcomeScreen';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import { fetchSessions, loadSession, saveSession, sendMessage, uploadDocument } from '../api/api';
import { generateId, getTimeLabel } from '../utils/helpers';
import { STORAGE_KEYS } from '../config/constants';
import '../styles/chat.css';
import '../styles/sidebar.css';
import '../styles/components.css';

function ChatPage() {
  const navigate = useNavigate();

  // ── Auth data from localStorage ──────────────────────────────────────────────
  const authData = {
    token: localStorage.getItem(STORAGE_KEYS.TOKEN),
    role: localStorage.getItem(STORAGE_KEYS.ROLE),
    email: localStorage.getItem(STORAGE_KEYS.EMAIL),
  };

  // ── State ────────────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const refreshSessions = useCallback(async () => {
    try {
      const list = await fetchSessions();
      setSessions(list);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, []);

  const handleLoadSession = useCallback(async (sessionId) => {
    try {
      const data = await loadSession(sessionId);
      setCurrentSessionId(sessionId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  }, []);

  const persistSession = useCallback(
    async (sessionId, msgs) => {
      if (!sessionId || msgs.length === 0) return;
      try {
        await saveSession({ sessionId, messages: msgs });
        await refreshSessions();
      } catch (err) {
        console.error('Failed to save session:', err);
      }
    },
    [refreshSessions],
  );

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const sessionId = currentSessionId || generateId();

    if (!currentSessionId) setCurrentSessionId(sessionId);
    setInput('');

    const userMsg = { role: 'user', content: userMessage, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data = await sendMessage(userMessage, sessionId);
      const botMsg = {
        role: 'assistant',
        content: data.answer || 'No response',
        sources: data.sources || [],
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const updated = [...prev, botMsg];
        persistSession(sessionId, updated);
        return updated;
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: 'Error: ' + (err.response?.data?.detail || 'Failed to get response'),
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, currentSessionId, persistSession]);

  // ── File upload ──────────────────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadDocument(file);
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `✅ Successfully uploaded "${file.name}". Processing in progress.`,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `❌ Upload failed: ${err.response?.data?.detail || 'Unknown error'}`,
          timestamp: Date.now(),
        },
      ]);
    }

    e.target.value = '';
  }, []);

  // ── New chat ─────────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    navigate('/login');
  }, [navigate]);

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => { refreshSessions(); }, [refreshSessions]);
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="chat-page">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.csv,.doc,.docx,.json,.xlsx"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Global Sidebar (Dashboard/Chat only) */}
      <Sidebar
        authData={authData}
        onLogout={handleLogout}
        onUploadClick={() => fileInputRef.current?.click()}
        collapsed={!!selectedAgent}
      />

      {/* Main Container */}
      <main className="chat-main" style={{ flexDirection: selectedAgent ? 'row' : 'column' }}>
        {!selectedAgent ? (
          /* Initial View: Agent Selection */
          <div className="explore-agents-wrapper">
            <WelcomeScreen onSelectAgent={setSelectedAgent} />
          </div>
        ) : (
          /* Chat View: Specific Agent active */
          <>
            {/* Inner Local Sidebar for Session History */}
            <aside className="chat-sub-sidebar">
              <div className="sub-sidebar__header">
                <button className="back-btn-v2" onClick={() => setSelectedAgent(null)}>
                  <ChevronLeft size={16} /> <span>Back</span>
                </button>
                <div className="agent-identity">
                  <div className="agent-icon-v2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    {selectedAgent.icon}
                  </div>
                  <div className="agent-info-v2">
                    <div className="agent-name-v2">{selectedAgent.title}</div>
                    <div className="agent-status-v2">Online & Ready</div>
                  </div>
                </div>
              </div>

              {/* Spacer to push everything to the bottom */}
              <div style={{ flex: 1 }} />

              <div className="sidebar__new-btn-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn btn-full btn-light-solid" onClick={handleNewChat}>
                  <Plus size={16} /> New Session
                </button>
                {authData && authData.role === 'Admin' && (
                  <button className="btn btn-outline btn-full btn-light-outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} /> Upload Data
                  </button>
                )}
              </div>

              <div className="sidebar__history sidebar__history--light">
                <div className="section-label section-label--light">Recent Sessions</div>
                {sessions.length === 0 ? (
                  <div className="sidebar__empty sidebar__empty--light">No session history yet</div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.session_id}
                      className={`session-item session-item--light ${session.session_id === currentSessionId ? ' session-item--active-light' : ''}`}
                      onClick={() => handleLoadSession(session.session_id)}
                    >
                      <div className="session-item__header">
                        <MessageSquare
                          size={14}
                          color={session.session_id === currentSessionId ? '#fff' : 'rgba(255,255,255,0.7)'}
                        />
                        <div className="session-item__title">{session.title || 'Untitled Session'}</div>
                      </div>
                      <div className="session-item__time">{getTimeLabel(session.updated_at)}</div>
                    </div>
                  ))
                )}
              </div>
            </aside>

            {/* Actual Chat Content */}
            <div className="chat-content-v2">
              <div className="chat-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="agent-avatar-small" style={{ backgroundColor: selectedAgent.bgColor }}>{selectedAgent.icon}</div>
                  <div>
                    <div className="chat-topbar__title">
                      {currentSessionId ? 'Active Session' : 'New Session'}
                    </div>
                    <div className="chat-topbar__subtitle">
                      Powered by {selectedAgent.title}
                    </div>
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                <div className="chat-messages__inner">
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--color-muted)' }}>
                      <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Start a conversation with <strong>{selectedAgent.title}</strong></p>
                      <p>Type your query below to get intelligent insights on your supply chain.</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <MessageBubble key={idx} msg={msg} />
                  ))}

                  {isLoading && (
                    <div className="message-row message-row--system">
                      <div className="msg-avatar msg-avatar--bot">
                        <Loader2 size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                      <div className="typing-bubble">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                disabled={isLoading}
              />
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .chat-sub-sidebar {
          width: 300px;
          border-right: 1px solid var(--color-border);
          background: linear-gradient(180deg, #005596 0%, #008CCA 100%);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          color: white;
        }

        .chat-content-v2 {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: white;
        }

        .sub-sidebar__header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .back-btn-v2 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 6px 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          width: fit-content;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .back-btn-v2:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateX(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .agent-identity {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 4px 0;
        }

        .agent-icon-v2 {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .agent-info-v2 {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .agent-name-v2 {
          font-size: 17px;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
        }

        .agent-status-v2 {
          font-size: 10px;
          color: #4ade80; /* Brighter green for "Online" */
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .agent-status-v2::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          background-color: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 8px #4ade80;
        }

        .btn-light-solid {
          background-color: white;
          color: #005596;
          font-weight: 700;
        }

        .btn-light-solid:hover {
          background-color: rgba(255, 255, 255, 0.9);
        }

        .btn-light-outline {
          border-color: rgba(255, 255, 255, 0.4);
          color: white;
        }

        .btn-light-outline:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .sidebar__history--light .section-label--light {
          color: rgba(255, 255, 255, 0.7);
        }

        .sidebar__empty--light {
          color: rgba(255, 255, 255, 0.6);
        }

        .session-item--light {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .session-item--light:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .session-item--active-light {
          background: rgba(255, 255, 255, 0.2);
          border-color: white;
        }

        .session-item--light .session-item__title {
          color: rgba(255, 255, 255, 0.9);
        }

        .session-item--active-light .session-item__title {
          color: white;
        }

        .session-item--light .session-item__time {
          color: rgba(255, 255, 255, 0.6);
        }

        .agent-avatar-small {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
      `}</style>
    </div>
  );
}

export default ChatPage;
