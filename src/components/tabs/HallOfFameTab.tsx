import React, { useMemo, useState } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  Users,
} from 'lucide-react';
import { Participant, Expense, Settlement } from '../../types';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { useI18n } from '../../i18n/I18nContext';
import {
  computeBadges,
  computeParticipantStats,
  computeGroupStats,
  BADGE_DEFINITIONS,
  BadgeItem,
  BadgeId,
  ParticipantStats,
} from '../../utils/gamification';
import { cn } from '../../utils/cn';

export interface HallOfFameTabProps {
  participants: Participant[];
  expenses: Expense[];
  settlements?: Settlement[];
  currency?: string;
  activeParticipant?: Participant | null;
  className?: string;
}

export const HallOfFameTab: React.FC<HallOfFameTabProps> = ({
  participants,
  expenses,
  settlements = [],
  currency = '₼',
  activeParticipant,
  className,
}) => {
  const { t, lang, formatMoney } = useI18n();

  // Active tooltip or selected badge details modal/popover
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  // Compute badges map: participantId -> BadgeItem[]
  const badgesMap = useMemo(() => {
    return computeBadges(participants, expenses, settlements, lang);
  }, [participants, expenses, settlements, lang]);

  // Compute individual participant stats
  const participantStats = useMemo(() => {
    const stats = computeParticipantStats(participants, expenses, settlements, lang);
    // Sort by badge count descending, then total spent descending
    return stats.sort((a, b) => {
      if (b.badges.length !== a.badges.length) {
        return b.badges.length - a.badges.length;
      }
      return b.totalSpent - a.totalSpent;
    });
  }, [participants, expenses, settlements, lang]);

  // Compute group-level statistics
  const groupStats = useMemo(() => {
    return computeGroupStats(expenses, settlements, badgesMap);
  }, [expenses, settlements, badgesMap]);

  // Badge Spotlight: find awardees for each badge type
  const badgeSpotlight = useMemo(() => {
    const badgeIds: BadgeId[] = ['sponsor', 'lightning', 'tomorrow', 'party'];

    return badgeIds.map((id) => {
      const def = BADGE_DEFINITIONS[id];
      const awardees: Array<{ participant: Participant; stats: ParticipantStats }> = [];

      for (const stat of participantStats) {
        if (stat.badges.some((b) => b.id === id)) {
          awardees.push({ participant: stat.participant, stats: stat });
        }
      }

      const title = def.titles[lang] || def.titles.az;
      const description = def.descriptions[lang] || def.descriptions.az;

      return {
        id,
        icon: def.icon,
        title,
        description,
        awardees,
      };
    });
  }, [participantStats, lang]);

  return (
    <div className={cn('w-full max-w-4xl mx-auto space-y-6 pb-12', className)}>
      {/* Hero Header */}
      <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-amber-500/10 via-teal-500/10 to-purple-500/10 p-5 sm:p-6 rounded-3xl border border-md-outline/15 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>{t('hall_of_fame.title')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-md-on-surface tracking-tight">
            {t('hall_of_fame.title')}
          </h2>
          <p className="text-xs sm:text-sm text-md-on-surface-variant mt-1 max-w-xl">
            {t('hall_of_fame.subtitle')}
          </p>
        </div>

        {/* Aggregate Group Counters */}
        <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
          <div className="bg-md-surface-container-low px-3.5 py-2 rounded-2xl border border-md-outline/10 text-center min-w-[90px]">
            <div className="text-xs font-semibold text-md-on-surface-variant">
              {t('hall_of_fame.total_expenses_count')}
            </div>
            <div className="text-base sm:text-lg font-bold text-md-primary">
              {groupStats.totalExpensesCount}
            </div>
          </div>

          <div className="bg-md-surface-container-low px-3.5 py-2 rounded-2xl border border-md-outline/10 text-center min-w-[90px]">
            <div className="text-xs font-semibold text-md-on-surface-variant">
              {t('hall_of_fame.total_settlements_count')}
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {groupStats.totalSettlementsCount}
            </div>
          </div>

          <div className="bg-md-surface-container-low px-3.5 py-2 rounded-2xl border border-md-outline/10 text-center min-w-[90px]">
            <div className="text-xs font-semibold text-md-on-surface-variant">
              {t('hall_of_fame.badges_count')}
            </div>
            <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
              {groupStats.activeBadgesCount}
            </div>
          </div>
        </div>
      </div>

      {/* Badges Spotlight Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-base sm:text-lg font-bold text-md-on-surface">
            {t('hall_of_fame.stats_title')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {badgeSpotlight.map((badge) => {
            const hasAwardees = badge.awardees.length > 0;

            return (
              <Card
                key={badge.id}
                variant="outlined"
                className={cn(
                  'p-4 transition-all duration-200 flex flex-col justify-between gap-3',
                  hasAwardees
                    ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                    : 'border-md-outline/15 bg-md-surface-container-low opacity-75'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl sm:text-3xl" role="img" aria-label={badge.title}>
                        {badge.icon}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-md-on-surface">
                          {badge.title}
                        </h4>
                        <p className="text-xs text-md-on-surface-variant line-clamp-2">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Awardee(s) info */}
                <div className="pt-2 border-t border-md-outline/10 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-md-on-surface-variant">
                    {hasAwardees ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {badge.awardees.map(({ participant }) => (
                          <div
                            key={participant.id}
                            className="inline-flex items-center gap-1.5 bg-md-surface-container-high/60 px-2.5 py-1 rounded-full border border-md-outline/10"
                          >
                            <Avatar
                              name={participant.name}
                              color={participant.avatarColor}
                              size="sm"
                              className="w-5 h-5 text-[10px]"
                            />
                            <span className="font-bold text-md-on-surface text-xs">
                              {participant.name}
                            </span>
                            {activeParticipant?.id === participant.id && (
                              <span className="text-[10px] text-md-primary font-extrabold ml-0.5">
                                ({t('header.my_profile')})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="italic text-xs text-md-on-surface-variant/70">
                        {t('hall_of_fame.unassigned')}
                      </span>
                    )}
                  </div>

                  {/* Contextual Metric Tag */}
                  {hasAwardees && (
                    <div className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 shrink-0">
                      {badge.id === 'sponsor' &&
                        formatMoney(badge.awardees[0].stats.totalSpent, currency)}
                      {badge.id === 'lightning' &&
                        `${badge.awardees[0].stats.settlementsCount}x`}
                      {badge.id === 'tomorrow' &&
                        `-${formatMoney(Math.abs(badge.awardees[0].stats.netBalance), currency)}`}
                      {badge.id === 'party' &&
                        `${badge.awardees[0].stats.gatheringsAttended}x`}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Participant Leaderboard Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-md-primary" />
            <h3 className="text-base sm:text-lg font-bold text-md-on-surface">
              {t('hall_of_fame.leaderboard_title')}
            </h3>
          </div>
          <span className="text-xs text-md-on-surface-variant font-medium">
            {participants.length} {t('participant.list_title').toLowerCase()}
          </span>
        </div>

        {participantStats.length === 0 ? (
          <Card variant="outlined" className="p-8 text-center border-dashed border-md-outline/30">
            <Award className="w-10 h-10 text-md-on-surface-variant/50 mx-auto mb-2" />
            <div className="font-semibold text-sm text-md-on-surface">
              {t('hall_of_fame.no_badges')}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {participantStats.map((stat, index) => {
              const p = stat.participant;
              const isActiveUser = activeParticipant?.id === p.id;
              const hasBadges = stat.badges.length > 0;

              return (
                <Card
                  key={p.id}
                  variant="elevated"
                  className={cn(
                    'p-4 sm:p-5 transition-all duration-200 border',
                    isActiveUser
                      ? 'border-md-primary/60 bg-md-primary/5 ring-1 ring-md-primary/30'
                      : 'border-md-outline/15 bg-md-surface-container-low hover:border-md-outline/30'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Avatar, Name, Rank, Active Badge */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar
                          name={p.name}
                          color={p.avatarColor}
                          size="md"
                          className="w-11 h-11 text-sm font-bold shadow-xs"
                        />
                        {index === 0 && hasBadges && (
                          <div
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[10px] font-bold shadow-xs"
                            title="Rank 1"
                          >
                            👑
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-md-on-surface truncate">
                            {p.name}
                          </span>
                          {isActiveUser && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-md-primary text-md-on-primary shadow-2xs">
                              {t('header.my_profile')}
                            </span>
                          )}
                        </div>

                        {/* Badges won by this participant */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {hasBadges ? (
                            stat.badges.map((badge) => (
                              <button
                                key={badge.id}
                                type="button"
                                onClick={() => setSelectedBadge(badge)}
                                title={`${badge.name}: ${badge.description}`}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-200 transition-colors cursor-pointer"
                              >
                                <span>{badge.icon}</span>
                                <span>{badge.name}</span>
                              </button>
                            ))
                          ) : (
                            <span className="text-[11px] text-md-on-surface-variant/70 italic">
                              {t('hall_of_fame.no_badges')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Detailed Metric Counters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-md-outline/10">
                      {/* Total Spent */}
                      <div className="bg-md-surface-container-high/40 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none">
                        <div className="text-[10px] uppercase font-bold text-md-on-surface-variant tracking-wider">
                          {t('hall_of_fame.total_spent')}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-md-on-surface font-mono mt-0.5">
                          {formatMoney(stat.totalSpent, currency)}
                        </div>
                      </div>

                      {/* Settlements Count */}
                      <div className="bg-md-surface-container-high/40 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none">
                        <div className="text-[10px] uppercase font-bold text-md-on-surface-variant tracking-wider">
                          {t('hall_of_fame.settled_count')}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                          {stat.settlementsCount} ({formatMoney(stat.totalSettledAmount, currency)})
                        </div>
                      </div>

                      {/* Gatherings Attended */}
                      <div className="bg-md-surface-container-high/40 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none">
                        <div className="text-[10px] uppercase font-bold text-md-on-surface-variant tracking-wider">
                          {t('hall_of_fame.gatherings')}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-md-on-surface font-mono mt-0.5">
                          {stat.gatheringsAttended}
                        </div>
                      </div>

                      {/* Current Net Balance */}
                      <div className="bg-md-surface-container-high/40 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none">
                        <div className="text-[10px] uppercase font-bold text-md-on-surface-variant tracking-wider">
                          {t('balance.net_balance')}
                        </div>
                        <div
                          className={cn(
                            'text-xs sm:text-sm font-bold font-mono mt-0.5',
                            stat.netBalance > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : stat.netBalance < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-md-on-surface-variant'
                          )}
                        >
                          {stat.netBalance > 0 ? '+' : ''}
                          {formatMoney(stat.netBalance, currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Badge Description Popover/Modal */}
      {selectedBadge && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-md-surface-container-low rounded-3xl p-6 max-w-sm w-full border border-md-outline/20 shadow-xl space-y-4 animate-modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl" role="img" aria-label={selectedBadge.name}>
                {selectedBadge.icon}
              </span>
              <div>
                <h4 className="text-lg font-bold text-md-on-surface">
                  {selectedBadge.name}
                </h4>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
                  {t('hall_of_fame.badges_count')}
                </span>
              </div>
            </div>

            <p className="text-sm text-md-on-surface-variant leading-relaxed">
              {selectedBadge.description}
            </p>

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-full bg-md-primary text-md-on-primary font-semibold text-xs tracking-wide transition-opacity hover:opacity-90 cursor-pointer"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
