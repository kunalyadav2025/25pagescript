import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Script, EditScriptFormData, Genre, GENRES, LANGUAGES } from '../types';
import { apiClient } from '../api/client';
import { OTPInput } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'EditScript'>;
type Step = 1 | 2 | 3;

export function EditScriptScreen({ route, navigation }: Props) {
  const { scriptId } = route.params;
  const [script, setScript] = useState<Script | null>(null);
  const [loadingScript, setLoadingScript] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<EditScriptFormData>({
    writerMobile: '',
    otpId: '',
    verificationToken: '',
    title: '',
    logline: '',
    synopsis: '',
    genre: 'Drama',
    language: 'Hindi',
    hasCopyright: false,
    copyrightNumber: '',
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Fetch script on mount
  useEffect(() => {
    async function loadScript() {
      try {
        const data = await apiClient.getScriptById(scriptId);
        setScript(data);
        setFormData((prev) => ({
          ...prev,
          title: data.title,
          logline: data.logline,
          synopsis: data.synopsis,
          genre: data.genre,
          language: data.language,
          hasCopyright: data.copyright.hasCertificate,
          copyrightNumber: data.copyright.certificateNumber || '',
        }));
      } catch (err) {
        setError('Failed to load script details');
      } finally {
        setLoadingScript(false);
      }
    }
    loadScript();
  }, [scriptId]);

  // OTP countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const updateFormData = (updates: Partial<EditScriptFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setError(null);
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    const cleanMobile = formData.writerMobile.replace(/\s/g, '');
    if (!/^(\+91)?[6-9]\d{9}$/.test(cleanMobile)) {
      setError('Please enter a valid Indian mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mobile = cleanMobile.startsWith('+91') ? cleanMobile : `+91${cleanMobile}`;
      const response = await apiClient.sendOTP(mobile);
      updateFormData({ otpId: response.otpId, writerMobile: mobile });
      setOtpSent(true);
      setOtpCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.verifyOTP(formData.otpId, otp);
      if (response.verified) {
        updateFormData({ verificationToken: response.verificationToken });
        setStep(2);
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpCountdown > 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.sendOTP(formData.writerMobile);
      updateFormData({ otpId: response.otpId });
      setOtp('');
      setOtpCountdown(60);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your mobile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate and go to review
  const handleEditNext = () => {
    const { title, logline, synopsis, genre, hasCopyright, copyrightNumber } = formData;

    if (!title.trim()) {
      setError('Please enter the script title');
      return;
    }
    if (!logline.trim()) {
      setError('Please enter a logline');
      return;
    }
    if (logline.trim().length > 200) {
      setError('Logline must be 200 characters or less');
      return;
    }
    if (!synopsis.trim()) {
      setError('Please enter a synopsis');
      return;
    }
    if (!genre) {
      setError('Please select a genre');
      return;
    }
    if (hasCopyright && !copyrightNumber.trim()) {
      setError('Please enter your copyright certificate number');
      return;
    }

    setStep(3);
  };

  // Step 3: Submit
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.updateScript(scriptId, {
        verificationToken: formData.verificationToken,
        writerMobile: formData.writerMobile,
        title: formData.title.trim(),
        logline: formData.logline.trim(),
        synopsis: formData.synopsis.trim(),
        genre: formData.genre,
        language: formData.language,
        hasCopyright: formData.hasCopyright,
        copyrightNumber: formData.hasCopyright ? formData.copyrightNumber.trim() : undefined,
      });

      Alert.alert('Success', 'Your script has been updated.', [
        { text: 'OK', onPress: () => navigation.navigate('ScriptDetail', { scriptId }) },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update script');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepRow}>
          <View
            style={[
              styles.stepCircle,
              s === step && styles.stepCircleActive,
              s < step && styles.stepCircleCompleted,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                (s === step || s < step) && styles.stepNumberActive,
              ]}
            >
              {s < step ? '\u{2713}' : s}
            </Text>
          </View>
          {s < 3 && (
            <View
              style={[
                styles.stepLine,
                s < step && styles.stepLineCompleted,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  if (loadingScript) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#262626" />
          <Text style={styles.loadingText}>Loading script...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!script) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || 'Script not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Verify Ownership</Text>
      <Text style={styles.stepSubtitle}>
        Enter the mobile number used when uploading this script
      </Text>

      {!otpSent ? (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number *</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="9876543210"
                placeholderTextColor="#8E8E8E"
                value={formData.writerMobile.replace('+91', '')}
                onChangeText={(text) => updateFormData({ writerMobile: text.replace(/\D/g, '') })}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
              />
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.otpSentText}>
            OTP sent to {formData.writerMobile}
          </Text>

          <View style={styles.otpContainer}>
            <OTPInput value={otp} onChange={setOtp} disabled={loading} />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleResendOTP}
            disabled={otpCountdown > 0 || loading}
          >
            <Text
              style={[
                styles.linkText,
                otpCountdown > 0 && styles.linkTextDisabled,
              ]}
            >
              {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => { setOtpSent(false); setOtp(''); setError(null); }}
            disabled={loading}
          >
            <Text style={styles.linkText}>Change Mobile Number</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Edit Details</Text>
      <Text style={styles.stepSubtitle}>
        Update your script information
      </Text>

      {/* Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter script title"
          placeholderTextColor="#8E8E8E"
          value={formData.title}
          onChangeText={(text) => updateFormData({ title: text })}
          maxLength={100}
          editable={!loading}
        />
      </View>

      {/* Logline */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Logline * (max 200 chars)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="One-line description of your story"
          placeholderTextColor="#8E8E8E"
          value={formData.logline}
          onChangeText={(text) => updateFormData({ logline: text })}
          maxLength={200}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          editable={!loading}
        />
        <Text style={styles.charCount}>{formData.logline.length}/200</Text>
      </View>

      {/* Synopsis */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Synopsis *</Text>
        <TextInput
          style={[styles.input, styles.textAreaLarge]}
          placeholder="Brief summary of your story"
          placeholderTextColor="#8E8E8E"
          value={formData.synopsis}
          onChangeText={(text) => updateFormData({ synopsis: text })}
          maxLength={2500}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          editable={!loading}
        />
      </View>

      {/* Genre */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Genre *</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          {GENRES.map((genre) => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.chip,
                formData.genre === genre && styles.chipSelected,
              ]}
              onPress={() => updateFormData({ genre })}
              disabled={loading}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.genre === genre && styles.chipTextSelected,
                ]}
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Language */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Language</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.chip,
                formData.language === lang && styles.chipSelected,
              ]}
              onPress={() => updateFormData({ language: lang })}
              disabled={loading}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.language === lang && styles.chipTextSelected,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Copyright */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Copyright Certificate</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.hasCopyright && styles.toggleButtonActive,
            ]}
            onPress={() => updateFormData({ hasCopyright: true })}
            disabled={loading}
          >
            <Text
              style={[
                styles.toggleText,
                formData.hasCopyright && styles.toggleTextActive,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              !formData.hasCopyright && styles.toggleButtonActive,
            ]}
            onPress={() => updateFormData({ hasCopyright: false, copyrightNumber: '' })}
            disabled={loading}
          >
            <Text
              style={[
                styles.toggleText,
                !formData.hasCopyright && styles.toggleTextActive,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {formData.hasCopyright && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Certificate Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., L-12345/2024"
            placeholderTextColor="#8E8E8E"
            value={formData.copyrightNumber}
            onChangeText={(text) => updateFormData({ copyrightNumber: text })}
            maxLength={50}
            editable={!loading}
          />
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backStepButton}
          onPress={() => setStep(1)}
          disabled={loading}
        >
          <Text style={styles.backStepText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.flexButton, loading && styles.buttonDisabled]}
          onPress={handleEditNext}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Review Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review Changes</Text>
      <Text style={styles.stepSubtitle}>
        Confirm your updates
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Title</Text>
          <Text style={styles.summaryValue} numberOfLines={2}>
            {formData.title}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Genre</Text>
          <Text style={styles.summaryValue}>{formData.genre}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Language</Text>
          <Text style={styles.summaryValue}>{formData.language}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Logline</Text>
          <Text style={styles.summaryValue} numberOfLines={3}>
            {formData.logline}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Copyright</Text>
          <Text style={styles.summaryValue}>
            {formData.hasCopyright ? formData.copyrightNumber : 'No'}
          </Text>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backStepButton}
          onPress={() => setStep(2)}
          disabled={loading}
        >
          <Text style={styles.backStepText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, styles.flexButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepIndicator()}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#8E8E8E',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFEFEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#0095F6',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: '#EFEFEF',
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
  },
  stepContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E8E',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#262626',
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'right',
    marginTop: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryCode: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    color: '#262626',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  chipSelected: {
    backgroundColor: '#262626',
    borderColor: '#262626',
  },
  chipText: {
    fontSize: 13,
    color: '#262626',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBDBDB',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(0, 149, 246, 0.1)',
    borderColor: '#0095F6',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  toggleTextActive: {
    color: '#0095F6',
  },
  otpContainer: {
    marginVertical: 24,
  },
  otpSentText: {
    fontSize: 14,
    color: '#262626',
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#0095F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(0, 149, 246, 0.5)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backStepButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  backStepText: {
    color: '#8E8E8E',
    fontSize: 15,
    fontWeight: '600',
  },
  flexButton: {
    flex: 1,
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#0095F6',
    fontSize: 14,
    fontWeight: '600',
  },
  linkTextDisabled: {
    color: '#C7C7C7',
  },
  error: {
    color: '#ED4956',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ED4956',
    fontSize: 14,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginVertical: 8,
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EditScriptScreen;
