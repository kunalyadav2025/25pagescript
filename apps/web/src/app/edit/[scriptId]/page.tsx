'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GENRES, LANGUAGES, type Genre, type Script } from '@25pagescript/shared';
import { validateIndianMobile, formatMobileWithCountryCode } from '@25pagescript/shared';
import { apiClient } from '@/lib/api';
import { Header, OTPInput, LoadingSpinner } from '@/components';

type Step = 1 | 2 | 3;

interface FormData {
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
}

export default function EditScriptPage() {
  const router = useRouter();
  const params = useParams();
  const scriptId = params.scriptId as string;

  const [script, setScript] = useState<Script | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Load script data
  useEffect(() => {
    const loadScript = async () => {
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
        setError(err instanceof Error ? err.message : 'Failed to load script');
      } finally {
        setLoading(false);
      }
    };
    loadScript();
  }, [scriptId]);

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
    const { writerMobile } = formData;

    if (!validateIndianMobile(writerMobile)) {
      setError('Please enter a valid Indian mobile number');
      return;
    }

    setSubmitting(true);
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
      setSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setSubmitting(true);
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
      setSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpCountdown > 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.sendOTP(formData.writerMobile);
      updateFormData({ otpId: response.otpId });
      setOtp('');
      setOtpCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Submit changes
  const handleSubmit = async () => {
    const { title, logline, synopsis, genre } = formData;

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

    if (formData.hasCopyright && !formData.copyrightNumber.trim()) {
      setError('Please enter your copyright certificate number');
      return;
    }

    setSubmitting(true);
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

      router.push(`/scripts/${scriptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update script');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center items-center gap-0 mb-6">
      {[1, 2, 3].map((s) => (
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
          {s < 3 && (
            <div
              className={`w-5 h-0.5 ${s < step ? 'bg-success' : 'bg-secondary-bg'}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-16 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-text-secondary">Loading script...</p>
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-16 text-center">
          <p className="text-error mb-4">{error || 'Script not found'}</p>
          <button
            onClick={() => router.back()}
            className="text-text-secondary hover:text-foreground"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground text-center mb-6">
          Edit: {script.title}
        </h1>

        {renderStepIndicator()}

        <div className="bg-card border border-border rounded-xl p-6">
          {/* Step 1: Verify Ownership */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">Verify Ownership</h2>
              <p className="text-text-secondary text-sm mb-6">
                Enter the mobile number used to upload this script
              </p>

              <div className="space-y-4">
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
                      disabled={submitting}
                      maxLength={10}
                      className="flex-1 px-4 py-3 bg-secondary-bg border border-border rounded-lg text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
                    />
                  </div>
                </div>

                {error && <p className="text-error text-sm text-center">{error}</p>}

                <button
                  onClick={handleSendOTP}
                  disabled={submitting}
                  className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : 'Send OTP'}
                </button>
              </div>
            </>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">Verify OTP</h2>
              <p className="text-text-secondary text-sm mb-6">
                Enter the 6-digit OTP sent to {formData.writerMobile}
              </p>

              <div className="my-8">
                <OTPInput value={otp} onChange={setOtp} disabled={submitting} />
              </div>

              {error && <p className="text-error text-sm text-center mb-4">{error}</p>}

              <button
                onClick={handleVerifyOTP}
                disabled={submitting}
                className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center mb-4"
              >
                {submitting ? <LoadingSpinner size="sm" /> : 'Verify'}
              </button>

              <button
                onClick={handleResendOTP}
                disabled={otpCountdown > 0 || submitting}
                className="w-full py-3 text-accent font-semibold disabled:text-text-muted"
              >
                {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Resend OTP'}
              </button>

              <button
                onClick={() => setStep(1)}
                disabled={submitting}
                className="w-full py-3 text-text-secondary font-medium"
              >
                Change Mobile Number
              </button>
            </>
          )}

          {/* Step 3: Edit Details */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">Edit Script Details</h2>
              <p className="text-text-secondary text-sm mb-6">
                Update your script information below
              </p>

              <div className="space-y-4">
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
                    disabled={submitting}
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
                    disabled={submitting}
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
                    disabled={submitting}
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
                        disabled={submitting}
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
                        disabled={submitting}
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

                {/* Copyright */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Copyright Certificate
                  </label>
                  <div className="flex gap-3 mb-3">
                    <button
                      onClick={() => updateFormData({ hasCopyright: true })}
                      disabled={submitting}
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
                      disabled={submitting}
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
                    <input
                      type="text"
                      placeholder="e.g., L-12345/2024"
                      value={formData.copyrightNumber}
                      onChange={(e) => updateFormData({ copyrightNumber: e.target.value })}
                      disabled={submitting}
                      maxLength={50}
                      className="w-full px-4 py-3 bg-secondary-bg border border-border rounded-lg text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
                    />
                  )}
                </div>

                {error && <p className="text-error text-sm text-center">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 bg-success text-white font-bold rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : 'Save Changes'}
                </button>

                <button
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="w-full py-3 text-text-secondary font-medium"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
