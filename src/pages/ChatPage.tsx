import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Search, Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { User } from '@/data/mockData';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { players, coaches, messages, sendMessage } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [messageInput, setMessageInput] = useState('');

  const allUsers = useMemo(() => {
    const list = [...players, ...coaches].filter(u => u.id !== user?.id);
    if (!searchQuery) return list;
    return list.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [players, coaches, user, searchQuery]);

  const currentMessages = useMemo(() => {
    if (!selectedUser || !user) return [];
    return messages.filter(m => 
      (m.from === user.id && m.to === selectedUser.id) || 
      (m.from === selectedUser.id && m.to === user.id) ||
      m.from === 'system'
    );
  }, [messages, selectedUser, user]);

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedUser || !user) return;
    const text = messageInput;
    setMessageInput('');
    await sendMessage(user.id, selectedUser.id, text);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {!selectedUser ? (
        // User List
        <div className="flex-1 overflow-hidden flex flex-col bg-card rounded-lg border border-border p-6">
          <h1 className="text-2xl font-bold mb-4">Messages</h1>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="golf-input w-full pl-9"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2">
            {allUsers.map(u => (
              <button
                key={u.id} 
                onClick={() => setSelectedUser(u)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-sm">{u.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="font-medium text-sm truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                </div>
              </button>
            ))}
            {allUsers.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No users found</p>
            )}
          </div>
        </div>
      ) : (
        // Chat Area
        <div className="flex-1 overflow-hidden flex flex-col bg-card rounded-lg border border-border">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            <button 
              onClick={() => setSelectedUser(null)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="font-bold">{selectedUser.name}</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/20">
            {currentMessages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Start a conversation</p>
              </div>
            )}
            {currentMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.from === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
                  msg.from === user?.id ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent text-foreground'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex gap-2">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="golf-input flex-1 py-2"
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={!messageInput.trim()}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
