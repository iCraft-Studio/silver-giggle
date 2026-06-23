import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, ArrowLeft, User, PawPrint, MessageSquare, X, ImagePlus, Loader2, Check, CheckCheck } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// --- TYPES ---
type UserProfile = {
  id: string;
  full_name: string;
  avatar_url: string;
  is_verified?: boolean;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content?: string;
  image_url?: string;
  created_at: string;
  read: boolean;
};

type Conversation = {
  id: string;
  other_user: UserProfile;
  last_message: string;
  updated_at: string;
  unread: boolean;
};

// --- SKELETON LOADERS ---
const SidebarSkeleton = () => (
  <div className="flex items-center space-x-4 p-4 border-b border-gray-50/50">
    <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse flex-shrink-0"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-100 rounded-full animate-pulse w-1/2"></div>
      <div className="h-3 bg-gray-100 rounded-full animate-pulse w-3/4"></div>
    </div>
  </div>
);

// --- IMAGE COMPRESSOR ---
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        // Compress chat images to max 800px to keep messaging lightning fast
        if (width > height && width > 800) { height *= 800 / width; width = 800; }
        else if (height > 800) { width *= 800 / height; height = 800; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (blob) resolve(new File([blob], `${Date.now()}-chat.jpeg`, { type: 'image/jpeg' }));
          else reject(new Error('Compression failed'));
        }, 'image/jpeg', 0.7); // 70% quality
      };
    };
    reader.onerror = reject;
  });
};

