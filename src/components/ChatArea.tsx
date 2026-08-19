import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCheck,
  Pin,
  Clock,
  ThumbsUp,
  Heart,
  Smile,
  Copy,
  Receipt,
  BarChart2,
  Calendar,
  Volume2,
  Reply,
  CheckSquare,
  Square,
  FileSpreadsheet,
  BarChart3,
  ListTodo,
  Quote,
  Forward,
  MoreHorizontal,
  Edit2,
  Trash2,
  Download,
  FileText,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Sparkles,
  Languages,
  Bookmark,
  BookmarkCheck,
  SmilePlus,
  Flame
} from 'lucide-react';
import { Message, LocationData, ChatMember, UserProfile, TableData, TaskListData } from '../types';
import { soundFx } from '../utils/sound';
import { DataTableViewer } from './DataTableViewer';
import { ChartEmbed } from './ChartEmbed';
import { TaskListEmbed } from './TaskListEmbed';
import { MultiQuoteEmbed } from './MultiQuoteEmbed';

interface ChatAreaProps {
  messages: Message[];
  currentUserId: string;
  onOpenLocation: (loc: LocationData) => void;
  onVotePoll: (messageId: string, optionId: string) => void;
  onPayBillShare: (messageId: string, participantId: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onReplyMessage: (msg: Message) => void;
  onEditMessage?: (msg: Message) => void;
  onDeleteMessage?: (msgId: string) => void;
  onTogglePinMessage?: (msgId: string) => void;
  onForwardMessage?: (msg: Message) => void;
  onSelectMemberByName?: (name: string) => void;
  selectedMessageIds: string[];
  onToggleSelectMessage: (id: string) => void;
  isSelectionMode: boolean;
  onUpdateTableData?: (messageId: string, updatedTable: TableData) => void;
  onUpdateTaskListData?: (messageId: string, updatedTaskList: TaskListData) => void;
  onOpenImageLightbox?: (imgUrl: string, title?: string) => void;
  isSearching: boolean;
  onCloseSearch: () => void;
  onSendQuickReply?: (text: string) => void;
}

const quickReactions = ['❤️', '👍', '🔥', '👏', '😂', '💡'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentUserId,
  onOpenLocation,
  onVotePoll,
  onPayBillShare,
  onAddReaction,
  onReplyMessage,
  onEditMessage,
  onDeleteMessage,
  onTogglePinMessage,
  onForwardMessage,
  onSelectMemberByName,
  selectedMessageIds,
  onToggleSelectMessage,
  isSelectionMode,
  onUpdateTableData,
  onUpdateTaskListData,
  onOpenImageLightbox,
  isSearching,
  onCloseSearch,
  onSendQuickReply,
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState<number>(0);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  // AI Instant Features (Translation, Summary, Bookmarks)
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, { text: string; lang: string }>>({});
  const [summarizedMessages, setSummarizedMessages] = useState<Record<string, string>>({});
  const [savedMessages, setSavedMessages] = useState<Record<string, boolean>>({});
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastNotification(text);
    setTimeout(() => setToastNotification(null), 2500);
  };

  const handleToggleTranslate = (msg: Message) => {
    soundFx.playTap();
    if (translatedMessages[msg.id]) {
      setTranslatedMessages((prev) => {
        const next = { ...prev };
        delete next[msg.id];
        return next;
      });
      return;
    }

    const originalText = msg.text || '';
    // Smart simulated translation with organic accuracy
    let translation = '';
    if (originalText.includes('Aura') || originalText.includes('design') || originalText.includes('meeting')) {
      translation = 'Design updates and interactive components have been fully integrated into the Aura workspace. Everything looks consistent and responsive.';
    } else if (originalText.includes('кава') || originalText.includes('зустріч') || originalText.includes('вул.')) {
      translation = 'Let’s meet at the specialty coffee spot on Reitarska st. at 15:00. The atmosphere there is perfect for deep work.';
    } else {
      translation = `[English Translation]: ${originalText}`;
    }

    setTranslatedMessages((prev) => ({
      ...prev,
      [msg.id]: { text: translation, lang: 'EN' },
    }));
    showToast('✨ Повідомлення перекладено на англійську');
  };

