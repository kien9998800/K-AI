import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role, ChatConfig, User, ChatSession, Persona } from './types';
import { createChatSession, sendMessageStream } from './services/geminiService';
import { getCurrentUser, logoutUser, saveSession } from './services/storageService';
import { DEFAULT_PERSONA } from './data/personas';
import MessageBubble from './components/MessageBubble';
import SettingsPanel from './components/ConfigPanel';
import AuthModal from './components/AuthModal';
import HistoryPanel from './components/HistoryPanel';
import PersonaSelector from './components/PersonaSelector';
import { Send, Settings, RefreshCw, Image as ImageIcon, X, Mic, MicOff, Volume2, VolumeX, PhoneOff, History, LogOut, Users } from 'lucide-react';
import { Chat } from '@google/genai';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  
  // Chat State
  const [sessionId, setSessionId] = useState<string>(Date.now().toString());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  // Persona State
  const [currentPersona, setCurrentPersona] = useState<Persona>(DEFAULT_PERSONA);
  
  // Derived Config from Persona
  const config: ChatConfig = {
    systemInstruction: currentPersona.systemInstruction,
    temperature: currentPersona.temperature
  };
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPersonaSelectorOpen, setIsPersonaSelectorOpen] = useState(false);
  
  // Settings State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [volume, setVolume] = useState<number>(1);
  const [language, setLanguage] = useState<string>('vi');
  
  // Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice & Interaction State
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Auth
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Initialize Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auto-save session
  useEffect(() => {
    if (user && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        saveSession(user.username, sessionId, messages);
      }, 1000); // Debounce save
      return () => clearTimeout(timeoutId);
    }
  }, [messages, user, sessionId]);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setMessages([]);
    setSessionId(Date.now().toString());
    startNewSession(config);
  };

  const handleLoadSession = (session: ChatSession) => {
    if (user && messages.length > 0) {
        saveSession(user.username, sessionId, messages);
    }

    setSessionId(session.id);
    setMessages(session.messages);
    const newChat = createChatSession(config);
    setChatSession(newChat);
  };

  const handleNewChat = () => {
     if (user && messages.length > 0) {
        saveSession(user.username, sessionId, messages);
     }
     setSessionId(Date.now().toString());
     setMessages([]);
     startNewSession(config);
  };

  // Handle Switching Persona
  const handlePersonaSelect = (newPersona: Persona) => {
    if (newPersona.id === currentPersona.id) return;
    
    // Save current session if needed
    if (user && messages.length > 0) {
        saveSession(user.username, sessionId, messages);
    }
    
    setCurrentPersona(newPersona);
    
    // Reset Chat for new persona
    setSessionId(Date.now().toString());
    setMessages([]);
    
    // Create new config derived from new persona
    const newConfig: ChatConfig = {
        systemInstruction: newPersona.systemInstruction,
        temperature: newPersona.temperature
    };
    
    startNewSession(newConfig);
  };

  // Handle Sending Message
  const executeSendMessage = useCallback(async (textInput: string, imgData?: string | null) => {
    if ((!textInput.trim() && !imgData) || !chatSession) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: textInput,
      timestamp: Date.now(),
      image: imgData || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // 2. Add AI Placeholder
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsgPlaceholder: Message = {
      id: aiMsgId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now(),
      isStreaming: true
    };
    setMessages(prev => [...prev, aiMsgPlaceholder]);

    let fullResponse = "";

    try {
      const stream = sendMessageStream(chatSession, textInput, imgData || undefined);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, text: fullResponse }
            : msg
        ));
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, isStreaming: false }
          : msg
      ));

      return fullResponse;

    } catch (error) {
      console.error("Error generating response:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, text: "Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.", isStreaming: false }
          : msg
      ));
      return "Xin lỗi, có lỗi xảy ra.";
    } finally {
      setIsLoading(false);
    }
  }, [chatSession]);

  // Speak Text Function
  const speakText = useCallback((text: string, onEndCallback?: () => void) => {
    if (!isSpeechEnabled || !text) {
      if (onEndCallback) onEndCallback();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    synthesisRef.current = utterance;
    
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    if (language === 'vi') {
        selectedVoice = 
            voices.find(v => v.lang.includes('vi') && v.name.toLowerCase().includes('nam')) || 
            voices.find(v => v.lang.includes('vi') && v.name.toLowerCase().includes('male')) ||
            voices.find(v => v.lang.includes('vi'));
    } else {
        selectedVoice = 
            voices.find(v => v.lang.includes('en') && v.name.toLowerCase().includes('male')) ||
            voices.find(v => v.lang.includes('en'));
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.volume = volume;
    utterance.pitch = 0.9; 
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  }, [isSpeechEnabled, language, volume]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'vi' ? 'vi-VN' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (isVoiceMode) {
            setVoiceTranscript(finalTranscript || interimTranscript);
            if (finalTranscript) {
               handleVoiceSend(finalTranscript);
            }
        } 
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech') {
            if(isVoiceMode && !isSpeaking && !isLoading) {
                 setIsListening(false);
            } else {
                 setIsListening(false);
            }
            return;
        }
        console.error('Speech error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (!isVoiceMode) {
             setIsListening(false);
        } else {
             if (!isLoading && !isSpeaking) {
                 setIsListening(false); 
             }
        }
      };
    }
  }, [language, isVoiceMode, isLoading, isSpeaking, chatSession]);

  const handleVoiceSend = async (text: string) => {
      setIsListening(false);
      setVoiceTranscript(text);
      
      const response = await executeSendMessage(text, null);
      
      if (response && isVoiceMode) {
          speakText(response, () => {
              if (isVoiceMode) {
                  setVoiceTranscript('');
                  startListening();
              }
          });
      }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.lang = language === 'vi' ? 'vi-VN' : 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Start error", e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleVoiceMode = () => {
      if (isVoiceMode) {
          setIsVoiceMode(false);
          stopListening();
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
      } else {
          setIsVoiceMode(true);
          setIsSpeechEnabled(true); 
          setTimeout(() => startListening(), 500); 
      }
  };

  const handleTextSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading || !chatSession) return;
    
    const textToSend = input;
    const imgToSend = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    const response = await executeSendMessage(textToSend, imgToSend);
    
    if (response) {
        speakText(response);
    }
  };

  const startNewSession = (cfg: ChatConfig) => {
    try {
      const newChat = createChatSession(cfg);
      setChatSession(newChat);
      window.speechSynthesis.cancel();
    } catch (error) {
      console.error("Failed to initialize chat:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  };

  useEffect(() => {
     startNewSession(config);
  }, []);

  // --- RENDER ---
  
  if (!user) {
    return <AuthModal onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 transition-colors duration-200 overflow-hidden relative">
      
      {/* --- MODALS --- */}
      <HistoryPanel
        user={user}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleLoadSession}
        onNewChat={handleNewChat}
        currentSessionId={sessionId}
      />
      
      <PersonaSelector
        isOpen={isPersonaSelectorOpen}
        onClose={() => setIsPersonaSelectorOpen(false)}
        currentPersonaId={currentPersona.id}
        onSelect={handlePersonaSelect}
      />

      {/* --- VOICE MODE OVERLAY --- */}
      {isVoiceMode && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-between p-6 animate-in fade-in duration-300">
           {/* Top Controls */}
           <div className="w-full flex justify-between items-center text-white/70">
              <button onClick={() => setIsSettingsOpen(true)} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                  <Settings size={24} />
              </button>
              <span className="font-medium tracking-wide text-sm uppercase opacity-50">{currentPersona.name} Live</span>
              <button onClick={toggleVoiceMode} className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-full transition-colors">
                  <X size={24} />
              </button>
           </div>

           {/* Central Avatar Visualizer */}
           <div className="flex-1 flex flex-col items-center justify-center w-full relative">
              {isListening && (
                 <div className="absolute w-64 h-64 bg-indigo-500/20 rounded-full animate-ping" />
              )}
              {isListening && (
                 <div className="absolute w-52 h-52 bg-indigo-500/30 rounded-full animate-pulse" />
              )}
              
              {isLoading && (
                 <div className="absolute w-44 h-44 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              )}

              <div className={`
                 relative z-10 w-40 h-40 rounded-full overflow-hidden border-4 shadow-2xl transition-all duration-500
                 ${isSpeaking ? 'scale-110 border-emerald-400 shadow-emerald-500/50' : 'border-indigo-500 shadow-indigo-500/50'}
                 ${isLoading ? 'scale-95 opacity-80' : ''}
              `}>
                  <img src={currentPersona.avatar} className="w-full h-full object-cover" alt="Persona Avatar" />
              </div>

              <div className="mt-12 text-center max-w-md h-24 flex items-center justify-center">
                 {isLoading ? (
                    <p className="text-indigo-300 animate-pulse text-lg font-medium">Đang suy nghĩ...</p>
                 ) : isListening ? (
                    <p className="text-white text-xl font-medium leading-relaxed">
                       {voiceTranscript || "Đang nghe bạn nói..."}
                    </p>
                 ) : isSpeaking ? (
                    <div className="flex gap-1 items-center h-8">
                       <div className="w-1 h-3 bg-emerald-400 animate-bounce" style={{animationDelay: '0ms'}}/>
                       <div className="w-1 h-5 bg-emerald-400 animate-bounce" style={{animationDelay: '100ms'}}/>
                       <div className="w-1 h-8 bg-emerald-400 animate-bounce" style={{animationDelay: '200ms'}}/>
                       <div className="w-1 h-5 bg-emerald-400 animate-bounce" style={{animationDelay: '100ms'}}/>
                       <div className="w-1 h-3 bg-emerald-400 animate-bounce" style={{animationDelay: '0ms'}}/>
                    </div>
                 ) : (
                    <p className="text-white/50 text-sm">Chạm vào mic để nói</p>
                 )}
              </div>
           </div>

           {/* Bottom Controls */}
           <div className="w-full flex justify-center items-center gap-8 mb-8">
               <button 
                  onClick={() => {
                      const newState = !isSpeechEnabled;
                      setIsSpeechEnabled(newState);
                      if (!newState) {
                          window.speechSynthesis.cancel();
                          setIsSpeaking(false);
                      }
                  }}
                  className={`p-4 rounded-full transition-all ${!isSpeechEnabled ? 'bg-red-500/20 text-red-200' : 'bg-white/10 text-white hover:bg-white/20'}`}
               >
                   {!isSpeechEnabled ? <VolumeX size={24} /> : <Volume2 size={24} />}
               </button>

               <button 
                  onClick={isListening ? stopListening : startListening}
                  className={`
                     p-6 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95
                     ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-indigo-900'}
                  `}
               >
                  {isListening ? <MicOff size={32} /> : <Mic size={32} />}
               </button>
               
               <button 
                  onClick={toggleVoiceMode}
                  className="p-4 rounded-full bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-200 transition-all"
               >
                   <PhoneOff size={24} />
               </button>
           </div>
        </div>
      )}

      {/* --- STANDARD CHAT UI --- */}
      <header className="flex-none bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm z-10 transition-colors duration-200">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="md:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl"
          >
             <History size={20} className="text-gray-500" />
          </button>
          
          <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md">
            <img 
              src={currentPersona.avatar} 
              alt={currentPersona.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg md:text-xl text-gray-900 dark:text-white tracking-tight">{currentPersona.name}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden md:block">{currentPersona.role}</p>
          </div>
        </div>
        <div className="flex gap-1 md:gap-2">
           <button 
             onClick={() => setIsHistoryOpen(true)}
             className="hidden md:flex p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400 items-center gap-2"
             title="Lịch sử"
           >
             <History size={20} />
             <span className="text-sm font-medium">Lịch sử</span>
           </button>

           <button 
            onClick={() => setIsPersonaSelectorOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
            title="Chọn Persona"
          >
            <Users size={20} />
          </button>

          <button 
             onClick={() => {
               const newState = !isSpeechEnabled;
               setIsSpeechEnabled(newState);
               if (!newState) window.speechSynthesis.cancel();
             }}
             className={`p-2 rounded-xl transition-all ${isSpeechEnabled ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400'}`}
          >
            {isSpeechEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <button 
            onClick={handleNewChat}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
            title="Cuộc trò chuyện mới"
          >
            <RefreshCw size={20} />
          </button>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
            title="Cài đặt"
          >
            <Settings size={20} />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
            title="Đăng xuất"
          >
             <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <div className="max-w-3xl mx-auto space-y-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 dark:text-gray-500 mt-20">
              <div className="w-24 h-24 mb-6 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-slate-700 shadow-inner">
                 <img 
                  src={currentPersona.avatar} 
                  alt="Persona Big" 
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                 Chào <b>{user.username}</b>! Mình là {currentPersona.name}.
              </p>
              <p className="text-sm">Mình có thể giúp gì cho bạn hôm nay?</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 md:p-6 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 transition-colors duration-200">
        <div className="max-w-3xl mx-auto">
          {selectedImage && (
            <div className="relative inline-block mb-4 group">
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 shadow-md">
                <img src={selectedImage} alt="Preview" className="h-24 w-auto object-cover" />
                <button 
                  onClick={removeImage}
                  className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 items-end bg-gray-50 dark:bg-slate-700 p-2 rounded-2xl border border-gray-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all shadow-sm">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-600 rounded-xl transition-colors"
            >
              <ImageIcon size={22} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={language === 'vi' ? `Nhắn tin cho ${currentPersona.name}...` : `Message ${currentPersona.name}...`}
              className="flex-1 max-h-40 py-3 bg-transparent border-none focus:ring-0 resize-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
              rows={1}
            />

            <button
              onClick={toggleVoiceMode}
              className="p-3 rounded-xl transition-all text-gray-400 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-600"
            >
               <Mic size={22} />
            </button>

            <button
              onClick={handleTextSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className={`
                p-3 rounded-xl transition-all duration-200
                ${(!input.trim() && !selectedImage) || isLoading
                  ? 'bg-gray-200 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95'
                }
              `}
            >
              <Send size={22} />
            </button>
          </div>
        </div>
      </footer>

      <SettingsPanel 
        config={config} 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        volume={volume}
        setVolume={setVolume}
        language={language}
        setLanguage={setLanguage}
        currentPersonaName={currentPersona.name}
      />
    </div>
  );
};

export default App;