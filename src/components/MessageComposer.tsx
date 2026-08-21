import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Smile,
  Zap,
  X,
  Plus,
  Clock,
  Check,
  Quote,
  Layers,
  StopCircle,
  Trash2,
  Sliders,
  Bold,
  Italic,
  Code,
  Eye,
  Strikethrough,
  List,
  Sparkles,
  Image as ImageIcon,
  AtSign,
  Play,
  Pause,
  Reply,
  FileEdit
} from 'lucide-react';
import { Message, ChatMember, MessageReplyInfo } from '../types';
import { soundFx } from '../utils/sound';

interface MessageComposerProps {
  onSendMessage: (text: string, scheduledTime?: string) => void;
  onSendVoiceMessage: (duration: number, transcript: string) => void;
  onOpenActions: () => void;
  onOpenScheduler: () => void;
  onOpenScheduledList?: () => void;
  scheduledCountInCurrentChat?: number;
  replyingTo: MessageReplyInfo | null;
  onCancelReply: () => void;
  onRemoveReplyQuote?: (quoteId: string) => void;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  onSaveEdit: (messageId: string, newText: string) => void;
  selectedMessagesForQuote: Message[];
  onSynthesizeMultiQuote: (title: string, userCommentary: string) => void;
  onClearSelectedQuotes: () => void;
  scheduledTime?: string;
  onClearScheduledTime?: () => void;
  chatMembers?: ChatMember[];
  chatId?: string;
  initialDraft?: string;
  onDraftChange?: (chatId: string, draftText: string) => void;
}

const emojiList = ['✨', '🌱', '☕', '❤️', '👍', '🔥', '👏', '🙌', '💡', '📌', '🎯', '🚀', '🌿', '🤝', '😊', '👌', '🤩', '🫡', '🎉', '🏆'];

