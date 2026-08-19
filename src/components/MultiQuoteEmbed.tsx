import React, { useState } from 'react';
import { Quote, Sparkles, ChevronDown, ChevronUp, CheckCircle2, Copy, Check } from 'lucide-react';
import { MultiQuoteData } from '../types';
import { soundFx } from '../utils/sound';

interface MultiQuoteEmbedProps {
  data: MultiQuoteData;
}

export const MultiQuoteEmbed: React.FC<MultiQuoteEmbedProps> = ({ data }) => {
  const [showFullQuotes, setShowFullQuotes] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const copySynthesis = () => {
    soundFx.playTap();
    const textToCopy = `📋 ${data.title || 'Синтез цитат'}:\n${data.synthesis?.keyPoints.map((k) => `• ${k}`).join('\n')}\n\nВисновок: ${data.synthesis?.conclusion || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-3 pt-1 select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#E8DFD1]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FCE7D8] text-[#E87A42] rounded-lg">
            <Quote className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-[#1F2521] leading-tight">
              {data.title || 'Комбінована цитата та аналіз'}
            </h4>
            <span className="text-[10px] text-[#717E75]">
              {data.quotes.length} підкріплених повідомлень
            </span>
          </div>
        </div>

        <button
          onClick={copySynthesis}
          className="p-1.5 bg-[#FAF4EB] hover:bg-[#EFE8DC] text-[#475249] rounded-lg text-xs transition-colors"
          title="Копіювати синтез"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Synthesis Box */}
      {data.synthesis && (
        <div className="p-3.5 bg-[#FAF1E6] rounded-2xl border border-[#F3DAC2] space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8C461A]">
            <Sparkles className="w-3.5 h-3.5 text-[#E87A42]" />
            <span>AI Синтез ключових тез:</span>
          </div>

          <div className="space-y-1 pl-1">
            {data.synthesis.keyPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[#3D4740]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E87A42] mt-1.5 shrink-0" />
                <span className="leading-snug">{point}</span>
              </div>
            ))}
          </div>

          {data.synthesis.conclusion && (
            <div className="pt-2 border-t border-[#ECD1B8] text-[11px] text-[#733B17] font-medium leading-relaxed">
              <span className="font-bold">Висновок:</span> {data.synthesis.conclusion}
            </div>
          )}
        </div>
      )}

      {/* Accordion to view original quoted messages */}
      <div className="bg-white rounded-xl border border-[#DFD6C5] overflow-hidden">
        <button
          onClick={() => {
            soundFx.playTap();
            setShowFullQuotes(!showFullQuotes);
          }}
          className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-semibold text-[#515E54] hover:bg-[#FAF8F3] transition-colors"
        >
          <span>Оригінальні цитати ({data.quotes.length})</span>
          {showFullQuotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showFullQuotes && (
          <div className="p-2 space-y-2 border-t border-[#EFE8DC] bg-[#FAF8F3] max-h-48 overflow-y-auto">
            {data.quotes.map((q) => (
              <div
                key={q.id}
                className="p-2.5 bg-white rounded-xl border border-[#DFD6C5] text-xs space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] text-[#7A877E] font-medium">
                  <span className="font-bold text-[#1F2521]">{q.senderName}</span>
                  <span className="font-mono">{q.timestamp}</span>
                </div>
                <p className="text-[#323D36] italic leading-relaxed">
                  "{q.text}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
