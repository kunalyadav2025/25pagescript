'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GENRES, LANGUAGES, type Genre } from '@25pagescript/shared';
import { validateIndianMobile, formatMobileWithCountryCode } from '@25pagescript/shared';
import { apiClient } from '@/lib/api';
import { Header, OTPInput, LoadingSpinner } from '@/components';

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  writerName: string;
  writerMobile: string;
  otpId: string;
  verificationToken: string;
  title: string;
  logline: string;
  synopsis: string;
  genre: Genre;
  language: string;
  hasCopyright: boolean;
  copyrightNumber: string;
  scriptFile: File | null;
  pageCount: number;
}

const INITIAL_FORM_DATA: FormData = {
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

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
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

  const updateFormData = (updates: Partial<FormData>) => {
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

    if (!validateIndianMobile(writerMobile)) {
      setError('Please enter a valid Indian mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mobile = formatMobileWithCountryCode(writerMobile);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Pick PDF
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    // For page count validation, we'd need to use pdf.js
    // For now, we'll estimate based on file size or let backend validate
    // Approximate: 25 pages ~ 500KB max for typical scripts
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum 5MB allowed.');
      return;
    }

    // Estimate page count (will be validated by backend)
    const estimatedPages = Math.ceil(file.size / 20000); // rough estimate

    updateFormData({
      scriptFile: file,
      pageCount: Math.min(estimatedPages, 25),
    });
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

  // Step 5: Submit
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Read file as base64
      const reader = new FileReader();
      const scriptFileBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(formData.scriptFile!);
      });

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

      router.push(`/success?scriptId=${response.scriptId}&title=${encodeURIComponent(formData.title.trim())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload script');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center items-center gap-0 mb-6">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              s === step
                ? 'bg-accent text-white'
                : s < step
                ? 'bg-success text-white'
                : 'bg-secondary-bg text-text-secondary'
            }`}
          >
            {s < step ? '✓' : s}
          </div>
          {s < 5 && (
            <div
              className={`w-5 h-0.5 ${s < step ? 'bg-success' : 'bg-secondary-bg'}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-xl mx-auto px-4 py-8">
        {renderStepIndicator()}

        <div className="bg-card border border-border rounded-xl p-6">
          {/* Step 1: Writer Details */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">Enter Your Details</h2>
              <p className="text-text-secondary text-sm mb-6">
                We'll send an OTP to verify your mobile number
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.writerName}
                    onChange={(e) => updateFormData({ writerName: e.target.value })}
                    disabled={loading}
                    maxLength={50}
                    className="w-full px-4 py-3 bg-secondary-bg border border-border rounded-lg text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Mobile Number *
                  </label>
                  <div className="flex gap-2">
                    <div className="px-4 py-3 bg-secondary-bg border border-border rounded-lg text-foreground font-semibold">
                      +91
                    </div>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={formData.writerMobile.replace('+91', '')}
                      onChange={(e) => updateFormData({ writerMobile: e.target.value.replace(/\D/g, '') })}
                      disabled={loading}
                      maxLength={10}
                      className="flex-1 px-4 py-3 bg-secondary-bg border border-border rounded-lg text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
                    />
                  </div>
                </div>

                {error && <p className="text-error text-sm text-center">{error}</p>}

                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Send OTP'}
                </button>
              </div>
            </>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">Verify Mobile</h2>
              <p className="text-text-secondary text-sm mb-6">
                Enter the 6-digit OTP sent to {formData.writerMobile}
              </p>

              <div className="my-8">
                <OTPInput value={otp} onChange={setOtp} disabled={loading} />
              </div>

              {error && <p className="text-error text-sm text-center mb-4">{error}</p>}

              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center mb-4"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Verify'}
              </button>

              <button
                onClick={handleResendOTP}
                disabled={otpCountdown > 0 || loading}
                className="w-full py-3 text-accent font-semibold disabled:text-text-muted"
              >
                {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Resend OTP'}
              </button>

              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-full py-3 text-text-secondary font-medium"
              >
                Change Mobile Number
              </button>
            </>
          )}

          {/* Step 3: Script Details */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">Script Details</h2>
              <p className="text-text-secondary text-sm mb-6">
                Upload your script and provide details
              </p>

              <div className="space-y-4">
                {/* PDF Upload */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Script PDF * (max 25 pages)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-full p-6 border-2 border-dashed border-border rounded-xl hover:border-accent transition-colors disabled:opacity-50"
                  >
                    {formData.scriptFile ? (
                      <div className="text-center">
                        <p className="font-semibold text-foreground truncate">{formData.scriptFile.name}</p>
                        <p className="text-sm text-success mt-1">
                          {(formData.scriptFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <p className="text-text-secondary">Tap to select PDF file</p>
                    )}
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter script title"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    disabled={loading}
                    maxLength={100}
                    className="w-full px-4 py-3 bg-secondary-bg border border-border rounded-lg text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                </div>

                {/* Logline */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Logline * (max 200 chars)
                  </label>
                  <textarea
                    placeholder="One-line description of your story"
                    value={formData.logline}
                    onChange={(e) => updateFormData({ logline: e.target.value })}
                    disabled={loading}
                    maxLength={200}
                    rows={2}
                    className="w-full px-4 py-3 bg-secondary-bg border border-border rounded-lg text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50 resize-none"
                  />
                  <p className="text-xs text-text-muted text-right mt-1">{formData.logline.length}/200</p>
                </div>

                {/* Synopsis */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Synopsis *
                  </label>
                  <textarea
                    placeholder="Brief summary of your story"
                    value={formData.synopsis}
                    onChange={(e) => updateFormData({ synopsis: e.target.value })}
                    disabled={loading}
                    maxLength={2500}
                    rows={5}
                    className="w-full px-4 py-3 bg-secondary-bg border border-border rounded-lg text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Genre *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => updateFormData({ genre })}
                        disabled={loading}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          formData.genre === genre
                            ? 'bg-foreground text-background'
                            : 'bg-secondary-bg text-foreground border border-border hover:border-foreground'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Language
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => updateFormData({ language: lang })}
                        disabled={loading}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          formData.language === lang
                            ? 'bg-foreground text-background'
                            : 'bg-secondary-bg text-foreground border border-border hover:border-foreground'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-error text-sm text-center">{error}</p>}

                <button
                  onClick={handleScriptDetailsNext}
                  disabled={loading}
                  className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 4: Copyright */}
          {step === 4 && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">Copyright Information</h2>
              <p className="text-text-secondary text-sm mb-6">
                Do you have a copyright certificate for this script?
              </p>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => updateFormData({ hasCopyright: true })}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    formData.hasCopyright
                      ? 'bg-accent/10 border-2 border-accent text-accent'
                      : 'bg-secondary-bg border border-border text-text-secondary'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => updateFormData({ hasCopyright: false, copyrightNumber: '' })}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    !formData.hasCopyright
                      ? 'bg-accent/10 border-2 border-accent text-accent'
                      : 'bg-secondary-bg border border-border text-text-secondary'
                  }`}
                >
                  No
                </button>
              </div>

              {formData.hasCopyright && (
                <div className="mb-6">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Certificate Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., L-12345/2024"
                    value={formData.copyrightNumber}
                    onChange={(e) => updateFormData({ copyrightNumber: e.target.value })}
                    disabled={loading}
                    maxLength={50}
                    className="w-full px-4 py-3 bg-secondary-bg border border-border rounded-lg text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                </div>
              )}

              {error && <p className="text-error text-sm text-center mb-4">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  disabled={loading}
                  className="px-6 py-3 text-text-secondary font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleCopyrightNext}
                  disabled={loading}
                  className="flex-1 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 5: Review & Submit */}
          {step === 5 && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">Review & Submit</h2>
              <p className="text-text-secondary text-sm mb-6">
                Confirm your details and submit your script
              </p>

              <div className="bg-secondary-bg rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Writer</span>
                  <span className="font-semibold text-foreground">{formData.writerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Mobile</span>
                  <span className="font-semibold text-foreground">{formData.writerMobile}</span>
                </div>
                <div className="border-t border-divider my-2" />
                <div className="flex justify-between">
                  <span className="text-text-secondary">Title</span>
                  <span className="font-semibold text-foreground text-right flex-1 ml-4 truncate">{formData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Genre</span>
                  <span className="font-semibold text-foreground">{formData.genre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Language</span>
                  <span className="font-semibold text-foreground">{formData.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Copyright</span>
                  <span className="font-semibold text-foreground">
                    {formData.hasCopyright ? formData.copyrightNumber : 'No'}
                  </span>
                </div>
              </div>

              {error && <p className="text-error text-sm text-center mb-4">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(4)}
                  disabled={loading}
                  className="px-6 py-3 text-text-secondary font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-success text-white font-bold rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Submit Script'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
