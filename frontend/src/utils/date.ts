import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** "in 3h", "2d ago", "in 45m": short relative time used on task cards. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);

  let label: string;
  if (mins < 60) label = `${Math.max(mins, 1)}m`;
  else if (hours < 48) label = `${hours}h`;
  else label = `${days}d`;

  return diff >= 0 ? `in ${label}` : `${label} ago`;
}

/**
 * Android has no combined date-time picker, so open the date dialog first and
 * then the time dialog, merging the results into a single Date.
 */
export function pickDateTime(current: Date, onPick: (d: Date) => void) {
  DateTimePickerAndroid.open({
    value: current,
    mode: 'date',
    onChange: (e, date) => {
      if (e.type !== 'set' || !date) return;
      DateTimePickerAndroid.open({
        value: date,
        mode: 'time',
        is24Hour: false,
        onChange: (e2, time) => {
          if (e2.type !== 'set' || !time) return;
          const result = new Date(date);
          result.setHours(time.getHours(), time.getMinutes(), 0, 0);
          onPick(result);
        },
      });
    },
  });
}
