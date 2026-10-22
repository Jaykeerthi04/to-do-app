import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import RootNavigator from './src/navigation/RootNavigator';
import { store, useAppDispatch } from './src/store';
import { bootstrap } from './src/store/authSlice';
import { colors } from './src/theme';

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, primary: colors.primary, text: colors.text },
};

// Restores a saved login session once, on app start.
function Bootstrap() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(bootstrap());
  }, [dispatch]);
  return <RootNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer theme={navTheme}>
          <Bootstrap />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
