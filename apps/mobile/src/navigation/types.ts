import type { NavigatorScreenParams } from '@react-navigation/native';
import type { AlertResponse } from '../api/types';

export type TransactionsStackParamList = {
  TransactionsList: undefined;
  TransactionDetail: { transactionId: string };
};

export type GoalsStackParamList = {
  GoalsList: undefined;
  GoalForm: { goalId?: string };
};

export type AlertsStackParamList = {
  AlertsList: undefined;
  AlertDetail: { alert: AlertResponse };
};

export type RootTabParamList = {
  Dashboard: undefined;
  Transactions: NavigatorScreenParams<TransactionsStackParamList> | undefined;
  Goals: NavigatorScreenParams<GoalsStackParamList> | undefined;
  Alerts: NavigatorScreenParams<AlertsStackParamList> | undefined;
  AiCoach: undefined;
};
