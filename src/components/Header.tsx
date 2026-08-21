import React, { useState } from 'react';
import {
  Search,
  Pin,
  FileText,
  Clock,
  Zap,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Phone,
  Video,
  Bookmark,
  MessageSquare,
  MoreVertical,
  Mic,
  Users,
  Radio,
  Lock,
  Globe,
  ChevronLeft
} from 'lucide-react';
import { Chat, UserProfile, ActiveTransportStatus, TransportProtocol } from '../types';
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
  onOpenP2PNetworkModal?: () => void;
  onBack?: () => void;
  activeTransportStatus?: ActiveTransportStatus;
  transportMode?: TransportProtocol;
  networkLatencyMs?: number;
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
  onOpenP2PNetworkModal,
  onBack,
  activeTransportStatus = 'p2p-direct',
  transportMode = 'auto',
  networkLatencyMs = 14,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <header className="min-h-[3.75rem] pt-[var(--sat)] px-3 sm:px-6 bg-[#FAF8F5] border-b border-[#EAE2D5] flex items-center justify-between gap-2 sm:gap-3 select-none shrink-0 z-20 shadow-2xs">
      {/* 1. Left Chat Identity & Mobile Back Button */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 py-2">
        {/* Mobile Back Button (returns to chat list) */}
        {onBack && (
          <button
            onClick={() => {
              soundFx.playTap();
              onBack();
            }}
            className="md:hidden w-10 h-10 -ml-1.5 text-[#4F5C52] hover:text-[#1C2620] hover:bg-[#EFE9DF] rounded-full transition-colors shrink-0 active:scale-90 flex items-center justify-center"
            title="Назад до списку бесід"
            aria-label="Назад"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div
          onClick={() => {
            soundFx.playTap();
            onOpenGroupDetails();
          }}
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 cursor-pointer group flex-1"
          title="Переглянути деталі бесіди, учасників та медіа"
        >
          <div className="relative shrink-0">
            <img
              src={currentChat.avatar}
              alt={currentChat.title}
              className="w-10 h-10 sm:w-10 sm:h-10 rounded-2xl object-cover ring-1 ring-[#DFD6C5] shadow-2xs group-hover:scale-105 transition-transform"
            />
            {currentChat.isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#10B981] rounded-full ring-2 ring-white" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-[#1C2620] truncate group-hover:text-[#EA7A24] transition-colors">
                {currentChat.title}
              </h2>
              <span className="hidden xs:inline-block px-1.5 sm:px-2 py-0.2 sm:py-0.5 bg-[#F6EEE2] text-[#9A501F] text-[9px] sm:text-[10px] font-bold rounded-md uppercase border border-[#EDE0CF] shrink-0">
                {currentChat.circle?.toUpperCase() || 'WORK'}
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-[#728178] truncate">
              {currentChat.topic || currentChat.customVibe || 'Синхронізація релізу v2.4 та впровадження інтерактивних елементів'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Right Action Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 relative">
        
        {/* Live P2P / Server Protocol Badge (Desktop) */}
        {onOpenP2PNetworkModal && (
          <button
            onClick={() => {
              soundFx.playTap();
              onOpenP2PNetworkModal();
            }}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-2xs ${
              activeTransportStatus === 'p2p-direct'
                ? 'bg-[#EBF7EE] hover:bg-[#DEF0E2] text-[#246A34] border-[#B8E3C3]'
                : activeTransportStatus === 'server-ws'
                ? 'bg-[#EBF3FB] hover:bg-[#DFEDFA] text-[#20639B] border-[#BDD9F5]'
                : 'bg-[#FFF7ED] hover:bg-[#FEEFD8] text-[#9A3412] border-[#FED7AA]'
            }`}
            title="Натисніть для налаштування P2P тунелю або серверного релею"
          >
            {activeTransportStatus === 'p2p-direct' ? (
              <>
                <Lock className="w-3 h-3 text-[#10B981]" />
                <span className="truncate max-w-[100px]">P2P Direct</span>
                <span className="text-[10px] opacity-75 font-mono">{networkLatencyMs}ms</span>
              </>
            ) : activeTransportStatus === 'server-ws' ? (
              <>
                <Globe className="w-3 h-3 text-[#3B82F6]" />
                <span className="truncate max-w-[100px]">Server WS</span>
                <span className="text-[10px] opacity-75 font-mono">{networkLatencyMs}ms</span>
              </>
            ) : (
              <>
                <Radio className="w-3 h-3 text-[#E87A42] animate-pulse" />
                <span>Auto Hybrid</span>
              </>
            )}
          </button>
        )}

        {/* Thread / Digest Comments (Desktop & Tablet) */}
        <button
          onClick={() => {
            soundFx.playChime();
            onOpenDigest();
          }}
          className="hidden sm:flex p-2 text-[#5D6B61] hover:text-[#1C2620] hover:bg-[#EFE9DF] rounded-xl transition-colors"
          title="Підсумок та коментарі бесіди"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Pinned Messages shortcut / Bookmark (Desktop & Tablet) */}
        <button
          onClick={() => {
            soundFx.playTap();
            onScrollToPinned?.();
          }}
          className="hidden sm:flex p-2 text-[#5D6B61] hover:text-[#1C2620] hover:bg-[#EFE9DF] rounded-xl transition-colors relative"
          title="Закріплені повідомлення"
        >
          <Bookmark className="w-4 h-4" />
          {pinnedCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EA7A24] rounded-full" />
          )}
        </button>

        {/* Audio Call / Huddle */}
        <button
          onClick={() => {
            soundFx.playTap();
            onToggleHuddle();
          }}
          className={`p-2 rounded-xl transition-colors active:scale-95 ${
            isHuddleActive
              ? 'bg-[#EA7A24] text-white shadow-xs animate-pulse'
              : 'text-[#5D6B61] hover:text-[#1C2620] hover:bg-[#EFE9DF]'
          }`}
          title={isHuddleActive ? 'Аудіо-ефір активний' : 'Розпочати аудіо-ефір'}
        >
          <Phone className="w-4 h-4" />
        </button>

        {/* In-Chat Search Button (Desktop) */}
        <button
          onClick={() => {
            soundFx.playTap();
            onToggleSearch();
          }}
          className={`hidden sm:flex p-2 rounded-xl transition-colors ${
            isSearching
              ? 'bg-[#EA7A24] text-white'
              : 'text-[#5D6B61] hover:text-[#1C2620] hover:bg-[#EFE9DF]'
          }`}
          title="Пошук у бесіді"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* More Actions Dropdown (Responsive for both Mobile & Desktop) */}
        <button
          onClick={() => {
            soundFx.playTap();
            setShowMoreMenu(!showMoreMenu);
          }}
          className="p-2 text-[#5D6B61] hover:text-[#1C2620] hover:bg-[#EFE9DF] rounded-xl transition-colors active:scale-95"
          title="Більше дій"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu with Backdrop click handler */}
        {showMoreMenu && (
          <>
            <div
              className="fixed inset-0 z-25 bg-black/10"
              onClick={() => setShowMoreMenu(false)}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-12 z-30 w-64 p-2 bg-white border border-[#DFD7C8] rounded-2xl shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Mobile: Search in chat option */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onToggleSearch();
                }}
                className="sm:hidden w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-[#FAF6EF] text-[#1C2620] transition-colors"
              >
                <Search className="w-4 h-4 text-[#EA7A24]" />
                <span>Пошук у бесіді</span>
              </button>

              {/* Mobile: Pinned messages */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onScrollToPinned?.();
                }}
                className="sm:hidden w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between hover:bg-[#FAF6EF] text-[#1C2620] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#EA7A24]" />
                  <span>Закріплені повідомлення</span>
                </div>
                {pinnedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#EA7A24] text-white rounded-full text-[10px] font-bold">
                    {pinnedCount}
                  </span>
                )}
              </button>

              {/* Mobile: Digest summary */}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenDigest();
                }}
                className="sm:hidden w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-[#FAF6EF] text-[#1C2620] transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-[#EA7A24]" />
                <span>AI Конспект & Підсумок</span>
              </button>

              {onOpenP2PNetworkModal && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenP2PNetworkModal();
                  }}
                  className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-[#FAF6EF] text-[#1C2620] transition-colors"
                >
                  <Radio className="w-4 h-4 text-[#10B981]" />
                  <div className="flex-1">
                    <span>P2P / Серверний зв'язок</span>
                    <span className="block text-[10px] text-[#78887F] font-normal">Зміна протоколу, WebRTC тунель</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenActions();
                }}
                className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-[#FAF6EF] text-[#1C2620] transition-colors"
              >
                <Zap className="w-4 h-4 text-[#EA7A24]" />
                <span>Студія карток (таблиці, опитування)</span>
              </button>

              {onOpenScheduledMessages && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenScheduledMessages();
                  }}
                  className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between hover:bg-[#FAF6EF] text-[#1C2620] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#EA7A24]" />
                    <span>Відкладені повідомлення</span>
                  </div>
                  {scheduledMessagesCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#EA7A24] text-white rounded-full text-[10px] font-bold">
                      {scheduledMessagesCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onToggleSound();
                }}
                className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-[#FAF6EF] text-[#1C2620] transition-colors"
              >
                {isSoundEnabled ? <Volume2 className="w-4 h-4 text-[#EA7A24]" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                <span>{isSoundEnabled ? 'Звук увімкнено' : 'Звук вимкнено'}</span>
              </button>

              <div className="pt-1 border-t border-[#F2ECE2]">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenSettings();
                  }}
                  className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 hover:bg-[#FAF6EF] text-[#1C2620] transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 text-[#717E75]" />
                  <span>Налаштування месенджера</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

