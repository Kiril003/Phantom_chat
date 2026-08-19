import React, { useState } from 'react';
import { X, Forward, Search, Check } from 'lucide-react';
import { Chat, Message } from '../types';
import { soundFx } from '../utils/sound';

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  currentChatId: string;
  messagesToForward: Message[];
  onConfirmForward: (targetChatId: string) => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  chats,
  currentChatId,
  messagesToForward,
  onConfirmForward,
}) => {
  const [search, setSearch] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetChats = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleForward = (chatId: string) => {
    soundFx.playSend();
    onConfirmForward(chatId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAF8F3] border border-[#DCD3C1] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8DFD1] flex items-center justify-between bg-[#F5EFE4]">
          <div className="flex items-center gap-2">
            <Forward className="w-5 h-5 text-[#E87A42]" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#1F2521]">
                Переслати повідомлення
              </h3>
              <p className="text-xs text-[#717E75]">
                {messagesToForward.length} {messagesToForward.length === 1 ? 'повідомлення' : 'повідомлень'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTap();
              onClose();
            }}
            className="p-1.5 text-[#717E75] hover:text-[#1F2521] hover:bg-[#EBE2D3] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#E8DFD1]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C988E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Пошук чату або групи для пересилання..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#DFD6C5] rounded-xl text-xs focus:outline-none focus:border-[#E87A42]"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {targetChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleForward(chat.id)}
              className="p-2.5 rounded-2xl hover:bg-white border border-transparent hover:border-[#DFD6C5] cursor-pointer flex items-center justify-between gap-3 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={chat.avatar}
                  alt={chat.title}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-black/5"
                />
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#1F2521] truncate">{chat.title}</p>
                  <p className="text-[10px] text-[#717E75] truncate">{chat.circle}</p>
                </div>
              </div>

              <span className="text-xs text-[#E87A42] font-semibold">Надіслати →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
