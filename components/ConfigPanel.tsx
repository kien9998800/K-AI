import React, { useState, useEffect } from 'react';
import { ChatConfig } from '../types';
import { Settings, X, Moon, Sun, Volume2, Globe, Cpu, Lock } from 'lucide-react';

interface ConfigPanelProps {
  config: ChatConfig;
  // Removed onSaveConfig for AI since it's read-only here
  isOpen: boolean;
  onClose: () => void;
  
  // App Settings Props
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  volume: number;
  setVolume: (volume: number) => void;
  language: string;
  setLanguage: (lang: string) => void;
  currentPersonaName: string; // To display which persona is active
}

const SettingsPanel: React.FC<ConfigPanelProps> = ({ 
  config, 
  isOpen, 
  onClose,
  theme,
  setTheme,
  volume,
  setVolume,
  language,
  setLanguage,
  currentPersonaName
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai'>('general');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex-none">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Settings size={20} className="text-indigo-600 dark:text-indigo-400" />
            Cài đặt
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-slate-700 flex-none">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'general' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Chung
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'ai' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Thông tin AI
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-200 fade-in">
              {/* Theme */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Sun size={16} /> Giao diện
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      theme === 'light'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300'
                    }`}
                  >
                    <Sun size={18} /> Sáng
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-700 border-indigo-500 text-indigo-300 ring-1 ring-indigo-400'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-400'
                    }`}
                  >
                    <Moon size={18} /> Tối
                  </button>
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-3">
                <div className="flex justify-between">
                   <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Volume2 size={16} /> Âm lượng đọc
                  </label>
                  <span className="text-xs font-mono bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
              </div>

              {/* Language */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Globe size={16} /> Ngôn ngữ hội thoại
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="vi">Tiếng Việt (Vietnamese)</option>
                  <option value="en">Tiếng Anh (English)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Thay đổi ngôn ngữ sẽ ảnh hưởng đến giọng đọc của AI.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-200 fade-in">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800/50 flex gap-3">
                <Lock size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-orange-800 dark:text-orange-300 mb-1">Chế độ xem thông tin</p>
                  <p className="text-orange-700 dark:text-orange-400">
                    Bạn đang trò chuyện với <b>{currentPersonaName}</b>. Để thay đổi nhân vật hoặc tính cách, vui lòng sử dụng nút "Chọn Persona" ở màn hình chính.
                  </p>
                </div>
              </div>

              {/* System Instruction */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Cpu size={16} /> Chỉ dẫn hệ thống
                </label>
                <textarea
                  className="w-full h-64 p-3 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 font-mono leading-relaxed cursor-not-allowed resize-none outline-none"
                  value={config.systemInstruction}
                  readOnly
                />
              </div>
            </div>
          )}
        </div>

        {activeTab === 'general' && (
           <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end border-t dark:border-slate-700 flex-none">
             <button
               onClick={onClose}
               className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-all"
             >
               Đóng
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;