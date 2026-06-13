import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Search, Send, User as UserIcon } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-4 overflow-hidden relative">
      {/* Sidebar - User List */}
      <div className={`w-full md:w-1/3 flex-col bg-sidebar rounded-xl border border-border shadow-sm overflow-hidden absolute md:relative z-10 h-full transition-transform ${selectedUser ? '-translate-x-full md:translate-x-0' : 'translate-x-0 flex'}`}>
        <div className="p-4 border-b border-border bg-sidebar-accent/30">
          <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-3">
            Messages
          </h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search username or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="golf-input w-full pl-9 py-2 text-sm bg-background"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {allUsers.map(u => (
            <div 
              key={u.id} 
              onClick={() => setSelectedUser(u)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedUser?.id === u.id ? 'bg-primary/10 border-primary/20 border' : 'hover:bg-sidebar-accent'}`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                <span className="font-bold text-slate-300">{u.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{u.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
              </div>
            </div>
          ))}
          {allUsers.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">No users found.</p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`w-full md:w-2/3 flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden absolute md:relative z-20 h-full transition-transform ${!selectedUser ? 'translate-x-full md:translate-x-0' : 'translate-x-0 flex'}`}>
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border bg-sidebar-accent/30 flex items-center gap-3">
              <button 
                onClick={() => setSelectedUser(null)} 
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-sidebar-accent/50 text-foreground"
              >
                ←
              </button>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                <span className="font-bold text-slate-300">{selectedUser.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-bold font-display">{selectedUser.name}</p>
                <p className="text-xs text-green-400">Online</p>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/20">
              {currentMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.from === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-2 text-sm shadow-sm ${
                    msg.from === 'system' ? 'bg-muted text-muted-foreground w-full text-center text-xs mx-auto' :
                    msg.from === user?.id ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-sidebar-accent text-foreground border border-border rounded-tl-sm'
                  }`}>
                    {msg.text}
                    {msg.from !== 'system' && (
                      <p className={`text-[10px] mt-1 text-right ${msg.from === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {msg.time}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {currentMessages.length === 1 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Start a conversation with {selectedUser.name}!</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-sidebar-accent/30 border-t border-border flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="golf-input flex-1 py-2 text-sm"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={!messageInput.trim()}
                className="w-10 h-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Select a user from the list to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
