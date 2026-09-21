import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';

export default function Chat() {
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    const res = await api.get('/chat/conversations');
    setConversations(res.data);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/users').then((res) => setUsers(res.data.filter((u) => u.id !== user.id)));
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !activeId) return;

    socket.emit('joinConversation', activeId);

    const handleNewMessage = (message) => {
      if (message.conversationId === activeId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (id) => {
    setActiveId(id);
    const res = await api.get(`/chat/conversations/${id}/messages`);
    setMessages(res.data);
  };

  const startConversation = async (otherUserId) => {
    const res = await api.post('/chat/conversations', { otherUserId });
    setShowNewChat(false);
    await loadConversations();
    openConversation(res.data.id);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    socket.emit('sendMessage', { conversationId: activeId, content: newMessage });
    setNewMessage('');
  };

  const getOtherParticipant = (conv) =>
    conv.participants.find((p) => p.user.id !== user.id)?.user;

  return (
    <div className="flex h-screen">
      <div className="w-72 border-r border-line bg-white flex flex-col">
        <div className="p-4 border-b border-line flex justify-between items-center">
          <h2 className="font-semibold text-ink">Chats</h2>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="text-xs text-steel font-medium"
          >
            {showNewChat ? 'Cancel' : '+ New'}
          </button>
        </div>

        {showNewChat && (
          <div className="p-3 border-b border-line">
            {users.length === 0 && (
              <p className="text-xs text-ink/40">
                No users to list (only admins can browse all users right now).
              </p>
            )}
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => startConversation(u.id)}
                className="block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-canvas"
              >
                {u.name} <span className="text-ink/40 text-xs">({u.role})</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const lastMsg = conv.messages?.[0];
            return (
              <button
                key={conv.id}
                onClick={() => openConversation(conv.id)}
                className={`block w-full text-left px-4 py-3 border-b border-line hover:bg-canvas ${
                  activeId === conv.id ? 'bg-canvas' : ''
                }`}
              >
                <p className="font-medium text-sm text-ink">{other?.name || 'Unknown'}</p>
                {lastMsg && (
                  <p className="text-xs text-ink/40 truncate">{lastMsg.content}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-canvas">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-ink/40">
            Select a conversation
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-md ${msg.senderId === user.id || msg.sender?.id === user.id ? 'ml-auto' : ''}`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg text-sm ${
                      msg.senderId === user.id || msg.sender?.id === user.id
                        ? 'bg-steel text-white'
                        : 'bg-white border border-line text-ink'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-line bg-white flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel"
              />
              <button type="submit" className="bg-steel text-white px-4 py-2 rounded font-medium hover:bg-steel-dark">
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}