import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Smile,
  Zap,
  X,
  Clock,
  Check,
  Quote,
  Layers,
  StopCircle,
  Trash2,
  Sliders
} from 'lucide-react';
import { Message } from '../types';
import { soundFx } from '../utils/sound';

interface MessageComposerProps {
  onSendMessage: (text: string, scheduledTime?: string) => void;
  onSendVoiceMessage: (duration: number, transcript: string) => void;
  onOpenActions: () => void;
  onOpenScheduler: () => void;
  onOpenScheduledList?: () => void;
  scheduledCountInCurrentChat?: number;
  replyingTo: Message | null;
  onCancelReply: () => void;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  onSaveEdit: (messageId: string, newText: string) => void;
  selectedMessagesForQuote: Message[];
  onSynthesizeMultiQuote: (title: string, userCommentary: string) => void;
  onClearSelectedQuotes: () => void;
  scheduledTime?: string;
  onClearScheduledTime?: () => void;
}

const emojiList = ['✨', '🌱', '☕', '❤️', '👍', '🔥', '👏', '🙌', '💡', '📌', '🎯', '🚀', '🌿', '🤝', '😊', '👌'];

const stylePresets = [
  { id: 'concise', label: 'Лаконічно ⚡' },
  { id: 'warm', label: 'Тепло & Дружньо ☕' },
  { id: 'business', label: 'Діловий тон 💼' },
  { id: 'polite', label: 'Ввічливо & М’яко 🌿' },
];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onSendVoiceMessage,
  onOpenActions,
  onOpenScheduler,
  onOpenScheduledList,
  scheduledCountInCurrentChat = 0,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSaveEdit,
  selectedMessagesForQuote,
  onSynthesizeMultiQuote,
  onClearSelectedQuotes,
  scheduledTime,
  onClearScheduledTime,
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [multiQuoteTitle, setMultiQuoteTitle] = useState('Зведена цитата домовленостей');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingTimerRef = useRef<any>(null);

  // Sync editing message
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const handleSend = () => {
    if (editingMessage) {
      if (text.trim()) {
        onSaveEdit(editingMessage.id, text.trim());
        setText('');
      }
      return;
    }

    if (selectedMessagesForQuote.length > 0) {
      onSynthesizeMultiQuote(multiQuoteTitle, text.trim());
      setText('');
      return;
    }

    if (!text.trim()) return;
    soundFx.playSend();
    onSendMessage(text.trim(), scheduledTime);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startVoiceRecording = () => {
    soundFx.playTap();
    setIsRecordingVoice(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const cancelVoiceRecording = () => {
    soundFx.playTap();
    clearInterval(recordingTimerRef.current);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const finishVoiceRecording = () => {
    soundFx.playSend();
    clearInterval(recordingTimerRef.current);
    const duration = Math.max(recordingSeconds, 3);
    const mockTranscripts = [
      'Привіт! Переглянув структуру, виглядає дуже продумано і зручно. До зустрічі!',
      'Узгодили всі параметри для запуску. Завтра о 10:00 проведемо фінальний синхрон.',
      'Кава на Подолі була чудовою ідеєю, встигли обговорити всі ключові деталі проєкту.',
    ];
    const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
    onSendVoiceMessage(duration, randomTranscript);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const applyStyle = (styleId: string) => {
    soundFx.playTap();
    if (!text.trim()) return;
    let transformed = text.trim();
    if (styleId === 'concise') {
      transformed = transformed.replace(/будь ласка/gi, '').replace(/\s+/g, ' ').trim();
      transformed = `📌 ${transformed}`;
    } else if (styleId === 'warm') {
      transformed = `Привіт! 😊 ${transformed} Дякую за співпрацю!`;
    } else if (styleId === 'business') {
      transformed = `Доброго дня. Щодо питання: ${transformed}. Прошу підтвердити узгодження.`;
    } else if (styleId === 'polite') {
      transformed = `Буду дуже вдячний, якщо знайдете хвилинку: ${transformed} ✨`;
    }
    setText(transformed);
    setShowStyleMenu(false);
  };

  return (
    <div className="p-3 sm:p-4 bg-[#FAF8F3] border-t border-[#E8DFD1] shrink-0 select-none relative z-10">
      {/* 1. Multi-Quote Synthesis Banner */}
      {selectedMessagesForQuote.length > 0 && (
        <div className="mb-2.5 p-3 bg-[#FAF1E6] border border-[#EACBB0] rounded-2xl space-y-2 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#E87A42]" />
              <span className="font-bold text-xs text-[#8C461A]">
                Синтез {selectedMessagesForQuote.length} вибраних повідомлень
              </span>
            </div>
            <button
              onClick={onClearSelectedQuotes}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={multiQuoteTitle}
            onChange={(e) => setMultiQuoteTitle(e.target.value)}
            placeholder="Заголовок синтезу цитат..."
            className="w-full px-2.5 py-1 bg-white border border-[#DFD6C5] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#E87A42]"
          />

          <div className="space-y-1 max-h-24 overflow-y-auto">
            {selectedMessagesForQuote.map((m) => (
              <div key={m.id} className="text-[11px] text-[#556157] bg-white/80 p-1.5 rounded-lg border border-[#EAE0D1] truncate">
                <span className="font-bold text-[#E87A42]">{m.senderName}: </span>
                <span>{m.text || m.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Replying-to Banner */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-[#F3ECE0] border-l-4 border-[#E87A42] rounded-xl flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0">
            <p className="font-bold text-[#E87A42] text-[11px]">
              Відповідь для {replyingTo.senderName}
            </p>
            <p className="text-[#556157] truncate text-[11px]">{replyingTo.text || replyingTo.type}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-[#E5DCCF] rounded-lg text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Editing Message Banner */}
      {editingMessage && (
        <div className="mb-2 p-2 bg-[#FAF1E6] border-l-4 border-[#528A4B] rounded-xl flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0">
            <p className="font-bold text-[#528A4B] text-[11px]">Редагування повідомлення</p>
            <p className="text-[#556157] truncate text-[11px]">{editingMessage.text}</p>
          </div>
          <button
            onClick={onCancelEdit}
            className="p-1 hover:bg-[#EFE3D3] rounded-lg text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Scheduled Time Badge */}
      {scheduledTime ? (
        <div className="mb-2 p-2 bg-[#F0EAE0] rounded-xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#6B5A4B] font-semibold text-[11px]">
            <Clock className="w-3.5 h-3.5 text-[#E87A42]" />
            <span>Заплановано на: {scheduledTime}</span>
          </div>
          <div className="flex items-center gap-1">
            {onOpenScheduledList && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playTap();
                  onOpenScheduledList();
                }}
                className="text-[10px] font-bold text-[#E87A42] hover:underline px-1"
              >
                Всі відкладені
              </button>
            )}
            <button
              onClick={onClearScheduledTime}
              className="p-1 hover:bg-[#E5DCCF] rounded-lg text-gray-500"
              title="Скасувати таймер для цього повідомлення"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : scheduledCountInCurrentChat > 0 && onOpenScheduledList ? (
        <div className="mb-1.5 px-2 py-1 bg-[#FAF4EB] border border-[#EDE4D6] rounded-xl flex items-center justify-between gap-2 text-[11px] animate-in fade-in">
          <button
            type="button"
            onClick={() => {
              soundFx.playTap();
              onOpenScheduledList();
            }}
            className="flex items-center gap-1.5 text-[#8C461A] hover:text-[#E87A42] font-semibold text-left transition-colors"
          >
            <Clock className="w-3 h-3 text-[#E87A42]" />
            <span>
              У цьому чаті заплановано <strong>{scheduledCountInCurrentChat}</strong> повідомл.
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFx.playTap();
              onOpenScheduledList();
            }}
            className="text-[10px] font-bold text-[#E87A42] hover:underline"
          >
            Переглянути →
          </button>
        </div>
      ) : null}

      {/* 5. Voice Recording Live Bar */}
      {isRecordingVoice ? (
        <div className="p-3 bg-[#1F2521] text-white rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono text-sm font-bold">
              {Math.floor(recordingSeconds / 60)}:
              {(recordingSeconds % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-xs text-white/60">Запис голосового повідомлення...</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cancelVoiceRecording}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Скасувати</span>
            </button>

            <button
              onClick={finishVoiceRecording}
              className="px-3.5 py-2 bg-[#E87A42] hover:bg-[#D46B35] text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Надіслати</span>
            </button>
          </div>
        </div>
      ) : (
        /* 6. Main Message Composer Bar */
        <div className="flex items-end gap-2 bg-white border border-[#DFD6C5] rounded-2xl p-1.5 sm:p-2 shadow-2xs focus-within:border-[#E87A42] transition-colors">
          {/* Action Studio Button (⚡) */}
          <button
            onClick={() => {
              soundFx.playTap();
              onOpenActions();
            }}
            className="p-2 bg-[#FCE7D8] hover:bg-[#F9CCA8] text-[#C45318] rounded-xl transition-colors shrink-0"
            title="Студія створення інтерактивних карток (таблиці, графіки, чек-листи)"
          >
            <Zap className="w-4 h-4" />
          </button>

          {/* Schedule Message (Clock) */}
          <button
            onClick={() => {
              soundFx.playTap();
              onOpenScheduler();
            }}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              scheduledTime
                ? 'bg-[#E87A42] text-white'
                : 'text-[#68766C] hover:text-[#1F2521] hover:bg-[#F2ECE0]'
            }`}
            title="Відкладене надсилання"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Style Presets Menu */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playTap();
                setShowStyleMenu(!showStyleMenu);
              }}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                showStyleMenu
                  ? 'bg-[#1F2521] text-white'
                  : 'text-[#68766C] hover:text-[#1F2521] hover:bg-[#F2ECE0]'
              }`}
              title="Стиль тексту"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {showStyleMenu && (
              <div className="absolute bottom-12 left-0 bg-[#FAF8F3] border border-[#DFD6C5] rounded-2xl p-2 shadow-xl w-48 space-y-1 z-30 animate-in fade-in">
                <p className="text-[10px] font-bold text-[#717E75] px-2 py-0.5 uppercase">
                  Стиль тексту
                </p>
                {stylePresets.map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => applyStyle(sp.id)}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-[#1F2521] hover:bg-[#F2EDE4] rounded-xl transition-colors"
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedMessagesForQuote.length > 0
                ? 'Додайте власний коментар до синтезу цитат...'
                : editingMessage
                ? 'Відредагуйте текст повідомлення...'
                : 'Напишіть повідомлення (Enter — надіслати, Shift+Enter — новий рядок)...'
            }
            className="flex-1 max-h-32 min-h-[36px] py-1.5 px-2 bg-transparent text-xs sm:text-sm text-[#1F2521] placeholder-[#8F9C92] resize-none focus:outline-none select-text"
          />

          {/* Emoji Picker Button */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playTap();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="p-2 text-[#68766C] hover:text-[#1F2521] hover:bg-[#F2ECE0] rounded-xl transition-colors shrink-0"
              title="Емодзі"
            >
              <Smile className="w-4 h-4" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-white border border-[#DFD6C5] rounded-2xl p-2.5 shadow-xl grid grid-cols-4 gap-1.5 w-48 z-30 animate-in fade-in">
                {emojiList.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      soundFx.playTap();
                      setText((prev) => prev + e);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 text-base hover:scale-125 transition-transform"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mic for Voice Message OR Send Button */}
          {text.trim() || selectedMessagesForQuote.length > 0 || editingMessage ? (
            <button
              onClick={handleSend}
              className="p-2 bg-[#E87A42] hover:bg-[#D46B35] text-white rounded-xl transition-colors shadow-2xs shrink-0"
              title="Надіслати повідомлення"
            >
              {editingMessage ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          ) : (
            <button
              onClick={startVoiceRecording}
              className="p-2 text-[#68766C] hover:text-[#E87A42] hover:bg-[#FCE7D8] rounded-xl transition-colors shrink-0"
              title="Записати голосове повідомлення"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