  const handleToggleSummary = (msg: Message) => {
    soundFx.playTap();
    if (summarizedMessages[msg.id]) {
      setSummarizedMessages((prev) => {
        const next = { ...prev };
        delete next[msg.id];
        return next;
      });
      return;
    }

    const summary = msg.text
      ? `💡 Ключовий висновок: ${msg.text.slice(0, 75)}... (Всі деталі узгоджено)`
      : '💡 Структуровані дані готові до експорту';

    setSummarizedMessages((prev) => ({
      ...prev,
      [msg.id]: summary,
    }));
    showToast('⚡ AI підсумок згенеровано');
  };

  const handleToggleBookmark = (msg: Message) => {
    soundFx.playSend();
    const isNowSaved = !savedMessages[msg.id];
    setSavedMessages((prev) => ({ ...prev, [msg.id]: isNowSaved }));
    showToast(isNowSaved ? '🔖 Додано в «Збережене»' : 'Вилучено зі «Збереженого»');
  };

  // In-chat search state
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  // Pinned messages navigation
  const pinnedMessages = messages.filter((m) => m.isPinned);
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceIntervalRef = useRef<any>(null);

  // Filter messages by in-chat search query if active
  const searchMatchingIds = chatSearchQuery.trim()
    ? messages
        .filter((m) => {
          const q = chatSearchQuery.toLowerCase();
          return (
            (m.text && m.text.toLowerCase().includes(q)) ||
            (m.tableData && m.tableData.title.toLowerCase().includes(q)) ||
            (m.chartData && m.chartData.title.toLowerCase().includes(q)) ||
            (m.taskListData && m.taskListData.title.toLowerCase().includes(q)) ||
            (m.fileData && m.fileData.name.toLowerCase().includes(q)) ||
            m.senderName.toLowerCase().includes(q)
          );
        })
        .map((m) => m.id)
    : [];

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`message-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(msgId);
      setTimeout(() => setHighlightedMessageId(null), 2500);
    }
  };

  const handleNextSearchMatch = () => {
    if (searchMatchingIds.length === 0) return;
    const nextIdx = (searchMatchIndex + 1) % searchMatchingIds.length;
    setSearchMatchIndex(nextIdx);
    scrollToMessage(searchMatchingIds[nextIdx]);
  };

  const handlePrevSearchMatch = () => {
    if (searchMatchingIds.length === 0) return;
    const prevIdx = (searchMatchIndex - 1 + searchMatchingIds.length) % searchMatchingIds.length;
    setSearchMatchIndex(prevIdx);
    scrollToMessage(searchMatchingIds[prevIdx]);
  };

  const toggleVoice = (msgId: string, duration: number = 15) => {
    soundFx.playTap();
    if (playingVoiceId === msgId) {
      clearInterval(voiceIntervalRef.current);
      setPlayingVoiceId(null);
      setVoiceProgress(0);
    } else {
      if (voiceIntervalRef.current) clearInterval(voiceIntervalRef.current);
      setPlayingVoiceId(msgId);
      setVoiceProgress(0);

      const stepMs = 100;
      const totalSteps = (duration * 1000) / (stepMs * voiceSpeed);
      let currentStep = 0;

      voiceIntervalRef.current = setInterval(() => {
        currentStep += 1;
        setVoiceProgress((currentStep / totalSteps) * 100);
        if (currentStep >= totalSteps) {
          clearInterval(voiceIntervalRef.current);
          setPlayingVoiceId(null);
          setVoiceProgress(0);
        }
      }, stepMs);
    }
  };

  const cycleVoiceSpeed = () => {
    soundFx.playTap();
    setVoiceSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  const toggleTranscript = (msgId: string) => {
    soundFx.playTap();
    setExpandedTranscripts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const copyCode = (code: string, id: string) => {
    soundFx.playTap();
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const copyMessageText = (text: string) => {
    soundFx.playTap();
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F5EE] relative overflow-hidden select-none">
      {/* 1. Pinned Messages Banner (if pinned messages exist) */}
      {pinnedMessages.length > 0 && (() => {
        const pinnedMsg = pinnedMessages[currentPinnedIndex] || pinnedMessages[0];
        if (!pinnedMsg) return null;
        return (
          <div className="px-4 py-2 bg-[#FAF3E8] border-b border-[#EBDDCA] flex items-center justify-between gap-3 text-xs shrink-0 z-10 shadow-2xs">
            <div
              onClick={() => scrollToMessage(pinnedMsg.id)}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
            >
              <Pin className="w-4 h-4 text-[#E87A42] fill-current shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-bold text-[#1F2521]">
                  <span>Закріплене ({Math.min(currentPinnedIndex + 1, pinnedMessages.length)} з {pinnedMessages.length})</span>
                  <span className="text-[11px] text-[#717E75] font-normal">
                    від {pinnedMsg.senderName}
                  </span>
                </div>
                <p className="text-[11px] text-[#556157] truncate">
                  {pinnedMsg.text ||
                    pinnedMsg.tableData?.title ||
                    pinnedMsg.type}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {pinnedMessages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentPinnedIndex(
                        (prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length
                      )
                    }
                    className="p-1 hover:bg-[#EFE5D5] rounded-lg text-[#556157]"
                    title="Попереднє закріплене"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPinnedIndex((prev) => (prev + 1) % pinnedMessages.length)
                    }
                    className="p-1 hover:bg-[#EFE5D5] rounded-lg text-[#556157]"
                    title="Наступне закріплене"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <button
                onClick={() => onTogglePinMessage?.(pinnedMsg.id)}
                className="p-1 text-gray-400 hover:text-[#E87A42] rounded-lg"
                title="Відкріпити"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* 2. In-Chat Search Bar Strip (Toggled from Header) */}
      {isSearching && (
        <div className="px-4 py-2 bg-[#F3ECE0] border-b border-[#DFD6C5] flex items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C988E]" />
            <input
              type="text"
              autoFocus
              value={chatSearchQuery}
              onChange={(e) => {
                setChatSearchQuery(e.target.value);
                setSearchMatchIndex(0);
              }}
              placeholder="Пошук у поточній бесіді..."
              className="w-full px-3 py-1 bg-white border border-[#DFD6C5] rounded-xl text-xs focus:outline-none focus:border-[#E87A42]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#556157] shrink-0">
            {chatSearchQuery && (
              <span>
                {searchMatchingIds.length > 0
                  ? `${searchMatchIndex + 1} з ${searchMatchingIds.length}`
                  : 'Не знайдено'}
              </span>
            )}
            {searchMatchingIds.length > 0 && (
              <>
                <button
                  onClick={handlePrevSearchMatch}
                  className="p-1 hover:bg-[#E5DCCF] rounded-lg"
                  title="Попередній збіг"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextSearchMatch}
                  className="p-1 hover:bg-[#E5DCCF] rounded-lg"
                  title="Наступний збіг"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => {
                setChatSearchQuery('');
                onCloseSearch();
              }}
              className="p-1 hover:bg-[#E5DCCF] rounded-lg text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4">
        {messages.map((msg) => {
          const isSelf = msg.senderId === currentUserId || msg.isSelf;
          const isVoicePlaying = playingVoiceId === msg.id;
          const isTranscriptOpen = expandedTranscripts[msg.id];
          const isSelected = selectedMessageIds.includes(msg.id);
          const isHighlighted = highlightedMessageId === msg.id;

          return (
            <div
              key={msg.id}
              id={`message-${msg.id}`}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
              className={`flex items-start gap-2.5 ${isSelf ? 'justify-end' : 'justify-start'} group relative transition-all ${
                isHighlighted ? 'ring-2 ring-[#E87A42] bg-[#FAF1E6]/50 rounded-3xl p-1' : ''
              }`}
            >
              {/* Selection Checkbox */}
              {(isSelectionMode || isSelected) && (
                <button
                  onClick={() => {
                    soundFx.playTap();
                    onToggleSelectMessage(msg.id);
                  }}
                  className={`self-center p-1 rounded-lg transition-colors ${
                    isSelected ? 'text-[#E87A42]' : 'text-[#8E9B91] hover:text-[#1F2521]'
                  }`}
                  title="Вибрати повідомлення"
                >
                  {isSelected ? <CheckSquare className="w-4 h-4 fill-current" /> : <Square className="w-4 h-4" />}
                </button>
              )}

              {/* Sender Avatar (for other people) */}
              {!isSelf && (
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  onClick={() => onSelectMemberByName?.(msg.senderName)}
                  className="w-8 h-8 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-[#E87A42] transition-all shrink-0 mt-1 border border-[#DCD3C1]"
                  title={`Переглянути профіль: ${msg.senderName}`}
                />
              )}

              {/* Message Bubble Container */}
              <div
                className={`max-w-[90%] sm:max-w-[82%] md:max-w-[75%] rounded-3xl p-3.5 sm:p-4 transition-all relative ${
                  isSelf
                    ? 'bg-[#1F2521] text-[#FAF8F3] rounded-tr-xs shadow-xs'
                    : 'bg-white text-[#1F2521] rounded-tl-xs border border-[#E2D8C7] shadow-2xs'
                } ${isSelected ? 'ring-2 ring-[#E87A42]' : ''}`}
              >
                {/* Replying-to Preview Quote Header */}
                {msg.replyTo && (
                  <div
                    onClick={() => scrollToMessage(msg.replyTo!.id)}
                    className={`mb-2.5 p-2 rounded-xl text-xs border-l-3 cursor-pointer transition-colors ${
                      isSelf
                        ? 'bg-white/10 border-[#E87A42] text-white/90 hover:bg-white/15'
                        : 'bg-[#F9F5EE] border-[#E87A42] text-[#424F45] hover:bg-[#F2ECE0]'
                    }`}
                  >
                    <p className="font-bold text-[11px] text-[#E87A42] flex items-center gap-1">
                      <Reply className="w-3 h-3" />
                      <span>{msg.replyTo.senderName}</span>
                    </p>
                    <p className="truncate text-[11px] opacity-80">{msg.replyTo.text}</p>
                  </div>
                )}

                {/* Forwarded Header Attribution */}
                {msg.forwardFrom && (
                  <div className="mb-2 text-[11px] text-[#E87A42] flex items-center gap-1 font-semibold">
                    <Forward className="w-3 h-3" />
                    <span>Переслано з «{msg.forwardFrom.chatTitle}» ({msg.forwardFrom.senderName})</span>
                  </div>
                )}

                {/* Sender Name in Group Chat */}
                {!isSelf && (
                  <p
                    onClick={() => onSelectMemberByName?.(msg.senderName)}
                    className="font-bold text-xs text-[#E87A42] mb-1 cursor-pointer hover:underline"
                  >
                    {msg.senderName}
                  </p>
                )}

                {/* Pinned Tag if message is pinned */}
                {msg.isPinned && (
                  <div className="flex items-center gap-1 text-[10px] text-[#E87A42] font-bold mb-1">
                    <Pin className="w-3 h-3 fill-current" />
                    <span>Закріплено в бесіді</span>
                  </div>
                )}

                {/* 1. TEXT MESSAGE */}
                {msg.text && (
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text">
                    {msg.text}
                  </div>
                )}

                {/* AI Inline Translation */}
                {translatedMessages[msg.id] && (
                  <div className={`mt-2 p-2.5 rounded-xl text-xs border animate-in fade-in zoom-in-95 duration-150 ${
                    isSelf
                      ? 'bg-white/15 border-white/25 text-white'
                      : 'bg-[#F2EFE8] border-[#DFD6C5] text-[#2F3D33]'
                  }`}>
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-current/15 mb-1 text-[10px] font-mono font-bold opacity-80">
                      <span className="flex items-center gap-1">
                        <Languages className="w-3 h-3 text-[#E87A42]" />
                        <span>AI Переклад ({translatedMessages[msg.id].lang})</span>
                      </span>
                      <button
                        onClick={() => handleToggleTranslate(msg)}
                        className="hover:opacity-100 opacity-60 text-[10px]"
                      >
                        Приховати
                      </button>
                    </div>
                    <p className="leading-relaxed">{translatedMessages[msg.id].text}</p>
                  </div>
                )}

                {/* AI Instant Summary */}
                {summarizedMessages[msg.id] && (
                  <div className={`mt-2 p-2 rounded-xl text-xs border flex items-start gap-1.5 animate-in fade-in duration-150 ${
                    isSelf
                      ? 'bg-[#E87A42]/30 border-white/20 text-white'
                      : 'bg-[#FCE7D8] border-[#E87A42]/40 text-[#8C461A]'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#E87A42]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium leading-snug">{summarizedMessages[msg.id]}</p>
                    </div>
                  </div>
                )}

                {/* 2. TABLE MESSAGE */}
                {msg.type === 'table' && msg.tableData && (
                  <DataTableViewer
                    data={msg.tableData}
                    isSelf={isSelf}
                    onUpdateTableData={(updated) => onUpdateTableData?.(msg.id, updated)}
                  />
                )}

                {/* 3. CHART MESSAGE */}
                {msg.type === 'chart' && msg.chartData && (
                  <ChartEmbed data={msg.chartData} />
                )}

                {/* 4. TASK LIST MESSAGE */}
                {msg.type === 'task-list' && msg.taskListData && (
                  <TaskListEmbed
                    data={msg.taskListData}
                    isSelf={isSelf}
                    onUpdateTaskList={(updated) => onUpdateTaskListData?.(msg.id, updated)}
                  />
                )}

                {/* 5. MULTI-QUOTE SYNTHESIS MESSAGE */}
                {msg.type === 'multi-quote' && msg.multiQuoteData && (
                  <MultiQuoteEmbed data={msg.multiQuoteData} isSelf={isSelf} />
                )}

                {/* 6. VOICE MESSAGE */}
                {msg.type === 'voice' && msg.voiceData && (
                  <div className="space-y-2 pt-1 min-w-[220px] sm:min-w-[280px]">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleVoice(msg.id, msg.voiceData?.duration || 15)}
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                          isSelf
                            ? 'bg-[#E87A42] text-white hover:bg-[#D46B35]'
                            : 'bg-[#FCE7D8] text-[#E87A42] hover:bg-[#F9CCA8]'
                        }`}
                      >
                        {isVoicePlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>

                      {/* Animated Sound Waveform */}
                      <div className="flex-1 flex items-center gap-0.8 h-8 px-1 relative">
                        {msg.voiceData.waveform.map((height, i) => {
                          const isPast = (i / msg.voiceData!.waveform.length) * 100 <= voiceProgress;
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-all ${
                                isSelf
                                  ? isPast ? 'bg-[#E87A42]' : 'bg-white/30'
                                  : isPast ? 'bg-[#E87A42]' : 'bg-[#DCD2C1]'
                              }`}
                              style={{
                                height: `${Math.max(height * 0.35, 4)}px`,
                                transform: isVoicePlaying ? `scaleY(${1 + Math.sin(Date.now() / 200 + i) * 0.3})` : 'scaleY(1)',
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Speed toggle */}
                      <button
                        onClick={cycleVoiceSpeed}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono transition-colors ${
                          isSelf
                            ? 'bg-white/10 hover:bg-white/20 text-white'
                            : 'bg-[#F2EDE4] hover:bg-[#E8DFC8] text-[#556157]'
                        }`}
                      >
                        {voiceSpeed}x
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] opacity-70">
                      <span>{msg.voiceData.duration} сек</span>
                      {msg.voiceData.transcript && (
                        <button
                          onClick={() => toggleTranscript(msg.id)}
                          className="hover:underline flex items-center gap-0.5 text-[#E87A42] font-semibold"
                        >
                          <span>{isTranscriptOpen ? 'Сховати розшифровку' : 'Читати текст'}</span>
                          {isTranscriptOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {isTranscriptOpen && msg.voiceData.transcript && (
                      <div className={`p-2.5 rounded-xl text-xs border ${
                        isSelf ? 'bg-white/10 border-white/20 text-white/90' : 'bg-[#FAF8F3] border-[#DFD6C5] text-[#333E35]'
                      }`}>
                        <p className="italic">«{msg.voiceData.transcript}»</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 7. POLL MESSAGE */}
                {msg.type === 'poll' && msg.pollData && (
                  <div className="space-y-2.5 pt-1 min-w-[240px] sm:min-w-[300px]">
                    <div className="flex items-center gap-2 pb-1 border-b border-black/10">
                      <BarChart2 className="w-4 h-4 text-[#528A4B]" />
                      <h4 className="font-bold text-xs sm:text-sm">{msg.pollData.question}</h4>
                    </div>

                    <div className="space-y-1.5">
                      {msg.pollData.options.map((option) => {
                        const total = msg.pollData!.totalVotes || 0;
                        const percent = total > 0 ? Math.round((option.votes / total) * 100) : 0;
                        const hasVoted = option.voters.includes(currentUserId) || msg.pollData?.userVotedOptionId === option.id;

                        return (
                          <div
                            key={option.id}
                            onClick={() => onVotePoll(msg.id, option.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer relative overflow-hidden transition-all ${
                              hasVoted
                                ? isSelf
                                  ? 'bg-[#E87A42]/30 border-[#E87A42]'
                                  : 'bg-[#FCE7D8] border-[#E87A42]'
                                : isSelf
                                ? 'bg-white/10 border-white/20 hover:bg-white/15'
                                : 'bg-[#FAF8F3] border-[#DFD6C5] hover:bg-[#F2EDE4]'
                            }`}
                          >
                            {/* Animated vote progress fill */}
                            <div
                              className={`absolute top-0 bottom-0 left-0 opacity-20 rounded-xl transition-all duration-300 ${
                                isSelf ? 'bg-white' : 'bg-[#528A4B]'
                              }`}
                              style={{ width: `${percent}%` }}
                            />

                            <div className="relative flex items-center justify-between gap-2 z-10 text-xs">
                              <span className="font-medium truncate">{option.text}</span>
                              <span className="font-mono font-bold shrink-0">{percent}% ({option.votes})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[10px] opacity-70 text-right font-mono">
                      Всього голосів: {msg.pollData.totalVotes}
                    </div>
                  </div>
                )}

                {/* 8. SPLIT BILL MESSAGE */}
                {msg.type === 'split-bill' && msg.splitBillData && (
                  <div className="space-y-2.5 pt-1 min-w-[240px] sm:min-w-[300px]">
                    <div className="flex items-center justify-between pb-1 border-b border-black/10">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-[#E87A42]" />
                        <h4 className="font-bold text-xs sm:text-sm">{msg.splitBillData.title}</h4>
                      </div>
                      <span className="font-bold text-xs text-[#E87A42]">
                        {msg.splitBillData.totalAmount} {msg.splitBillData.currency}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {msg.splitBillData.participants.map((part) => (
                        <div
                          key={part.id}
                          onClick={() => onPayBillShare(msg.id, part.id)}
                          className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all border ${
                            part.paid
                              ? isSelf
                                ? 'bg-white/10 border-white/20'
                                : 'bg-[#EAF3E9] border-[#C3DCC1]'
                              : isSelf
                              ? 'bg-white/5 border-white/10 hover:bg-white/10'
                              : 'bg-white border-[#DFD6C5] hover:bg-[#FAF8F3]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={part.avatar} alt={part.name} className="w-6 h-6 rounded-full object-cover" />
                            <span className="text-xs truncate">{part.name}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-xs font-bold">{part.share} {msg.splitBillData!.currency}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              part.paid ? 'bg-green-700 text-white' : 'bg-[#E87A42] text-white'
                            }`}>
                              {part.paid ? 'Оплачено' : 'Очікує'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 9. LOCATION MESSAGE */}
                {msg.type === 'location' && msg.locationData && (
                  <div
                    onClick={() => onOpenLocation(msg.locationData!)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border mt-1 ${
                      isSelf ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-[#FAF8F3] border-[#DFD6C5] hover:bg-[#F2EDE4]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-[#FCE7D8] text-[#E87A42] rounded-xl shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs sm:text-sm truncate">{msg.locationData.name}</h4>
                        <p className="text-[11px] opacity-80 truncate">{msg.locationData.address}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#E87A42] font-semibold">
                          <span>{msg.locationData.walkingTime}</span>
                          <span>· Відкрити досьє 📍</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. CODE MESSAGE */}
                {msg.type === 'code' && msg.codeData && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] opacity-80 font-mono">
                      <span>{msg.codeData.title || msg.codeData.language}</span>
                      <button
                        onClick={() => copyCode(msg.codeData!.code, msg.id)}
                        className="hover:underline flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedCodeId === msg.id ? 'Скопійовано!' : 'Копіювати'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-[#171C18] text-[#A8D5BA] font-mono text-xs rounded-xl overflow-x-auto select-text">
                      <code>{msg.codeData.code}</code>
                    </pre>
                  </div>
                )}

                {/* 11. FILE MESSAGE */}
                {msg.type === 'file' && msg.fileData && (
                  <div className={`p-3 rounded-2xl flex items-center justify-between gap-3 border mt-1 ${
                    isSelf ? 'bg-white/10 border-white/20' : 'bg-[#FAF8F3] border-[#DFD6C5]'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-[#FCE7D8] text-[#E87A42] rounded-xl shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate">{msg.fileData.name}</p>
                        <p className="text-[10px] opacity-70">{msg.fileData.size} · {msg.fileData.extension.toUpperCase()}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        soundFx.playTap();
                        alert(`Завантаження файлу: ${msg.fileData!.name}`);
                      }}
                      className={`p-2 rounded-xl transition-colors shrink-0 ${
                        isSelf ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-[#F2EDE4] hover:bg-[#E8DFC8] text-[#1F2521]'
                      }`}
                      title="Завантажити файл"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 12. IMAGE MESSAGE */}
                {msg.type === 'image' && msg.imageData && (
                  <div className="space-y-1 pt-1">
                    <img
                      src={msg.imageData.url}
                      alt="chat image"
                      onClick={() => onOpenImageLightbox?.(msg.imageData!.url, msg.imageData?.caption)}
                      className="rounded-2xl max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    />
                    {msg.imageData.caption && (
                      <p className="text-xs opacity-90">{msg.imageData.caption}</p>
                    )}
                  </div>
                )}

                {/* Message Footer: Timestamp, Saved Badge, Edited badge & Delivery ticks */}
                <div className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] ${
                  isSelf ? 'text-white/60' : 'text-[#859288]'
                }`}>
                  {savedMessages[msg.id] && (
                    <span className="flex items-center gap-0.5 text-[#E87A42]" title="Збережено в Збереженому">
                      <Bookmark className="w-3 h-3 fill-current" />
                    </span>
                  )}
                  {msg.isEdited && <span className="italic">ред.</span>}
                  <span>{msg.timestamp}</span>
                  {isSelf && (
                    <CheckCheck className="w-3.5 h-3.5 text-[#E87A42]" />
                  )}
                </div>

                {/* Reactions Display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    {msg.reactions.map((r, idx) => (
                      <button
                        key={idx}
                        onClick={() => onAddReaction(msg.id, r.emoji)}
                        className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all ${
                          r.users.includes(currentUserId)
                            ? 'bg-[#FCE7D8] border-[#E87A42] text-[#8C461A]'
                            : isSelf
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-[#FAF8F3] border-[#DFD6C5] text-[#1F2521]'
                        }`}
                        title={r.users.join(', ')}
                      >
                        <span>{r.emoji}</span>
                        <span className="font-bold text-[10px]">{r.count}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Hover Quick Reaction & Action Menu Bar */}
                {hoveredMessageId === msg.id && (
                  <div className={`absolute -top-3.5 ${
                    isSelf ? 'right-2' : 'left-2'
                  } bg-white border border-[#DFD6C5] rounded-full px-2 py-1 flex items-center gap-1 shadow-lg z-20 animate-in fade-in zoom-in-90 duration-100`}>
                    {/* Quick Emojis */}
                    {quickReactions.slice(0, 4).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          soundFx.playTap();
                          onAddReaction(msg.id, emoji);
                        }}
                        className="hover:scale-125 transition-transform text-xs p-0.5"
                      >
                        {emoji}
                      </button>
                    ))}

                    <div className="w-px h-3.5 bg-[#DFD6C5] mx-0.5" />

                    {/* AI Translation Action */}
                    {msg.text && (
                      <button
                        onClick={() => handleToggleTranslate(msg)}
                        className={`p-1 rounded-full transition-colors ${
                          translatedMessages[msg.id]
                            ? 'bg-[#E87A42] text-white'
                            : 'hover:bg-[#FAF6EE] text-[#556157] hover:text-[#E87A42]'
                        }`}
                        title="AI Переклад"
                      >
                        <Languages className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* AI Key Takeaway / Summary Action */}
                    {msg.text && (
                      <button
                        onClick={() => handleToggleSummary(msg)}
                        className={`p-1 rounded-full transition-colors ${
                          summarizedMessages[msg.id]
                            ? 'bg-[#E87A42] text-white'
                            : 'hover:bg-[#FAF6EE] text-[#556157] hover:text-[#E87A42]'
                        }`}
                        title="AI Коротке резюме"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Bookmark Action */}
                    <button
                      onClick={() => handleToggleBookmark(msg)}
                      className={`p-1 rounded-full transition-colors ${
                        savedMessages[msg.id]
                          ? 'bg-[#E87A42] text-white'
                          : 'hover:bg-[#FAF6EE] text-[#556157] hover:text-[#E87A42]'
                      }`}
                      title={savedMessages[msg.id] ? 'Вилучити зі Збереженого' : 'Зберегти повідомлення'}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    {/* Reply button */}
                    <button
                      onClick={() => onReplyMessage(msg)}
                      className="p-1 hover:bg-[#FAF6EE] text-[#556157] hover:text-[#E87A42] rounded-full transition-colors"
                      title="Відповісти"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    {/* Pin/Unpin button */}
                    <button
                      onClick={() => onTogglePinMessage?.(msg.id)}
                      className="p-1 hover:bg-[#FAF6EE] text-[#556157] hover:text-[#E87A42] rounded-full transition-colors"
                      title={msg.isPinned ? 'Відкріпити' : 'Закріпити'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    {/* Forward button */}
                    <button
                      onClick={() => onForwardMessage?.(msg)}
                      className="p-1 hover:bg-[#FAF6EE] text-[#556157] hover:text-[#E87A42] rounded-full transition-colors"
                      title="Переслати"
                    >
                      <Forward className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy text */}
                    {msg.text && (
                      <button
                        onClick={() => copyMessageText(msg.text!)}
                        className="p-1 hover:bg-[#FAF6EE] text-[#556157] hover:text-[#E87A42] rounded-full transition-colors"
                        title="Копіювати текст"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Edit button (if self) */}
                    {isSelf && msg.text && (
                      <button
                        onClick={() => onEditMessage?.(msg)}
                        className="p-1 hover:bg-[#FAF6EE] text-[#556157] hover:text-[#E87A42] rounded-full transition-colors"
                        title="Редагувати"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete button (if self) */}
                    {isSelf && (
                      <button
                        onClick={() => onDeleteMessage?.(msg.id)}
                        className="p-1 hover:bg-red-50 text-[#556157] hover:text-red-600 rounded-full transition-colors"
                        title="Видалити"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Contextual Follow-up Suggestions Bar */}
      {onSendQuickReply && !isSelectionMode && (
        <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-[#EBDDCA]/60 bg-[#F4EDE2]/50 shrink-0">
          <span className="text-[10px] font-extrabold text-[#717E75] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#E87A42]" />
            <span>Швидкі відповіді:</span>
          </span>
          {[
            '✨ Домовилися!',
            '☕ Буду через 10 хв',
            '📍 Надішлю локацію',
            '👍 Все перевірив, супер',
            '🚀 Погоджено!',
            '🤝 Дякую за деталі',
          ].map((replyText, idx) => (
            <button
              key={idx}
              onClick={() => {
                soundFx.playSend();
                onSendQuickReply(replyText);
              }}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white hover:bg-[#FAF6EE] text-[#1F2521] border border-[#DFD6C5] shadow-2xs hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0 hover:border-[#E87A42]"
            >
              {replyText}
            </button>
          ))}
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#1F2521] text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-lg z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-1.5">
          <span>{toastNotification}</span>
        </div>
      )}
    </div>
  );
};
