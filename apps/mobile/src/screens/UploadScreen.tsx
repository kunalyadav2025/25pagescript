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
  Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UploadFormData, Genre, GENRES, LANGUAGES } from '../types';
import { apiClient } from '../api/client';
import { validatePDF, readPDFAsBase64, formatFileSize } from '../utils';
import { OTPInput } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'Upload'>;

type Step = 1 | 2 | 3 | 4 | 5;

const INITIAL_FORM_DATA: UploadFormData = {
  writerName: '',
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
  scriptFile: null,
  pageCount: 0,
};

export function UploadScreen({ navigation }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<UploadFormData>(INITIAL_FORM_DATA);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // OTP resend countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const updateFormData = (updates: Partial<UploadFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setError(null);
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    const { writerName, writerMobile } = formData;

    if (!writerName.trim()) {
      setError('Please enter your name');
      return;
    }

    // Validate mobile number (Indian format)
    const cleanMobile = writerMobile.replace(/\s/g, '');
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
      setOtpCountdown(60);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
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
        setStep(3);
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

  // Step 3: Pick PDF
  const handlePickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      setLoading(true);
      setError(null);

      // Validate PDF
      const validation = await validatePDF(file.uri);

      if (!validation.valid) {
        setError(validation.error || 'Invalid PDF file');
        setLoading(false);
        return;
      }

      updateFormData({
        scriptFile: {
          uri: file.uri,
          name: file.name,
          type: 'application/pdf',
        },
        pageCount: validation.pageCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select file');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Continue to copyright
  const handleScriptDetailsNext = () => {
    const { title, logline, synopsis, scriptFile, genre } = formData;

    if (!scriptFile) {
      setError('Please upload your script PDF');
      return;
    }

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

    setStep(4);
  };

  // Step 4: Continue to review
  const handleCopyrightNext = () => {
    const { hasCopyright, copyrightNumber } = formData;

    if (hasCopyright && !copyrightNumber.trim()) {
      setError('Please enter your copyright certificate number');
      return;
    }

    setStep(5);
  };

  // Step 5: Submit and pay
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Read PDF as base64
      const scriptFileBase64 = await readPDFAsBase64(formData.scriptFile!.uri);

      // Upload script
      const response = await apiClient.uploadScript({
        verificationToken: formData.verificationToken,
        writerName: formData.writerName.trim(),
        writerMobile: formData.writerMobile,
        title: formData.title.trim(),
        logline: formData.logline.trim(),
        synopsis: formData.synopsis.trim(),
        genre: formData.genre,
        language: formData.language,
        hasCopyright: formData.hasCopyright,
        copyrightNumber: formData.hasCopyright ? formData.copyrightNumber.trim() : undefined,
        scriptFileBase64,
        scriptFileName: formData.scriptFile!.name,
        pageCount: formData.pageCount,
      });

      // Script is now published directly (payment bypassed)
      // TODO: Re-enable Cashfree payment flow when ready
      // Alert.alert('Payment Required', 'You will be redirected to complete payment of INR 99', [
      //   { text: 'Pay Now', onPress: () => { /* Open Cashfree checkout */ } },
      //   { text: 'Cancel', style: 'cancel' },
      // ]);

      navigation.replace('Success', {
        scriptId: response.scriptId,
        title: formData.title.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload script');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((s) => (
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
          {s < 5 && (
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

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Enter Your Details</Text>
      <Text style={styles.stepSubtitle}>
        We'll send an OTP to verify your mobile number
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Your Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#8E8E8E"
          value={formData.writerName}
          onChangeText={(text) => updateFormData({ writerName: text })}
          maxLength={50}
          editable={!loading}
        />
      </View>

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
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Verify Mobile</Text>
      <Text style={styles.stepSubtitle}>
        Enter the 6-digit OTP sent to {formData.writerMobile}
      </Text>

      <View style={styles.otpContainer}>
        <OTPInput
          value={otp}
          onChange={setOtp}
          disabled={loading}
        />
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
        onPress={() => setStep(1)}
        disabled={loading}
      >
        <Text style={styles.linkText}>Change Mobile Number</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Script Details</Text>
      <Text style={styles.stepSubtitle}>
        Upload your script and provide details
      </Text>

      {/* PDF Upload */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Script PDF * (max 25 pages)</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={handlePickPDF}
          disabled={loading}
        >
          {formData.scriptFile ? (
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {formData.scriptFile.name}
              </Text>
              <Text style={styles.fileDetails}>
                {formData.pageCount} pages
              </Text>
            </View>
          ) : (
            <Text style={styles.uploadText}>Tap to select PDF file</Text>
          )}
        </TouchableOpacity>
      </View>

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

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleScriptDetailsNext}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Copyright Information</Text>
      <Text style={styles.stepSubtitle}>
        Do you have a copyright certificate for this script?
      </Text>

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
          onPress={() => setStep(3)}
          disabled={loading}
        >
          <Text style={styles.backStepText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.flexButton, loading && styles.buttonDisabled]}
          onPress={handleCopyrightNext}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepSubtitle}>
        Confirm your details and submit your script
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Writer</Text>
          <Text style={styles.summaryValue}>{formData.writerName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Mobile</Text>
          <Text style={styles.summaryValue}>{formData.writerMobile}</Text>
        </View>
        <View style={styles.divider} />
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
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pages</Text>
          <Text style={styles.summaryValue}>{formData.pageCount}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Copyright</Text>
          <Text style={styles.summaryValue}>
            {formData.hasCopyright ? formData.copyrightNumber : 'No'}
          </Text>
        </View>
      </View>

      {/* TODO: Re-enable price card when Cashfree is active */}
      {/* <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Upload Fee</Text>
        <Text style={styles.priceValue}>{'\u{20B9}'} 99</Text>
      </View> */}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backStepButton}
          onPress={() => setStep(4)}
          disabled={loading}
        >
          <Text style={styles.backStepText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Submit Script</Text>
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
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
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
  uploadBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  fileInfo: {
    alignItems: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  fileDetails: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 6,
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
    marginBottom: 18,
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
  priceCard: {
    backgroundColor: 'rgba(0, 149, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0095F6',
  },
  priceLabel: {
    fontSize: 15,
    color: '#0095F6',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0095F6',
  },
  payButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default UploadScreen;
