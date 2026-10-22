import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store';
import { clearError, register } from '../store/authSlice';
import { colors } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Register'>) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => () => void dispatch(clearError()), [dispatch]);

  // Mirrors the server rules so users get instant feedback.
  const submit = () => {
    const e: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address';
    if (password.length < 8) e.password = 'At least 8 characters';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) e.password = 'Include a letter and a number';
    if (confirm !== password) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;
    dispatch(register({ name: name.trim() || undefined, email: email.trim(), password }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Plan smarter with deadlines that prioritise themselves.</Text>

          <View style={{ marginTop: 28 }}>
            <TextField label="Name (optional)" value={name} onChangeText={setName} placeholder="Your name" />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              error={errors.email}
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secure
              autoCapitalize="none"
              placeholder="8+ characters, letter and number"
              error={errors.password}
            />
            <TextField
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secure
              autoCapitalize="none"
              placeholder="Repeat password"
              error={errors.confirm}
            />
          </View>

          {!!error && <Text style={styles.apiError}>{error}</Text>}
          <Button title="Sign up" onPress={submit} loading={loading} />
          <Button title="I already have an account" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 6 },
  apiError: { color: colors.danger, marginBottom: 12, fontSize: 14 },
});
