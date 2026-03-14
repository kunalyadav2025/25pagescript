'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UploadFormData, Genre, GENRES, LANGUAGES } from '@/types';
import { sendOTP, verifyOTP, uploadScript } from '@/lib/api';
import OTPInput from '@/components/OTPInput';

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

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<UploadFormData>(INITIAL_FORM_DATA);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const response = await sendOTP(mobile);
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
      const response = await verifyOTP(formData.otpId, otp);
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
      const response = await sendOTP(formData.writerMobile);
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
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For web, we'll estimate page count or set a default
      // Actual page count validation happens on backend
      updateFormData({
        scriptFile: file,
        pageCount: 25, // Default, will be validated on backend
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
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

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Step 5: Submit
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const scriptFileBase64 = await fileToBase64(formData.scriptFile!);

      const response = await uploadScript({
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

      // Redirect to success page
      router.push(`/success?scriptId=${response.scriptId}&title=${encodeURIComponent(formData.title.trim())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload script');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center items-center gap-0 mb-8">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
              ${s === step ? 'bg-blue-600 text-white' : ''}
              ${s < step ? 'bg-green-500 text-white' : ''}
              ${s > step ? 'bg-gray-700 text-gray-400' : ''}
            `}
          >
            {s < step ? '✓' : s}
          </div>
          {s < 5 && (
            <div
              className={`w-8 h-0.5 ${s < step ? 'bg-green-500' : 'bg-gray-700'}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Enter Your Details</h2>
        <p className="text-gray-400">We'll send an OTP to verify your mobile number</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Your Name *
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={formData.writerName}
            onChange={(e) => updateFormData({ writerName: e.target.value })}
            maxLength={50}
            disabled={loading}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Mobile Number *
          </label>
          <div className="flex gap-2">
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-semibold">
              +91
            </div>
            <input
              type="tel"
              placeholder="9876543210"
              value={formData.writerMobile.replace('+91', '')}
              onChange={(e) => updateFormData({ writerMobile: e.target.value.replace(/\D/g, '') })}
              maxLength={10}
              disabled={loading}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {error && <div className="text-red-400 text-center">{error}</div>}

      <button
        onClick={handleSendOTP}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Sending...
          </>
        ) : (
          'Send OTP'
        )}
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Verify Mobile</h2>
        <p className="text-gray-400">Enter the 6-digit OTP sent to {formData.writerMobile}</p>
      </div>

      <div className="py-4">
        <OTPInput value={otp} onChange={setOtp} disabled={loading} />
      </div>

      {error && <div className="text-red-400 text-center">{error}</div>}

      <button
        onClick={handleVerifyOTP}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify'
        )}
      </button>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleResendOTP}
          disabled={otpCountdown > 0 || loading}
          className={`text-sm font-semibold ${otpCountdown > 0 ? 'text-gray-500' : 'text-blue-400 hover:text-blue-300'}`}
        >
          {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Resend OTP'}
        </button>
        <button
          onClick={() => setStep(1)}
          disabled={loading}
          className="text-sm text-gray-400 hover:text-white"
        >
          Change Mobile Number
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Script Details</h2>
        <p className="text-gray-400">Upload your script and provide details</p>
      </div>

      <div className="space-y-4">
        {/* PDF Upload */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Script PDF * (max 25 pages)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors disabled:opacity-50"
          >
            {formData.scriptFile ? (
              <div>
                <p className="text-white font-semibold">{formData.scriptFile.name}</p>
                <p className="text-green-400 text-sm mt-1">Click to change file</p>
              </div>
            ) : (
              <p className="text-gray-400">Click to select PDF file</p>
            )}
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Title *
          </label>
          <input
            type="text"
            placeholder="Enter script title"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            maxLength={100}
            disabled={loading}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Logline */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Logline * (max 200 chars)
          </label>
          <textarea
            placeholder="One-line description of your story"
            value={formData.logline}
            onChange={(e) => updateFormData({ logline: e.target.value })}
            maxLength={200}
            rows={2}
            disabled={loading}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 text-right mt-1">{formData.logline.length}/200</p>
        </div>

        {/* Synopsis */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Synopsis *
          </label>
          <textarea
            placeholder="Brief summary of your story"
            value={formData.synopsis}
            onChange={(e) => updateFormData({ synopsis: e.target.value })}
            maxLength={2500}
            rows={4}
            disabled={loading}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
          />
        </div>

        {/* Genre */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
                    ? 'bg-white text-black'
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-500'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
                    ? 'bg-white text-black'
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-500'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="text-red-400 text-center">{error}</div>}

      <button
        onClick={handleScriptDetailsNext}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Copyright Information</h2>
        <p className="text-gray-400">Do you have a copyright certificate for this script?</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => updateFormData({ hasCopyright: true })}
          disabled={loading}
          className={`flex-1 py-4 rounded-lg font-semibold transition-colors border ${
            formData.hasCopyright
              ? 'bg-blue-600/10 border-blue-500 text-blue-400'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => updateFormData({ hasCopyright: false, copyrightNumber: '' })}
          disabled={loading}
          className={`flex-1 py-4 rounded-lg font-semibold transition-colors border ${
            !formData.hasCopyright
              ? 'bg-blue-600/10 border-blue-500 text-blue-400'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
          }`}
        >
          No
        </button>
      </div>

      {formData.hasCopyright && (
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Certificate Number *
          </label>
          <input
            type="text"
            placeholder="e.g., L-12345/2024"
            value={formData.copyrightNumber}
            onChange={(e) => updateFormData({ copyrightNumber: e.target.value })}
            maxLength={50}
            disabled={loading}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        </div>
      )}

      {error && <div className="text-red-400 text-center">{error}</div>}

      <div className="flex gap-4">
        <button
          onClick={() => setStep(3)}
          disabled={loading}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleCopyrightNext}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Review & Submit</h2>
        <p className="text-gray-400">Confirm your details and submit your script</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Writer</span>
          <span className="text-white font-medium">{formData.writerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Mobile</span>
          <span className="text-white font-medium">{formData.writerMobile}</span>
        </div>
        <div className="border-t border-gray-700 my-2" />
        <div className="flex justify-between">
          <span className="text-gray-400">Title</span>
          <span className="text-white font-medium text-right max-w-[60%]">{formData.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Genre</span>
          <span className="text-white font-medium">{formData.genre}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Language</span>
          <span className="text-white font-medium">{formData.language}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">File</span>
          <span className="text-white font-medium text-right max-w-[60%] truncate">{formData.scriptFile?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Copyright</span>
          <span className="text-white font-medium">
            {formData.hasCopyright ? formData.copyrightNumber : 'No'}
          </span>
        </div>
      </div>

      {error && <div className="text-red-400 text-center">{error}</div>}

      <div className="flex gap-4">
        <button
          onClick={() => setStep(4)}
          disabled={loading}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            'Submit Script'
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Scripts
        </Link>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>
      </div>
    </div>
  );
}
