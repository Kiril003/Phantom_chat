import React from 'react';
import {
  SlidersHorizontal,
  Mic,
  Search,
  Volume2,
  VolumeX,
  Pin,
  FileSpreadsheet,
  Zap,
  FileText,
  Clock,
  Info
} from 'lucide-react';
import { Chat, UserProfile } from '../types';
import { soundFx } from '../utils/sound';

interface HeaderProps {
  currentChat: Chat;
  currentUser: UserProfile;
  onOpenDigest: () => void;
  onOpenActions: () => void;
  onOpenScheduledMessages?: () => void;
  scheduledMessagesCount?: number;
  onOpenSettings: () => void;
  onOpenGroupDetails: () => void;
  isHuddleActive: boolean;
  onToggleHuddle: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onToggleSearch: () => void;
  isSearching: boolean;
  pinnedCount?: number;
  onScrollToPinned?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentChat,
  currentUser,
  onOpenDigest,
  onOpenActions,
  onOpenScheduledMessages,
  scheduledMessagesCount = 0,
  onOpenSettings,
  onOpenGroupDetails,
  isHuddleActive,
  onToggleHuddle,
  isSoundEnabled,
  onToggleSound,
  onToggleSearch,
  isSearching,
  pinnedCount = 0,
  onScrollToPinned,
}) => {
  return (
    <header className="h-16 px-4 sm:px-6 bg-[#FAF8F3] border-b border-[#E8DFD1] flex items-center justify-between gap-3 select-none shrink-0 z-20">
      {/* 1. Left Chat Identity (Clickable to open Group Details / Profile) */}
      <div
        onClick={() => {
          soundFx.playTap();
          onOpenGroupDetails();
        }}
        className="flex items-center gap-3 min-w-0 cursor-pointer group py-1"
        title="Переглянути деталі бесіди, учасників та медіа"
      >
        <div className="relative shrink-0">
          <img
            src={currentChat.avatar}
            alt={currentChat.title}
            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white shadow-2xs group-hover:scale-105 transition-transform"
          />
          {currentChat.isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#528A4B] rounded-full ring-2 ring-white" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-sm sm:text-base text-[#1F2521] truncate group-hover:text-[#E87A42] transition-colors">
              {currentChat.title}
            </h2>
            <span className="px-1.5 py-0.5 bg-[#F2EDE4] text-[#556157] text-[10px] font-bold rounded-md uppercase border border-[#E2D8C7] shrink-0">
              {currentChat.circle}
            </span>
          </div>

          <p className="text-[11px] text-[#717E75] truncate flex items-center gap-1.5">
            {currentChat.topic ? (
              <span>{currentChat.topic}</span>
            ) : currentChat.membersCount ? (
              <span>{currentChat.membersCount} учасників</span>
            ) : (
              <span>{currentChat.customVibe || 'Активний діалог'}</span>
            )}
            <span className="text-[#A1ADA3]">· Деталі ℹ️</span>
          </p>
        </div>
      </div>

      {/* 2. Right Action Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* In-Chat Search Button */}
        <button
          onClick={() => {
            soundFx.playTap();
            onToggleSearch();
          }}
          className={`p-2 rounded-xl transition-colors ${
            isSearching
              ? 'bg-[#E87A42] text-white'
              : 'text-[#68766C] hover:text-[#1F2521] hover:bg-[#F2ECE0]'
          }`}
          title="Пошук повідомлень у цій бесіді"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Pinned Messages shortcut */}
        {pinnedCount > 0 && (
          <button
            onClick={() => {
              soundFx.playTap();
              onScrollToPinned?.();
            }}
            className="px-2.5 py-1.5 bg-[#FAF1E6] hover:bg-[#F6E6D2] border border-[#F3DAC2] text-[#8C461A] text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors shadow-2xs"
            title="Перейти до закріпленого повідомлення"
          >
            <Pin className="w-3.5 h-3.5 fill-current text-[#E87A42]" />
            <span className="hidden sm:inline">{pinnedCount}</span>
          </button>
        )}

        {/* Scheduled Messages Button */}
        <button
          onClick={() => {
            soundFx.playTap();
            onOpenScheduledMessages?.();
          }}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
            scheduledMessagesCount > 0
              ? 'bg-[#FAF1E6] hover:bg-[#F5E5D0] border-[#E8DFD0] text-[#8C461A]'
              : 'bg-white hover:bg-[#F2ECE0] text-[#556157] border-[#DFD6C5]'
          }`}
          title="Відкладені повідомлення та керування чергою"
        >
          <Clock className="w-3.5 h-3.5 text-[#E87A42]" />
          <span className="hidden sm:inline">Відкладені</span>
          {scheduledMessagesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#E87A42] text-white rounded-full text-[10px] font-bold">
              {scheduledMessagesCount}
            </span>
          )}
        </button>

        {/* Structured Catch-Up Brief / Digest Button */}
        <button
          onClick={() => {
            soundFx.playChime();
            onOpenDigest();
          }}
          className="px-3 py-1.5 bg-[#FAF4EB] hover:bg-[#F3E8D7] border border-[#E8DFD0] text-[#4A574E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
          title="Скласти конспект бесіди та підсумок домовленостей"
        >
          <FileText className="w-3.5 h-3.5 text-[#E87A42]" />
          <span className="hidden md:inline">Конспект</span>
        </button>

        {/* Live Audio Huddle Button */}
        <button
          onClick={() => {
            soundFx.playTap();
            onToggleHuddle();
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isHuddleActive
              ? 'bg-[#E87A42] text-white shadow-xs animate-pulse'
              : 'bg-white hover:bg-[#FAF4EB] text-[#3F4B41] border border-[#DFD6C5]'
          }`}
          title="Спільний аудіо-ефір (Voice Huddle)"
        >
          <Mic className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">
            {isHuddleActive ? 'В ефірі 🎙️' : 'Аудіо-ефір'}
          </span>
        </button>

        {/* Action Studio Button */}
        <button
          onClick={() => {
            soundFx.playTap();
            onOpenActions();
          }}
          className="p-2 bg-[#FCDBC7] hover:bg-[#F9CCA8] text-[#C45318] rounded-xl transition-colors shadow-2xs font-bold"
          title="Студія створення інтерактивних карток (таблиці, графіки, чеки, опитування)"
        >
          <Zap className="w-4 h-4" />
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => {
            soundFx.playTap();
            onToggleSound();
          }}
          className="p-2 text-[#68766C] hover:text-[#1F2521] hover:bg-[#F2ECE0] rounded-xl transition-colors"
          title={isSoundEnabled ? 'Вимкнути звуковий відгук' : 'Увімкнути звуковий відгук'}
        >
          {isSoundEnabled ? <Volume2 className="w-4 h-4 text-[#E87A42]" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
        </button>

        {/* Settings */}
        <button
          onClick={() => {
            soundFx.playTap();
            onOpenSettings();
          }}
          className="p-2 text-[#68766C] hover:text-[#1F2521] hover:bg-[#F2ECE0] rounded-xl transition-colors"
          title="Параметри месенджера"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
