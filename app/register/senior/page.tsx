'use client';

import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';

export default function RegisterSeniorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const rawBase64 = result.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
        resolve(rawBase64);
      };
      reader.onerror = () => reject(new Error('Failed to read ID image file.'));
      reader.readAsDataURL(file);
    });
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedFile) {
      setError('Verification Failed: Please upload a photo of your student ID card.');
      return;
    }

    setIsLoading(true);

    try {
      const idImageBase64 = await convertFileToBase64(selectedFile);

      const res = await fetch('/api/auth/register/senior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          college,
          branch,
          year,
          idImageBase64,
          mimeType: selectedFile.type || 'image/jpeg',
        }),
      });

      if (res.status === 404) {
        throw new Error('404 Error: The API route is missing. (Developer: Restart the Next.js dev server!)');
      }

      const data = await res.json();

      if (!res.ok) {
        const reason = data.error || 'Student ID verification failed.';
        throw new Error(reason.startsWith('Verification Failed:') ? reason : `Verification Failed: ${reason}`);
      }

      setSuccess('Student ID verified successfully! Redirecting to Senior Rating...');
      window.location.href = data.redirectTo || '/rating';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Senior registration failed.';
      setError(message.startsWith('Verification Failed:') ? message : `Verification Failed: ${message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            CC
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
            CollegeConnect
          </span>
        </Link>

        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Automated Student ID Verification
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Register as Verified Senior
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Upload your university ID card. Automated verification confirms your enrolled status in real-time.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
          {error && (
            <div className="p-4 bg-red-600 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-md flex items-start gap-2.5">
              <svg className="w-5 h-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1 leading-snug">{error}</div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-md flex items-center gap-2.5">
              <svg className="w-5 h-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex-1 leading-snug">{success}</div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aman Verma"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu or gmail"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  College / Institute
                </label>
                <input
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. IIT Bombay, NIT Trichy"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Branch / Major
                </label>
                <input
                  type="text"
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Current Year or Graduation Year
              </label>
              <input
                type="text"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 3rd Year or 2026"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Upload Student ID Card Photo
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl transition-colors bg-slate-50/50 dark:bg-slate-800/40">
                <div className="space-y-2 text-center">
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img
                        src={previewUrl}
                        alt="ID Card Preview"
                        className="max-h-36 mx-auto rounded-xl shadow-md border border-slate-200 dark:border-slate-700 object-contain"
                      />
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ {selectedFile?.name} (Ready for AI verification)
                      </p>
                    </div>
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-slate-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <label
                      htmlFor="id-card-upload"
                      className="relative cursor-pointer rounded-md font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <span>Upload ID card file</span>
                      <input
                        id="id-card-upload"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        required
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>{' '}
                    <span>(JPEG, PNG, WebP)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Must clearly display your name, institute, and major
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Verifying your University ID...</span>
                </>
              ) : (
                'Verify ID & Create Senior Account →'
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Already verified?{' '}
            <Link
              href="/login"
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Sign in to Senior Inbox
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
