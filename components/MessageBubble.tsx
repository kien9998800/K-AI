import React from 'react';
import { Message, Role } from '../types';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser 
            ? 'bg-indigo-600 text-white' 
            : 'bg-emerald-600 text-white'}
          shadow-sm
        `}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble */}
        <div className={`
          flex flex-col p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap overflow-hidden
          ${isUser 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-slate-700 rounded-tl-none'}
        `}>
          {/* Image Attachment */}
          {message.image && (
            <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
              <img 
                src={message.image} 
                alt="User upload" 
                className="max-w-full h-auto object-cover max-h-64 w-full" 
              />
            </div>
          )}

          {/* Text Content */}
          <div>
            {message.text}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 align-middle bg-emerald-500 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;