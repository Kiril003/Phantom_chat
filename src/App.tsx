import React, { useState, useEffect } from 'react';
import { initialChats, initialSmartFolders, initialScheduledMessages, currentUser as defaultCurrentUser } from './data/initialData';
import {
  Chat,
  Message,
  MessageReplyInfo,
  LocationData,
  ChatMember,
  UserProfile,
  AudioHuddleState,
  TableData,
  TaskListData,
  SmartFolder,
  ScheduledMessage,
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { MessageComposer } from './components/MessageComposer';
import { AudioHuddleBar } from './components/AudioHuddleBar';
import { ActionHubModal } from './components/ActionHubModal';
import { ChatDigestModal } from './components/ChatDigestModal';
import { SettingsModal } from './components/SettingsModal';
import { GroupDetailsDrawer } from './components/GroupDetailsDrawer';
import { UserProfileModal } from './components/UserProfileModal';
import { MultiSelectBar } from './components/MultiSelectBar';
import { LocationDossierModal } from './components/LocationDossierModal';
import { CreateChatModal } from './components/CreateChatModal';
import { ForwardMessageModal } from './components/ForwardMessageModal';
import { MediaLightboxModal } from './components/MediaLightboxModal';
import { ScheduleMessageModal } from './components/ScheduleMessageModal';
import { ScheduledMessagesDrawer } from './components/ScheduledMessagesDrawer';
import { SmartFolderModal } from './components/SmartFolderModal';
import { P2PNetworkModal } from './components/P2PNetworkModal';
import { soundFx } from './utils/sound';
import { networkEngine } from './utils/networkEngine';

export function App() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<string>(initialChats[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultCurrentUser);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

  // Scheduled Messages State
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>(initialScheduledMessages);
  const [isScheduledDrawerOpen, setIsScheduledDrawerOpen] = useState(false);

  // Modals & Drawers
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [isActionHubOpen, setIsActionHubOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isP2PModalOpen, setIsP2PModalOpen] = useState(false);
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduledTimeString, setScheduledTimeString] = useState<string | undefined>(undefined);

  // Network Engine Initialization & Listener
  useEffect(() => {
    networkEngine.init(currentUser.id, currentUser.name, currentUser.avatar);

    const unsubscribe = networkEngine.onMessage((targetChatId: string, incomingMsg: Message) => {
      soundFx.playReceive();
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === targetChatId) {
            // Avoid duplicate messages if already present
            if ((c.messages || []).some((m) => m.id === incomingMsg.id)) {
              return c;
            }
            return {
              ...c,
              messages: [...(c.messages || []), incomingMsg],
              unreadCount: activeChatId === targetChatId ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser.id, currentUser.name, currentUser.avatar, activeChatId]);

  // Smart Folders / Workspaces
  const [smartFolders, setSmartFolders] = useState<SmartFolder[]>(initialSmartFolders);
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [isSmartFolderModalOpen, setIsSmartFolderModalOpen] = useState<boolean>(false);
  const [editingSmartFolder, setEditingSmartFolder] = useState<SmartFolder | null>(null);

  // Deep linking to folders (e.g. ?folder=work or #folder=work)
  useEffect(() => {
    const handleCheckFolderDeepLink = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const folderParam = urlParams.get('folder');
        const hash = window.location.hash;
        let targetFolderId = folderParam;
        if (!targetFolderId && hash.startsWith('#folder=')) {
          targetFolderId = hash.replace('#folder=', '');
        }

        if (targetFolderId) {
          const found = smartFolders.find((f) => f.id === targetFolderId);
          if (found) {
            setActiveFolderId(found.id);
          }
        }
      } catch (err) {
        console.warn('Deep link parse error:', err);
      }
    };

    handleCheckFolderDeepLink();
    window.addEventListener('popstate', handleCheckFolderDeepLink);
    window.addEventListener('hashchange', handleCheckFolderDeepLink);
    return () => {
      window.removeEventListener('popstate', handleCheckFolderDeepLink);
      window.removeEventListener('hashchange', handleCheckFolderDeepLink);
    };
  }, [smartFolders]);

  const [isSelfProfileOpen, setIsSelfProfileOpen] = useState(false);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<ChatMember | null>(null);
  const [activeLocationDossier, setActiveLocationDossier] = useState<LocationData | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    title?: string;
    senderName?: string;
    timestamp?: string;
  } | null>(null);

  // Search in chat
  const [isSearchingInChat, setIsSearchingInChat] = useState(false);

  // Mobile navigation state: false = show chats list, true = show active chat conversation
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Reply & Edit state
  const [replyingTo, setReplyingTo] = useState<MessageReplyInfo | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  // Multi-message selection mode
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Audio Huddle State
  const [isHuddleActive, setIsHuddleActive] = useState(false);
  const [huddleState, setHuddleState] = useState<AudioHuddleState>({
    active: false,
    chatId: initialChats[0].id,
    title: 'Aura Design Room 🎙️',
    participants: [
      { id: '1', name: 'Кирило (Ви)', avatar: defaultCurrentUser.avatar, isSpeaking: false, isMuted: false, hasRaisedHand: false },
      { id: '2', name: 'Олексій', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', isSpeaking: true, isMuted: false, hasRaisedHand: false },
      { id: '3', name: 'Дарина', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', isSpeaking: false, isMuted: true, hasRaisedHand: false },
    ],
    liveTranscript: [
      { speaker: 'Олексій', text: 'Завершуємо тестування синтезу цитат та інтерактивних таблиць.', time: '11:34' },
    ],
  });

  // AI Thinking indicator
  const [isAiTyping, setIsAiTyping] = useState(false);

  const currentChat = chats.find((c) => c.id === activeChatId) || chats[0] || {
    id: 'default',
    name: 'Чат',
    avatar: '',
    type: 'dm',
    circle: 'work',
    unreadCount: 0,
    messages: [],
  };
  const pinnedCount = currentChat.pinnedMessages?.length || 0;

  // Toggle message selection
  const handleToggleSelectMessage = (msgId: string) => {
    setSelectedMessageIds((prev) => {
      if (prev.includes(msgId)) {
        const next = prev.filter((id) => id !== msgId);
        if (next.length === 0) setIsSelectionMode(false);
        return next;
      } else {
        setIsSelectionMode(true);
        return [...prev, msgId];
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedMessageIds([]);
    setIsSelectionMode(false);
  };

  // AI Synthesize Quotes action
  const handleSynthesizeSelection = async () => {
    if (selectedMessageIds.length === 0) return;

    const selectedMsgs = (currentChat.messages || [])
      .filter((m) => selectedMessageIds.includes(m.id))
      .map((m) => ({
        id: m.id,
        senderName: m.senderName,
        senderAvatar: m.senderAvatar,
        timestamp: m.timestamp,
        text: m.text || (m.tableData ? `[Таблиця: ${m.tableData.title}]` : m.type),
      }));

    setIsAiTyping(true);
    handleClearSelection();

    try {
      const res = await fetch('/api/gemini/synthesize-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: selectedMsgs }),
      });
      const data = await res.json();

      const newMsg: Message = {
        id: `msg_synth_${Date.now()}`,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'multi-quote',
        isSelf: true,
        text: 'Синтезовано ключові тези з виділених повідомлень:',
        multiQuoteData: {
          title: data.title || 'Синтез узгоджених питань',
          quotes: selectedMsgs,
          synthesis: data.synthesis || {
            keyPoints: ['Синтезовано домовленості по задачах.'],
            conclusion: 'Рішення прийнято одноголосно.',
          },
        },
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId ? { ...c, messages: [...(c.messages || []), newMsg] } : c
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Create combined multi-quote without AI
  const handleCreateMultiQuote = () => {
    if (selectedMessageIds.length === 0) return;

    const selectedMsgs = (currentChat.messages || [])
      .filter((m) => selectedMessageIds.includes(m.id))
      .map((m) => ({
        id: m.id,
        senderName: m.senderName,
        senderAvatar: m.senderAvatar,
        timestamp: m.timestamp,
        text: m.text || m.type,
      }));

    const newMsg: Message = {
      id: `msg_quote_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'multi-quote',
      isSelf: true,
      text: 'Підкріплені цитати з бесіди:',
      multiQuoteData: {
        title: 'Збірка цитат',
        quotes: selectedMsgs,
      },
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId ? { ...c, messages: [...(c.messages || []), newMsg] } : c
      )
    );
    handleClearSelection();
  };

  const handleCopyAllSelected = () => {
    const selectedTexts = (currentChat.messages || [])
      .filter((m) => selectedMessageIds.includes(m.id))
      .map((m) => `[${m.senderName} - ${m.timestamp}]: ${m.text || m.type}`)
      .join('\n\n');
    navigator.clipboard.writeText(selectedTexts);
    handleClearSelection();
  };

  // Reply to multiple selected messages simultaneously
  const handleReplyMultipleSelected = () => {
    if (selectedMessageIds.length === 0) return;
    const selectedMsgs = (currentChat.messages || [])
      .filter((m) => selectedMessageIds.includes(m.id))
      .map((m) => ({
        id: m.id,
        senderName: m.senderName,
        senderAvatar: m.senderAvatar,
        text: m.text || (m.tableData ? `[Таблиця: ${m.tableData.title}]` : m.type),
        timestamp: m.timestamp,
      }));

    setReplyingTo({
      id: selectedMsgs[0]?.id || `multi_${Date.now()}`,
      senderName: selectedMsgs.map((m) => m.senderName).join(', '),
      text: `[Відповідь на ${selectedMsgs.length} повідомлень]`,
      quotes: selectedMsgs,
    });
    handleClearSelection();
  };

  // Remove individual quote from rich multi-quote
  const handleRemoveReplyQuote = (quoteId: string) => {
    if (!replyingTo) return;
    if (replyingTo.quotes && replyingTo.quotes.length > 1) {
      const filtered = replyingTo.quotes.filter((q) => q.id !== quoteId);
      if (filtered.length === 0) {
        setReplyingTo(null);
      } else {
        setReplyingTo({
          ...replyingTo,
          quotes: filtered,
          senderName: filtered.map((q) => q.senderName).join(', '),
        });
      }
    } else {
      setReplyingTo(null);
    }
  };

  // Reply single message or partial text quote handler
  const handleReplyMessage = (msg: Message, quoteSelectedText?: string) => {
    setReplyingTo({
      id: msg.id,
      senderName: msg.senderName,
      text: msg.text || (msg.tableData ? `[Таблиця: ${msg.tableData.title}]` : msg.type),
      type: msg.type,
      quoteSelectedText: quoteSelectedText,
      quotes: [
        {
          id: msg.id,
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatar,
          text: quoteSelectedText || msg.text || msg.type,
          timestamp: msg.timestamp,
        },
      ],
    });
    setEditingMessage(null);
  };

  // Send new message (text, rich payload, scheduled)
  const handleSendMessage = async (payloadOrText: any, scheduledTime?: string) => {
    let payload: Partial<Message> = {};

    if (typeof payloadOrText === 'string') {
      payload = {
        type: 'text',
        text: payloadOrText,
      };
    } else {
      payload = payloadOrText;
    }

    const effectiveScheduledTime = scheduledTime || scheduledTimeString;

    // If scheduled time is provided, queue into scheduledMessages
    if (effectiveScheduledTime) {
      soundFx.playSend();
      const scheduledItem: ScheduledMessage = {
        id: `sched_${Date.now()}`,
        chatId: activeChatId,
        chatTitle: currentChat.title,
        chatAvatar: currentChat.avatar,
        senderId: currentUser.id,
        senderName: currentUser.name,
        scheduledTime: effectiveScheduledTime,
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledExactTime: '18:00',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: payload.type || 'text',
        text: payload.text,
        taskListData: payload.taskListData,
        tableData: payload.tableData,
        chartData: payload.chartData,
        pollData: payload.pollData,
        eventData: payload.eventData,
        fileData: payload.fileData,
        imageData: payload.imageData,
        codeData: payload.codeData,
      };

      setScheduledMessages((prev) => [scheduledItem, ...prev]);
      setReplyingTo(null);
      setScheduledTimeString(undefined);
      setDrafts((prev) => {
        if (!prev[activeChatId]) return prev;
        const next = { ...prev };
        delete next[activeChatId];
        return next;
      });
      setChats((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, draft: undefined } : c))
      );
      return;
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      type: payload.type || 'text',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text,
            type: replyingTo.type,
            quoteSelectedText: replyingTo.quoteSelectedText,
            quotes: replyingTo.quotes,
          }
        : undefined,
      ...payload,
    };

    // Broadcast over Hybrid Network Engine (P2P / Server)
    const transportUsed = networkEngine.sendMessage(activeChatId, newMsg);
    newMsg.transport = transportUsed;

    // Reset reply & scheduled states
    setReplyingTo(null);
    setScheduledTimeString(undefined);

    // Clear draft for this active chat
    setDrafts((prev) => {
      if (!prev[activeChatId]) return prev;
      const next = { ...prev };
      delete next[activeChatId];
      return next;
    });

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, newMsg], unreadCount: 0, draft: undefined }
          : c
      )
    );

    // If chat is Copilot or mentions Gemini, stream Copilot response
    if (currentChat.type === 'copilot' || (typeof payload.text === 'string' && payload.text.toLowerCase().includes('@gemini'))) {
      setIsAiTyping(true);
      try {
        const res = await fetch('/api/gemini/chat-digest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...currentChat.messages, newMsg].map((m) => ({
              senderName: m.senderName,
              text: m.text || '',
            })),
            chatTitle: currentChat.title,
          }),
        });
        const data = await res.json();

        const copilotMsg: Message = {
          id: `msg_ai_${Date.now()}`,
          senderId: 'copilot',
          senderName: 'Gemini Copilot ✦',
          senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
          text: data.summary || 'Обробив ваш запит та зафіксував інформацію.',
        };

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId ? { ...c, messages: [...c.messages, copilotMsg] } : c
          )
        );
      } catch (err) {
        console.error(err);
      } finally {
        setIsAiTyping(false);
      }
    }
  };

  // Scheduled Messages Management Handlers
  const handleSendScheduledNow = (scheduledId: string) => {
    const item = scheduledMessages.find((s) => s.id === scheduledId);
    if (!item) return;

    soundFx.playSend();
    const sentMsg: Message = {
      id: `msg_sched_sent_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      type: item.type,
      text: item.text,
      fileData: item.fileData,
      imageData: item.imageData,
      tableData: item.tableData,
      chartData: item.chartData,
      pollData: item.pollData,
      eventData: item.eventData,
      taskListData: item.taskListData,
      splitBillData: item.splitBillData,
      codeData: item.codeData,
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === item.chatId
          ? { ...c, messages: [...c.messages, sentMsg], unreadCount: 0 }
          : c
      )
    );

    setScheduledMessages((prev) => prev.filter((s) => s.id !== scheduledId));
  };

  const handleDeleteScheduled = (scheduledId: string) => {
    soundFx.playTap();
    setScheduledMessages((prev) => prev.filter((s) => s.id !== scheduledId));
  };

  const handleUpdateScheduled = (scheduledId: string, updated: Partial<ScheduledMessage>) => {
    soundFx.playTap();
    setScheduledMessages((prev) =>
      prev.map((s) => (s.id === scheduledId ? { ...s, ...updated } : s))
    );
  };

  const handleCreateScheduled = (newScheduled: Omit<ScheduledMessage, 'id' | 'createdAt'>) => {
    soundFx.playSend();
    const item: ScheduledMessage = {
      ...newScheduled,
      id: `sched_${Date.now()}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderId: currentUser.id,
      senderName: currentUser.name,
    };
    setScheduledMessages((prev) => [item, ...prev]);
  };

  // Voice message
  const handleSendVoiceMessage = (duration: number, transcript: string) => {
    const newMsg: Message = {
      id: `msg_voice_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      type: 'voice',
      voiceData: {
        duration,
        waveform: Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 20),
        transcript: transcript || 'Голосове повідомлення записано',
      },
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, newMsg], unreadCount: 0 }
          : c
      )
    );
  };

  // Edit message
  const handleSaveEdit = (messageId: string, newText: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        return {
          ...c,
          messages: (c.messages || []).map((m) =>
            m.id === messageId ? { ...m, text: newText, isEdited: true } : m
          ),
        };
      })
    );
    setEditingMessage(null);
  };

  // Delete message
  const handleDeleteMessage = (messageId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        return {
          ...c,
          messages: (c.messages || []).filter((m) => m.id !== messageId),
          pinnedMessages: (c.pinnedMessages || []).filter((id) => id !== messageId),
        };
      })
    );
  };

  // Toggle Pin message
  const handleTogglePinMessage = (messageId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const pinned = c.pinnedMessages || [];
        const isPinned = pinned.includes(messageId);
        const updatedPinned = isPinned
          ? pinned.filter((id) => id !== messageId)
          : [...pinned, messageId];
        return { ...c, pinnedMessages: updatedPinned };
      })
    );
  };

  // Update Table Data (CRUD)
  const handleUpdateTableData = (messageId: string, updatedTable: TableData) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        return {
          ...c,
          messages: (c.messages || []).map((m) =>
            m.id === messageId ? { ...m, tableData: updatedTable } : m
          ),
        };
      })
    );
  };

  // Update Task List Data (CRUD)
  const handleUpdateTaskListData = (messageId: string, updatedTasks: TaskListData) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        return {
          ...c,
          messages: (c.messages || []).map((m) =>
            m.id === messageId ? { ...m, taskListData: updatedTasks } : m
          ),
        };
      })
    );
  };

  // Poll voting
  const handleVotePoll = (messageId: string, optionId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const newMessages = (c.messages || []).map((m) => {
          if (m.id !== messageId || !m.pollData) return m;
          const options = m.pollData.options.map((opt) =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          );
          return {
            ...m,
            pollData: {
              ...m.pollData,
              totalVotes: m.pollData.totalVotes + 1,
              options,
            },
          };
        });
        return { ...c, messages: newMessages };
      })
    );
  };

  // Pay bill share
  const handlePayBillShare = (messageId: string, participantId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const newMessages = (c.messages || []).map((m) => {
          if (m.id !== messageId || !m.splitBillData) return m;
          const participants = m.splitBillData.participants.map((p) =>
            p.id === participantId ? { ...p, paid: true } : p
          );
          return {
            ...m,
            splitBillData: {
              ...m.splitBillData,
              paidCount: m.splitBillData.paidCount + 1,
              participants,
            },
          };
        });
        return { ...c, messages: newMessages };
      })
    );
  };

  // Add reaction
  const handleAddReaction = (messageId: string, emoji: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const newMessages = (c.messages || []).map((m) => {
          if (m.id !== messageId) return m;
          const reactions = [...(m.reactions || [])];
          const existing = reactions.find((r) => r.emoji === emoji);
          if (existing) {
            existing.count += 1;
          } else {
            reactions.push({ emoji, count: 1, users: [currentUser.id] });
          }
          return { ...m, reactions };
        });
        return { ...c, messages: newMessages };
      })
    );
  };

  // Member select by name
  const handleSelectMemberByName = (name: string) => {
    const found = currentChat.members?.find((m) => m.name === name);
    if (found) {
      setSelectedMemberProfile(found);
    }
  };

  // Start Direct Chat
  const handleStartDirectChat = (memberOrId: ChatMember | string) => {
    const memberId = typeof memberOrId === 'string' ? memberOrId : memberOrId.id;
    const existing = chats.find((c) => c.id === `dm_${memberId}`);
    if (existing) {
      setActiveChatId(existing.id);
      setShowMobileChat(true);
    } else {
      const member =
        typeof memberOrId === 'object'
          ? memberOrId
          : currentChat.members?.find((m) => m.id === memberId);
      if (member) {
        const newDm: Chat = {
          id: `dm_${member.id}`,
          title: member.name,
          avatar: member.avatar,
          type: 'dm',
          circle: currentChat.circle === 'family' ? 'family' : 'friends',
          unreadCount: 0,
          isOnline: member.isOnline,
          customVibe: member.statusText || 'Особиста бесіда',
          messages: [
            {
              id: `msg_init_${Date.now()}`,
              senderId: member.id,
              senderName: member.name,
              senderAvatar: member.avatar,
              timestamp: 'Зараз',
              type: 'text',
              text: `Привіт, Кириле! Радий поспілкуватися 🌿`,
            },
          ],
        };
        setChats((prev) => [newDm, ...prev]);
        setActiveChatId(newDm.id);
        setShowMobileChat(true);
      }
    }
  };

  // Toggle Pin Chat
  const handleTogglePinChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, pinned: !c.pinned } : c
      )
    );
  };

  // Forward message submit
  const handleConfirmForward = (targetChatIds: string[], note?: string) => {
    if (!forwardingMessage) return;

    setChats((prev) =>
      prev.map((c) => {
        if (!targetChatIds.includes(c.id)) return c;
        const forwardedMsgs: Message[] = [];

        if (note && note.trim()) {
          forwardedMsgs.push({
            id: `msg_fwd_note_${Date.now()}_${c.id}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSelf: true,
            type: 'text',
            text: note.trim(),
          });
        }

        forwardedMsgs.push({
          ...forwardingMessage,
          id: `msg_fwd_${Date.now()}_${c.id}`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: true,
          forwardedFrom: {
            chatTitle: currentChat.title,
            originalSenderName: forwardingMessage.senderName,
          },
        });

        return { ...c, messages: [...c.messages, ...forwardedMsgs] };
      })
    );

    setForwardingMessage(null);
  };

  // Update chat settings (permissions, slow mode, topics, etc.)
  const handleUpdateChatSettings = (chatId: string, updatedSettings: Partial<Chat>) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, ...updatedSettings } : c))
    );
  };

  // Create new chat modal submission
  const handleCreateNewChat = (chatData: Partial<Chat>) => {
    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      title: chatData.title || 'Нова бесіда',
      avatar: chatData.avatar || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=80',
      type: chatData.type || 'group',
      circle: chatData.circle || 'work',
      unreadCount: 0,
      badge: 'Новий простір',
      customVibe: chatData.customVibe || 'Простір для спільних рішень',
      isPublic: chatData.isPublic ?? false,
      publicHandle: chatData.publicHandle,
      isForum: chatData.isForum ?? false,
      slowModeSeconds: chatData.slowModeSeconds ?? 0,
      historyVisibilityForNewMembers: chatData.historyVisibilityForNewMembers ?? 'visible',
      permissions: chatData.permissions || {
        sendMessages: true,
        sendMedia: true,
        sendStickersAndGifs: true,
        sendPolls: true,
        embedLinks: true,
        addMembers: true,
        pinMessages: true,
        changeChatInfo: false,
      },
      topics: chatData.isForum
        ? [
            { id: 't_gen', title: 'Загальне обговорення', iconEmoji: '💬', color: '#E87A42', messageCount: 1, lastMessageText: 'Вітаємо у новому форумі!' },
            { id: 't_ideas', title: 'Ідеї & Пропозиції', iconEmoji: '💡', color: '#528A4B', messageCount: 0 },
          ]
        : undefined,
      members: chatData.members || [
        {
          id: currentUser.id,
          name: currentUser.name,
          handle: currentUser.handle || '@kyrylo',
          avatar: currentUser.avatar,
          role: 'owner',
          isOnline: true,
          statusText: currentUser.status,
          customTitle: 'Засновник простору',
        },
      ],
      messages: [
        {
          id: `msg_init_${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          timestamp: 'Зараз',
          type: 'text',
          isSelf: true,
          text: `Створено новий простір «${chatData.title}». Ласкаво просимо! 🌿`,
        },
      ],
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setShowMobileChat(true);
  };

  // Smart Folder / Workspace Handlers
  const handleSaveFolder = (savedFolder: SmartFolder) => {
    setSmartFolders((prev) => {
      const exists = prev.some((f) => f.id === savedFolder.id);
      if (exists) {
        return prev.map((f) => (f.id === savedFolder.id ? savedFolder : f));
      }
      return [...prev, savedFolder];
    });
    setActiveFolderId(savedFolder.id);
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    setSmartFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    );
  };

  const handleDeleteFolder = (folderId: string) => {
    setSmartFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (activeFolderId === folderId) {
      setActiveFolderId('all');
    }
  };

  const handleAddChatToFolder = (folderId: string, chatId: string) => {
    setSmartFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          const currentIds = f.chatIds || [];
          if (!currentIds.includes(chatId)) {
            return { ...f, chatIds: [...currentIds, chatId] };
          }
        }
        return f;
      })
    );
  };

  const handleRemoveChatFromFolder = (folderId: string, chatId: string) => {
    setSmartFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          return { ...f, chatIds: (f.chatIds || []).filter((id) => id !== chatId) };
        }
        return f;
      })
    );
  };

  const handleMarkFolderAsRead = (folderId: string) => {
    const targetFolder = smartFolders.find((f) => f.id === folderId);
    if (!targetFolder) return;

    setChats((prevChats) =>
      prevChats.map((c) => {
        const belongs =
          targetFolder.id === 'all' ||
          (targetFolder.chatIds && targetFolder.chatIds.includes(c.id)) ||
          (targetFolder.filterRules?.includeCircles &&
            targetFolder.filterRules.includeCircles.includes(c.circle));
        if (belongs) {
          return { ...c, unreadCount: 0 };
        }
        return c;
      })
    );
  };

  const handleToggleMuteFolder = (folderId: string) => {
    setSmartFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, isMuted: !f.isMuted } : f))
    );
  };

  const handleToggleArchiveFolder = (folderId: string) => {
    setSmartFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, isArchived: !f.isArchived } : f))
    );
  };

  const handleSetFolderVibeAndColor = (folderId: string, color: string, vibe?: string) => {
    setSmartFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, color, vibe: vibe !== undefined ? vibe : f.vibe }
          : f
      )
    );
  };

  const handleSetFolderIcon = (folderId: string, emoji: string) => {
    setSmartFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, emoji } : f))
    );
  };

  const handleClearFolderChats = (folderId: string) => {
    setSmartFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, chatIds: [] } : f))
    );
  };

  const handleOpenCreateFolder = () => {
    setEditingSmartFolder(null);
    setIsSmartFolderModalOpen(true);
  };

  const handleOpenEditFolder = (folder: SmartFolder) => {
    setEditingSmartFolder(folder);
    setIsSmartFolderModalOpen(true);
  };

  const selectedMessagesForQuoteObjects = (currentChat?.messages || []).filter((m) =>
    (selectedMessageIds || []).includes(m.id)
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F3] font-sans antialiased text-[#1F2521]">
      {/* 1. Sidebar (Smart Folders, Circles & Spaces) */}
      <div className={`h-full shrink-0 ${showMobileChat ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={(id) => {
            setActiveChatId(id);
            setShowMobileChat(true);
            handleClearSelection();
            setReplyingTo(null);
            setEditingMessage(null);
          }}
          currentUser={currentUser}
          smartFolders={smartFolders}
          activeFolderId={activeFolderId}
          onSelectFolder={(fId) => setActiveFolderId(fId)}
          onAddChatToFolder={handleAddChatToFolder}
          onRemoveChatFromFolder={handleRemoveChatFromFolder}
          onOpenCreateFolder={handleOpenCreateFolder}
          onOpenEditFolder={handleOpenEditFolder}
          onRenameFolder={handleRenameFolder}
          onMarkFolderAsRead={handleMarkFolderAsRead}
          onToggleMuteFolder={handleToggleMuteFolder}
          onToggleArchiveFolder={handleToggleArchiveFolder}
          onSetFolderVibeAndColor={handleSetFolderVibeAndColor}
          onSetFolderIcon={handleSetFolderIcon}
          onClearFolderChats={handleClearFolderChats}
          onDeleteFolder={handleDeleteFolder}
          onNewChat={() => setIsCreateChatOpen(true)}
          onOpenUserProfile={() => setIsSelfProfileOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenP2PNetworkModal={() => setIsP2PModalOpen(true)}
          onSwitchPersonaSphere={(sphere) => {
            setCurrentUser((prev) => {
              const persona = prev.personas?.[sphere];
              return {
                ...prev,
                activePersonaSphere: sphere,
                name: persona?.name || prev.name,
                handle: persona?.handle || prev.handle,
                status: persona?.statusText || prev.status,
                statusEmoji: persona?.statusEmoji || prev.statusEmoji,
                bio: persona?.bio || prev.bio,
              };
            });
          }}
        />
      </div>

      {/* 2. Main Chat Area & Work Canvas */}
      <main className={`flex-1 flex-col h-full overflow-hidden relative ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
        {/* Header */}
        <Header
          currentChat={currentChat}
          currentUser={currentUser}
          onBack={() => setShowMobileChat(false)}
          onOpenDigest={() => setIsDigestOpen(true)}
          onOpenActions={() => setIsActionHubOpen(true)}
          onOpenScheduledMessages={() => setIsScheduledDrawerOpen(true)}
          scheduledMessagesCount={scheduledMessages.length}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenP2PModal={() => setIsP2PModalOpen(true)}
          onOpenGroupDetails={() => setIsGroupDetailsOpen(true)}
          isHuddleActive={isHuddleActive}
          onToggleHuddle={() => setIsHuddleActive(!isHuddleActive)}
          isSoundEnabled={isSoundEnabled}
          onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
          onToggleSearch={() => setIsSearchingInChat(!isSearchingInChat)}
          isSearching={isSearchingInChat}
          pinnedCount={pinnedCount}
          onScrollToPinned={() => {
            const firstPinned = currentChat.pinnedMessages?.[0];
            if (firstPinned) {
              const el = document.getElementById(`msg-${firstPinned}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        />

        {/* Audio Huddle Live Bar */}
        {isHuddleActive && (
          <AudioHuddleBar
            huddleState={huddleState}
            onClose={() => setIsHuddleActive(false)}
            onToggleMic={() => {
              soundFx.playTap();
              setHuddleState((prev) => ({
                ...prev,
                participants: prev.participants.map((p) =>
                  p.id === '1' ? { ...p, isMuted: !p.isMuted } : p
                ),
              }));
            }}
            onToggleHand={() => {
              soundFx.playTap();
              setHuddleState((prev) => ({
                ...prev,
                participants: prev.participants.map((p) =>
                  p.id === '1' ? { ...p, hasRaisedHand: !p.hasRaisedHand } : p
                ),
              }));
            }}
          />
        )}

        {/* Chat Feed */}
        <ChatArea
          currentChat={currentChat}
          messages={currentChat.messages}
          currentUserId={currentUser.id}
          onOpenLocation={(loc) => setActiveLocationDossier(loc)}
          onVotePoll={handleVotePoll}
          onPayBillShare={handlePayBillShare}
          onAddReaction={handleAddReaction}
          onReplyMessage={handleReplyMessage}
          onEditMessage={(msg) => {
            setEditingMessage(msg);
            setReplyingTo(null);
          }}
          onDeleteMessage={handleDeleteMessage}
          onTogglePinMessage={handleTogglePinMessage}
          onForwardMessage={(msg) => setForwardingMessage(msg)}
          onSelectMemberByName={handleSelectMemberByName}
          selectedMessageIds={selectedMessageIds}
          onToggleSelectMessage={handleToggleSelectMessage}
          isSelectionMode={isSelectionMode}
          isAiTyping={isAiTyping}
          onUpdateTableData={handleUpdateTableData}
          onUpdateTaskListData={handleUpdateTaskListData}
          onOpenImageLightbox={(url, title) => {
            setLightboxMedia({ url, title, senderName: currentChat.title });
          }}
          isSearching={isSearchingInChat}
          onCloseSearch={() => setIsSearchingInChat(false)}
        />

        {/* Floating Multi-Select & Synthesis Bar */}
        <MultiSelectBar
          selectedCount={selectedMessageIds.length}
          onClearSelection={handleClearSelection}
          onSynthesize={handleSynthesizeSelection}
          onCreateMultiQuote={handleCreateMultiQuote}
          onReplyMultiple={handleReplyMultipleSelected}
          onCopyAll={handleCopyAllSelected}
          onForward={() => {
            const firstMsg = (currentChat?.messages || []).find((m) => (selectedMessageIds || []).includes(m.id));
            if (firstMsg) setForwardingMessage(firstMsg);
          }}
        />

        {/* Message Composer */}
        <MessageComposer
          chatId={activeChatId}
          initialDraft={drafts[activeChatId] || currentChat.draft || ''}
          onDraftChange={(cId, draftText) => {
            setDrafts((prev) => ({
              ...prev,
              [cId]: draftText,
            }));
            setChats((prev) =>
              prev.map((c) => (c.id === cId ? { ...c, draft: draftText.trim() ? draftText : undefined } : c))
            );
          }}
          onSendMessage={handleSendMessage}
          onSendVoiceMessage={handleSendVoiceMessage}
          onOpenActions={() => setIsActionHubOpen(true)}
          onOpenScheduler={() => setIsScheduleModalOpen(true)}
          onOpenScheduledList={() => setIsScheduledDrawerOpen(true)}
          scheduledCountInCurrentChat={scheduledMessages.filter((m) => m.chatId === activeChatId).length}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onRemoveReplyQuote={handleRemoveReplyQuote}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onSaveEdit={handleSaveEdit}
          selectedMessagesForQuote={selectedMessagesForQuoteObjects}
          onSynthesizeMultiQuote={handleSynthesizeSelection}
          onClearSelectedQuotes={handleClearSelection}
          scheduledTime={scheduledTimeString}
          onClearScheduledTime={() => setScheduledTimeString(undefined)}
          chatMembers={currentChat.members}
        />
      </main>

      {/* 3. Drawers and Modals */}
      <GroupDetailsDrawer
        chat={currentChat}
        isOpen={isGroupDetailsOpen}
        onClose={() => setIsGroupDetailsOpen(false)}
        onSelectMember={(m) => setSelectedMemberProfile(m)}
        onAddMember={() => alert('Запрошення надіслано новим учасникам')}
        onTogglePinChat={handleTogglePinChat}
        onOpenImageLightbox={(url, title) => {
          setLightboxMedia({ url, title });
        }}
        onUpdateChatSettings={handleUpdateChatSettings}
      />

      <UserProfileModal
        isOpen={isSelfProfileOpen || !!selectedMemberProfile}
        onClose={() => {
          setIsSelfProfileOpen(false);
          setSelectedMemberProfile(null);
        }}
        currentUser={currentUser}
        onUpdateCurrentUser={(updated) => setCurrentUser((prev) => ({ ...prev, ...updated }))}
        viewingMember={selectedMemberProfile}
        onOpenDirectChat={handleStartDirectChat}
      />

      <LocationDossierModal
        location={activeLocationDossier}
        isOpen={!!activeLocationDossier}
        onClose={() => setActiveLocationDossier(null)}
      />

      <ActionHubModal
        isOpen={isActionHubOpen}
        onClose={() => setIsActionHubOpen(false)}
        chat={currentChat}
        onInsertAction={(payload) => handleSendMessage(payload)}
      />

      <ChatDigestModal
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
        chat={currentChat}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
        onExportAllData={() => {
          const exportPayload = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            user: currentUser,
            folders: smartFolders,
            scheduledMessages: scheduledMessages,
            chats: chats,
          };
          const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `aura-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        onClearHistory={() => {
          setChats((prev) =>
            prev.map((c) =>
              c.id === activeChatId ? { ...c, messages: [] } : c
            )
          );
        }}
        onOpenP2PNetworkModal={() => setIsP2PModalOpen(true)}
      />

      <P2PNetworkModal
        isOpen={isP2PModalOpen}
        onClose={() => setIsP2PModalOpen(false)}
      />

      <CreateChatModal
        isOpen={isCreateChatOpen}
        onClose={() => setIsCreateChatOpen(false)}
        onCreateChat={handleCreateNewChat}
      />

      <ForwardMessageModal
        isOpen={!!forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        message={forwardingMessage}
        chats={chats}
        currentChatId={activeChatId}
        onForward={handleConfirmForward}
      />

      <MediaLightboxModal
        media={lightboxMedia}
        onClose={() => setLightboxMedia(null)}
      />

      <ScheduleMessageModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={(timeStr) => setScheduledTimeString(timeStr)}
        onOpenScheduledList={() => setIsScheduledDrawerOpen(true)}
      />

      <ScheduledMessagesDrawer
        isOpen={isScheduledDrawerOpen}
        onClose={() => setIsScheduledDrawerOpen(false)}
        scheduledMessages={scheduledMessages}
        currentChatId={activeChatId}
        chats={chats}
        onSendNow={handleSendScheduledNow}
        onDeleteScheduled={handleDeleteScheduled}
        onUpdateScheduled={handleUpdateScheduled}
        onCreateScheduled={handleCreateScheduled}
        onSelectChat={(id) => {
          setActiveChatId(id);
          setIsScheduledDrawerOpen(false);
        }}
      />

      <SmartFolderModal
        isOpen={isSmartFolderModalOpen}
        onClose={() => {
          setIsSmartFolderModalOpen(false);
          setEditingSmartFolder(null);
        }}
        folderToEdit={editingSmartFolder}
        chats={chats}
        onSaveFolder={handleSaveFolder}
        onDeleteFolder={handleDeleteFolder}
      />
    </div>
  );
}
export default App;

