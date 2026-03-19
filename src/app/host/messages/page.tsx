'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

const CONVERSATIONS = [
  {
    id: 1, guest: 'Alex Johnson', car: 'Tesla Model 3', avatar: 'AJ', unread: 2, lastTime: '2h ago',
    lastMsg: 'Hi! What time can I pick up tomorrow?',
    messages: [
      { id: 1, from: 'guest', text: 'Hi! I just booked the Tesla Model 3 for 3 days.', time: '9:00 AM', date: 'Mon 10 Mar' },
      { id: 2, from: 'host', text: "Great choice! I'll have it fully charged and ready. Where would you like to pick up?", time: '9:15 AM', date: 'Mon 10 Mar' },
      { id: 3, from: 'guest', text: 'Melbourne Airport T2 works best for me.', time: '9:22 AM', date: 'Mon 10 Mar' },
      { id: 4, from: 'host', text: "Perfect! Meet me at Level 2, short-term parking. I'll send the exact bay number the evening before. 🚗⚡", time: '9:30 AM', date: 'Mon 10 Mar' },
      { id: 5, from: 'guest', text: 'Hi! What time can I pick up tomorrow?', time: '8:45 AM', date: 'Tue 11 Mar' },
    ],
  },
  {
    id: 2, guest: 'Priya Singh', car: 'Toyota Camry', avatar: 'PS', unread: 1, lastTime: '5h ago',
    lastMsg: 'Can I get early pickup at 7am?',
    messages: [
      { id: 1, from: 'guest', text: "Hello! I'd love to pick up the Camry early — around 7am if possible?", time: '7:00 AM', date: 'Mon 10 Mar' },
      { id: 2, from: 'host', text: "Sure! 7am works. I'll leave the key in the lockbox. Code: 4821", time: '7:30 AM', date: 'Mon 10 Mar' },
      { id: 3, from: 'guest', text: 'Can I get early pickup at 7am?', time: '5:10 AM', date: 'Tue 11 Mar' },
    ],
  },
  {
    id: 3, guest: 'James Russo', car: 'BMW X5', avatar: 'JR', unread: 0, lastTime: '1d ago',
    lastMsg: 'Thanks! Great car! ★★★★★',
    messages: [
      { id: 1, from: 'guest', text: 'Just returned the X5 — absolutely loved it! Super smooth and comfortable.', time: '4:00 PM', date: 'Sun 9 Mar' },
      { id: 2, from: 'host', text: 'So glad to hear that! Thanks for taking great care of it. Hope to see you again! 🙏', time: '4:45 PM', date: 'Sun 9 Mar' },
      { id: 3, from: 'guest', text: 'Thanks! Great car! ★★★★★', time: '5:00 PM', date: 'Sun 9 Mar' },
    ],
  },
];

const QUICK_REPLIES = [
  "Hi! Thanks for booking. I'll have everything ready.",
  "Your pickup location is confirmed.",
  "Please make sure to arrive on time.",
  "The key is in the lockbox. Code: 4821",
  "I'll send exact pickup details 24h before.",
  "Please fill up the tank before returning. Thanks!",
];

