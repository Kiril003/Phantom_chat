import React, { useState } from 'react';
import { Trash2, X, AlertTriangle, User, Users } from 'lucide-react';
import { soundFx } from '../utils/sound';

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (deleteForEveryone: boolean) => void;
  isSelfMessage: boolean;
  messageTextPreview?: string;
}

export const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  isSelfMessage,
  messageTextPreview,
}) => {
  const [deleteForEveryone, setDeleteForEveryone] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    soundFx.playTap();
    onConfirmDelete(deleteForEveryone);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#FAF8F3] border border-[#DFD6C5] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon & Title */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 bg-red-100 text-red-600 rounded-2xl shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-[#1F2521]">Видалити повідомлення?</h3>
            <p className="text-xs text-[#717E75] mt-0.5">Цю дію неможливо буде скасувати.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#EFE7D8] text-[#717E75] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message preview snippet */}
        {messageTextPreview && (
          <div className="p-2.5 bg-white border border-[#DFD6C5] rounded-xl text-xs text-[#556157] mb-4 truncate italic">
            «{messageTextPreview}»
          </div>
        )}

        {/* Choice: For Me vs For Everyone (if self message) */}
        {isSelfMessage && (
          <div className="space-y-2 mb-4">
            <label
              onClick={() => setDeleteForEveryone(true)}
              className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                deleteForEveryone
                  ? 'bg-white border-[#E87A42] ring-1 ring-[#E87A42]'
                  : 'bg-[#F2EDE4] border-[#DFD6C5] hover:bg-[#ECE5D7]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                deleteForEveryone ? 'border-[#E87A42] bg-[#E87A42]' : 'border-[#8C988E]'
              }`}>
                {deleteForEveryone && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-[#1F2521] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#E87A42]" />
                  <span>Видалити для всіх учасників</span>
                </p>
                <p className="text-[11px] text-[#717E75]">Повідомлення зникне з історії для кожного</p>
              </div>
            </label>

            <label
              onClick={() => setDeleteForEveryone(false)}
              className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                !deleteForEveryone
                  ? 'bg-white border-[#E87A42] ring-1 ring-[#E87A42]'
                  : 'bg-[#F2EDE4] border-[#DFD6C5] hover:bg-[#ECE5D7]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                !deleteForEveryone ? 'border-[#E87A42] bg-[#E87A42]' : 'border-[#8C988E]'
              }`}>
                {!deleteForEveryone && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-[#1F2521] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#717E75]" />
                  <span>Видалити тільки для мене</span>
                </p>
                <p className="text-[11px] text-[#717E75]">Залишиться в історії інших співрозмовників</p>
              </div>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFD6C5]">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 hover:bg-[#EFE8DA] text-[#556157] font-semibold text-xs rounded-xl transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
};
