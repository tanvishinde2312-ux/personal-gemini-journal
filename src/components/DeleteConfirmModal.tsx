import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3a36]/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-[#faf8f5] border border-[#e5e0d8] rounded-2xl shadow-xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#9c6657]/15 border border-[#9c6657]/25 text-[#9c6657] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#3d3a36] font-serif">
              Delete Reflection Entry?
            </h2>
            <p className="text-xs text-[#78716c] mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#4d4842] mt-4 p-3 rounded-xl bg-white border border-[#e5e0d8] shadow-2xs leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-[#3d3a36]">"{title || 'Untitled Entry'}"</span> from your Firestore vault?
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-[#dcd6cb] bg-white text-[#3d3a36] hover:bg-[#ede7dd] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-[#9c6657] hover:bg-[#855346] active:bg-[#704237] text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Entry'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
