import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Chip from '../components/Chip';
import TextField from '../components/TextField';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store';
import { createTask, updateTask } from '../store/tasksSlice';
import { colors, radius } from '../theme';
import { Priority, TaskInput } from '../types';
import { formatDateTime, pickDateTime } from '../utils/date';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const DEFAULT_CATEGORIES = ['General', 'Work', 'Personal', 'Study', 'Health'];

/** One screen for both creating and editing a task (edit mode when route.params.task exists). */
export default function TaskFormScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'TaskForm'>) {
  const editing = route.params?.task;
  const dispatch = useAppDispatch();
  const existingCategories = useAppSelector((s) => s.tasks.categories);

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [priority, setPriority] = useState<Priority>(editing?.priority ?? 'medium');
  const [category, setCategory] = useState(editing?.category ?? 'General');
  const [tagsText, setTagsText] = useState(editing?.tags.join(', ') ?? '');
  const [dueAt, setDueAt] = useState(() => (editing ? new Date(editing.dueAt) : new Date(Date.now() + 3600000)));
  const [deadline, setDeadline] = useState(() => (editing ? new Date(editing.deadline) : new Date(Date.now() + 86400000)));
  const [titleError, setTitleError] = useState<string>();
  const [apiError, setApiError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const categoryOptions = useMemo(
    () => [...new Set([...DEFAULT_CATEGORIES, ...existingCategories])],
    [existingCategories],
  );
  const deadlineInvalid = deadline < dueAt;

  const submit = async () => {
    setApiError(undefined);
    if (!title.trim()) return setTitleError('Title is required');
    setTitleError(undefined);
    if (deadlineInvalid) return;

    const input: TaskInput = {
      title: title.trim(),
      description: description.trim(),
      dueAt: dueAt.toISOString(),
      deadline: deadline.toISOString(),
      priority,
      category: category.trim() || 'General',
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
    };

    setSaving(true);
    try {
      if (editing) await dispatch(updateTask({ id: editing._id, changes: input })).unwrap();
      else await dispatch(createTask(input)).unwrap();
      navigation.goBack();
    } catch (e) {
      setApiError(typeof e === 'string' ? e : 'Could not save the task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="What needs doing?" error={titleError} maxLength={120} />
          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Add details (optional)"
            multiline
            style={{ minHeight: 80, textAlignVertical: 'top' }}
            maxLength={1000}
          />

          <Text style={styles.label}>Priority</Text>
          <View style={styles.row}>
            {PRIORITIES.map((p) => (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                style={[styles.prio, priority === p && { backgroundColor: colors.priority[p] + '33', borderColor: colors.priority[p] }]}>
                <Text style={[styles.prioText, priority === p && { color: colors.priority[p] }]}>
                  {p[0].toUpperCase() + p.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Due date & time</Text>
          <Pressable
            style={styles.dateBox}
            onPress={() =>
              pickDateTime(dueAt, (d) => {
                setDueAt(d);
                if (deadline < d) setDeadline(d); // keep deadline >= due time
              })
            }>
            <Text style={styles.dateText}>📅 {formatDateTime(dueAt)}</Text>
          </Pressable>

          <Text style={styles.label}>Deadline</Text>
          <Pressable
            style={[styles.dateBox, deadlineInvalid && { borderColor: colors.danger }]}
            onPress={() => pickDateTime(deadline, setDeadline)}>
            <Text style={styles.dateText}>⏰ {formatDateTime(deadline)}</Text>
          </Pressable>
          {deadlineInvalid && <Text style={styles.error}>Deadline must be on or after the due time</Text>}

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {categoryOptions.map((c) => (
              <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
            ))}
          </ScrollView>
          <TextField label="Or type a new category" value={category} onChangeText={setCategory} maxLength={40} />

          <TextField
            label="Tags (comma separated)"
            value={tagsText}
            onChangeText={setTagsText}
            placeholder="urgent, college, errands"
            autoCapitalize="none"
          />

          {!!apiError && <Text style={styles.error}>{apiError}</Text>}
          <Button title={editing ? 'Save changes' : 'Add task'} onPress={submit} loading={saving} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 48 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  prio: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  prioText: { color: colors.muted, fontWeight: '700' },
  dateBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 18,
  },
  dateText: { color: colors.text, fontSize: 16 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
});
