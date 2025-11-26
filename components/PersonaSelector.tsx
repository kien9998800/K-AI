import React from 'react';
import { Persona } from '../types';
import { PERSONAS } from '../data/personas';
import { X, Users, Check } from 'lucide-react';

interface PersonaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersonaId: string;
  onSelect: (persona: Persona) => void;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  isOpen,
  onClose,
  currentPersonaId,
  onSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="text-indigo-600 dark:text-indigo-400" />
              Chọn Persona
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Chọn nhân vật AI mà bạn muốn trò chuyện cùng.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-slate-950/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PERSONAS.map((persona) => {
              const isSelected = currentPersonaId === persona.id;
              
              return (
                <div 
                  key={persona.id}
                  onClick={() => {
                    onSelect(persona);
                    onClose();
                  }}
                  className={`
                    relative group flex flex-col bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden
                    ${isSelected 
                      ? 'border-indigo-600 dark:border-indigo-500 shadow-lg shadow-indigo-500/10' 
                      : 'border-transparent hover:border-gray-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
                    }
                  `}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 z-10 bg-indigo-600 text-white p-1.5 rounded-full shadow-md">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  )}

                  {/* Avatar Header */}
                  <div className="h-32 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/20 dark:to-purple-900/20 relative">
                     <div className="absolute -bottom-10 left-6">
                        <div className={`
                          w-20 h-20 rounded-full border-4 overflow-hidden shadow-lg
                          ${isSelected ? 'border-indigo-600 dark:border-indigo-500' : 'border-white dark:border-slate-800'}
                        `}>
                           <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover" />
                        </div>
                     </div>
                  </div>

                  {/* Body */}
                  <div className="pt-12 p-6 flex-1 flex flex-col">
                    <div>
                      <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                        {persona.name}
                      </h3>
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 mb-3">
                        {persona.role}
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                        {persona.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaSelector;