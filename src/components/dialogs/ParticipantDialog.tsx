import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Participant } from '../../types';
import { DEFAULT_AVATAR_COLORS } from '../../hooks/useRoomStore';
import { useI18n } from '../../i18n/I18nContext';
import { cn } from '../../utils/cn';

export interface ParticipantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddParticipant: (participant: { name: string; avatarColor: string }) => void | Promise<any>;
  existingParticipants?: Participant[];
}

export const ParticipantDialog: React.FC<ParticipantDialogProps> = ({
  isOpen,
  onClose,
  onAddParticipant,
  existingParticipants = [],
}) => {
  const { t } = useI18n();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_AVATAR_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically select next available palette color when dialog opens
  useEffect(() => {
    if (isOpen) {
      const nextIndex = existingParticipants.length % DEFAULT_AVATAR_COLORS.length;
      setSelectedColor(DEFAULT_AVATAR_COLORS[nextIndex]);
      setFirstName('');
      setLastName('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, existingParticipants.length]);

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedFirst = firstName.trim();
    if (!trimmedFirst) {
      setError(t('expense.empty_title_error') || 'Ad daxil edin');
      return;
    }

    // Check if name already exists in room
    const isDuplicate = existingParticipants.some(
      (p) => p.name.trim().toLowerCase() === fullName.toLowerCase()
    );

    if (isDuplicate) {
      setError(t('participant.already_exists'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddParticipant({
        name: fullName,
        avatarColor: selectedColor,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || t('error.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('participant.add_title')}
      description={t('header.add_friend')}
      maxWidth="sm"
      footer={
        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="text"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="filled"
            size="md"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            {t('participant.add_button')}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {/* Live Avatar Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-md-surface-container-high/40 rounded-2xl border border-md-outline/10">
          <Avatar
            name={fullName || '?'}
            color={selectedColor}
            size="xl"
            className="shadow-sm transition-all duration-200"
          />
          <div className="mt-2 text-sm font-semibold text-md-on-surface">
            {fullName || t('participant.name_placeholder')}
          </div>
          <div className="text-xs text-md-on-surface-variant">
            {t('header.my_profile')}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="px-4 py-2.5 rounded-xl bg-md-error-container text-md-on-error-container text-xs font-medium flex items-center gap-2"
          >
            <span>{error}</span>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="participant-first-name"
              className="block text-xs font-semibold text-md-on-surface-variant mb-1.5 uppercase tracking-wider"
            >
              {t('participant.name_label')} *
            </label>
            <input
              id="participant-first-name"
              type="text"
              required
              autoFocus
              placeholder={t('participant.name_placeholder')}
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-4 py-2.5 bg-md-surface-container-highest border border-md-outline/20 rounded-xl text-md-on-surface text-sm placeholder:text-md-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-md-primary transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="participant-last-name"
              className="block text-xs font-semibold text-md-on-surface-variant mb-1.5 uppercase tracking-wider"
            >
              Soyad (İxtiyari)
            </label>
            <input
              id="participant-last-name"
              type="text"
              placeholder="Məs., Əliyev"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-4 py-2.5 bg-md-surface-container-highest border border-md-outline/20 rounded-xl text-md-on-surface text-sm placeholder:text-md-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-md-primary transition-all"
            />
          </div>
        </div>

        {/* Color Palette Selector */}
        <div>
          <label className="block text-xs font-semibold text-md-on-surface-variant mb-2 uppercase tracking-wider">
            {t('participant.color_label')}
          </label>
          <div
            className="flex items-center gap-2.5 flex-wrap"
            role="radiogroup"
            aria-label={t('participant.color_label')}
          >
            {DEFAULT_AVATAR_COLORS.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={color}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary',
                    isSelected && 'ring-2 ring-offset-2 ring-md-primary shadow-xs scale-105'
                  )}
                >
                  {isSelected && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Dialog>
  );
};
