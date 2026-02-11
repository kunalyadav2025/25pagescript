import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Success'>;

export function SuccessScreen({ route, navigation }: Props) {
  const { scriptId, title } = route.params;

  const handleBrowseScripts = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleViewScript = () => {
    navigation.reset({
      index: 1,
      routes: [
        { name: 'Home' },
        { name: 'ScriptDetail', params: { scriptId } },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.checkmark}>{'\u{2713}'}</Text>
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Script Published!</Text>
        <Text style={styles.subtitle}>
          Your script has been successfully uploaded and is now visible to
          filmmakers and producers.
        </Text>

        {/* Script Title */}
        <View style={styles.scriptCard}>
          <Text style={styles.scriptLabel}>Your Script</Text>
          <Text style={styles.scriptTitle}>{title}</Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Your contact details are now visible to interested
            parties. Expect calls from filmmakers who love your work!
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewScript}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>View My Script</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBrowseScripts}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Browse Scripts</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 28,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#10B981',
  },
  checkmark: {
    fontSize: 48,
    color: '#10B981',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#262626',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  scriptCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  scriptLabel: {
    fontSize: 12,
    color: '#0095F6',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    fontWeight: '600',
  },
  scriptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 149, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 149, 246, 0.3)',
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E8E',
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#0095F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  secondaryButtonText: {
    color: '#262626',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SuccessScreen;