export const Messages: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetedSellerId = searchParams.get('user');
  const navigate = useNavigate();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Realtime & Upload States
  const [loadingChats, setLoadingChats] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // --- 1. AUTHENTICATION ---
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      } else {
        setLoadingChats(false);
      }
    };
    fetchUser();
  }, []);

  // --- 2. PRESENCE (TRUE ONLINE STATUS) ---
  useEffect(() => {
    if (!currentUserId) return;

    const presenceChannel = supabase.channel('global-presence', {
      config: { presence: { key: currentUserId } },
    });

    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      // presenceState keys are the user IDs we set in the config above
      setOnlineUsers(new Set(Object.keys(state)));
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUserId]);

  // --- 3. INITIALIZE INBOX ---
  useEffect(() => {
    if (!currentUserId) return;

    const initializeInbox = async () => {
      setLoadingChats(true);
      
      try {
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false })
          .limit(100);

        let chatPartners = new Map<string, Conversation>();

        if (recentMessages) {
          for (const msg of recentMessages) {
            const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
            
            if (!chatPartners.has(partnerId)) {
              // Get the actual avatar_url and verification status from the users table
              const { data: profile } = await supabase.from('users').select('id, full_name, avatar_url, is_verified').eq('id', partnerId).single();
              
              if (profile) {
                chatPartners.set(partnerId, {
                  id: partnerId,
                  other_user: profile,
                  last_message: msg.content || 'Sent an attachment',
                  updated_at: msg.created_at,
                  unread: msg.receiver_id === currentUserId && !msg.read
                });
              }
            }
          }
        }

        let loadedConversations = Array.from(chatPartners.values());

        if (targetedSellerId) {
          const existingChat = loadedConversations.find(c => c.id === targetedSellerId);
          if (existingChat) {
            setActiveChat(existingChat);
          } else {
            const { data: sellerData } = await supabase
              .from('users')
              .select('id, full_name, avatar_url, is_verified')
              .eq('id', targetedSellerId)
              .single();

            if (sellerData) {
              const newTargetChat: Conversation = {
                id: sellerData.id,
                other_user: sellerData,
                last_message: 'Start a conversation...',
                updated_at: new Date().toISOString(),
                unread: false
              };
              setActiveChat(newTargetChat);
              loadedConversations = [newTargetChat, ...loadedConversations];
            }
          }
        }

        setConversations(loadedConversations);
      } catch (error) {
        console.error("Error loading inbox:", error);
      } finally {
        setLoadingChats(false);
      }
    };

    initializeInbox();
  }, [currentUserId, targetedSellerId]);

  // --- 4. LOAD MESSAGES FOR ACTIVE CHAT ---
  useEffect(() => {
    if (!activeChat || !currentUserId) return;

    const fetchChatHistory = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);

        const unreadIds = data.filter(m => m.sender_id === activeChat.id && !m.read).map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase.from('messages').update({ read: true }).in('id', unreadIds);
          setConversations(prev => prev.map(c => c.id === activeChat.id ? { ...c, unread: false } : c));
        }
      }
    };

    fetchChatHistory();
  }, [activeChat, currentUserId]);

  // --- 5. REALTIME WEBSOCKETS ---
  useEffect(() => {
    if (!activeChat || !currentUserId) return;

    const messageChannel = supabase.channel(`messages-${activeChat.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUserId}` },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
          await supabase.from('messages').update({ read: true }).eq('id', newMsg.id);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${currentUserId}` },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage;
          setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        }
      )
      .subscribe();

    const typingChannel = supabase.channel(`typing-${activeChat.id}`)
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          if (payload.payload.user_id !== currentUserId) {
            setIsTyping(payload.payload.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [activeChat, currentUserId]);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    if (activeChat && currentUserId) {
      supabase.channel(`typing-${activeChat.id}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: currentUserId, is_typing: true },
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        supabase.channel(`typing-${activeChat.id}`).send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: currentUserId, is_typing: false },
        });
      }, 2000);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeChat || !currentUserId) return;

    const content = newMessage;
    const tempId = `temp-${Date.now()}`;
    setNewMessage(''); 

    supabase.channel(`typing-${activeChat.id}`).send({
      type: 'broadcast', event: 'typing', payload: { user_id: currentUserId, is_typing: false },
    });

    const tempMessage: ChatMessage = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: activeChat.id,
      content: content,
      created_at: new Date().toISOString(),
      read: false
    };

    setMessages((prev) => [...prev, tempMessage]);

    const { data, error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: activeChat.id,
      content: content
    }).select().single();

    if (!error && data) {
      setMessages((prev) => prev.map(m => m.id === tempId ? (data as ChatMessage) : m));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !currentUserId) return;

    setIsUploading(true);
    const tempId = `temp-${Date.now()}`;
    
    try {
      // Compress the image before uploading to save user data and speed up delivery
      const compressedFile = await compressImage(file);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(uploadData.path);

      const tempMessage: ChatMessage = {
        id: tempId,
        sender_id: currentUserId,
        receiver_id: activeChat.id,
        image_url: publicUrl,
        content: '', // Empty string ensures optimistic UI renders properly
        created_at: new Date().toISOString(),
        read: false
      };

      setMessages((prev) => [...prev, tempMessage]);

      const { data, error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: activeChat.id,
        image_url: publicUrl,
        content: '' // FIXED: Satisfies the DB if content column is NOT NULL
      }).select().single();

      if (!error && data) {
        setMessages((prev) => prev.map(m => m.id === tempId ? (data as ChatMessage) : m));
      }

    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to send image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
      className="bg-gray-50 h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] flex font-sans overflow-hidden relative"
    >
      
      {/* LEFT PANE: CONTACTS SIDEBAR */}
      <div className={`w-full md:w-[350px] lg:w-[400px] bg-white border-r border-gray-100 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="p-4 md:p-6 border-b border-gray-100">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-full text-gray-900 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar bg-white">
          {loadingChats ? (
            Array.from({ length: 6 }).map((_, i) => <SidebarSkeleton key={i} />)
          ) : conversations.length > 0 ? (
            <AnimatePresence>
              {conversations.map((chat, index) => (
                <motion.div 
                  key={chat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "rgba(249, 250, 251, 1)" }}
                  onClick={() => setActiveChat(chat)}
                  className={`p-4 flex items-center space-x-4 cursor-pointer transition-colors border-b border-gray-50/50 ${
                    activeChat?.id === chat.id ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="relative">
                    {chat.other_user.avatar_url ? (
                      <img src={chat.other_user.avatar_url} alt="avatar" className="w-14 h-14 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <User size={20} />
                      </div>
                    )}
                    {/* Realtime Online Indicator over Avatar */}
                    {onlineUsers.has(chat.id) && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                    )}
                    {chat.unread && !onlineUsers.has(chat.id) && (
                      <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full shadow-sm"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="flex items-center space-x-1">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">{chat.other_user.full_name}</h3>
                        {chat.other_user.is_verified && <img src="/tick.svg" alt="Verified" className="w-3 h-3" />}
                      </div>
                    </div>
                    <p className={`text-sm truncate ${chat.unread ? 'text-gray-900 font-semibold' : 'text-gray-500 font-medium'}`}>
                      {chat.last_message}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-600 mb-1">No messages yet</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: ACTIVE CHAT ROOM */}
      <div className={`${activeChat ? 'fixed inset-0 z-[100] md:static md:flex-1 md:z-auto' : 'hidden md:flex flex-1'} flex flex-col bg-[#F8F9FA]`}>
        
        {activeChat ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full w-full"
          >
            {/* Chat Header */}
            <div className="h-[72px] md:h-20 border-b border-gray-100 flex items-center px-4 md:px-6 bg-white/90 backdrop-blur-md z-10 sticky top-0 shadow-sm pt-safe md:pt-0">
              <button 
                className="md:hidden mr-3 p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => {
                  setActiveChat(null);
                  if (targetedSellerId) navigate('/messages', { replace: true });
                }}
              >
                <ArrowLeft size={20} />
              </button>
              
              <div onClick={() => navigate(`/profile/${activeChat.other_user.id}`)} className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                {activeChat.other_user.avatar_url ? (
                  <img src={activeChat.other_user.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <User size={18} />
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-1">
                    <h2 className="font-semibold text-gray-900 text-sm">{activeChat.other_user.full_name}</h2>
                    {activeChat.other_user.is_verified && <img src="/tick.svg" alt="Verified" className="w-3.5 h-3.5" />}
                  </div>
                  {onlineUsers.has(activeChat.id) ? (
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Online</p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Offline</p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                   <div className="bg-white px-4 py-2 rounded-full shadow-sm text-xs font-semibold border border-gray-100">
                     This is the beginning of your conversation.
                   </div>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                      >
                        {/* Avatar for received messages */}
                        {!isMe && (
                          <div className="hidden sm:block flex-shrink-0 mb-1">
                            {activeChat.other_user.avatar_url ? (
                              <img src={activeChat.other_user.avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover shadow-sm" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100"><User size={12} /></div>
                            )}
                          </div>
                        )}

                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[65%]`}>
                          <div className={`shadow-sm relative ${
                              isMe 
                                ? 'bg-indigo-600 text-white rounded-[1.5rem] rounded-br-sm' 
                                : 'bg-white text-gray-900 rounded-[1.5rem] rounded-bl-sm border border-gray-100'
                            }`}
                          >
                            {msg.image_url ? (
                              <img src={msg.image_url} alt="Sent attachment" className="w-full h-auto rounded-[1.2rem] object-cover max-h-64 p-1" />
                            ) : null}
                            
                            {/* Render text content if it exists and isn't an empty string (used as filler for images) */}
                            {msg.content && msg.content.trim() !== '' && (
                              <div className="px-5 py-3.5 text-sm font-medium leading-relaxed">
                                {msg.content}
                              </div>
                            )}
                          </div>
                          
                          {/* Sent / Read Receipts */}
                          {isMe && !msg.id.startsWith('temp') && (
                            <div className="flex items-center space-x-1 mt-1 mr-2 text-gray-400">
                              <span className="text-[10px] font-medium">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {msg.read ? <CheckCheck size={14} className="text-indigo-500" /> : <Check size={14} />}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              
              {/* REALTIME TYPING INDICATOR */}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-end space-x-2">
                  <div className="hidden sm:block flex-shrink-0 mb-1">
                     {activeChat.other_user.avatar_url ? (
                        <img src={activeChat.other_user.avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover shadow-sm" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100"><User size={12} /></div>
                      )}
                  </div>
                  <div className="bg-white px-4 py-3 rounded-[1.5rem] rounded-bl-sm border border-gray-100 shadow-sm flex space-x-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 z-10 pb-safe">
              <form 
                onSubmit={handleSendMessage}
                className="max-w-4xl mx-auto flex items-end space-x-2 bg-gray-50 rounded-3xl p-2 border border-transparent focus-within:border-indigo-600 focus-within:bg-white transition-all shadow-sm"
              >
                {/* Image Upload Button */}
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-3 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50"
                >
                  {isUploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                </button>

                <textarea 
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-2 text-sm font-medium text-gray-900 outline-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-600/20"
                >
                  <Send size={18} className="ml-0.5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center text-indigo-600 mb-6 border border-gray-100"
            >
              <PawPrint size={40} />
            </motion.div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Inbox</h2>
            <p className="text-gray-500 font-medium max-w-sm">
              Select a conversation from the sidebar or reach out to a seller to get started.
            </p>
          </div>
        )}
      </div>

    </motion.div>
  );
};