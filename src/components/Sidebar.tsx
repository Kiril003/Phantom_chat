import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Pin,
  Users,
  Home,
  Briefcase,
  Coffee,
  Bookmark,
  Compass,
  GraduationCap,
  SlidersHorizontal,
  BatteryCharging,
  X,
  Settings,
  MessagesSquare,
  Radio,
  Sparkles,
  ChevronDown,
  FolderPlus,
  FolderEdit,
  Folder,
  GripVertical,
  MoreVertical,
  Check,
  MoveRight,
  FolderCheck,
  Layers,
  CheckCheck,
  BellOff,
  Bell,
  Palette,
  Trash2,
  VolumeX,
  Volume2,
  Tag,
  Wand2,
  Clock,
  MessageCircle,
  Activity,
  BarChart2,
  Pencil,
  Zap,
  Eye,
  Pipette,
  Paintbrush,
  Share2,
  Download,
  FileJson,
  Smile,
  Archive,
  ArchiveRestore,
  Link2
} from 'lucide-react';
import { Chat, ChatCircle, PersonaSphere, SmartFolder, UserProfile } from '../types';
import { soundFx } from '../utils/sound';
import { ShareFolderModal } from './ShareFolderModal';
import { FolderInsightsModal } from './FolderInsightsModal';
import { FolderIconPickerModal } from './FolderIconPickerModal';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  currentUser: UserProfile;
  smartFolders: SmartFolder[];
  activeFolderId: string;
  onSelectFolder: (folderId: string) => void;
  onAddChatToFolder: (folderId: string, chatId: string) => void;
  onRemoveChatFromFolder: (folderId: string, chatId: string) => void;
  onOpenCreateFolder: () => void;
  onOpenEditFolder: (folder: SmartFolder) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onMarkFolderAsRead?: (folderId: string) => void;
  onToggleMuteFolder?: (folderId: string) => void;
  onToggleArchiveFolder?: (folderId: string) => void;
  onSetFolderVibeAndColor?: (folderId: string, color: string, vibe?: string) => void;
  onSetFolderIcon?: (folderId: string, emoji: string) => void;
  onClearFolderChats?: (folderId: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onNewChat: () => void;
  onOpenUserProfile: () => void;
  onOpenSettings: () => void;
  onSwitchPersonaSphere?: (sphere: PersonaSphere) => void;
}

const circlesConfig: { id: ChatCircle; label: string; icon: any; emoji: string }[] = [
  { id: 'all', label: 'Усі кола', icon: null, emoji: '✨' },
  { id: 'work', label: 'Робота', icon: Briefcase, emoji: '⚡' },
  { id: 'family', label: 'Сім’я', icon: Home, emoji: '🏡' },
  { id: 'friends', label: 'Друзі', icon: Coffee, emoji: '☕' },
  { id: 'study', label: 'Навчання', icon: GraduationCap, emoji: '🎓' },
  { id: 'communities', label: 'Спільноти', icon: Compass, emoji: '🌿' },
  { id: 'saved', label: 'Збережене', icon: Bookmark, emoji: '🔖' },
];

const sphereLabels: Record<PersonaSphere, { label: string; emoji: string; color: string; bg: string }> = {
  work: { label: 'Робота', emoji: '⚡', color: '#8C461A', bg: '#FCE7D8' },
  personal: { label: 'Особисте', emoji: '🌿', color: '#2E6B27', bg: '#E3EFE1' },
  creative: { label: 'Творчість', emoji: '🎨', color: '#8C461A', bg: '#F6E7DE' },
  family: { label: 'Родина', emoji: '🏡', color: '#B37418', bg: '#FEF3D6' },
};

const colorPalette = [
  { hex: '#E87A42', label: 'Теракота' },
  { hex: '#528A4B', label: 'Шавлія' },
  { hex: '#D97706', label: 'Бурштин' },
  { hex: '#8C461A', label: 'Каштан' },
  { hex: '#2563EB', label: 'Кобальт' },
  { hex: '#7C3AED', label: 'Лаванда' },
  { hex: '#E11D48', label: 'Корал' },
  { hex: '#1F2521', label: 'Графіт' },
];

const vibePresets = [
  '⚡ Deep Work & Design',
  '☕ Urban Chill & Specialty',
  '🎨 Creative & Brainstorm',
  '🏡 Дім & Родинні плани',
  '🎯 Sprint Focus & Tasks',
  '🔒 Конфіденційно & Особисте',
];

