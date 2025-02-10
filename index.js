/**
 * @format
 */
import { AppRegistry, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './App';
import { name as appName } from './app.json';

const Main = () => (
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

AppRegistry.registerComponent(appName, () => Main);
