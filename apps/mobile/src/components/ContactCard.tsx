import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { formatPhoneNumber } from '../utils';
import { useTheme } from '../context';

interface ContactCardProps {
  writerName: string;
  mobile: string;
}

export function ContactCard({ writerName, mobile }: ContactCardProps) {
  const { colors } = useTheme();

  const handleCall = async () => {
    const phoneUrl = `tel:${mobile}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);

    if (canOpen) {
      await Linking.openURL(phoneUrl);
    } else {
      Alert.alert('Error', 'Unable to make phone calls on this device');
    }
  };

  const handleWhatsApp = async () => {
    // Remove any non-digit characters for WhatsApp URL
    const cleanNumber = mobile.replace(/[^\d]/g, '');
    const whatsappUrl = `whatsapp://send?phone=${cleanNumber}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      Alert.alert('Error', 'WhatsApp is not installed on this device');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
      <Text style={[styles.sectionTitle, { color: colors.accent }]}>Writer Contact</Text>

      <View style={styles.card}>
        <View style={styles.writerInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
            <Text style={[styles.avatarText, { color: colors.text }]}>
              {writerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.details}>
            <Text style={[styles.name, { color: colors.text }]}>{writerName}</Text>
            <TouchableOpacity onPress={handleCall}>
              <Text style={[styles.phone, { color: colors.accent }]}>{formatPhoneNumber(mobile)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.callButton]}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.whatsappButton]}
            onPress={handleWhatsApp}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    borderBottomWidth: 0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  card: {
    paddingHorizontal: 16,
  },
  writerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: '#0095F6',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ContactCard;
