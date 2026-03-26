import type { AlertSeverityApi } from '../api/types';
import type { ColorPalette } from '../theme/theme';

/** Accent for severity strip / badges (MVP mapping). */
export function alertSeverityColor(severity: AlertSeverityApi, colors: ColorPalette): string {
  switch (severity) {
    case 'CRITICAL':
      return colors.danger;
    case 'WARNING':
    case 'HIGH':
    case 'MEDIUM':
      return '#C87F0A';
    case 'INFO':
    case 'LOW':
    default:
      return colors.primary;
  }
}

export function alertSeverityLabel(severity: AlertSeverityApi): string {
  return severity.replace(/_/g, ' ');
}
