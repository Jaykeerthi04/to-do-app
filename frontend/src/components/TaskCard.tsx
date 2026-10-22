import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { Task } from '../types';
import { formatDateTime, relativeTime } from '../utils/date';
import Chip from './Chip';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (task: Task) => void;
}

function TaskCard({ task, onToggle, onDelete, onPress }: Props) {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const overdue = !task.completed && deadline < now;
  const soon = !task.completed && !overdue && deadline.getTime() - now.getTime() < 24 * 3600000;
  const pColor = colors.priority[task.priority];

  const confirmDelete = () =>
    Alert.alert('Delete task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(task._id) },
    ]);

  return (
    <Pressable onPress={() => onPress(task)} style={[styles.card, task.completed && styles.done]}>
      {/* Colored stripe shows priority at a glance */}
      <View style={[styles.stripe, { backgroundColor: pColor }]} />

      <Pressable onPress={() => onToggle(task._id)} hitSlop={10} style={styles.checkWrap}>
        <View style={[styles.check, task.completed && { backgroundColor: colors.success, borderColor: colors.success }]}>
          {task.completed && <Text style={styles.tick}>✓</Text>}
        </View>
      </Pressable>

      <View style={styles.body}>
        <Text style={[styles.title, task.completed && styles.strike]} numberOfLines={2}>
          {task.title}
        </Text>
        {!!task.description && (
          <Text style={styles.desc} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        <View style={styles.row}>
          <Chip small active label={task.priority.toUpperCase()} color={pColor} />
          <Chip small label={task.category} />
          {task.tags.slice(0, 3).map((t) => (
            <Chip small key={t} label={`#${t}`} />
          ))}
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>Due {formatDateTime(task.dueAt)}</Text>
          <Text
            style={[styles.metaText, overdue && { color: colors.danger }, soon && { color: colors.warning }]}>
            {task.completed
              ? 'Completed'
              : overdue
              ? `Overdue ${relativeTime(task.deadline).replace(' ago', '')}`
              : `Deadline ${relativeTime(task.deadline)}`}
          </Text>
        </View>
      </View>

      <Pressable onPress={confirmDelete} hitSlop={10} style={styles.delete}>
        <Text style={styles.deleteText}>🗑</Text>
      </Pressable>
    </Pressable>
  );
}

// memo avoids re-rendering every card when only one task changes
export default React.memo(TaskCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingRight: 10,
  },
  done: { opacity: 0.6 },
  stripe: { width: 4, marginRight: 12, borderRadius: 2 },
  checkWrap: { paddingRight: 12, paddingTop: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { color: '#06281A', fontWeight: '900', fontSize: 14 },
  body: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  strike: { textDecorationLine: 'line-through', color: colors.muted },
  desc: { color: colors.muted, fontSize: 13, marginTop: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, rowGap: 6 },
  meta: { marginTop: 10, gap: 2 },
  metaText: { color: colors.muted, fontSize: 12 },
  delete: { paddingLeft: 8, justifyContent: 'flex-start' },
  deleteText: { fontSize: 18 },
});