// ─────────────────────────────────────────────
// Message Bubble
// ─────────────────────────────────────────────
function MessageBubble({ msg, avatar }: { msg: any; avatar: string }) {
  const isHost = msg.from === 'host';
  return (
    <div style={{ display: 'flex', justifyContent: isHost ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
      {!isHost && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#64748b,#94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'white', flexShrink: 0 }}>
          {avatar}
        </div>
      )}
      <div>
        <div className={`msg-bubble ${isHost ? 'msg-host' : 'msg-guest'}`}>{msg.text}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: isHost ? 'right' : 'left' }}>{msg.time}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Conversation Item
// ─────────────────────────────────────────────
function ConversationItem({ conv, isActive, onClick }: { conv: any; isActive: boolean; onClick: () => void }) {
  return (
    <div className={`conv-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,${conv.unread ? '#1d4ed8' : '#64748b'},${conv.unread ? '#059669' : '#94a3b8'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0, position: 'relative' }}>
        {conv.avatar}
        {conv.unread > 0 && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, background: '#ef4444', borderRadius: '50%', fontSize: 9, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
            {conv.unread}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{conv.guest}</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{conv.lastTime}</span>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>🚗 {conv.car}</div>
        <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMsg}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Chat Messages Area
// ─────────────────────────────────────────────
function ChatMessages({ selected, messagesEndRef }: { selected: any; messagesEndRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {selected.messages.map((msg: any, i: number) => {
        const showDate = i === 0 || selected.messages[i - 1].date !== msg.date;
        return (
          <div key={msg.id}>
            {showDate && (
              <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600, margin: '8px 0', letterSpacing: '0.05em' }}>
                {msg.date}
              </div>
            )}
            <MessageBubble msg={msg} avatar={selected.avatar} />
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function HostMessagesPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(CONVERSATIONS[0]);
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected]);

  const sendMessage = (msg?: string) => {
    const content = msg || text.trim();
    if (!content) return;
    const newMsg = {
      id: Date.now(), from: 'host' as const, text: content,
      time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      date: 'Today',
    };
    setConversations(cs => cs.map(c =>
      c.id === selected.id
        ? { ...c, messages: [...c.messages, newMsg], lastMsg: content, lastTime: 'now', unread: 0 }
        : c
    ));
    setSelected(s => ({ ...s, messages: [...s.messages, newMsg] }));
    setText('');
  };

  const handleSelectConv = (conv: any) => {
    setSelected(conv);
    setConversations(cs => cs.map(x => x.id === conv.id ? { ...x, unread: 0 } : x));
  };

  const filtered = conversations.filter(c =>
    c.guest.toLowerCase().includes(search.toLowerCase()) ||
    c.car.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .msg-bubble { max-width: 72%; padding: 11px 16px; border-radius: 18px; font-size: 14px; line-height: 1.55; word-break: break-word; }
        .msg-host { background: linear-gradient(135deg,#1d4ed8,#0d9488); color: white; border-bottom-right-radius: 4px; }
        .msg-guest { background: white; color: #0f172a; border: 1px solid #f1f5f9; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .conv-item { display: flex; gap: 12px; padding: 14px 16px; cursor: pointer; border-radius: 12px; transition: background 0.15s; border-bottom: 1px solid #f8fafc; }
        .conv-item:hover { background: #f8fafc; }
        .conv-item.active { background: linear-gradient(135deg,rgba(29,78,216,0.06),rgba(5,150,105,0.04)); border: 1px solid rgba(29,78,216,0.1); }
        .inp { border: 1.5px solid #e2e8f0; border-radius: 24px; padding: 12px 20px; font-size: 14px; outline: none; color: #0f172a; background: white; resize: none; flex: 1; transition: border-color 0.2s; font-family: inherit; }
        .inp:focus { border-color: #1d4ed8; }
        .send-btn { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg,#1d4ed8,#059669); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
        .send-btn:hover { transform: scale(1.08); }
        .quick-btn { padding: 7px 14px; background: white; border: 1.5px solid #e2e8f0; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; color: #374151; transition: all 0.18s; white-space: nowrap; }
        .quick-btn:hover { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: '#0a0f1e', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
        <Link href="/host/dashboard">
          <Image src="/logo.png" alt="GlideGo" width={95} height={22} style={{ objectFit: 'contain', filter: 'brightness(1.2)' }} />
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>/</span>
        <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Messages</span>
        <div style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20 }}>
          {totalUnread} unread
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ width: 300, borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', background: 'white', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <input
              style={{ width: '100%', border: '1.5px solid #f1f5f9', borderRadius: 10, padding: '9px 14px', fontSize: 13, outline: 'none', background: '#f8fafc', color: '#0f172a' }}
              placeholder="🔍 Search conversations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {filtered.map(c => (
              <ConversationItem
                key={c.id}
                conv={c}
                isActive={selected.id === c.id}
                onClick={() => handleSelectConv(c)}
              />
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat Header */}
          <div style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white' }}>
              {selected.avatar}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{selected.guest}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>🚗 {selected.car} · Active trip</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button style={{ padding: '8px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#15803d', cursor: 'pointer' }}>📞 Call</button>
              <button style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer' }}>📋 Booking</button>
            </div>
          </div>

          {/* Messages */}
          <ChatMessages selected={selected} messagesEndRef={messagesEndRef} />

          {/* Quick Replies */}
          <div style={{ padding: '12px 24px 10px', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {QUICK_REPLIES.map((r, i) => (
              <button key={i} className="quick-btn" onClick={() => sendMessage(r)}>
                {r.slice(0, 30)}{r.length > 30 ? '…' : ''}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 24px 16px', background: 'white', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              className="inp"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Message ${selected.guest}...`}
              rows={1}
              style={{ lineHeight: 1.5 }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button className="send-btn" onClick={() => sendMessage()} title="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="m22 2-7 20-4-9-9-4 20-7z" /><path d="m22 2-11 11" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
