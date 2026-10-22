import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Chip from '../components/Chip';
import TaskCard from '../components/TaskCard';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/authSlice';
import { deleteTask, fetchMeta, fetchTasks, resetFilters, setFilters, toggleTask } from '../store/tasksSlice';
import { colors, radius } from '../theme';
import { Priority, SortMode, StatusFilter, Task } from '../types';

const STATUS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
  { key: 'overdue', label: 'Overdue' },
];
const SORTS: { key: SortMode; label: string }[] = [
  { key: 'smart', label: '✨ Smart' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'due', label: 'Due time' },
  { key: 'priority', label: 'Priority' },
  { key: 'newest', label: 'Newest' },
];
const PRIORITIES: (Priority | 'all')[] = ['all', 'high', 'medium', 'low'];

export default function TasksScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Tasks'>) {
  const dispatch = useAppDispatch();
  const { items, loading, error, filters, categories, tags } = useAppSelector((s) => s.tasks);
  const user = useAppSelector((s) => s.auth.user);

  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(filters.search);

  // Debounce search so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== filters.search) dispatch(setFilters({ search }));
    }, 350);
    return () => clearTimeout(t);
  }, [search, filters.search, dispatch]);

  // Reload whenever any filter or sort option changes.
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch, filters]);

  useEffect(() => {
    dispatch(fetchMeta());
  }, [dispatch]);

  const onToggle = useCallback((id: string) => void dispatch(toggleTask(id)), [dispatch]);
  const onDelete = useCallback((id: string) => void dispatch(deleteTask(id)), [dispatch]);
  const onOpen = useCallback((task: Task) => navigation.navigate('TaskForm', { task }), [navigation]);

  const confirmLogout = () =>
    Alert.alert('Log out', 'Do you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);

  const overdueCount = useMemo(
    () => items.filter((t) => !t.completed && new Date(t.deadline) < new Date()).length,
    [items],
  );
  const activeCount = items.filter((t) => !t.completed).length;
  const filtersActive =
    filters.status !== 'all' || filters.priority !== 'all' || filters.category !== 'all' || filters.tag !== 'all' || !!filters.search;
  const displayName = user?.name || user?.email.split('@')[0] || '';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Hi, {displayName} 👋</Text>
          <Text style={styles.summary}>
            {activeCount} active
            {overdueCount > 0 && <Text style={{ color: colors.danger }}> · {overdueCount} overdue</Text>}
          </Text>
        </View>
        <Pressable onPress={confirmLogout} hitSlop={10}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search tasks…"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>

      {/* Status chips + filter toggle */}
      <View style={styles.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {STATUS.map((s) => (
            <Chip
              key={s.key}
              label={s.label}
              active={filters.status === s.key}
              onPress={() => dispatch(setFilters({ status: s.key }))}
            />
          ))}
        </ScrollView>
        <Pressable onPress={() => setShowFilters((v) => !v)} style={styles.filterBtn}>
          <Text style={styles.filterBtnText}>{showFilters ? 'Hide' : 'Sort & filter'}</Text>
        </Pressable>
      </View>

      {showFilters && (
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Sort by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SORTS.map((s) => (
              <Chip
                key={s.key}
                label={s.label}
                color={colors.accent}
                active={filters.sort === s.key}
                onPress={() => dispatch(setFilters({ sort: s.key }))}
              />
            ))}
          </ScrollView>

          <Text style={styles.panelLabel}>Priority</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PRIORITIES.map((p) => (
              <Chip
                key={p}
                label={p === 'all' ? 'Any' : p[0].toUpperCase() + p.slice(1)}
                color={p === 'all' ? colors.primary : colors.priority[p]}
                active={filters.priority === p}
                onPress={() => dispatch(setFilters({ priority: p }))}
              />
            ))}
          </ScrollView>

          {categories.length > 0 && (
            <>
              <Text style={styles.panelLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['all', ...categories].map((c) => (
                  <Chip
                    key={c}
                    label={c === 'all' ? 'Any' : c}
                    active={filters.category === c}
                    onPress={() => dispatch(setFilters({ category: c }))}
                  />
                ))}
              </ScrollView>
            </>
          )}

          {tags.length > 0 && (
            <>
              <Text style={styles.panelLabel}>Tag</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['all', ...tags].map((t) => (
                  <Chip
                    key={t}
                    label={t === 'all' ? 'Any' : `#${t}`}
                    active={filters.tag === t}
                    onPress={() => dispatch(setFilters({ tag: t }))}
                  />
                ))}
              </ScrollView>
            </>
          )}

          {filtersActive && (
            <Pressable
              onPress={() => {
                setSearch('');
                dispatch(resetFilters());
              }}>
              <Text style={styles.reset}>Reset filters</Text>
            </Pressable>
          )}
        </View>
      )}

      {!!error && (
        <Pressable onPress={() => dispatch(fetchTasks())} style={styles.errorBar}>
          <Text style={styles.errorText}>{error} · Tap to retry</Text>
        </Pressable>
      )}

      <FlatList
        data={items}
        keyExtractor={(t) => t._id}
        renderItem={({ item }) => <TaskCard task={item} onToggle={onToggle} onDelete={onDelete} onPress={onOpen} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading && items.length > 0} onRefresh={() => void dispatch(fetchTasks())} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.emptySub}>Loading tasks… the server may need a moment to wake up.</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{filtersActive ? '🔍' : '🌱'}</Text>
              <Text style={styles.emptyTitle}>{filtersActive ? 'No tasks match' : 'Nothing here yet'}</Text>
              <Text style={styles.emptySub}>
                {filtersActive ? 'Try changing or resetting your filters.' : 'Tap + to add your first task.'}
              </Text>
            </View>
          )
        }
      />

      {/* Floating add button */}
      <Pressable style={styles.fab} onPress={() => navigation.navigate('TaskForm')} android_ripple={{ color: '#ffffff44', radius: 32 }}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  hello: { color: colors.text, fontSize: 24, fontWeight: '800' },
  summary: { color: colors.muted, marginTop: 2, fontSize: 14 },
  logout: { color: colors.muted, fontWeight: '600' },
  searchBox: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  searchInput: { color: colors.text, fontSize: 15, paddingVertical: 11 },
  chipRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 12, marginTop: 14 },
  filterBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  filterBtnText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  panel: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 8, textTransform: 'uppercase' },
  reset: { color: colors.danger, fontWeight: '700', marginTop: 14 },
  errorBar: { marginHorizontal: 20, marginTop: 12, padding: 12, borderRadius: radius.sm, backgroundColor: colors.danger + '22' },
  errorText: { color: colors.danger, fontSize: 13 },
  list: { padding: 20, paddingBottom: 120, flexGrow: 1 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySub: { color: colors.muted, textAlign: 'center', marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    overflow: 'hidden',
  },
  fabText: { color: '#fff', fontSize: 30, marginTop: -2 },
});
