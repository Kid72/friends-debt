import React, { useState } from 'react';
import {
  HelpCircle,
  Zap,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Users,
  Receipt,
  Share2,
  MoreVertical,
  Layers,
} from 'lucide-react';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { useI18n } from '../../i18n/I18nContext';
import { cn } from '../../utils/cn';

export interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

type SectionKey = 'how_it_works' | 'simplification' | 'pwa' | 'security';

export const HelpDialog: React.FC<HelpDialogProps> = ({
  isOpen,
  onClose,
  className,
}) => {
  const { t } = useI18n();

  // Track accordion open state (default to how_it_works and simplification expanded)
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    how_it_works: true,
    simplification: true,
    pwa: false,
    security: false,
  });

  const toggleSection = (key: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-md-primary/10 flex items-center justify-center text-md-primary shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold">{t('help.title')}</span>
        </div>
      }
      maxWidth="lg"
      className={className}
      footer={
        <div className="w-full flex justify-end">
          <Button variant="filled" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 py-1 text-sm text-md-on-surface">
        {/* Section 1: "Necə işləyir?" (How it works) */}
        <div className="border border-md-outline/15 rounded-2xl overflow-hidden bg-md-surface-container-high/30 transition-all">
          <button
            type="button"
            onClick={() => toggleSection('how_it_works')}
            aria-expanded={expandedSections.how_it_works}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-semibold text-md-on-surface hover:bg-md-surface-container-high/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-md-primary">
                {t('help.how_it_works_title')}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-md-on-surface-variant transition-transform duration-200',
                expandedSections.how_it_works && 'rotate-180'
              )}
            />
          </button>

          {expandedSections.how_it_works && (
            <div className="px-4 pb-4 pt-1 space-y-3 text-xs sm:text-sm text-md-on-surface-variant">
              <p className="whitespace-pre-line leading-relaxed">
                {t('help.how_it_works_desc')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* Step 1 */}
                <div className="bg-md-surface-container-low rounded-xl p-3 border border-md-outline/10 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-md-primary font-bold text-xs">
                    <Users className="w-3.5 h-3.5" />
                    <span>{t('help.step_1_title')}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-md-on-surface-variant leading-normal">
                    {t('help.step_1_desc')}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-md-surface-container-low rounded-xl p-3 border border-md-outline/10 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-md-primary font-bold text-xs">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{t('help.step_2_title')}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-md-on-surface-variant leading-normal">
                    {t('help.step_2_desc')}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-md-surface-container-low rounded-xl p-3 border border-md-outline/10 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('help.step_3_title')}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-md-on-surface-variant leading-normal">
                    {t('help.step_3_desc')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: "Borcların схлопывание-si nədir?" (Debt Simplification) */}
        <div className="border border-md-outline/15 rounded-2xl overflow-hidden bg-md-surface-container-high/30 transition-all">
          <button
            type="button"
            onClick={() => toggleSection('simplification')}
            aria-expanded={expandedSections.simplification}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-semibold text-md-on-surface hover:bg-md-surface-container-high/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-md-primary">
                {t('help.debt_simplification_title')}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-md-on-surface-variant transition-transform duration-200',
                expandedSections.simplification && 'rotate-180'
              )}
            />
          </button>

          {expandedSections.simplification && (
            <div className="px-4 pb-4 pt-1 space-y-3 text-xs sm:text-sm text-md-on-surface-variant">
              <p className="whitespace-pre-line leading-relaxed">
                {t('help.debt_simplification_desc')}
              </p>

              {/* Visual Demonstration Card */}
              <div className="bg-md-surface-container-low rounded-2xl p-3.5 sm:p-4 border border-md-outline/10 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-md-primary" />
                  <span>{t('help.visual_example_title')}</span>
                </div>

                {/* Before: Triangular / chained debt */}
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {t('help.before_optimization', { count: 2 })}
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2 px-3 bg-md-surface-container-high/40 rounded-xl text-xs flex-wrap font-mono">
                    <span className="font-semibold text-md-on-surface">{t('help.sample_person_1')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-bold text-rose-600 dark:text-rose-400">10 ₼</span>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-semibold text-md-on-surface">{t('help.sample_person_2')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-bold text-rose-600 dark:text-rose-400">10 ₼</span>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-semibold text-md-on-surface">{t('help.sample_person_3')}</span>
                  </div>
                </div>

                {/* After: Collapsed / Min Cash Flow transfer */}
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {t('help.after_optimization', { count: 1 })}
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs flex-wrap font-mono text-emerald-900 dark:text-emerald-200">
                    <span className="font-bold text-md-on-surface">{t('help.sample_person_1')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      10 ₼ ({t('help.direct_transfer_note')})
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-md-on-surface">{t('help.sample_person_3')}</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 ml-1 font-sans">
                      {t('help.excluded_person_note', { name: t('help.sample_person_2') })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: "Tətbiq kimi necə quraşdırmaq olar?" (PWA Installation) */}
        <div className="border border-md-outline/15 rounded-2xl overflow-hidden bg-md-surface-container-high/30 transition-all">
          <button
            type="button"
            onClick={() => toggleSection('pwa')}
            aria-expanded={expandedSections.pwa}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-semibold text-md-on-surface hover:bg-md-surface-container-high/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-md-primary">
                {t('help.pwa_install_title')}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-md-on-surface-variant transition-transform duration-200',
                expandedSections.pwa && 'rotate-180'
              )}
            />
          </button>

          {expandedSections.pwa && (
            <div className="px-4 pb-4 pt-1 space-y-3 text-xs sm:text-sm text-md-on-surface-variant">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* iOS Safari Guide */}
                <div className="bg-md-surface-container-low rounded-2xl p-3.5 border border-md-outline/10 space-y-2">
                  <div className="flex items-center gap-2 text-md-on-surface font-bold text-xs">
                    <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{t('help.pwa_ios_title')}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs leading-relaxed text-md-on-surface-variant">
                    {t('help.pwa_ios_desc')}
                  </p>
                </div>

                {/* Android Chrome Guide */}
                <div className="bg-md-surface-container-low rounded-2xl p-3.5 border border-md-outline/10 space-y-2">
                  <div className="flex items-center gap-2 text-md-on-surface font-bold text-xs">
                    <MoreVertical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('help.pwa_android_title')}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs leading-relaxed text-md-on-surface-variant">
                    {t('help.pwa_android_desc')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: "Təhlükəsizlik və Məxfilik" (Zero-auth trust model & cloud REST) */}
        <div className="border border-md-outline/15 rounded-2xl overflow-hidden bg-md-surface-container-high/30 transition-all">
          <button
            type="button"
            onClick={() => toggleSection('security')}
            aria-expanded={expandedSections.security}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-semibold text-md-on-surface hover:bg-md-surface-container-high/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-md-primary">
                {t('help.trust_privacy_title')}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-md-on-surface-variant transition-transform duration-200',
                expandedSections.security && 'rotate-180'
              )}
            />
          </button>

          {expandedSections.security && (
            <div className="px-4 pb-4 pt-1 space-y-3 text-xs sm:text-sm text-md-on-surface-variant">
              <p className="whitespace-pre-line leading-relaxed">
                {t('help.trust_privacy_desc')}
              </p>

              <div className="bg-md-surface-container-low rounded-xl p-3 border border-md-outline/10 space-y-1">
                <div className="font-semibold text-xs text-md-on-surface">
                  {t('help.trust_storage_title')}
                </div>
                <p className="text-[11px] sm:text-xs leading-normal">
                  {t('help.trust_storage_desc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
