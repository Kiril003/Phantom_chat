import React from 'react';
import { X, Info, CheckCheck, Clock, ShieldCheck, Languages, Sparkles, User, Hash, FileText } from 'lucide-react';
import { Message, ChatMember } from '../types';
import { soundFx } from '../utils/sound';

interface MessageDetailsModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  chatTitle?: string;
  members?: ChatMember[];
}

export const MessageDetailsModal: React.FC<MessageDetailsModalProps> = ({
  message,
  isOpen,
  onClose,
  chatTitle = 'Бесіда',
  members = [],
}) => {
  if (!isOpen || !message) return null;

  const textLength = message.text ? message.text.length : 0;
  const wordCount = message.text ? message.text.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FAF8F3] border border-[#DFD6C5] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#F2EDE4] border-b border-[#DFD6C5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#E87A42]/15 text-[#E87A42] rounded-xl">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1F2521]">Інформація про повідомлення</h3>
              <p className="text-[11px] text-[#717E75]">{chatTitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playTap();
              onClose();
            }}
            className="p-1.5 hover:bg-[#E5DCCF] text-[#717E75] hover:text-[#1F2521] rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Sender card */}
          <div className="p-3 bg-white border border-[#DFD6C5] rounded-2xl flex items-center gap-3">
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="w-10 h-10 rounded-xl object-cover border border-[#DFD6C5]"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs text-[#1F2521] truncate">{message.senderName}</h4>
              <p className="text-[11px] text-[#717E75]">ID: {message.senderId}</p>
            </div>
            <span className="px-2 py-0.5 bg-[#FAF3E8] text-[#E87A42] font-semibold text-[10px] rounded-lg border border-[#EBDDCA]">
              {message.isSelf ? 'Ви' : 'Учасник'}
            </span>
          </div>

          {/* Delivery & Timestamps */}
          <div className="p-3 bg-white border border-[#DFD6C5] rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2EDE4]">
              <span className="text-[#717E75] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#E87A42]" />
                <span>Час відправки</span>
              </span>
              <span className="font-mono font-medium text-[#1F2521]">{message.timestamp}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#F2EDE4]">
              <span className="text-[#717E75] flex items-center gap-1.5">
                <CheckCheck className="w-3.5 h-3.5 text-[#528A4B]" />
                <span>Статус доставки</span>
              </span>
              <span className="font-semibold text-[#528A4B]">Прочитано всіма учасниками</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#717E75] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3F6B42]" />
                <span>Шифрування</span>
              </span>
              <span className="font-mono text-[11px] text-[#3F6B42]">End-to-End Encrypted</span>
            </div>
          </div>

          {/* Message Content preview & stats */}
          <div className="p-3 bg-white border border-[#DFD6C5] rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] text-[#717E75]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Тип вмісту</span>
              <span className="font-mono px-2 py-0.5 bg-[#F2EDE4] rounded-md font-semibold text-[#1F2521]">
                {message.type}
              </span>
            </div>

            {message.text && (
              <>
                <div className="p-2.5 bg-[#FAF8F3] border border-[#E8DFC8] rounded-xl text-xs text-[#1F2521] select-text max-h-32 overflow-y-auto leading-relaxed">
                  {message.text}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#717E75] pt-1">
                  <span>Символів: <strong>{textLength}</strong></span>
                  <span>Слів: <strong>{wordCount}</strong></span>
                  {message.isEdited && <span className="text-[#E87A42] font-semibold">Було відредаговано</span>}
                </div>
              </>
            )}
          </div>

          {/* Reactions breakdown */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="p-3 bg-white border border-[#DFD6C5] rounded-2xl space-y-2 text-xs">
              <h5 className="font-bold text-[11px] text-[#1F2521] uppercase tracking-wider">
                Реакції учасників ({message.reactions.reduce((acc, r) => acc + r.count, 0)})
              </h5>
              <div className="space-y-1.5">
                {message.reactions.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 bg-[#FAF8F3] rounded-xl border border-[#E8DFC8]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{r.emoji}</span>
                      <span className="text-xs text-[#556157] truncate">
                        {r.users.join(', ')}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#E87A42]">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F2EDE4] border-t border-[#DFD6C5] flex justify-end">
          <button
            onClick={() => {
              soundFx.playTap();
              onClose();
            }}
            className="px-4 py-1.5 bg-[#1F2521] text-white hover:bg-black rounded-xl text-xs font-semibold transition-colors"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
