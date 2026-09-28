import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useUnread } from '../context/UnreadContext';
import api from '../api/axios';

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

const formatSize = (bytes) =>
  bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;

function AttachmentView({ attachment }) {
  const isImage = attachment.mimeType.startsWith('image/');
  const [src, setSrc] = useState(null);

  const fetchBlob = () =>
    api.get(`/chat/attachments/${attachment.id}`, { responseType: 'blob' });

  useEffect(() => {
    if (!isImage) return;
    let url;
    let cancelled = false;
    fetchBlob()
      .then((res) => {
        if (cancelled) return;
        url = URL.createObjectURL(res.data);
        setSrc(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [attachment.id]);

  const download = async () => {
    try {
      const res = await fetchBlob();
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      // ignore; the file may have been removed
    }
  };

  return (
    <div className="mb-1">
      {isImage && src && (
        <img
          src={src}
          alt={attachment.fileName}
          onClick={download}
          className="max-h-56 max-w-full rounded cursor-pointer"
        />
      )}
      <button
        type="button"
        onClick={download}
        className="block text-left text-xs underline mt-1 break-all"
      >
        {attachment.fileName} ({formatSize(attachment.size)})
      </button>
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const socket = useSocket();
  const { refreshUnread } = useUnread();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newChatSearch, setNewChatSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadConversations = async () => {
    const res = await api.get('/chat/conversations');
    setConversations(res.data);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    api.get('/users/colleagues').then((res) => setUsers(res.data));
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.conversationId === activeId) {
        setMessages((prev) => [...prev, message]);
        api.patch(`/chat/conversations/${activeId}/read`);
      }
      loadConversations();
    };

    const handleDeleted = ({ conversationId }) => {
      if (conversationId === activeId) {
        setActiveId(null);
        setMessages([]);
      }
      loadConversations();
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('conversationDeleted', handleDeleted);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('conversationDeleted', handleDeleted);
    };
  }, [socket, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (id) => {
    setActiveId(id);
    const res = await api.get(`/chat/conversations/${id}/messages`);
    setMessages(res.data);

    await api.patch(`/chat/conversations/${id}/read`);
    loadConversations();
    refreshUnread();
  };

  const startConversation = async (otherUserId) => {
    setError('');
    try {
      const res = await api.post('/chat/conversations', { otherUserId });
      setShowNewChat(false);
      setNewChatSearch('');
      await loadConversations();
      openConversation(res.data.id);
    } catch (err) {
      setError('Failed to start conversation.');
    }
  };

  const toggleGroupMember = (id) => {
    setGroupMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createGroup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/chat/groups', {
        name: groupName,
        memberIds: groupMembers,
      });
      setShowNewGroup(false);
      setGroupName('');
      setGroupMembers([]);
      await loadConversations();
      openConversation(res.data.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group.');
    }
  };

  const deleteGroup = async () => {
    if (!activeConv) return;
    const ok = confirm(
      `Delete the group "${activeConv.name}"? All its messages and files will be permanently removed for everyone.`
    );
    if (!ok) return;

    setError('');
    try {
      await api.delete(`/chat/groups/${activeConv.id}`);
      setActiveId(null);
      setMessages([]);
      await loadConversations();
      refreshUnread();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete group.');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    socket.emit('sendMessage', { conversationId: activeId, content: newMessage });
    setNewMessage('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !activeId) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 1 MB.');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post(`/chat/conversations/${activeId}/attachments`, form);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const getOtherParticipant = (conv) =>
    conv.participants.find((p) => p.user.id !== user.id)?.user;

  const getConversationName = (conv) =>
    conv.isGroup
      ? conv.name || 'Group'
      : getOtherParticipant(conv)?.name || 'Unknown';

  const activeConv = conversations.find((c) => c.id === activeId);
  const canDeleteGroup =
    activeConv?.isGroup &&
    (activeConv.createdBy === user.id || user.role === 'admin');

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-screen">
      {error && (
        <div className="bg-brick/10 border-b border-brick/30 text-brick text-sm px-4 py-2 flex justify-between items-start gap-2">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Conversation list */}
        <div
          className={`${
            activeId ? 'hidden md:flex' : 'flex'
          } w-full md:w-72 border-r border-line bg-white flex-col min-h-0`}
        >
          <div className="p-4 border-b border-line flex justify-between items-center">
            <h2 className="font-semibold text-ink">Chats</h2>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewChat(!showNewChat);
                  setShowNewGroup(false);
                }}
                className="text-xs text-steel font-medium"
              >
                {showNewChat ? 'Cancel' : '+ New'}
              </button>
              <button
                onClick={() => {
                  setShowNewGroup(!showNewGroup);
                  setShowNewChat(false);
                }}
                className="text-xs text-steel font-medium"
              >
                {showNewGroup ? 'Cancel' : '+ Group'}
              </button>
            </div>
          </div>

          {showNewChat && (
            <div className="p-3 border-b border-line">
              <input
                type="text"
                placeholder="Search people..."
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                className="w-full border border-line rounded px-2 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-steel"
              />
              {users.length === 0 && (
                <p className="text-xs text-ink/40">No other users to list yet.</p>
              )}
              {users
                .filter((u) => u.name.toLowerCase().includes(newChatSearch.toLowerCase()))
                .map((u) => (
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

          {showNewGroup && (
            <form onSubmit={createGroup} className="p-3 border-b border-line space-y-2">
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full border border-line rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-steel"
                required
              />
              <p className="text-xs text-ink/50">Select at least 2 people:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {users.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={groupMembers.includes(u.id)}
                      onChange={() => toggleGroupMember(u.id)}
                      className="accent-steel"
                    />
                    {u.name}
                  </label>
                ))}
              </div>
              <button
                type="submit"
                disabled={groupMembers.length < 2 || !groupName.trim()}
                className="w-full bg-steel text-white text-sm rounded py-1.5 font-medium hover:bg-steel-dark disabled:opacity-40"
              >
                Create group
              </button>
            </form>
          )}

          <div className="p-3 border-b border-line">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-line rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-steel"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations
              .filter((conv) =>
                getConversationName(conv).toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((conv) => {
                const lastMsg = conv.messages?.[0];
                const preview = lastMsg
                  ? lastMsg.content ||
                    (lastMsg.attachment ? `Attachment: ${lastMsg.attachment.fileName}` : '')
                  : '';
                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv.id)}
                    className={`flex items-center justify-between w-full text-left px-4 py-3 border-b border-line hover:bg-canvas ${
                      activeId === conv.id ? 'bg-canvas' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`text-sm truncate ${
                          conv.unreadCount > 0 ? 'font-bold text-ink' : 'font-medium text-ink'
                        }`}
                      >
                        {getConversationName(conv)}
                        {conv.isGroup && (
                          <span className="text-[10px] text-ink/40 ml-1 font-normal">Group</span>
                        )}
                      </p>
                      {preview && (
                        <p
                          className={`text-xs truncate ${
                            conv.unreadCount > 0 ? 'text-ink/70' : 'text-ink/40'
                          }`}
                        >
                          {preview}
                        </p>
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-steel text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0 ml-2">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Message thread */}
        <div
          className={`${
            activeId ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col bg-canvas min-w-0 min-h-0`}
        >
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-ink/40">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="px-3 md:px-6 py-3 border-b border-line bg-white flex items-center gap-3">
                <button
                  onClick={() => setActiveId(null)}
                  className="md:hidden text-sm text-steel font-medium shrink-0"
                >
                  Back
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-sm truncate">
                    {activeConv ? getConversationName(activeConv) : ''}
                  </p>
                  {activeConv?.isGroup && (
                    <p className="text-xs text-ink/40 truncate">
                      {activeConv.participants.map((p) => p.user.name).join(', ')}
                    </p>
                  )}
                </div>
                {canDeleteGroup && (
                  <button
                    onClick={deleteGroup}
                    className="text-xs text-brick hover:underline shrink-0"
                  >
                    Delete group
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
                {messages.map((msg) => {
                  const mine = msg.senderId === user.id || msg.sender?.id === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[85%] md:max-w-md ${mine ? 'ml-auto' : ''}`}
                    >
                      {activeConv?.isGroup && !mine && (
                        <p className="text-xs text-ink/40 mb-0.5 px-1">{msg.sender?.name}</p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-lg text-sm break-words ${
                          mine
                            ? 'bg-steel text-white'
                            : 'bg-white border border-line text-ink'
                        }`}
                      >
                        {msg.attachment && <AttachmentView attachment={msg.attachment} />}
                        {msg.content && <p>{msg.content}</p>}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={sendMessage}
                className="p-3 md:p-4 border-t border-line bg-white flex gap-2 items-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/gif,image/webp,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-sm text-steel font-medium px-2 shrink-0 disabled:opacity-40"
                >
                  {uploading ? 'Uploading...' : 'Attach'}
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 min-w-0 border border-line rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel"
                />
                <button
                  type="submit"
                  className="bg-steel text-white px-4 py-2 rounded font-medium hover:bg-steel-dark shrink-0"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}