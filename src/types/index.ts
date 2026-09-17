export type Language = 'az' | 'ru' | 'en';

export type SplitMode = 'equal' | 'custom';

export interface Participant {
  id: string;
  name: string;
  avatarColor: string;
}

export interface SplitItem {
  participantId: string;
  amount: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  payerId: string;
  date: string;
  splitMode: SplitMode;
  involvedParticipantIds: string[];
  customSplits?: SplitItem[];
  createdAt: number;
}

export interface Settlement {
  id: string;
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  date: string;
  createdAt: number;
}

export interface RoomState {
  id: string;
  groupName: string;
  currency: string; // default "₼"
  participants: Participant[];
  expenses: Expense[];
  settlements: Settlement[];
  updatedAt: number;
}

export interface TransferExplanation {
  az: string;
  ru: string;
  en: string;
}

export interface SimplifiedTransfer {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  explanation: TransferExplanation;
}