interface FolderStats {
  total: number;
  unread: number;
  latestTime: string;
  topChats: Chat[];
  onlineCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  currentUser,
  smartFolders,
  activeFolderId,
  onSelectFolder,
  onAddChatToFolder,
  onRemoveChatFromFolder,
  onOpenCreateFolder,
  onOpenEditFolder,
  onRenameFolder,
  onMarkFolderAsRead,
  onToggleMuteFolder,
  onToggleArchiveFolder,
  onSetFolderVibeAndColor,
  onSetFolderIcon,
  onClearFolderChats,
  onDeleteFolder,
  onNewChat,
  onOpenUserProfile,
  onOpenSettings,
  onSwitchPersonaSphere,
}) => {
  const [activeCircle, setActiveCircle] = useState<ChatCircle>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);

  // Drag-and-Drop state
  const [draggedChatId, setDraggedChatId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat context menu for quick folder assignment
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);

  // Right-click Context Menu on Smart Folders
  const [folderContextMenu, setFolderContextMenu] = useState<{
    folder: SmartFolder;
    x: number;
    y: number;
  } | null>(null);

  // Inline Title Renaming state
  const [inlineEditingFolderId, setInlineEditingFolderId] = useState<string | null>(null);
  const [inlineFolderName, setInlineFolderName] = useState<string>('');

  // Hover Statistics Tooltip state
  const [hoveredFolderStats, setHoveredFolderStats] = useState<{
    folder: SmartFolder;
    x: number;
    y: number;
    stats: FolderStats;
  } | null>(null);

  // Quick Vibe & Color sub-editors inside context menu
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false);
  const [isVibePaletteOpen, setIsVibePaletteOpen] = useState(false);
  const [customVibeInput, setCustomVibeInput] = useState('');

  // Quick Preview Floating Card state
  const [quickPreview, setQuickPreview] = useState<{
    folder: SmartFolder;
    chat: Chat;
    messages: any[];
    x: number;
    y: number;
  } | null>(null);

  // Share Folder Modal state
  const [sharingFolder, setSharingFolder] = useState<SmartFolder | null>(null);

  // Folder Insights Modal state
  const [insightsFolder, setInsightsFolder] = useState<SmartFolder | null>(null);

  // Folder Icon Picker Modal state
  const [iconPickerFolder, setIconPickerFolder] = useState<SmartFolder | null>(null);

  // Archived Folders bottom section toggle
  const [isArchiveSectionExpanded, setIsArchiveSectionExpanded] = useState<boolean>(true);

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const quickPreviewRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Close context menu & preview on outside click or escape
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setFolderContextMenu(null);
        setIsColorPaletteOpen(false);
        setIsVibePaletteOpen(false);
      }
      if (quickPreviewRef.current && !quickPreviewRef.current.contains(e.target as Node)) {
        setQuickPreview(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFolderContextMenu(null);
        setIsColorPaletteOpen(false);
        setIsVibePaletteOpen(false);
        setActiveMenuChatId(null);
        setHoveredFolderStats(null);
        setQuickPreview(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentFolder = smartFolders.find((f) => f.id === activeFolderId) || smartFolders[0];

  // Helper to check if a chat belongs to a folder
  const isChatInFolder = (chat: Chat, folder: SmartFolder) => {
    if (folder.id === 'all') return true;
    if (folder.chatIds && folder.chatIds.includes(chat.id)) return true;
    if (folder.filterRules?.includeCircles && folder.filterRules.includeCircles.includes(chat.circle)) return true;
    if (folder.filterRules?.unreadOnly && chat.unreadCount > 0) return true;
    return false;
  };

  // Compute rich statistical summary for a Smart Folder
  const getFolderStatistics = (folder: SmartFolder): FolderStats => {
    const matchingChats = chats.filter((c) => isChatInFolder(c, folder));
    const total = matchingChats.length;
    const unread = matchingChats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    const onlineCount = matchingChats.filter((c) => c.isOnline).length;

    let latestTime = 'Немає активності';
    const activeChat = matchingChats.find((c) => c.messages && c.messages.length > 0);
    if (activeChat && activeChat.messages) {
      latestTime = activeChat.messages[activeChat.messages.length - 1].timestamp || 'Сьогодні';
    }

    const topChats = matchingChats.slice(0, 3);

    return {
      total,
      unread,
      latestTime,
      topChats,
      onlineCount,
    };
  };

  // Filter chats by Active Smart Folder, Circle, Search Query & Unread status
  const filteredChats = chats.filter((c) => {
    const matchesFolder = isChatInFolder(c, currentFolder);
    const matchesCircle = activeCircle === 'all' || c.circle === activeCircle;
    const matchesUnread = !showOnlyUnread || c.unreadCount > 0;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.topic && c.topic.toLowerCase().includes(q)) ||
      (c.badge && c.badge.toLowerCase().includes(q)) ||
      (c.publicHandle && c.publicHandle.toLowerCase().includes(q));

    return matchesFolder && matchesCircle && matchesUnread && matchesSearch;
  });

  const totalUnread = chats.reduce((acc, c) => acc + c.unreadCount, 0);
  const activeSphere = currentUser.activePersonaSphere || 'work';

  // Calculate unread count for each Smart Folder
  const getFolderUnreadCount = (folder: SmartFolder) => {
    return chats
      .filter((c) => isChatInFolder(c, folder))
      .reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, chatId: string) => {
    e.dataTransfer.setData('text/plain', chatId);
    e.dataTransfer.effectAllowed = 'copyMove';
    setDraggedChatId(chatId);
    setHoveredFolderStats(null);
  };

  const handleDragEnd = () => {
    setDraggedChatId(null);
    setDragOverFolderId(null);
  };

  const handleDragOverFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeaveFolder = (folderId: string) => {
    if (dragOverFolderId === folderId) {
      setDragOverFolderId(null);
    }
  };

  const handleDropOnFolder = (e: React.DragEvent, folder: SmartFolder) => {
    e.preventDefault();
    const chatId = e.dataTransfer.getData('text/plain') || draggedChatId;
    if (!chatId) return;

    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    if (folder.id === 'all') {
      showToast(`Чат «${chat.title}» відображається в усіх бесідах`);
    } else {
      onAddChatToFolder(folder.id, chatId);
      soundFx.playSend();
      showToast(`✨ «${chat.title}» додано до папки «${folder.name}»`);
    }

    setDraggedChatId(null);
    setDragOverFolderId(null);
    setHoveredFolderStats(null);
  };

  // Hover Tooltip Handlers
  const handleFolderMouseEnter = (e: React.MouseEvent<HTMLDivElement>, folder: SmartFolder) => {
    if (folderContextMenu || draggedChatId || inlineEditingFolderId) return;

    const target = e.currentTarget;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const stats = getFolderStatistics(folder);
      const posX = Math.min(Math.max(rect.left - 10, 10), window.innerWidth - 240);
      const posY = rect.bottom + 6;

      setHoveredFolderStats({
        folder,
        x: posX,
        y: posY,
        stats,
      });
    }, 100);
  };

  const handleFolderMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredFolderStats(null);
  };

  // Open Context Menu on Right-Click or Long-Press
  const openFolderContextMenu = (e: React.MouseEvent | React.TouchEvent, folder: SmartFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredFolderStats(null);
    soundFx.playTap();

    let clientX = 16;
    let clientY = 80;

    if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    // Keep context menu inside visible boundary
    const x = Math.min(Math.max(clientX - 40, 10), window.innerWidth - 270);
    const y = Math.min(Math.max(clientY + 10, 60), window.innerHeight - 380);

    setFolderContextMenu({ folder, x, y });
    setCustomVibeInput(folder.vibe || '');
    setIsVibePaletteOpen(false);
  };

  const handleTouchStart = (e: React.TouchEvent, folder: SmartFolder) => {
    longPressTimerRef.current = window.setTimeout(() => {
      openFolderContextMenu(e, folder);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Folder Context Menu Action Handlers
  const handleMarkAllAsReadAction = (folder: SmartFolder) => {
    soundFx.playSend();
    if (onMarkFolderAsRead) {
      onMarkFolderAsRead(folder.id);
    }
    showToast(`✨ Усі чати в «${folder.name}» позначено як прочитані`);
    setFolderContextMenu(null);
  };

  const handleToggleMuteAction = (folder: SmartFolder) => {
    soundFx.playTap();
    if (onToggleMuteFolder) {
      onToggleMuteFolder(folder.id);
    }
    const newMutedState = !folder.isMuted;
    showToast(newMutedState ? `🔕 Сповіщення для «${folder.name}» вимкнено` : `🔔 Сповіщення для «${folder.name}» увімкнено`);
    setFolderContextMenu(null);
  };

  const handleToggleArchiveAction = (folder: SmartFolder) => {
    soundFx.playTap();
    if (onToggleArchiveFolder) {
      onToggleArchiveFolder(folder.id);
    }
    const willBeArchived = !folder.isArchived;
    showToast(
      willBeArchived
        ? `📦 Простір «${folder.name}» переміщено в архів`
        : `📂 Простір «${folder.name}» розархівовано`
    );
    if (willBeArchived && activeFolderId === folder.id) {
      onSelectFolder('all');
    }
    setFolderContextMenu(null);
  };

  const handleCopyFolderLinkAction = (folder: SmartFolder) => {
    soundFx.playSend();
    const deepLink = `${window.location.origin}${window.location.pathname}?folder=${encodeURIComponent(folder.id)}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(deepLink).then(() => {
        showToast(`🔗 Deep Link на «${folder.name}» скопійовано!`);
      }).catch(() => {
        showToast(`🔗 Посилання: ${deepLink}`);
      });
    } else {
      showToast(`🔗 Посилання: ${deepLink}`);
    }
    setFolderContextMenu(null);
  };

  const handleSetColorAction = (folder: SmartFolder, colorHex: string) => {
    soundFx.playTap();
    if (onSetFolderVibeAndColor) {
      onSetFolderVibeAndColor(folder.id, colorHex, folder.vibe);
    }
    showToast(`🎨 Колір папки оновлено`);
  };

  const handleSetVibeAction = (folder: SmartFolder, vibeText: string) => {
    soundFx.playSend();
    if (onSetFolderVibeAndColor) {
      onSetFolderVibeAndColor(folder.id, folder.color || '#E87A42', vibeText);
    }
    showToast(`✨ Vibe встановлено: ${vibeText}`);
    setIsVibePaletteOpen(false);
    setFolderContextMenu(null);
  };

  const handleClearFolderAction = (folder: SmartFolder) => {
    soundFx.playTap();
    if (confirm(`Очистити чати з папки «${folder.name}»? (Чати залишаться в системі)`)) {
      if (onClearFolderChats) {
        onClearFolderChats(folder.id);
      }
      showToast(`Папку «${folder.name}» очищено`);
      setFolderContextMenu(null);
    }
  };

  const handleDeleteFolderAction = (folder: SmartFolder) => {
    soundFx.playTap();
    if (confirm(`Видалити папку «${folder.name}»?`)) {
      if (onDeleteFolder) {
        onDeleteFolder(folder.id);
      }
      showToast(`Папку «${folder.name}» видалено`);
      setFolderContextMenu(null);
    }
  };

  // Export structured JSON of all chat metadata in a folder
  const handleExportChatListAction = (folder: SmartFolder) => {
    soundFx.playSend();
    const folderChats = chats.filter((c) => isChatInFolder(c, folder));

    const exportData = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Aura Messenger',
      folder: {
        id: folder.id,
        name: folder.name,
        emoji: folder.emoji,
        color: folder.color,
        vibe: folder.vibe,
        isMuted: folder.isMuted,
        isBuiltIn: folder.isBuiltIn,
      },
      totalChats: folderChats.length,
      chats: folderChats.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        circle: c.circle,
        topic: c.topic,
        badge: c.badge,
        customVibe: c.customVibe,
        unreadCount: c.unreadCount,
        isOnline: c.isOnline,
        isPinned: c.isPinned,
        isForum: c.isForum,
        isPublic: c.isPublic,
        publicHandle: c.publicHandle,
        membersCount: c.members?.length || (c.type === 'dm' ? 2 : 1),
        members: c.members?.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          handle: m.handle,
          isOnline: m.isOnline,
          customTitle: m.customTitle,
        })),
        topics: c.topics?.map((t) => ({
          id: t.id,
          title: t.title,
          iconEmoji: t.iconEmoji,
          messageCount: t.messageCount,
        })),
        totalMessages: c.messages?.length || 0,
        pinnedMessagesCount: c.pinnedMessages?.length || 0,
        lastActivity:
          c.messages && c.messages.length > 0
            ? c.messages[c.messages.length - 1].timestamp
            : undefined,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = folder.name.toLowerCase().replace(/[^a-z0-9а-яіїє]/gi, '_');
    link.href = url;
    link.download = `aura_${safeName}_chats_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`📥 Експортовано ${folderChats.length} чатів з «${folder.name}» у JSON`);
    setFolderContextMenu(null);
  };

  // Inline Folder Renaming Handlers
  const handleStartRename = (folder: SmartFolder) => {
    setFolderContextMenu(null);
    setInlineEditingFolderId(folder.id);
    setInlineFolderName(folder.name);
  };

  const handleSaveRename = (folderId: string) => {
    const trimmed = inlineFolderName.trim();
    if (trimmed && onRenameFolder) {
      onRenameFolder(folderId, trimmed);
      showToast(`✏️ Папку перейменовано на «${trimmed}»`);
    } else if (trimmed) {
      const folder = smartFolders.find((f) => f.id === folderId);
      if (folder) {
        onOpenEditFolder({ ...folder, name: trimmed });
      }
    }
    setInlineEditingFolderId(null);
  };

  const handleCancelRename = () => {
    setInlineEditingFolderId(null);
  };

  // Find most recent active chat and its latest 3 messages in a folder
  const getMostRecentChatInFolder = (folder: SmartFolder): { chat: Chat; lastMessages: any[] } | null => {
    const matchingChats = chats.filter((c) => isChatInFolder(c, folder));
    if (matchingChats.length === 0) return null;

    const sorted = [...matchingChats].sort((a, b) => {
      const aMsgs = a.messages || [];
      const bMsgs = b.messages || [];
      if (aMsgs.length === 0 && bMsgs.length === 0) return 0;
      if (aMsgs.length === 0) return 1;
      if (bMsgs.length === 0) return -1;
      return bMsgs.length - aMsgs.length;
    });

    const targetChat = sorted[0];
    const msgs = targetChat.messages || [];
    const last3 = msgs.slice(-3);

    return {
      chat: targetChat,
      lastMessages: last3,
    };
  };

  const handleOpenQuickPreview = (folder: SmartFolder) => {
    const recent = getMostRecentChatInFolder(folder);
    if (!recent || recent.lastMessages.length === 0) {
      showToast(`У просторі «${folder.name}» ще немає повідомлень для перегляду`);
      setFolderContextMenu(null);
      return;
    }
    const posX = Math.min(Math.max((folderContextMenu?.x || 100) - 80, 20), window.innerWidth - 370);
    const posY = Math.min((folderContextMenu?.y || 120) + 8, window.innerHeight - 380);

    setQuickPreview({
      folder,
      chat: recent.chat,
      messages: recent.lastMessages,
      x: posX,
      y: posY,
    });
    setFolderContextMenu(null);
    soundFx.playTap();
  };

  return (
    <aside className="w-80 sm:w-88 md:w-96 flex flex-col h-full bg-[#FAF8F3] border-r border-[#E2D9C8] select-none shrink-0 overflow-hidden relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-16 left-3 right-3 z-40 bg-[#1F2521] text-white px-3.5 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <FolderCheck className="w-4 h-4 text-[#E87A42] shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Identity & Action Bar */}
      <div className="p-3.5 border-b border-[#E8DFD1] flex items-center justify-between gap-2 bg-[#F6EFE3]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#1F2521] flex items-center justify-center text-[#FAF8F3] font-black text-sm shadow-2xs shrink-0">
            A
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm tracking-tight text-[#1F2521] truncate">
              Aura Messenger
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-[#717E75]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#528A4B]" />
              <span className="truncate">Smart Workspaces & Folders</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              soundFx.playTap();
              onOpenSettings();
            }}
            className="p-2 bg-white/80 hover:bg-white text-[#4A574E] rounded-xl border border-[#DFD6C5] transition-colors shadow-2xs"
            title="Налаштування застосунку"
          >
            <Settings className="w-4 h-4 text-[#717E75]" />
          </button>

          <button
            onClick={() => {
              soundFx.playTap();
              onNewChat();
            }}
            className="px-2.5 py-1.5 bg-[#E87A42] hover:bg-[#D46B35] text-white rounded-xl font-extrabold text-xs flex items-center gap-1 transition-colors shadow-2xs"
            title="Створити простір або тему"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Новий</span>
          </button>
        </div>
      </div>

      {/* 2. SMART FOLDERS / WORKSPACES BAR (With Drag & Drop, Hover Stats & Right-Click Context Menu) */}
      <div className="bg-[#F1E9DC] border-b border-[#E5DAC8] px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <AnimatePresence initial={false}>
          {smartFolders
            .filter((f) => !f.isArchived)
            .map((folder) => {
            const isActive = activeFolderId === folder.id;
            const isDragTarget = dragOverFolderId === folder.id;
            const folderUnread = getFolderUnreadCount(folder);

            return (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, scale: 0.86, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.82, y: -4 }}
                transition={{
                  type: 'spring',
                  stiffness: 440,
                  damping: 24,
                  mass: 0.75,
                }}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.96 }}
                layout
                onContextMenu={(e) => openFolderContextMenu(e, folder)}
                onTouchStart={(e) => handleTouchStart(e, folder)}
                onTouchEnd={handleTouchEnd}
                onMouseEnter={(e) => handleFolderMouseEnter(e, folder)}
                onMouseLeave={handleFolderMouseLeave}
                onDragOver={(e) => handleDragOverFolder(e, folder.id)}
                onDragLeave={() => handleDragLeaveFolder(folder.id)}
                onDrop={(e) => handleDropOnFolder(e, folder)}
                onClick={() => {
                  soundFx.playTap();
                  onSelectFolder(folder.id);
                  setHoveredFolderStats(null);
                }}
                style={{
                  borderColor: isDragTarget
                    ? (folder.color || '#E87A42')
                    : isActive
                    ? (folder.color || '#D8CEBC')
                    : folder.color
                    ? `${folder.color}55`
                    : undefined,
                  boxShadow: isActive && folder.color
                    ? `0 2px 8px -2px ${folder.color}35`
                    : undefined,
                }}
                className={`smart-folder-item animate-organic-bounce group px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 text-xs whitespace-nowrap relative border select-none ${
                  isDragTarget
                    ? 'bg-[#1F2521] text-white scale-105 ring-2 ring-[#E87A42] shadow-md'
                    : isActive
                    ? 'bg-white text-[#1F2521] font-bold shadow-xs'
                    : 'bg-white/50 text-[#5E6B62] hover:bg-white hover:text-[#1F2521] border-transparent hover:border-[#DFD6C5]'
                }`}
              >
              {/* Interactive Folder Avatar Placeholder (Faded opacity if empty, click to change icon/emoji) */}
              <div className="relative shrink-0 flex items-center justify-center group/avatar">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playTap();
                    setIconPickerFolder(folder);
                  }}
                  title={
                    chats.filter((c) => isChatInFolder(c, folder)).length === 0
                      ? `Порожній простір (0 чатів) — натисніть, щоб обрати іконку`
                      : `Натисніть, щоб обрати органічну іконку простору`
                  }
                  className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0 transition-all duration-150 hover:scale-115 active:scale-95 shadow-2xs cursor-pointer hover:ring-2 hover:ring-[#E87A42]/50 ${
                    chats.filter((c) => isChatInFolder(c, folder)).length === 0
                      ? 'opacity-40 group-hover/avatar:opacity-85 grayscale-40'
                      : 'opacity-100'
                  }`}
                  style={{
                    backgroundColor: folder.color ? `${folder.color}22` : '#F0E8DC',
                    color: folder.color || '#1F2521',
                    border: folder.color ? `1px solid ${folder.color}44` : '1px solid transparent',
                  }}
                >
                  <span className="select-none">{folder.emoji}</span>
                </button>

                {/* Visual Notification State Badge on Folder Icon */}
                {folder.isMuted ? (
                  <span
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#5F6A60] text-white rounded-full flex items-center justify-center ring-1.5 ring-[#FAF8F3] shadow-2xs pointer-events-none"
                    title="Сповіщення для цього простору вимкнено"
                  >
                    <BellOff className="w-2 h-2 stroke-[2.5]" />
                  </span>
                ) : (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-white pointer-events-none"
                    style={{ backgroundColor: folder.color || '#528A4B' }}
                    title="Сповіщення активні"
                  />
                )}
              </div>
              
              {/* Folder Title or Inline Rename Input Overlay */}
              {inlineEditingFolderId === folder.id ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 min-w-24"
                >
                  <input
                    type="text"
                    autoFocus
                    value={inlineFolderName}
                    onChange={(e) => setInlineFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveRename(folder.id);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelRename();
                      }
                    }}
                    onBlur={() => handleSaveRename(folder.id)}
                    className="px-1.5 py-0.5 text-xs font-bold bg-white text-[#1F2521] border border-[#E87A42] rounded-lg shadow-xs focus:outline-none focus:ring-1 focus:ring-[#E87A42] w-28"
                    placeholder="Назва..."
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1 truncate max-w-28">
                  <span className="truncate">{folder.name}</span>
                  {folder.isMuted && (
                    <VolumeX className="w-3 h-3 text-[#8C988E] shrink-0" title="Сповіщення вимкнено" />
                  )}
                </div>
              )}

              {/* Unread Counter Badge (Muted vs Vibrant) */}
              {folderUnread > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-full shadow-2xs ${
                    folder.isMuted
                      ? 'bg-[#8C988E] text-white/90'
                      : 'bg-[#E87A42] text-white'
                  }`}
                  title={folder.isMuted ? `${folderUnread} непрочитаних (без звуку)` : `${folderUnread} непрочитаних`}
                >
                  {folderUnread}
                </span>
              )}

              {/* Quick-action button: Toggle Priority View (Only unread conversations in this folder) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundFx.playTap();
                  if (!isActive) {
                    onSelectFolder(folder.id);
                    setShowOnlyUnread(true);
                    showToast(`⚡ Priority View: тільки бесіди з новими в «${folder.name}»`);
                  } else {
                    const nextState = !showOnlyUnread;
                    setShowOnlyUnread(nextState);
                    showToast(
                      nextState
                        ? `⚡ Priority View: тільки з новими в «${folder.name}»`
                        : `📁 Показано всі чати в «${folder.name}»`
                    );
                  }
                }}
                className={`p-0.5 rounded-lg transition-all flex items-center justify-center ${
                  isActive && showOnlyUnread
                    ? 'bg-[#E87A42] text-white shadow-2xs scale-105 opacity-100 ring-1 ring-white/50'
                    : folderUnread > 0
                    ? 'text-[#E87A42] hover:bg-[#FCE7D8] opacity-90 group-hover:opacity-100'
                    : 'opacity-0 group-hover:opacity-100 text-[#717E75] hover:text-[#E87A42] hover:bg-[#EAE0D0]'
                }`}
                title={
                  isActive && showOnlyUnread
                    ? 'Вимкнути Priority View (показати всі)'
                    : '⚡ Priority View: показати тільки бесіди з новими повідомленнями'
                }
              >
                <Zap className={`w-3 h-3 ${isActive && showOnlyUnread ? 'fill-current' : ''}`} />
              </button>

              {/* Explicit Folder Settings / Context Menu Trigger Button */}
              <button
                type="button"
                data-action="folder-settings"
                onClick={(e) => {
                  e.stopPropagation();
                  soundFx.playTap();
                  openFolderContextMenu(e, folder);
                }}
                className="folder-settings opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#EAE0D0] rounded-md text-[#717E75] hover:text-[#1F2521] transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="Налаштування та меню простору"
                aria-label="folder-settings"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

        {/* Create new Smart Folder button */}
        <button
          onClick={() => {
            soundFx.playTap();
            onOpenCreateFolder();
          }}
          className="p-1.5 bg-white/70 hover:bg-white text-[#5E6B62] hover:text-[#E87A42] rounded-xl border border-dashed border-[#CFC3B0] transition-colors shadow-2xs shrink-0 flex items-center gap-1 text-xs font-bold"
          title="Створити новий Workspace або розумну папку"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-[11px] pr-1">Папка</span>
        </button>
      </div>

      {/* Drag-and-drop helper tip (visible when dragging) */}
      {draggedChatId && (
        <div className="bg-[#E87A42] text-white px-3 py-1.5 text-[11px] font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5" />
            <span>Перетягніть у потрібну папку вгорі 👆</span>
          </div>
          <span className="text-[10px] opacity-80">Відпустіть для додавання</span>
        </div>
      )}

      {/* Active Folder Vibe & Focus Banner */}
      {currentFolder.vibe && (
        <div className="px-3 py-1.5 bg-[#FAF3E8] border-b border-[#EAE0D0] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: currentFolder.color || '#E87A42' }}
            />
            <span className="font-bold text-[11px] text-[#5C4524] truncate">
              {currentFolder.vibe}
            </span>
          </div>
          <button
            onClick={(e) => openFolderContextMenu(e, currentFolder)}
            className="text-[10px] font-extrabold text-[#E87A42] hover:underline flex items-center gap-0.5 shrink-0"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>Змінити vibe</span>
          </button>
        </div>
      )}

      {/* 3. Search & Unread Filter Box */}
      <div className="px-3 pt-2.5 pb-2 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8C988E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук людей, тем, задач та файлів..."
            className="w-full pl-8 pr-8 py-1.5 bg-white border border-[#DFD6C5] rounded-xl text-xs text-[#1F2521] placeholder-[#8C988E] focus:outline-none focus:border-[#E87A42] transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] px-1 text-[#6F7C73]">
          <span className="font-bold text-[10px] text-[#717E75] uppercase tracking-wider">
            {currentFolder.name} ({filteredChats.length})
          </span>
          {totalUnread > 0 && (
            <button
              onClick={() => setShowOnlyUnread(!showOnlyUnread)}
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] transition-colors ${
                showOnlyUnread
                  ? 'bg-[#E87A42] text-white'
                  : 'bg-[#FCE7D8] text-[#8C461A] hover:bg-[#F9CCA8]'
              }`}
            >
              {totalUnread} нових
            </button>
          )}
        </div>
      </div>

      {/* 4. Circles Sub-Filter Bar */}
      <div className="px-3 py-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#E8DFD1] text-xs font-semibold">
        {circlesConfig.map((circle) => {
          const isActive = activeCircle === circle.id;
          return (
            <button
              key={circle.id}
              onClick={() => {
                soundFx.playTap();
                setActiveCircle(circle.id);
              }}
              className={`px-2 py-0.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 text-[11px] ${
                isActive
                  ? 'bg-[#1F2521] text-white shadow-2xs font-bold'
                  : 'bg-[#F2EDE4] text-[#4F5B52] hover:bg-[#E8DFD0] border border-[#DFD6C5]'
              }`}
            >
              <span>{circle.emoji}</span>
              <span>{circle.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Chats List (Draggable Items) */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredChats.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#7A877E] space-y-2 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F0E8DC] text-2xl flex items-center justify-center mx-auto shadow-2xs">
              {currentFolder.emoji || '📁'}
            </div>
            <p className="font-bold text-[#1F2521]">У папці «{currentFolder.name}» порожньо</p>
            <p className="text-[11px] text-[#717E75]">
              Перетягніть сюди будь-який чат із папки «Усі» або натисніть нижче:
            </p>
            <div className="flex flex-col gap-1.5 pt-1">
              {!currentFolder.isBuiltIn && (
                <button
                  onClick={() => onOpenEditFolder(currentFolder)}
                  className="px-3 py-1.5 bg-white hover:bg-[#FAF6EE] text-[#1F2521] border border-[#DFD6C5] rounded-xl text-xs font-bold transition-colors"
                >
                  ⚙️ Налаштувати склад папки
                </button>
              )}
              <button
                onClick={() => onSelectFolder('all')}
                className="text-[#E87A42] font-semibold text-xs hover:underline"
              >
                ← Повернутися до «Усі бесіди»
              </button>
            </div>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = chat.id === activeChatId;
            const lastMsg = chat.messages?.[chat.messages.length - 1];
            const isDraggingThis = draggedChatId === chat.id;

            return (
              <div
                key={chat.id}
                id={`chat-item-${chat.id}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, chat.id)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  soundFx.playTap();
                  onSelectChat(chat.id);
                  setActiveMenuChatId(null);
                }}
                className={`group p-2.5 rounded-2xl cursor-pointer transition-all flex items-center gap-2.5 relative border ${
                  isDraggingThis
                    ? 'opacity-40 scale-95 border-dashed border-[#E87A42] bg-[#FAF3EA]'
                    : isSelected
                    ? 'bg-white border-[#1F2521] shadow-xs ring-1 ring-[#1F2521]/10'
                    : 'bg-white/60 hover:bg-white border-transparent hover:border-[#E2D8C7]'
                }`}
              >
                {/* Drag Grip Handle */}
                <div
                  className="opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-grab active:cursor-grabbing text-[#8C988E] hover:text-[#1F2521] transition-opacity -mr-1"
                  title="Перетягніть для додавання в папку"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>

                {/* Avatar with Online Badge */}
                <div className="relative shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.title}
                    className="w-11 h-11 rounded-2xl object-cover ring-1 ring-[#FAF8F3]"
                  />
                  {chat.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#528A4B] rounded-full ring-2 ring-white" />
                  )}
                  {chat.isForum && (
                    <span className="absolute -top-1 -right-1 bg-[#1F2521] text-white p-0.5 rounded-md text-[8px] shadow-2xs">
                      <MessagesSquare className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <h3 className="font-extrabold text-xs text-[#1F2521] truncate">
                        {chat.title}
                      </h3>
                      {chat.pinned && (
                        <Pin className="w-2.5 h-2.5 text-[#E87A42] fill-current shrink-0" />
                      )}
                    </div>
                    {lastMsg && (
                      <span className="text-[10px] text-[#7E8B82] font-mono shrink-0">
                        {lastMsg.timestamp}
                      </span>
                    )}
                  </div>

                  {/* Last message preview snippet */}
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] text-[#5E6B62] truncate">
                      {lastMsg?.type === 'table' ? (
                        <span className="text-[#C45318] font-semibold">📊 Таблиця: {lastMsg.tableData?.title}</span>
                      ) : lastMsg?.type === 'chart' ? (
                        <span className="text-[#2E6B27] font-semibold">📈 Графік: {lastMsg.chartData?.title}</span>
                      ) : lastMsg?.type === 'task-list' ? (
                        <span className="text-[#C45318] font-semibold">☑️ Задачі: {lastMsg.taskListData?.title}</span>
                      ) : lastMsg?.type === 'multi-quote' ? (
                        <span className="text-[#C45318] font-semibold">💬 {lastMsg.multiQuoteData?.title || 'Синтез цитат'}</span>
                      ) : lastMsg?.type === 'location' ? (
                        <span className="text-[#C45318] font-semibold">📍 {lastMsg.locationData?.name}</span>
                      ) : lastMsg?.type === 'voice' ? (
                        <span className="text-[#C45318] font-semibold">🎙️ Голосове ({lastMsg.voiceData?.duration}с)</span>
                      ) : lastMsg?.type === 'poll' ? (
                        <span className="text-[#2E6B27] font-semibold">🗳️ {lastMsg.pollData?.question}</span>
                      ) : lastMsg?.type === 'split-bill' ? (
                        <span className="text-[#C45318] font-semibold">💳 Рахунок ({lastMsg.splitBillData?.totalAmount} {lastMsg.splitBillData?.currency})</span>
                      ) : lastMsg?.type === 'file' ? (
                        <span className="text-[#4A574E] font-semibold">📎 {lastMsg.fileData?.name}</span>
                      ) : lastMsg?.type === 'code' ? (
                        <span className="text-[#4A574E] font-mono text-[10px]">💻 {lastMsg.codeData?.title || 'Code snippet'}</span>
                      ) : (
                        lastMsg?.text || chat.description || 'Розпочати бесіду'
                      )}
                    </p>

                    <div className="flex items-center gap-1 shrink-0">
                      {chat.unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-[#E87A42] text-white text-[9px] font-extrabold rounded-full shadow-2xs">
                          {chat.unreadCount}
                        </span>
                      )}

                      {/* Quick Move Context Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFx.playTap();
                          setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#F2ECE2] rounded-lg text-[#8C988E] hover:text-[#1F2521] transition-opacity"
                        title="Додати або перемістити в папку"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Folder Move Menu Popup for Chat Items */}
                {activeMenuChatId === chat.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-12 z-30 w-52 p-2 bg-white border border-[#DFD6C5] rounded-2xl shadow-xl space-y-1 animate-in fade-in duration-100"
                  >
                    <div className="px-2 py-1 text-[10px] font-extrabold text-[#717E75] uppercase tracking-wider flex items-center justify-between">
                      <span>Призначити папку:</span>
                      <button
                        onClick={() => setActiveMenuChatId(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {smartFolders
                      .filter((f) => !f.isBuiltIn)
                      .map((folder) => {
                        const isIn = isChatInFolder(chat, folder);
                        return (
                          <button
                            key={folder.id}
                            onClick={() => {
                              soundFx.playTap();
                              if (isIn) {
                                onRemoveChatFromFolder(folder.id, chat.id);
                                showToast(`Видалено з «${folder.name}»`);
                              } else {
                                onAddChatToFolder(folder.id, chat.id);
                                soundFx.playSend();
                                showToast(`✨ Додано до «${folder.name}»`);
                              }
                              setActiveMenuChatId(null);
                            }}
                            className={`w-full p-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                              isIn
                                ? 'bg-[#F2EDE4] text-[#1F2521]'
                                : 'hover:bg-[#FAF8F3] text-[#4F5B52]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span>{folder.emoji}</span>
                              <span className="truncate">{folder.name}</span>
                            </div>
                            {isIn && <Check className="w-3.5 h-3.5 text-[#E87A42] shrink-0" />}
                          </button>
                        );
                      })}

                    <div className="pt-1 border-t border-[#F2EDE4]">
                      <button
                        onClick={() => {
                          setActiveMenuChatId(null);
                          onOpenCreateFolder();
                        }}
                        className="w-full p-1.5 rounded-xl text-left text-xs font-bold text-[#E87A42] hover:bg-[#FAF5ED] flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Новий Workspace</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6. HOVER TOOLTIP FOR SMART FOLDERS (.smart-folder-item) */}
      {hoveredFolderStats && !folderContextMenu && !inlineEditingFolderId && (
        <div
          className="fixed z-40 bg-[#1F2521] text-white border border-[#3D473F] rounded-xl shadow-xl px-3 py-2 text-xs pointer-events-none animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col gap-1.5 min-w-44 max-w-64"
          style={{
            top: hoveredFolderStats.y,
            left: hoveredFolderStats.x,
          }}
        >
          {/* Folder Name & Emoji */}
          <div className="flex items-center justify-between gap-2 border-b border-[#313C34] pb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs">{hoveredFolderStats.folder.emoji}</span>
              <span className="font-extrabold text-xs text-[#FAF8F3] truncate">
                {hoveredFolderStats.folder.name}
              </span>
            </div>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: hoveredFolderStats.folder.color || '#E87A42' }}
            />
          </div>

          {/* Counts: Total chats and total unread message count */}
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-1 text-[#D2DBD4]">
              <MessageCircle className="w-3.5 h-3.5 text-[#8CB886] shrink-0" />
              <span>Чати:</span>
              <span className="font-extrabold text-white">{hoveredFolderStats.stats.total}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[#D2DBD4]">Непрочитані:</span>
              {hoveredFolderStats.stats.unread > 0 ? (
                <span className="px-1.5 py-0.2 bg-[#E87A42] text-white text-[10px] font-black rounded-full shadow-2xs">
                  {hoveredFolderStats.stats.unread}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-[#8CB886]">
                  0
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. SMART FOLDER RIGHT-CLICK CONTEXT MENU (SaaS / Telegram Grade) */}
      {folderContextMenu && (
        <div
          ref={contextMenuRef}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-64 bg-white border border-[#DFD6C5] rounded-2xl shadow-2xl p-1.5 space-y-1 animate-in fade-in slide-in-from-left-4 duration-200 ease-out text-[#1F2521]"
          style={{
            top: folderContextMenu.y,
            left: folderContextMenu.x,
          }}
        >
          {/* Menu Header with Folder Info */}
          <div className="px-2.5 py-2 border-b border-[#F2ECE2] flex items-center justify-between bg-[#FAF8F3] rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{folderContextMenu.folder.emoji}</span>
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs text-[#1F2521] truncate">
                  {folderContextMenu.folder.name}
                </h4>
                <p className="text-[10px] text-[#717E75] truncate">
                  {folderContextMenu.folder.vibe || 'Smart Workspace'}
                </p>
              </div>
            </div>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: folderContextMenu.folder.color || '#E87A42' }}
            />
          </div>

          {/* Action 1: Mark all as read */}
          <button
            onClick={() => handleMarkAllAsReadAction(folderContextMenu.folder)}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCheck className="w-3.5 h-3.5 text-[#528A4B]" />
              <span>Позначити всі як прочитані</span>
            </div>
            {getFolderUnreadCount(folderContextMenu.folder) > 0 && (
              <span className="px-1.5 py-0.2 bg-[#E87A42] text-white text-[9px] font-extrabold rounded-full">
                {getFolderUnreadCount(folderContextMenu.folder)}
              </span>
            )}
          </button>

          {/* Action: Priority View for this folder */}
          <button
            onClick={() => {
              const f = folderContextMenu.folder;
              setFolderContextMenu(null);
              onSelectFolder(f.id);
              setShowOnlyUnread(true);
              soundFx.playTap();
              showToast(`⚡ Priority View: тільки бесіди з новими в «${f.name}»`);
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#E87A42]" />
              <span>Priority View (тільки нові)</span>
            </div>
            {getFolderUnreadCount(folderContextMenu.folder) > 0 && (
              <span className="px-1.5 py-0.2 bg-[#E87A42] text-white text-[9px] font-extrabold rounded-full">
                {getFolderUnreadCount(folderContextMenu.folder)}
              </span>
            )}
          </button>

          {/* Action: Quick Preview (Last 3 messages from most recent chat) */}
          <button
            onClick={() => handleOpenQuickPreview(folderContextMenu.folder)}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#528A4B]" />
              <span>Швидкий перегляд (3 ост. пов.)</span>
            </div>
            <span className="text-[10px] text-[#717E75] font-mono">
              Останній чат
            </span>
          </button>

          {/* Action 2: Toggle Notifications (Mute / Unmute) */}
          <button
            onClick={() => handleToggleMuteAction(folderContextMenu.folder)}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
          >
            <div className="flex items-center gap-2">
              {folderContextMenu.folder.isMuted ? (
                <Bell className="w-3.5 h-3.5 text-[#528A4B]" />
              ) : (
                <BellOff className="w-3.5 h-3.5 text-[#E87A42]" />
              )}
              <span>
                {folderContextMenu.folder.isMuted
                  ? 'Увімкнути сповіщення (Unmute)'
                  : 'Вимкнути сповіщення (Toggle Notifications)'}
              </span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                folderContextMenu.folder.isMuted
                  ? 'bg-[#8C988E]/15 text-[#717E75]'
                  : 'bg-[#528A4B]/15 text-[#528A4B]'
              }`}
            >
              {folderContextMenu.folder.isMuted ? '🔕 Muted' : '🔔 Active'}
            </span>
          </button>

          {/* Action 3: Set Folder Accent Color (Dedicated Color Picker) */}
          <div className="border-t border-[#F2ECE2] pt-1">
            <button
              onClick={() => {
                setIsColorPaletteOpen(!isColorPaletteOpen);
                setIsVibePaletteOpen(false);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-[#E87A42]" />
                <span>Колірний акцент</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-black/10 shadow-2xs shrink-0"
                  style={{ backgroundColor: folderContextMenu.folder.color || '#E87A42' }}
                />
                <ChevronDown
                  className={`w-3 h-3 text-[#717E75] transition-transform ${
                    isColorPaletteOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {isColorPaletteOpen && (
              <div className="p-2 bg-[#FAF8F3] rounded-xl mt-1 space-y-2 border border-[#EAE0D0] animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#717E75]">
                  <span>Палітра відтінків:</span>
                  <span
                    className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-white border border-[#DFD6C5] font-bold"
                    style={{ color: folderContextMenu.folder.color || '#E87A42' }}
                  >
                    {folderContextMenu.folder.color || '#E87A42'}
                  </span>
                </div>

                {/* Color swatches */}
                <div className="grid grid-cols-4 gap-1.5">
                  {colorPalette.map((c) => {
                    const isSelected = folderContextMenu.folder.color === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => handleSetColorAction(folderContextMenu.folder, c.hex)}
                        className={`h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-[#1F2521] scale-105 shadow-xs font-bold text-white'
                            : 'hover:scale-105 hover:shadow-2xs'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#EAE0D0]">
                  <label
                    htmlFor="folder-custom-color"
                    className="text-[10px] font-bold text-[#5E6B62] flex items-center gap-1 cursor-pointer flex-1"
                  >
                    <Pipette className="w-3 h-3 text-[#717E75]" />
                    <span>Свій відтінок:</span>
                  </label>
                  <input
                    id="folder-custom-color"
                    type="color"
                    value={folderContextMenu.folder.color || '#E87A42'}
                    onChange={(e) => handleSetColorAction(folderContextMenu.folder, e.target.value)}
                    className="w-8 h-6 p-0 border border-[#DFD6C5] rounded-md cursor-pointer bg-transparent"
                    title="Обрати довільний колір"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action 4: Set Folder Vibe Presets */}
          <div>
            <button
              onClick={() => {
                setIsVibePaletteOpen(!isVibePaletteOpen);
                setIsColorPaletteOpen(false);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#528A4B]" />
                <span>Налаштувати Vibe</span>
              </div>
              <ChevronDown
                className={`w-3 h-3 text-[#717E75] transition-transform ${
                  isVibePaletteOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isVibePaletteOpen && (
              <div className="p-2 bg-[#FAF8F3] rounded-xl mt-1 space-y-2 border border-[#EAE0D0] animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Vibe Presets */}
                <div>
                  <label className="block text-[10px] font-bold text-[#717E75] mb-1">
                    Швидкі пресети:
                  </label>
                  <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                    {vibePresets.map((v) => (
                      <button
                        key={v}
                        onClick={() => handleSetVibeAction(folderContextMenu.folder, v)}
                        className="text-left text-[11px] px-2 py-1 bg-white hover:bg-[#F2ECE2] rounded-lg text-[#1F2521] font-medium truncate transition-colors border border-[#DFD6C5]"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Vibe text input */}
                <div className="flex gap-1 pt-1">
                  <input
                    type="text"
                    value={customVibeInput}
                    onChange={(e) => setCustomVibeInput(e.target.value)}
                    placeholder="Власний vibe..."
                    className="flex-1 px-2 py-1 text-[11px] bg-white border border-[#DFD6C5] rounded-lg text-[#1F2521] placeholder-[#8C988E] focus:outline-none focus:border-[#E87A42]"
                  />
                  <button
                    onClick={() => handleSetVibeAction(folderContextMenu.folder, customVibeInput)}
                    disabled={!customVibeInput.trim()}
                    className="px-2 py-1 bg-[#E87A42] hover:bg-[#D46B35] disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-colors"
                  >
                    ОК
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action: Choose Folder Icon & Emoji */}
          <button
            onClick={() => {
              const f = folderContextMenu.folder;
              setFolderContextMenu(null);
              setIconPickerFolder(f);
              soundFx.playTap();
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Smile className="w-3.5 h-3.5 text-[#E87A42]" />
              <span>Змінити іконку / Emoji</span>
            </div>
            <span className="text-xs font-bold px-1.5 py-0.2 rounded bg-[#F0E8DC] border border-[#DFD6C5]">
              {folderContextMenu.folder.emoji}
            </span>
          </button>

          {/* Action: View Folder Insights */}
          <button
            onClick={() => {
              const f = folderContextMenu.folder;
              setFolderContextMenu(null);
              setInsightsFolder(f);
              soundFx.playTap();
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Аналітика простору (Insights)</span>
            </div>
            <span className="text-[10px] text-[#7C3AED] font-mono font-bold bg-[#7C3AED]/10 px-1.5 py-0.2 rounded">
              30 днів
            </span>
          </button>

          {/* Action: Copy Folder Link (Deep Link) */}
          <button
            onClick={() => handleCopyFolderLinkAction(folderContextMenu.folder)}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Копіювати посилання (Copy Link)</span>
            </div>
            <span className="text-[10px] text-[#2563EB] font-mono font-bold bg-[#2563EB]/10 px-1.5 py-0.2 rounded">
              Deep Link
            </span>
          </button>

          {/* Action: Share Folder */}
          <button
            onClick={() => {
              const f = folderContextMenu.folder;
              setFolderContextMenu(null);
              setSharingFolder(f);
              soundFx.playTap();
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-[#E87A42]" />
              <span>Поділитися папкою (Share)</span>
            </div>
            <span className="text-[10px] text-[#717E75] font-mono">
              Посилання
            </span>
          </button>

          {/* Action: Archive / Restore Folder */}
          <button
            onClick={() => handleToggleArchiveAction(folderContextMenu.folder)}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
          >
            <div className="flex items-center gap-2">
              {folderContextMenu.folder.isArchived ? (
                <ArchiveRestore className="w-3.5 h-3.5 text-[#528A4B]" />
              ) : (
                <Archive className="w-3.5 h-3.5 text-[#8C461A]" />
              )}
              <span>
                {folderContextMenu.folder.isArchived
                  ? 'Розархівувати простір'
                  : 'Архівувати простір (Archive Folder)'}
              </span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                folderContextMenu.folder.isArchived
                  ? 'bg-[#528A4B]/15 text-[#528A4B]'
                  : 'bg-[#8C461A]/10 text-[#8C461A]'
              }`}
            >
              {folderContextMenu.folder.isArchived ? 'Відновити' : 'В архів'}
            </span>
          </button>

          {/* Action: Export Chat List as JSON */}
          <button
            onClick={() => handleExportChatListAction(folderContextMenu.folder)}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center justify-between text-[#1F2521] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-[#528A4B]" />
              <span>Експорт списку чатів (.json)</span>
            </div>
            <span className="text-[10px] text-[#528A4B] font-mono font-bold bg-[#528A4B]/10 px-1.5 py-0.2 rounded">
              JSON
            </span>
          </button>

          {/* Action 4: Rename Folder (Inline overlay) */}
          <button
            onClick={() => handleStartRename(folderContextMenu.folder)}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center gap-2 text-[#1F2521] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-[#E87A42]" />
            <span>Перейменувати</span>
          </button>

          {/* Action 5: Edit Folder */}
          <button
            onClick={() => {
              const f = folderContextMenu.folder;
              setFolderContextMenu(null);
              onOpenEditFolder(f);
            }}
            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center gap-2 text-[#1F2521] transition-colors"
          >
            <FolderEdit className="w-3.5 h-3.5 text-[#717E75]" />
            <span>Налаштувати простір...</span>
          </button>

          {/* Action 5 & 6 (Clear / Delete for custom folders) */}
          {!folderContextMenu.folder.isBuiltIn && (
            <div className="border-t border-[#F2ECE2] pt-1 space-y-0.5">
              <button
                onClick={() => handleClearFolderAction(folderContextMenu.folder)}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#FAF5ED] text-left text-xs font-semibold flex items-center gap-2 text-[#717E75] hover:text-[#1F2521] transition-colors"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Очистити чати з папки</span>
              </button>

              <button
                onClick={() => handleDeleteFolderAction(folderContextMenu.folder)}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-red-50 text-left text-xs font-semibold flex items-center gap-2 text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Видалити папку</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 8. QUICK PREVIEW FLOATING CARD (Last 3 messages from most recent chat) */}
      {quickPreview && (
        <div
          ref={quickPreviewRef}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-80 sm:w-88 bg-[#FAF8F3]/98 backdrop-blur-md border border-[#D8CEBC] rounded-2xl shadow-2xl p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-200 text-[#1F2521]"
          style={{
            top: quickPreview.y,
            left: quickPreview.x,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-[#EAE0D0] pb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={quickPreview.chat.avatar}
                alt={quickPreview.chat.title}
                className="w-8 h-8 rounded-xl object-cover ring-1 ring-[#D8CEBC] shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs text-[#1F2521] truncate">
                    {quickPreview.chat.title}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#F1E9DC] text-[#6F7C73] font-bold rounded-md shrink-0">
                    {quickPreview.folder.emoji} {quickPreview.folder.name}
                  </span>
                </div>
                <p className="text-[10px] text-[#717E75] truncate">
                  {quickPreview.chat.description || quickPreview.chat.topic || 'Остання активність у просторі'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setQuickPreview(null)}
              className="p-1 hover:bg-[#EAE0D0] rounded-lg text-[#717E75] hover:text-[#1F2521] transition-colors shrink-0"
              title="Закрити"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Last 3 Messages Container */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {quickPreview.messages.map((msg, index) => {
              const isSelf = msg.isSelf || msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id || index}
                  className={`flex items-start gap-1.5 text-xs ${isSelf ? 'flex-row-reverse' : ''}`}
                >
                  {!isSelf && (
                    <img
                      src={msg.senderAvatar || quickPreview.chat.avatar}
                      alt={msg.senderName}
                      className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                    />
                  )}
                  <div
                    className={`rounded-xl px-2.5 py-1.5 max-w-[85%] space-y-0.5 ${
                      isSelf
                        ? 'bg-[#E87A42] text-white rounded-tr-xs'
                        : 'bg-white border border-[#E8DFD1] text-[#1F2521] rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {!isSelf && (
                      <span className="font-extrabold text-[10px] text-[#528A4B] block leading-none">
                        {msg.senderName}
                      </span>
                    )}
                    <p className="text-xs break-words line-clamp-3 leading-relaxed">
                      {msg.text || (msg.mediaUrl ? '📎 Вкладення' : msg.voiceDuration ? '🎤 Голосове' : 'Повідомлення')}
                    </p>
                    <span
                      className={`text-[9px] block text-right font-mono ${
                        isSelf ? 'text-white/80' : 'text-[#8C988E]'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-[#EAE0D0] flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-[#717E75] flex items-center gap-1">
              <Eye className="w-3 h-3 text-[#E87A42]" />
              <span>Швидкий перегляд</span>
            </span>

            <button
              onClick={() => {
                onSelectFolder(quickPreview.folder.id);
                onSelectChat(quickPreview.chat.id);
                setQuickPreview(null);
                soundFx.playTap();
              }}
              className="px-3 py-1.5 bg-[#1F2521] hover:bg-[#333C35] text-[#FAF8F3] font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Відкрити чат</span>
              <MoveRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 9. Share Folder Modal */}
      {sharingFolder && (
        <ShareFolderModal
          isOpen={!!sharingFolder}
          onClose={() => setSharingFolder(null)}
          folder={sharingFolder}
          chats={chats}
          onSendToChat={(folder) => {
            showToast(`🚀 Запрошення у «${folder.name}» надіслано в активний чат!`);
          }}
        />
      )}

      {/* 10. Folder Insights Modal (30-day message frequency chart) */}
      {insightsFolder && (
        <FolderInsightsModal
          isOpen={!!insightsFolder}
          onClose={() => setInsightsFolder(null)}
          folder={insightsFolder}
          chats={chats}
        />
      )}

      {/* 11. Folder Icon & Emoji Picker Modal */}
      {iconPickerFolder && (
        <FolderIconPickerModal
          isOpen={!!iconPickerFolder}
          onClose={() => setIconPickerFolder(null)}
          folder={iconPickerFolder}
          onSelectIcon={(folderId, emoji) => {
            if (onSetFolderIcon) {
              onSetFolderIcon(folderId, emoji);
            }
            showToast(`✨ Іконку простору оновлено на ${emoji}`);
          }}
        />
      )}

      {/* 7.5 ARCHIVED SMART FOLDERS SECTION (Dimmed Appearance at Bottom of Sidebar) */}
      {smartFolders.some((f) => f.isArchived) && (
        <div className="border-t border-[#E5DAC8] bg-[#EFE7D8]/85 p-2 space-y-1.5 transition-colors">
          <button
            type="button"
            onClick={() => {
              soundFx.playTap();
              setIsArchiveSectionExpanded(!isArchiveSectionExpanded);
            }}
            className="w-full flex items-center justify-between text-xs font-bold text-[#717E75] hover:text-[#1F2521] px-1.5 py-1 rounded-lg hover:bg-white/40 transition-colors select-none"
          >
            <div className="flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-[#8C461A]" />
              <span>Архів просторів</span>
              <span className="px-1.5 py-0.2 bg-[#DFD6C5] text-[#5E6B62] rounded-full text-[10px] font-extrabold">
                {smartFolders.filter((f) => f.isArchived).length}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#717E75] transition-transform duration-200 ${
                isArchiveSectionExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isArchiveSectionExpanded && (
            <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {smartFolders
                .filter((f) => f.isArchived)
                .map((folder) => {
                  const isActive = activeFolderId === folder.id;
                  const folderUnread = getFolderUnreadCount(folder);

                  return (
                    <div
                      key={folder.id}
                      onContextMenu={(e) => openFolderContextMenu(e, folder)}
                      onClick={() => {
                        soundFx.playTap();
                        onSelectFolder(folder.id);
                      }}
                      className={`smart-folder-item group px-2.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs whitespace-nowrap border transition-all select-none opacity-60 hover:opacity-100 filter grayscale-40 hover:grayscale-0 ${
                        isActive
                          ? 'bg-white text-[#1F2521] font-bold shadow-xs border-[#C9BFA8] ring-1 ring-[#8C988E]'
                          : 'bg-white/45 text-[#717E75] hover:bg-white/90 border-dashed border-[#D2C5B2]'
                      }`}
                      title={`Архівований простір: «${folder.name}» (правий клік для опцій / розархівації)`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFx.playTap();
                          setIconPickerFolder(folder);
                        }}
                        title={
                          chats.filter((c) => isChatInFolder(c, folder)).length === 0
                            ? `Порожній простір (0 чатів)`
                            : `Змінити іконку`
                        }
                        className={`w-4.5 h-4.5 rounded-md flex items-center justify-center text-xs shrink-0 bg-[#E8DFD1]/60 text-[#717E75] hover:scale-110 transition-all ${
                          chats.filter((c) => isChatInFolder(c, folder)).length === 0
                            ? 'opacity-35 hover:opacity-80 grayscale-50'
                            : 'opacity-100'
                        }`}
                      >
                        {folder.emoji}
                      </button>
                      <span className="truncate max-w-24 line-through decoration-[#8C988E]/70">
                        {folder.name}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#DFD6C5]/70 text-[#717E75] font-mono font-bold">
                        Архів
                      </span>
                      {folderUnread > 0 && (
                        <span className="px-1.5 py-0.2 bg-[#8C988E] text-white text-[9px] font-bold rounded-full">
                          {folderUnread}
                        </span>
                      )}

                      {/* Explicit Folder Settings / Context Menu Trigger Button */}
                      <button
                        type="button"
                        data-action="folder-settings"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFx.playTap();
                          openFolderContextMenu(e, folder);
                        }}
                        className="folder-settings opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#DFD6C5] rounded-md text-[#717E75] hover:text-[#1F2521] transition-all cursor-pointer hover:scale-110 active:scale-95 ml-0.5"
                        title="Налаштування та опції архівованого простору"
                        aria-label="folder-settings"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 8. Bottom Multi-Sphere Persona Panel */}
      <div className="p-2.5 border-t border-[#E8DFD1] bg-[#F5EFE4] relative">
        {/* Persona quick switcher popup */}
        {isPersonaMenuOpen && onSwitchPersonaSphere && (
          <div className="absolute bottom-full left-2 right-2 mb-2 p-2 bg-white border border-[#DFD6C5] rounded-2xl shadow-xl z-30 space-y-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-1 text-[10px] font-extrabold text-[#717E75] uppercase tracking-wider">
              Перемкнути активну ідентичність
            </div>
            {(['work', 'personal', 'creative', 'family'] as PersonaSphere[]).map((sphere) => {
              const meta = sphereLabels[sphere];
              const isSelected = activeSphere === sphere;
              return (
                <button
                  key={sphere}
                  onClick={() => {
                    soundFx.playTap();
                    onSwitchPersonaSphere(sphere);
                    setIsPersonaMenuOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-colors ${
                    isSelected ? 'bg-[#1F2521] text-white' : 'hover:bg-[#FAF8F3] text-[#1F2521]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </div>
                  <span className={`text-[10px] ${isSelected ? 'text-[#D5DDD7]' : 'text-[#717E75]'}`}>
                    {currentUser.personas?.[sphere]?.statusText || 'В мережі'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Main user clickable card */}
          <div
            onClick={() => {
              soundFx.playTap();
              onOpenUserProfile();
            }}
            className="flex-1 p-2 bg-white hover:bg-[#FAF6EE] border border-[#DFD6C5] rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-2xs group min-w-0"
            title="Відкрити картку профілю"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-white"
                />
                <span className="absolute -bottom-1 -right-1 text-[10px]">
                  {currentUser.statusEmoji}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs text-[#1F2521] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span
                    className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-md uppercase"
                    style={{
                      backgroundColor: sphereLabels[activeSphere].bg,
                      color: sphereLabels[activeSphere].color,
                    }}
                  >
                    {activeSphere}
                  </span>
                </div>
                <p className="text-[10px] text-[#717E75] truncate">
                  {currentUser.status}
                </p>
              </div>
            </div>
          </div>

          {/* Quick sphere toggle button */}
          <button
            onClick={() => {
              soundFx.playTap();
              setIsPersonaMenuOpen(!isPersonaMenuOpen);
            }}
            className="p-2 bg-white hover:bg-[#FAF6EE] border border-[#DFD6C5] rounded-2xl text-[#4A574E] hover:text-[#1F2521] shadow-2xs transition-colors shrink-0"
            title="Швидка зміна сфери"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isPersonaMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </aside>
  );
};
