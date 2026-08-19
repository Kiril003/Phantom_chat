import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Hand,
  Monitor,
  PhoneOff,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Volume2,
  Users
} from 'lucide-react';
import { AudioHuddleState, HuddleParticipant } from '../types';
import { soundFx } from '../utils/sound';

interface AudioHuddleBarProps {
  huddleState: AudioHuddleState;
  onLeaveHuddle: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onRaiseHand: () => void;
  hasRaisedHand: boolean;
}

export const AudioHuddleBar: React.FC<AudioHuddleBarProps> = ({
  huddleState,
  onLeaveHuddle,
  onToggleMute,
  isMuted,
  onRaiseHand,
  hasRaisedHand,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState(huddleState.liveTranscript);

  // Simulate incoming live transcript notes from audio
  useEffect(() => {
    if (!huddleState.active) return;
    const interval = setInterval(() => {
      const phrases = [
        { speaker: 'Марта', text: 'Я вже взяла столик на терасі біля квітів 🌸' },
        { speaker: 'Тарас', text: 'Зараз паркуюся біля Змієнка 🚗' },
        { speaker: 'Gemini Scribe ✦', text: 'Ключовий пункт: зустріч узгоджена на терасі, Тарас прибуває.' },
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setLiveTranscript((prev) => [
        ...prev.slice(-4),
        { ...randomPhrase, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    }, 12000);
    return () => clearInterval(interval);
  }, [huddleState.active]);

  if (!huddleState.active) return null;

  return (
    <div className="bg-[#FAF4EB] border-b border-[#E8DFD1] shadow-xs select-none z-20">
      {/* Compact Main Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Indicator & Active Participants */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FCE7D8] text-[#C45318] rounded-full text-xs font-bold shrink-0 border border-[#F5C7A9]">
            <span className="w-2 h-2 rounded-full bg-[#E87A42] animate-ping" />
            <span>Живий аудіо-ефір</span>
          </div>

          {/* Participant Avatars with live speaking ring */}
          <div className="flex items-center -space-x-2 overflow-hidden">
            {huddleState.participants.map((p) => (
              <div key={p.id} className="relative group">
                <img
                  src={p.avatar}
                  alt={p.name}
                  className={`w-7 h-7 rounded-full object-cover ring-2 ${
                    p.isSpeaking ? 'ring-[#E87A42] scale-105' : 'ring-white'
                  }`}
                />
                {p.isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#E87A42] rounded-full ring-1 ring-white animate-pulse" />
                )}
              </div>
            ))}
          </div>

          <span className="text-xs font-semibold text-[#1F2521] hidden sm:inline truncate">
            {huddleState.title}
          </span>
        </div>

        {/* Center: Live Waveform simulation */}
        <div className="hidden md:flex items-center gap-1 h-5 px-3 bg-white/70 rounded-full border border-[#DFD6C5]">
          {[12, 24, 18, 28, 14, 26, 16, 22, 10].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-[#E87A42] rounded-full"
              style={{
                height: isMuted ? '4px' : `${h}px`,
                transition: 'height 0.2s ease',
              }}
            />
          ))}
          <span className="text-[10px] font-medium text-[#738075] ml-1">
            {isMuted ? 'Мікрофон вимкнено' : 'Пряма мова'}
          </span>
        </div>

        {/* Right: Controls (Mic, Hand, AI Notes Toggle, Leave) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              soundFx.playTap();
              onToggleMute();
            }}
            className={`p-2 rounded-full font-semibold text-xs flex items-center gap-1 transition-all ${
              isMuted
                ? 'bg-[#EAE2D4] text-[#475249] hover:bg-[#DDD4C3]'
                : 'bg-[#E87A42] text-white shadow-2xs'
            }`}
            title={isMuted ? 'Увімкнути мікрофон' : 'Вимкнути мікрофон'}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              soundFx.playTap();
              onRaiseHand();
            }}
            className={`p-2 rounded-full transition-colors ${
              hasRaisedHand
                ? 'bg-[#FCDBC7] text-[#C45318]'
                : 'bg-white text-[#475249] hover:bg-[#F2ECE0] border border-[#DED4C3]'
            }`}
            title="Підняти руку"
          >
            <Hand className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 bg-white hover:bg-[#F2ECE0] text-[#333E37] border border-[#DED4C3] rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E87A42]" />
            <span className="hidden lg:inline">AI Стенограма</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={() => {
              soundFx.playTap();
              onLeaveHuddle();
            }}
            className="p-2 bg-[#F7DCD7] hover:bg-[#F3C4BD] text-[#B83226] rounded-full transition-colors"
            title="Залишити аудіо-ефір"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Live AI Transcript drawer */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t border-[#E5DDD0] bg-white/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#717E74]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E87A42]" />
              Жива стенограма та авто-протокол зустрічі (Gemini Live Scribe)
            </span>
            <span>Оновлюється в реальному часі</span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {liveTranscript.map((t, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl border text-xs flex items-start justify-between gap-2 ${
                  t.speaker.includes('Gemini')
                    ? 'bg-[#FAF1E6] border-[#F2DAC2] text-[#8C461A]'
                    : 'bg-[#FAF8F3] border-[#E8DFD1] text-[#2F3832]'
                }`}
              >
                <div className="min-w-0">
                  <span className="font-bold mr-1.5">{t.speaker}:</span>
                  <span>{t.text}</span>
                </div>
                <span className="text-[10px] text-[#8C988E] shrink-0 font-mono">
                  {t.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
