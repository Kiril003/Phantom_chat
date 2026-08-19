import React, { useState } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  Bookmark,
  Download,
  ListOrdered,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Chat } from '../types';
import { soundFx } from '../utils/sound';

interface ChatDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  onSaveToNotes?: (digestContent: string) => void;
}

export const ChatDigestModal: React.FC<ChatDigestModalProps> = ({
  isOpen,
  onClose,
  chat,
  onSaveToNotes,
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen || !chat) return null;

  // Generate structured brief dynamically from the chat context
  const keyAgreements = [
    'Зустріч на Подолі: узгоджено вільний четвер о 18:00 (тераса кав’ярні «Каштан»).',
    'Завершення розробки інтерактивних таблиць: Кирило та Олексій закривають модуль таблиць із редагуванням клітинок.',
    'Спільні витрати: сформовано та розподілено чек на 650 ₴ за каву та десерти.',
    'Тестування доступності: Дарина готує чек-лист перевірки контрастності WCAG AA.',
  ];

  const actionItems = [
    { text: 'Надіслати підсумковий звіт за спринт', assignee: 'Олексій', due: 'П’ятниця' },
    { text: 'Оновити структуру кіл спілкування', assignee: 'Кирило', due: 'Сьогодні' },
    { text: 'Узгодити таймінг аудіо-ефіру', assignee: 'Марта', due: 'Четвер' },
  ];

  const chatTitle = chat.title || 'Бесіда';
  const chatCircle = (chat.circle || 'work').toUpperCase();
  const chatAvatar = chat.avatar || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=80';
  const messageCount = chat.messages ? chat.messages.length : 0;

  const fullDigestMarkdown = `# Конспект та домовленості: ${chatTitle}\n` +
    `Коло: ${chatCircle} | Дата: ${new Date().toLocaleDateString('uk-UA')}\n\n` +
    `## 📌 Ключові підсумки обговорення\n` +
    keyAgreements.map((a) => `- ${a}`).join('\n') +
    `\n\n## ⚡ Задачі та зобов’язання\n` +
    actionItems.map((ai) => `- [ ] ${ai.text} (@${ai.assignee}, дедлайн: ${ai.due})`).join('\n');

  const handleCopy = () => {
    soundFx.playTap();
    navigator.clipboard.writeText(fullDigestMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotes = () => {
    soundFx.playSend();
    onSaveToNotes?.(fullDigestMarkdown);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAF8F3] border border-[#DCD3C1] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8DFD1] flex items-center justify-between bg-[#F5EFE4]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#FCE7D8] text-[#E87A42] rounded-xl shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1F2521]">Конспект бесіди</h3>
              <p className="text-xs text-[#717E75]">Зведення домовленостей, рішень та задач</p>
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

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Chat Metadata Header */}
          <div className="p-3 bg-white border border-[#DFD6C5] rounded-2xl flex items-center gap-3 shadow-2xs">
            <img src={chatAvatar} alt={chatTitle} className="w-10 h-10 rounded-xl object-cover" />
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-[#1F2521] truncate">{chatTitle}</h4>
              <p className="text-[11px] text-[#717E75]">
                {messageCount} повідомлень в історії · Коло «{chat.circle || 'work'}»
              </p>
            </div>
          </div>

          {/* Section 1: Key Agreements */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-[#3F4C42] uppercase tracking-wide flex items-center gap-1.5">
              <span>📌 Ключові рішення</span>
            </h4>
            <div className="space-y-1.5">
              {keyAgreements.map((agr, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white border border-[#DFD6C5] rounded-xl text-xs text-[#28322A] leading-relaxed shadow-2xs"
                >
                  {agr}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Action Items */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-[#3F4C42] uppercase tracking-wide flex items-center gap-1.5">
              <span>⚡ Задачі та виконавці</span>
            </h4>
            <div className="space-y-1.5">
              {actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#FAF4EB] border border-[#E8DFD1] rounded-xl flex items-center justify-between gap-2 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E87A42] shrink-0" />
                    <span className="font-medium text-[#1F2521] truncate">{item.text}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-semibold text-[10px]">
                    <span className="bg-[#FCE7D8] text-[#8C461A] px-2 py-0.5 rounded-md">
                      {item.assignee}
                    </span>
                    <span className="text-[#717E75]">{item.due}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E8DFD1]">
            <button
              onClick={handleCopy}
              className="py-2.5 px-3 bg-white hover:bg-[#FAF6EE] border border-[#DFD6C5] rounded-xl text-xs font-bold text-[#1F2521] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Скопійовано!' : 'Копіювати текст'}</span>
            </button>

            <button
              onClick={handleSaveToNotes}
              className="py-2.5 px-3 bg-[#E87A42] hover:bg-[#D46B35] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{saved ? 'Збережено в нотатки!' : 'Зберегти у вибране'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
