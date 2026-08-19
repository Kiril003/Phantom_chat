import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Users,
  Shield,
  Layers,
  Link,
  Sparkles,
  MessageSquare,
  Send,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Chat, SmartFolder } from '../types';
import { soundFx } from '../utils/sound';

interface ShareFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: SmartFolder | null;
  chats: Chat[];
  onSendToChat?: (folder: SmartFolder, inviteUrl: string) => void;
}

export const ShareFolderModal: React.FC<ShareFolderModalProps> = ({
  isOpen,
  onClose,
  folder,
  chats,
  onSendToChat,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [allowJoinAll, setAllowJoinAll] = useState(true);
  const [autoSyncTopics, setAutoSyncTopics] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [tokenSeed, setTokenSeed] = useState(() => Math.random().toString(36).substring(2, 9));

  if (!isOpen || !folder) return null;

  // Filter chats belonging to this folder
  const folderChats = chats.filter((c) => {
    if (folder.id === 'all') return true;
    if (folder.chatIds && folder.chatIds.includes(c.id)) return true;
    if (
      folder.filterRules?.includeCircles &&
      folder.filterRules.includeCircles.includes(c.circle)
    ) {
      return true;
    }
    return false;
  });

  const inviteUrl = `https://aura.chat/folder/${folder.id}-${tokenSeed}?join=1`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    soundFx.playSend();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerate = () => {
    soundFx.playTap();
    setTokenSeed(Math.random().toString(36).substring(2, 9));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#FAF8F3] border border-[#DFD6C5] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#1F2521] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#EAE0D0] bg-[#F6EFE3] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-2xs shrink-0"
              style={{
                backgroundColor: folder.color ? `${folder.color}25` : '#F1E9DC',
                border: folder.color ? `1px solid ${folder.color}45` : '1px solid #D8CEBC',
              }}
            >
              <span>{folder.emoji}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-[#1F2521] truncate">
                  {folder.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-white text-[#5E6B62] font-bold rounded-full border border-[#DFD6C5]">
                  Поділитися
                </span>
              </div>
              <p className="text-[11px] text-[#717E75] truncate">
                {folder.vibe || 'Спільна структура чатів та каналів'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTap();
              onClose();
            }}
            className="p-1.5 hover:bg-[#EAE0D0] rounded-xl text-[#717E75] hover:text-[#1F2521] transition-colors"
            title="Закрити"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* 1. Invite Link Box */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-[#5E6B62] uppercase tracking-wider">
              Унікальне посилання для запрошення
            </label>
            <div className="flex items-center gap-1.5 p-1.5 bg-white border border-[#DFD6C5] rounded-2xl shadow-2xs">
              <Link className="w-4 h-4 text-[#8C988E] ml-1.5 shrink-0" />
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 bg-transparent text-xs font-mono text-[#1F2521] focus:outline-none truncate px-1"
              />
              <button
                onClick={handleRegenerate}
                className="p-1.5 hover:bg-[#F6EFE3] text-[#717E75] hover:text-[#1F2521] rounded-xl transition-colors shrink-0"
                title="Оновити посилання"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                  copied
                    ? 'bg-[#528A4B] text-white shadow-2xs'
                    : 'bg-[#E87A42] hover:bg-[#D46B35] text-white shadow-2xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Скопійовано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Копіювати</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. QR Code Toggle & Preview */}
          <div className="bg-white border border-[#DFD6C5] rounded-2xl p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#1F2521]">
                <QrCode className="w-4 h-4 text-[#E87A42]" />
                <span>QR-код для мобільних пристроїв</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFx.playTap();
                  setShowQr(!showQr);
                }}
                className="text-[11px] font-extrabold text-[#E87A42] hover:underline"
              >
                {showQr ? 'Сховати' : 'Показати'}
              </button>
            </div>

            {showQr && (
              <div className="pt-2 flex flex-col items-center justify-center gap-2 border-t border-[#F2ECE2] animate-in fade-in duration-150">
                <div className="p-3 bg-white border-2 border-[#1F2521] rounded-2xl shadow-sm flex items-center justify-center">
                  {/* Stylized QR Code Graphic */}
                  <div className="w-36 h-36 bg-[#FAF8F3] border border-[#DFD6C5] rounded-xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    <div className="grid grid-cols-6 gap-1 w-full h-full opacity-80">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-xs ${
                            (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                              ? 'bg-[#1F2521]'
                              : i % 5 === 0
                              ? 'bg-[#E87A42]'
                              : 'bg-[#D8CEBC]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-xl bg-white border border-[#DFD6C5] flex items-center justify-center shadow-md text-sm">
                        {folder.emoji}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-[#717E75] text-center">
                  Відскануйте камерою телефону для автоматичного імпорту простору
                </p>
              </div>
            )}
          </div>

          {/* 3. Included Chats & Topics Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#5E6B62] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#717E75]" />
                <span>Чати у структурі ({folderChats.length})</span>
              </label>
              <span className="text-[10px] text-[#717E75]">
                Всі учасники отримають доступ
              </span>
            </div>

            <div className="bg-white border border-[#DFD6C5] rounded-2xl p-2 max-h-36 overflow-y-auto space-y-1 shadow-2xs">
              {folderChats.length === 0 ? (
                <div className="py-3 text-center text-[#8C988E] text-[11px]">
                  У цій папці поки немає чатів
                </div>
              ) : (
                folderChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-1.5 rounded-xl hover:bg-[#FAF8F3] flex items-center justify-between gap-2 transition-colors border border-transparent hover:border-[#EAE0D0]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={chat.avatar}
                        alt={chat.title}
                        className="w-6 h-6 rounded-lg object-cover ring-1 ring-[#DFD6C5] shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-[#1F2521] truncate">
                          {chat.title}
                        </h4>
                        <span className="text-[9px] text-[#717E75] truncate block">
                          {chat.topic || chat.customVibe || 'Чат спільноти'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] px-1.5 py-0.2 bg-[#F6EFE3] text-[#5E6B62] rounded font-medium shrink-0">
                      {chat.type === 'dm' ? 'Особистий' : 'Група'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. Permissions & Rules */}
          <div className="bg-white border border-[#DFD6C5] rounded-2xl p-3 space-y-2.5 shadow-2xs">
            <div className="text-[11px] font-bold text-[#5E6B62] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#528A4B]" />
              <span>Параметри запрошення</span>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowJoinAll}
                onChange={(e) => setAllowJoinAll(e.target.checked)}
                className="mt-0.5 rounded text-[#E87A42] focus:ring-[#E87A42]"
              />
              <div>
                <span className="font-bold text-xs text-[#1F2521] block">
                  Автоматичний вступ до всіх чатів папки
                </span>
                <span className="text-[10px] text-[#717E75]">
                  Усі користувачі за посиланням одразу додаються до списку учасників.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSyncTopics}
                onChange={(e) => setAutoSyncTopics(e.target.checked)}
                className="mt-0.5 rounded text-[#E87A42] focus:ring-[#E87A42]"
              />
              <div>
                <span className="font-bold text-xs text-[#1F2521] block">
                  Синхронізація майбутніх тем & каналів
                </span>
                <span className="text-[10px] text-[#717E75]">
                  Нові чати, додані у цю папку пізніше, автоматично зʼявляться у підписників.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-[#EAE0D0] bg-[#F6EFE3] flex items-center justify-between gap-2">
          {onSendToChat && (
            <button
              onClick={() => {
                soundFx.playSend();
                onSendToChat(folder, inviteUrl);
                onClose();
              }}
              className="px-3.5 py-2 bg-white hover:bg-[#FAF8F3] text-[#1F2521] border border-[#DFD6C5] rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5 text-[#E87A42]" />
              <span>Надіслати у чат</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                soundFx.playTap();
                onClose();
              }}
              className="px-3.5 py-2 hover:bg-[#EAE0D0] text-[#5E6B62] rounded-xl font-bold text-xs transition-colors"
            >
              Закрити
            </button>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-[#1F2521] hover:bg-[#333C35] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопійовано!' : 'Копіювати посилання'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
