import React, { useEffect, useState } from 'react';
import { ChatSession, User } from '../types';
import { getUserSessions, deleteSession } from '../services/storageService';
import { MessageSquare, Trash2, X, Clock, Plus } from 'lucide-react';

interface HistoryPanelProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  currentSessionId: string | null;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  user,
  isOpen,
  onClose,
  onSelectSession,
  onNewChat,
  currentSessionId
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const loadSessions = () => {
    setSessions(getUserSessions(user.username));
  };

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, user]);

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
      deleteSession(sessionId);
      loadSessions();
      if (currentSessionId === sessionId) {
        onNewChat();
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Clock size={20} className="text-indigo-600 dark:text-indigo-400" />
              Lịch sử
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-xl transition-colors border border-indigo-200 dark:border-slate-700 font-medium"
            >
              <Plus size={18} />
              Cuộc trò chuyện mới
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 mt-10 text-sm">
                Chưa có lịch sử trò chuyện nào.
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session);
                    onClose();
                  }}
                  className={`
                    group relative p-3 rounded-xl cursor-pointer border transition-all
                    ${currentSessionId === session.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50'
                      : 'bg-white dark:bg-slate-900 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare size={18} className={`mt-0.5 flex-shrink-0 ${currentSessionId === session.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {session.title || "Không có tiêu đề"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(session.lastModified)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {/* User Info Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
             <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
               Đang lưu trên trình duyệt này
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HistoryPanel;