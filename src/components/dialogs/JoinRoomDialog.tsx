import React, { useState, useEffect } from 'react';
import { LogIn, History, ArrowRight } from 'lucide-react';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { useI18n } from '../../i18n/I18nContext';
import { getRecentRooms, RecentRoom } from '../../api/storage';

interface JoinRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (roomId: string) => void;
  currentRoomId?: string;
}

export const JoinRoomDialog: React.FC<JoinRoomDialogProps> = ({
  isOpen,
  onClose,
  onJoin,
  currentRoomId,
}) => {
  const { t } = useI18n();
  const [inputVal, setInputVal] = useState('');
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);

  useEffect(() => {
    if (isOpen) {
      setInputVal('');
      const recents = getRecentRooms().filter((r) => r.id !== currentRoomId);
      setRecentRooms(recents);
    }
  }, [isOpen, currentRoomId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    // If user pasted a full URL (e.g. https://domain.com/?room=xyz123)
    let extractedId = trimmed;
    try {
      if (trimmed.includes('room=')) {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        const param = urlObj.searchParams.get('room');
        if (param) extractedId = param;
      }
    } catch {
      // Use as plain ID
    }

    onJoin(extractedId);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t('room.join_title')}>
      <div className="space-y-4 pt-1">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="join-room-input"
              className="block text-xs font-semibold text-md-on-surface-variant uppercase tracking-wider mb-1.5"
            >
              {t('room.join_placeholder')}
            </label>
            <div className="relative">
              <input
                id="join-room-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Məs., adbffda və ya qrup linki"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-md-surface-container border border-md-outline/20 text-md-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-md-primary pr-10"
                autoFocus
                required
              />
              <LogIn className="w-4 h-4 text-md-on-surface-variant absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="text" size="sm" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="filled" size="sm" disabled={!inputVal.trim()}>
              {t('room.join_button')}
            </Button>
          </div>
        </form>

        {/* Recently Visited Rooms (Quick Switch) */}
        {recentRooms.length > 0 && (
          <div className="pt-3 border-t border-md-outline/10 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-md-on-surface-variant uppercase tracking-wider">
              <History className="w-3.5 h-3.5" />
              <span>Son daxil olunan qruplar</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {recentRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    onJoin(room.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-md-surface-container-low hover:bg-md-surface-container-high transition-colors text-left group"
                >
                  <div className="truncate">
                    <div className="text-sm font-semibold text-md-on-surface truncate">
                      {room.name || 'Dostlar'}
                    </div>
                    <div className="text-[11px] text-md-on-surface-variant font-mono">
                      #{room.id}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-md-on-surface-variant group-hover:text-md-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
