import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store';
import { clearError, login } from '../store/authSlice';
import { colors } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Login'>) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => () => void dispatch(clearError()), [dispatch]);

  const submit = () => {
    const e: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    if (Object.keys(e).length) return;
    dispatch(login({ email: email.trim(), password }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>✦ Taskly</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to pick up where you left off.</Text>

          <View style={{ marginTop: 32 }}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email}
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secure
              autoCapitalize="none"
              placeholder="Your password"
              error={errors.password}
            />
          </View>

          {!!error && <Text style={styles.apiError}>{error}</Text>}
          <Button title="Log in" onPress={submit} loading={loading} />
          {loading && (
            <Text style={styles.hint}>First request can take up to a minute while the server wakes up…</Text>
          )}
          <Button title="Create an account" variant="ghost" onPress={() => navigation.navigate('Register')} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, paddingTop: 48 },
  logo: { color: colors.accent, fontSize: 18, fontWeight: '800', marginBottom: 24 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 6 },
  apiError: { color: colors.danger, marginBottom: 12, fontSize: 14 },
  hint: { color: colors.muted, textAlign: 'center', marginTop: 12, fontSize: 12 },
});
