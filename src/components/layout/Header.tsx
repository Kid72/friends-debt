import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Check,
  Copy,
  Bell,
  BellOff,
  HelpCircle,
  Plus,
  FolderPlus,
  Coins,
  Users,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import { Participant } from '../../types';
import { useI18n, LanguageSwitcher } from '../../i18n/I18nContext';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { CurrencyDialog } from '../dialogs/CurrencyDialog';
import { HelpDialog } from '../dialogs/HelpDialog';
import { cn } from '../../utils/cn';

export interface HeaderProps {
  roomName?: string;
  roomId?: string;
  currency?: string;
  participants: Participant[];
  activeParticipant: Participant | null;
  onSelectParticipant: (participant: Participant | null) => void;
  onAddParticipant?: () => void;
  onUpdateCurrency?: (currency: string) => void | Promise<any>;
  onOpenHelp?: () => void;
  onEditGroupName?: () => void;
  onCreateNewRoom?: () => void;
  onJoinRoom?: () => void;
  isSyncing?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  roomName,
  roomId,
  currency = '₼',
  participants,
  activeParticipant,
  onSelectParticipant,
  onAddParticipant,
  onUpdateCurrency,
  onOpenHelp,
  onEditGroupName,
  onCreateNewRoom,
  onJoinRoom,
  isSyncing = false,
  className,
}) => {
  const { t } = useI18n();

  // Profile switcher state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Copy link feedback state
  const [copied, setCopied] = useState(false);

  // Currency dialog state
  const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = useState(false);

  // Help modal internal state (used if onOpenHelp is not provided)
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Notification toggle state
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  // Handle 1-tap copy link
  const handleCopyRoomLink = async () => {
    try {
      const url =
        typeof window !== 'undefined'
          ? roomId
            ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
            : window.location.href
          : '';

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  // Handle Notification Toggle
  const handleToggleNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled((prev) => !prev);
    } else if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === 'granted');
      } catch {
        // ignore
      }
    }
  };

  // Handle Help click
  const handleHelpClick = () => {
    if (onOpenHelp) {
      onOpenHelp();
    } else {
      setIsHelpOpen(true);
    }
  };

  // Profile button label: "Mən — [Ad] ▾"
  const profileLabel = activeParticipant
    ? `${t('header.my_profile')} — ${activeParticipant.name}`
    : `${t('header.my_profile')} — ${t('header.all_participants')}`;

  return (
    <header
      className={cn(
        'w-full bg-md-surface/85 backdrop-blur-md sticky top-0 z-30 border-b border-md-outline/10 px-4 py-3 sm:px-6 transition-all duration-200',
        className
      )}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        {/* Top bar: Group title, room code badge & copy link, language & controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left: App/Group Title & Sync Indicator */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onEditGroupName}
              disabled={!onEditGroupName}
              className={cn(
                'text-lg sm:text-xl font-bold tracking-tight text-md-on-surface truncate text-left',
                onEditGroupName && 'hover:text-md-primary transition-colors cursor-pointer'
              )}
            >
              {roomName || t('app.title')}
            </button>

            {isSyncing && (
              <RefreshCw
                className="w-3.5 h-3.5 text-md-primary animate-spin shrink-0"
                aria-label={t('sync.syncing')}
              />
            )}
          </div>

          {/* Right Controls: Room Code Share, Currency, Notifications, Help, Language */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Room Code Badge & 1-tap copy link */}
            {roomId && (
              <button
                type="button"
                onClick={handleCopyRoomLink}
                aria-label={copied ? t('common.copied') : t('header.share_room')}
                title={copied ? t('header.room_copied') : t('header.share_room')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border',
                  copied
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'bg-md-surface-container-high hover:bg-md-surface-container-highest border-md-outline/20 text-md-on-surface'
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('common.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-md-primary" />
                    <span className="font-mono">{roomId}</span>
                  </>
                )}
              </button>
            )}

            {/* Currency Switcher Option */}
            <button
              type="button"
              onClick={() => setIsCurrencyDialogOpen(true)}
              aria-label={t('header.change_currency')}
              title={t('header.change_currency')}
              className="inline-flex items-center justify-center h-8 px-2.5 rounded-full text-xs font-bold bg-md-surface-container-high hover:bg-md-surface-container-highest text-md-on-surface border border-md-outline/15 transition-colors gap-1"
            >
              <Coins className="w-3.5 h-3.5 text-md-primary" />
              <span>{currency}</span>
            </button>

            {/* Notification Toggle Button */}
            <button
              type="button"
              onClick={handleToggleNotifications}
              aria-pressed={notificationsEnabled}
              aria-label={t('header.notifications')}
              title={
                notificationsEnabled
                  ? t('header.notifications_enabled')
                  : t('header.notifications')
              }
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-colors border',
                notificationsEnabled
                  ? 'bg-md-primary/10 border-md-primary text-md-primary'
                  : 'bg-md-surface-container-high hover:bg-md-surface-container-highest border-md-outline/15 text-md-on-surface-variant'
              )}
            >
              {notificationsEnabled ? (
                <Bell className="w-4 h-4 fill-current" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </button>

            {/* Help Button */}
            <button
              type="button"
              onClick={handleHelpClick}
              aria-label={t('header.help')}
              title={t('header.help')}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-md-surface-container-high hover:bg-md-surface-container-highest border border-md-outline/15 text-md-on-surface-variant hover:text-md-on-surface transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>
        </div>

        {/* Bottom Bar: Profile Switcher Dropdown ("Mən — [Ad] ▾") */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-md-outline/10">
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 border',
                isProfileMenuOpen
                  ? 'bg-md-primary text-md-on-primary border-transparent shadow-xs'
                  : 'bg-md-surface-container-highest hover:bg-opacity-80 text-md-on-surface border-md-outline/20'
              )}
            >
              {activeParticipant ? (
                <Avatar
                  name={activeParticipant.name}
                  color={activeParticipant.avatarColor}
                  size="sm"
                  className="w-5 h-5 text-[10px]"
                />
              ) : (
                <Users className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate max-w-[160px] sm:max-w-[200px]">
                {profileLabel}
              </span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200 shrink-0',
                  isProfileMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div
                role="menu"
                aria-label={t('header.select_profile')}
                className="absolute left-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl bg-md-surface-container-low border border-md-outline/20 shadow-lg p-2 z-50 animate-modal-enter text-md-on-surface"
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-md-on-surface-variant uppercase tracking-wider">
                  {t('header.select_profile')}
                </div>

                {/* "Hamı" (All / Overview) Option */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelectParticipant(null);
                    setIsProfileMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors',
                    activeParticipant === null
                      ? 'bg-md-primary/10 text-md-primary font-semibold'
                      : 'hover:bg-md-surface-container-high text-md-on-surface'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-md-surface-container-highest flex items-center justify-center text-md-on-surface">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span>{t('header.all_participants')}</span>
                  </div>
                  {activeParticipant === null && (
                    <Check className="w-4 h-4 text-md-primary" />
                  )}
                </button>

                <div className="my-1 border-t border-md-outline/10" />

                {/* Participants list */}
                {participants.map((participant) => {
                  const isSelected = activeParticipant?.id === participant.id;
                  return (
                    <button
                      key={participant.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSelectParticipant(participant);
                        setIsProfileMenuOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors',
                        isSelected
                          ? 'bg-md-primary/10 text-md-primary font-semibold'
                          : 'hover:bg-md-surface-container-high text-md-on-surface'
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Avatar
                          name={participant.name}
                          color={participant.avatarColor}
                          size="sm"
                          className="w-7 h-7 text-xs"
                        />
                        <span className="truncate">{participant.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-md-primary shrink-0" />}
                    </button>
                  );
                })}

                {/* Add Friend shortcut */}
                {onAddParticipant && (
                  <>
                    <div className="my-1 border-t border-md-outline/10" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onAddParticipant();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-md-primary hover:bg-md-primary/8 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t('header.add_friend')}</span>
                    </button>
                  </>
                )}

                {/* Create New Group shortcut */}
                {onCreateNewRoom && (
                  <>
                    <div className="my-1 border-t border-md-outline/10" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onCreateNewRoom();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-md-on-surface-variant hover:bg-md-surface-container-high transition-colors"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>{t('room.create_new')}</span>
                    </button>
                  </>
                )}

                {/* Join Existing Group shortcut */}
                {onJoinRoom && (
                  <>
                    <div className="my-1 border-t border-md-outline/10" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onJoinRoom();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-md-primary hover:bg-md-primary/8 transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{t('room.join_title')}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Add Friend Button (visible on top row) */}
          {onAddParticipant && (
            <Button
              type="button"
              variant="text"
              size="sm"
              onClick={onAddParticipant}
              leftIcon={<Plus className="w-4 h-4" />}
              className="text-xs"
            >
              {t('header.add_friend')}
            </Button>
          )}
        </div>
      </div>

      {/* Currency Dialog */}
      <CurrencyDialog
        isOpen={isCurrencyDialogOpen}
        onClose={() => setIsCurrencyDialogOpen(false)}
        currentCurrency={currency}
        onSelectCurrency={(selected) => {
          onUpdateCurrency?.(selected);
        }}
      />

      {/* Help Dialog */}
      <HelpDialog
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </header>
  );
};
