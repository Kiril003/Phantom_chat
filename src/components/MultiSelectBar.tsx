import React from 'react';
import {
  Sparkles,
  Quote,
  Copy,
  Forward,
  Pin,
  Trash2,
  X,
  CheckSquare,
  Calendar
} from 'lucide-react';
import { soundFx } from '../utils/sound';

interface MultiSelectBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onSynthesize: () => void;
  onCreateMultiQuote: () => void;
  onCopyAll: () => void;
  onForward: () => void;
  onCalendarSync?: () => void;
}

export const MultiSelectBar: React.FC<MultiSelectBarProps> = ({
  selectedCount,
  onClearSelection,
  onSynthesize,
  onCreateMultiQuote,
  onCopyAll,
  onForward,
  onCalendarSync,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#FAF8F3]/95 backdrop-blur-md border border-[#DED4C3] shadow-2xl rounded-2xl p-2 flex items-center gap-1.5 sm:gap-2 animate-in fade-in slide-in-from-bottom-3 text-xs max-w-[95%] sm:max-w-xl">
      {/* Count pill */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F2521] text-white rounded-xl font-bold shrink-0">
        <CheckSquare className="w-3.5 h-3.5" />
        <span>{selectedCount} обрано</span>
      </div>

      {/* 1. AI Synthesize Button */}
      <button
        onClick={() => {
          soundFx.playChime();
          onSynthesize();
        }}
        className="px-3 py-1.5 bg-[#FCDBC7] hover:bg-[#F9CCA8] text-[#C45318] rounded-xl font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
        title="Синтезувати зміст обраних повідомлень через AI"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">AI Синтез ✦</span>
      </button>

      {/* 2. Calendar Sync from Selection */}
      {onCalendarSync && (
        <button
          onClick={() => {
            soundFx.playTap();
            onCalendarSync();
          }}
          className="px-2.5 py-1.5 bg-white hover:bg-[#F2ECE0] text-[#3F4A42] border border-[#DFD6C5] rounded-xl font-semibold flex items-center gap-1 transition-colors"
          title="Створити подію в календарі з обраних"
        >
          <Calendar className="w-3.5 h-3.5 text-[#E87A42]" />
          <span className="hidden md:inline">Подія</span>
        </button>
      )}

      {/* 3. Create Multi-Quote */}
      <button
        onClick={() => {
          soundFx.playTap();
          onCreateMultiQuote();
        }}
        className="px-2.5 py-1.5 bg-white hover:bg-[#F2ECE0] text-[#3F4A42] border border-[#DFD6C5] rounded-xl font-semibold flex items-center gap-1 transition-colors"
        title="Створити мульти-цитату"
      >
        <Quote className="w-3.5 h-3.5 text-[#E87A42]" />
        <span className="hidden md:inline">Цитата</span>
      </button>

      {/* 4. Copy All */}
      <button
        onClick={() => {
          soundFx.playTap();
          onCopyAll();
        }}
        className="p-2 bg-white hover:bg-[#F2ECE0] text-[#475249] border border-[#DFD6C5] rounded-xl transition-colors"
        title="Копіювати всі тексти"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* 5. Forward */}
      <button
        onClick={() => {
          soundFx.playTap();
          onForward();
        }}
        className="p-2 bg-white hover:bg-[#F2ECE0] text-[#475249] border border-[#DFD6C5] rounded-xl transition-colors"
        title="Переслати"
      >
        <Forward className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-5 bg-[#E2D8C7] my-auto" />

      {/* Cancel selection */}
      <button
        onClick={() => {
          soundFx.playTap();
          onClearSelection();
        }}
        className="p-1.5 text-[#738075] hover:text-[#1F2521] hover:bg-[#EFE8DC] rounded-lg transition-colors"
        title="Скасувати виділення"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

