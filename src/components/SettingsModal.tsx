import React, { useState } from 'react';
import {
  X,
  Volume2,
  Bell,
  Eye,
  Shield,
  Palette,
  Download,
  Trash2,
  Check,
  Smartphone,
  Sparkles,
  Type
} from 'lucide-react';
import { soundFx } from '../utils/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onExportAllData: () => void;
  onClearHistory?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isSoundEnabled,
  onToggleSound,
  onExportAllData,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'privacy' | 'data'>('appearance');
  const [accentColor, setAccentColor] = useState<'terracotta' | 'sage' | 'chestnut' | 'amber'>('terracotta');
  const [fontSize, setFontSize] = useState<'standard' | 'large'>('standard');
  const [desktopNotifs, setDesktopNotifs] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeenVisible, setLastSeenVisible] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAF8F3] border border-[#DCD3C1] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8DFD1] flex items-center justify-between bg-[#F5EFE4]">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base text-[#1F2521]">Налаштування Aura</h3>
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

        {/* Tab Selection */}
        <div className="px-4 py-2 bg-[#F0EAE0] border-b border-[#E2D8C7] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'appearance', label: 'Оформлення', icon: Palette },
            { id: 'notifications', label: 'Сповіщення & Звук', icon: Bell },
            { id: 'privacy', label: 'Приватність', icon: Shield },
            { id: 'data', label: 'Дані & Резерв', icon: Download },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  soundFx.playTap();
                  setActiveTab(t.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1F2521] text-white shadow-2xs'
                    : 'bg-white/70 hover:bg-white text-[#4A574E] border border-[#DFD6C5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#445047] mb-2">
                  Колірний акцент інтерфейсу
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'terracotta', label: 'Тепла теракота', color: '#E87A42' },
                    { id: 'sage', label: 'Оливкова шавлія', color: '#528A4B' },
                    { id: 'chestnut', label: 'Каштан та горіх', color: '#8C461A' },
                    { id: 'amber', label: 'Золотистий бурштин', color: '#D99026' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        soundFx.playTap();
                        setAccentColor(c.id as any);
                      }}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                        accentColor === c.id
                          ? 'bg-white border-[#1F2521] shadow-xs'
                          : 'bg-white/60 border-[#DFD6C5] hover:bg-white'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shadow-2xs shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-xs font-bold text-[#1F2521]">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#445047] mb-2">
                  Розмір шрифту
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      soundFx.playTap();
                      setFontSize('standard');
                    }}
                    className={`p-2.5 rounded-2xl text-xs font-bold border transition-all ${
                      fontSize === 'standard'
                        ? 'bg-[#1F2521] text-white'
                        : 'bg-white text-[#525E55] border-[#DFD6C5]'
                    }`}
                  >
                    Стандартний (14px)
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playTap();
                      setFontSize('large');
                    }}
                    className={`p-2.5 rounded-2xl text-xs font-bold border transition-all ${
                      fontSize === 'large'
                        ? 'bg-[#1F2521] text-white'
                        : 'bg-white text-[#525E55] border-[#DFD6C5]'
                    }`}
                  >
                    Збільшений (16px)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS & SOUND */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-white border border-[#DFD6C5] rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <p className="font-bold text-xs text-[#1F2521]">Тактильний звуковий відгук</p>
                  <p className="text-[11px] text-[#717E75]">Звуки відправки, кліків, вибору та дзвінків</p>
                </div>
                <button
                  onClick={() => {
                    soundFx.playTap();
                    onToggleSound();
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    isSoundEnabled ? 'bg-[#E87A42]' : 'bg-[#D6CDC0]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      isSoundEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3.5 bg-white border border-[#DFD6C5] rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <p className="font-bold text-xs text-[#1F2521]">Сповіщення на робочому столі</p>
                  <p className="text-[11px] text-[#717E75]">Показувати спливаючі банери при нових повідомленнях</p>
                </div>
                <button
                  onClick={() => {
                    soundFx.playTap();
                    setDesktopNotifs(!desktopNotifs);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    desktopNotifs ? 'bg-[#E87A42]' : 'bg-[#D6CDC0]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      desktopNotifs ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-white border border-[#DFD6C5] rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <p className="font-bold text-xs text-[#1F2521]">Звіти про прочитання</p>
                  <p className="text-[11px] text-[#717E75]">Співрозмовники бачать подвійні галочки</p>
                </div>
                <button
                  onClick={() => {
                    soundFx.playTap();
                    setReadReceipts(!readReceipts);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    readReceipts ? 'bg-[#E87A42]' : 'bg-[#D6CDC0]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      readReceipts ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3.5 bg-white border border-[#DFD6C5] rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <p className="font-bold text-xs text-[#1F2521]">Статус онлайн та час останнього візиту</p>
                  <p className="text-[11px] text-[#717E75]">Дозволити контактам бачити вашу активність</p>
                </div>
                <button
                  onClick={() => {
                    soundFx.playTap();
                    setLastSeenVisible(!lastSeenVisible);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    lastSeenVisible ? 'bg-[#E87A42]' : 'bg-[#D6CDC0]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      lastSeenVisible ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DATA & BACKUP */}
          {activeTab === 'data' && (
            <div className="space-y-3">
              <div className="p-4 bg-white border border-[#DFD6C5] rounded-2xl space-y-2 shadow-2xs">
                <p className="font-bold text-xs text-[#1F2521]">Експорт даних та історії</p>
                <p className="text-[11px] text-[#717E75]">
                  Завантажте всі ваші бесіди, таблиці, графіки та конспекти у структурованому JSON-архіві.
                </p>
                <button
                  onClick={() => {
                    soundFx.playTap();
                    onExportAllData();
                  }}
                  className="px-3.5 py-2 bg-[#FCE7D8] hover:bg-[#F9CCA8] text-[#8C461A] font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Експортувати повний бекап (.json)</span>
                </button>
              </div>

              {onClearHistory && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2">
                  <p className="font-bold text-xs text-red-800">Очищення локальної пам’яті</p>
                  <p className="text-[11px] text-red-600">
                    Скинути історію поточного чату до початкового стану.
                  </p>
                  <button
                    onClick={() => {
                      soundFx.playTap();
                      if (confirm('Справді очистити історію?')) {
                        onClearHistory();
                        onClose();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Очистити історію</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