const stylePresets = [
  { id: 'concise', label: 'Лаконічно ⚡', desc: 'Прибрати зайве та виділити суть' },
  { id: 'warm', label: 'Тепло & Дружньо ☕', desc: 'Додати щирого настрою та привітання' },
  { id: 'business', label: 'Діловий тон 💼', desc: 'Чіткі конструкції для робочих домовленостей' },
  { id: 'polite', label: 'Ввічливо & М’яко 🌿', desc: 'Турботливий та делікатний запит' },
  { id: 'translate_en', label: 'Перекласти на English 🌐', desc: 'Швидкий переклад тексту англійською' },
  { id: 'fix_grammar', label: 'Виправити граматику ✨', desc: 'Очистити пунктуацію та автокорекція' },
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
  onRemoveReplyQuote,
  editingMessage,
  onCancelEdit,
  onSaveEdit,
  selectedMessagesForQuote,
  onSynthesizeMultiQuote,
  onClearSelectedQuotes,
  scheduledTime,
  onClearScheduledTime,
  chatMembers = [],
  chatId,
  initialDraft = '',
  onDraftChange,
}) => {
  const [text, setText] = useState(initialDraft);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showFormattingBar, setShowFormattingBar] = useState(false);
  const [showSmartChips, setShowSmartChips] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [multiQuoteTitle, setMultiQuoteTitle] = useState('Зведена цитата домовленостей');

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionCursorPos, setMentionCursorPos] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingTimerRef = useRef<any>(null);
  const prevChatIdRef = useRef<string | undefined>(chatId);
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;

  // Sync draft when switching chats
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      // Switching to another chat: load this chat's initial draft
      prevChatIdRef.current = chatId;
      setText(initialDraft || '');
      setShowEmojiPicker(false);
      setShowStyleMenu(false);
      setShowFormattingBar(false);
      setMentionQuery(null);
    }
  }, [chatId, initialDraft]);

  // Sync editing message
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Track mentions in text and save draft per chat when typing
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setText(val);

    if (chatId && !editingMessage && onDraftChangeRef.current) {
      onDraftChangeRef.current(chatId, val);
    }

    // Look back from cursor to see if inside @mention
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\u0400-\u04FF]*)$/);

    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionCursorPos(cursorPos);
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelectMention = (member: ChatMember) => {
    soundFx.playTap();
    if (!textareaRef.current) return;
    const cursorPos = mentionCursorPos;
    const textBefore = text.slice(0, cursorPos);
    const atIndex = textBefore.lastIndexOf('@');
    const textAfter = text.slice(cursorPos);

    const replacement = `@${member.name} `;
    const newText = text.slice(0, atIndex) + replacement + textAfter;
    setText(newText);
    if (chatId && !editingMessage && onDraftChangeRef.current) {
      onDraftChangeRef.current(chatId, newText);
    }
    setMentionQuery(null);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursor = atIndex + replacement.length;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 50);
  };

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    soundFx.playTap();
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = text.slice(start, end);

    const newText = text.slice(0, start) + prefix + selected + suffix + text.slice(end);
    setText(newText);
    if (chatId && !editingMessage && onDraftChangeRef.current) {
      onDraftChangeRef.current(chatId, newText);
    }

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursor = start + prefix.length + selected.length;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 50);
  };

  const handleSend = () => {
    if (editingMessage) {
      if (text.trim()) {
        onSaveEdit(editingMessage.id, text.trim());
        setText('');
        if (chatId && onDraftChangeRef.current) {
          onDraftChangeRef.current(chatId, '');
        }
      }
      return;
    }

    if (selectedMessagesForQuote.length > 0) {
      onSynthesizeMultiQuote(multiQuoteTitle, text.trim());
      setText('');
      if (chatId && onDraftChangeRef.current) {
        onDraftChangeRef.current(chatId, '');
      }
      return;
    }

    if (!text.trim()) return;
    soundFx.playSend();
    onSendMessage(text.trim(), scheduledTime);
    setText('');
    if (chatId && onDraftChangeRef.current) {
      onDraftChangeRef.current(chatId, '');
    }
    setMentionQuery(null);
    setShowFormattingBar(false);
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
      'Ознайомився з дизайн-системою, кольори та типографіка ідеально підходять.',
    ];
    const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
    onSendVoiceMessage(duration, randomTranscript);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const applyStyle = (styleId: string) => {
    soundFx.playTap();
    if (!text.trim()) return;
    const transformed = stylePresets.find((s) => s.id === styleId);
    let newText = text.trim();
    if (styleId === 'concise') {
      newText = newText.replace(/будь ласка/gi, '').replace(/\s+/g, ' ').trim();
      newText = `📌 **Суть:** ${newText}`;
    } else if (styleId === 'warm') {
      newText = `Привіт! 😊 ${newText} Дякую за співпрацю! ☕`;
    } else if (styleId === 'business') {
      newText = `Доброго дня. Щодо питання: ${newText}. Прошу підтвердити узгодження.`;
    } else if (styleId === 'polite') {
      newText = `Буду дуже вдячний, якщо знайдете хвилинку: ${newText} ✨`;
    } else if (styleId === 'translate_en') {
      newText = `Hi team! Regarding the update: ${newText}. Everything is aligned.`;
    } else if (styleId === 'fix_grammar') {
      newText = newText.charAt(0).toUpperCase() + newText.slice(1);
      if (!/[.!?]$/.test(newText)) newText += '.';
    }
    setText(newText);
    if (chatId && !editingMessage && onDraftChangeRef.current) {
      onDraftChangeRef.current(chatId, newText);
    }
    setShowStyleMenu(false);
  };

  const filteredMembers = mentionQuery !== null
    ? chatMembers.filter((m) =>
        m.name.toLowerCase().includes(mentionQuery) ||
        m.handle.toLowerCase().includes(mentionQuery)
      )
    : [];

  return (
    <div className="px-3 pt-2 pb-[calc(var(--sab)+0.5rem)] sm:p-4 bg-[#FAF8F3] border-t border-[#E8DFD1] shrink-0 select-none relative z-20 shadow-2xs">
      {/* Mention Autocomplete Dropdown */}
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 bg-white border border-[#DFD6C5] rounded-2xl shadow-xl w-64 max-h-48 overflow-y-auto p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
          <p className="text-[10px] font-bold text-[#717E75] px-2 py-1 uppercase tracking-wider">
            Згадати учасника
          </p>
          {filteredMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelectMention(member)}
              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#FAF6EE] rounded-xl text-left transition-colors"
            >
              <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-[#1F2521] truncate">{member.name}</p>
                <p className="text-[10px] text-[#717E75] truncate">{member.handle}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 1. Multi-Quote Synthesis Banner */}
      {selectedMessagesForQuote.length > 0 && (
        <div className="mb-2 p-2.5 bg-[#FAF1E6] border border-[#EACBB0] rounded-2xl space-y-2 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#E87A42]" />
              <span className="font-bold text-xs text-[#8C461A]">
                Синтез {selectedMessagesForQuote.length} вибраних повідомлень
              </span>
            </div>
            <button
              onClick={onClearSelectedQuotes}
              className="p-1 text-[#8C7E72] hover:text-[#1F2521] rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            value={multiQuoteTitle}
            onChange={(e) => setMultiQuoteTitle(e.target.value)}
            placeholder="Заголовок синтезу цитат..."
            className="w-full px-2.5 py-1 bg-white border border-[#DFD6C5] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#E87A42]"
          />

          <div className="space-y-1 max-h-20 overflow-y-auto">
            {selectedMessagesForQuote.map((m) => (
              <div key={m.id} className="text-[11px] text-[#556157] bg-white/80 p-1.5 rounded-xl border border-[#EAE0D1] truncate">
                <span className="font-bold text-[#E87A42]">{m.senderName}: </span>
                <span>{m.text || m.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Replying-to Banner (Single, Selected Fragment, or Multi-Message Quotes) */}
      {replyingTo && (
        <div className="mb-2 p-2.5 bg-[#FAF4EA] border border-[#EBD6C3] border-l-4 border-l-[#E87A42] rounded-2xl space-y-1.5 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Reply className="w-3.5 h-3.5 text-[#E87A42] shrink-0" />
              {replyingTo.quotes && replyingTo.quotes.length > 1 ? (
                <span className="font-bold text-[#8C461A] text-[11px] truncate">
                  Відповідь на {replyingTo.quotes.length} повідомлень
                </span>
              ) : replyingTo.quoteSelectedText ? (
                <span className="font-bold text-[#8C461A] text-[11px] truncate">
                  Цитата фрагмента від {replyingTo.senderName}
                </span>
              ) : (
                <span className="font-bold text-[#8C461A] text-[11px] truncate">
                  Відповідь для {replyingTo.senderName}
                </span>
              )}
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 text-[#8C7E72] hover:text-[#1F2521] hover:bg-[#EFE4D6] rounded-lg transition-colors shrink-0"
              title="Скасувати відповідь"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* If Multi-message quotes */}
          {replyingTo.quotes && replyingTo.quotes.length > 0 ? (
            <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
              {replyingTo.quotes.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between gap-2 bg-white/90 px-2 py-1 rounded-xl border border-[#E8DFC8] text-[11px]"
                >
                  <div className="min-w-0 flex items-center gap-1.5 truncate">
                    {q.senderAvatar && (
                      <img src={q.senderAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                    )}
                    <span className="font-bold text-[#E87A42] shrink-0">{q.senderName}:</span>
                    <span className="text-[#556157] truncate">{q.text}</span>
                  </div>
                  {onRemoveReplyQuote && (
                    <button
                      onClick={() => onRemoveReplyQuote(q.id)}
                      className="p-0.5 text-gray-400 hover:text-red-500 rounded-md shrink-0"
                      title="Прибрати цю цитату"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : replyingTo.quoteSelectedText ? (
            /* If partial text snippet quote */
            <div className="bg-white/90 p-2 rounded-xl border border-[#E8DFC8] text-xs">
              <p className="italic text-[#424F45] leading-relaxed">
                «{replyingTo.quoteSelectedText}»
              </p>
            </div>
          ) : (
            /* Single full message reply */
            <p className="text-[#556157] truncate text-[11px] pl-5">
              {replyingTo.text}
            </p>
          )}
        </div>
      )}

      {/* 3. Editing Message Banner */}
      {editingMessage && (
        <div className="mb-2 p-2 bg-[#FAF1E6] border-l-4 border-[#528A4B] rounded-xl flex items-center justify-between gap-2 text-xs animate-in fade-in">
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
              title="Скасувати таймер"
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

      {/* 5. Voice Recording Live Visualizer Bar */}
      {isRecordingVoice ? (
        <div className="p-3 bg-[#1F2521] text-white rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="font-mono text-sm font-bold shrink-0">
              {Math.floor(recordingSeconds / 60)}:
              {(recordingSeconds % 60).toString().padStart(2, '0')}
            </span>

            {/* Equalizer frequency bars animation */}
            <div className="flex items-center gap-1 h-6 px-2">
              {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80].map((val, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#EA7A24] rounded-full animate-pulse"
                  style={{
                    height: `${(val * 0.22) + Math.sin(Date.now() / 200 + i) * 6}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>

            <span className="text-xs text-white/60 truncate hidden sm:inline">Запис аудіо...</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={cancelVoiceRecording}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Скасувати</span>
            </button>

            <button
              onClick={finishVoiceRecording}
              className="px-3.5 py-2 bg-[#EA7A24] hover:bg-[#D76931] text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Надіслати</span>
            </button>
          </div>
        </div>
      ) : (
        /* 6. Main Clean Message Composer Bar */
        <div className="flex items-end gap-2.5">
          {/* Action Studio & Attachments Button (+) */}
          <button
            onClick={() => {
              soundFx.playTap();
              onOpenActions();
            }}
            className="w-10 h-10 bg-[#EFE9DF] hover:bg-[#E4DCCF] text-[#4F5C52] hover:text-[#1C2620] rounded-xl transition-all shrink-0 flex items-center justify-center shadow-2xs"
            title="Створити картку або додати вкладення (+)"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Center Input Box */}
          <div className="flex-1 bg-[#EDE9E1] hover:bg-[#E8E3D9] focus-within:bg-white border border-[#DFD8C9] focus-within:border-[#EA7A24] rounded-2xl px-3 py-1.5 flex items-end gap-2 transition-all shadow-2xs">
            {/* Text Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedMessagesForQuote.length > 0
                  ? 'Додайте коментар до цитати...'
                  : editingMessage
                  ? 'Редагувати повідомлення...'
                  : 'Написати повідомлення (Enter — відправити, Shift+Enter — новий рядок, @ для згадки)...'
              }
              className="flex-1 max-h-32 min-h-[28px] py-1 bg-transparent text-xs sm:text-sm text-[#1C2620] placeholder-[#8C988E] resize-none focus:outline-none select-text leading-relaxed"
            />

            {/* Inline Emoji Picker Button */}
            <div className="relative pb-0.5">
              <button
                onClick={() => {
                  soundFx.playTap();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="p-1.5 text-[#6B786E] hover:text-[#1C2620] rounded-lg transition-colors shrink-0"
                title="Емодзі"
              >
                <Smile className="w-4.5 h-4.5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 bg-white border border-[#DFD6C5] rounded-2xl p-2.5 shadow-xl grid grid-cols-5 gap-1.5 w-56 z-30 animate-in fade-in">
                  {emojiList.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        soundFx.playTap();
                        const newText = text + e;
                        setText(newText);
                        if (chatId && !editingMessage && onDraftChangeRef.current) {
                          onDraftChangeRef.current(chatId, newText);
                        }
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

            {/* Inline @ Mention Button */}
            <button
              onClick={() => {
                soundFx.playTap();
                const newText = text + '@';
                setText(newText);
                setMentionQuery('');
                setMentionCursorPos(newText.length);
                textareaRef.current?.focus();
              }}
              className="p-1.5 text-[#6B786E] hover:text-[#1C2620] rounded-lg transition-colors shrink-0 pb-1"
              title="Згадати учасника (@)"
            >
              <AtSign className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Mic for Voice Message OR Send Button */}
          {text.trim() || selectedMessagesForQuote.length > 0 || editingMessage ? (
            <button
              onClick={handleSend}
              className="w-10 h-10 bg-[#EA7A24] hover:bg-[#D76931] text-white rounded-xl transition-transform active:scale-95 shadow-xs shrink-0 flex items-center justify-center"
              title="Надіслати повідомлення"
            >
              {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-4.5 h-4.5 -rotate-12 translate-x-0.5" />}
            </button>
          ) : (
            <button
              onClick={startVoiceRecording}
              className="w-10 h-10 bg-[#EFE9DF] hover:bg-[#E4DCCF] text-[#4F5C52] hover:text-[#EA7A24] rounded-xl transition-colors shrink-0 flex items-center justify-center shadow-2xs"
              title="Записати голосове повідомлення"
            >
              <Mic className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
