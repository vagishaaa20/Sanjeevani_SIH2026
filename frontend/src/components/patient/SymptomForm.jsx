import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SymptomForm() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!symptoms.trim()) {
      setError('Please describe your symptoms before continuing.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/triage/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          duration: duration.trim() || null,
          medicalHistory: medicalHistory.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Could not submit your symptoms. Please try again.');

      const data = await res.json();
      // data.requestId identifies this triage request for polling/status
      navigate(`/patient/triage/${data.requestId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-teal-700 tracking-wide uppercase">Sanjeevani</p>
        <h1 className="text-2xl font-semibold text-slate-900 mt-1">Tell us what's going on</h1>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed">
          Describe your symptoms in your own words. A doctor reviews every AI
          recommendation before it reaches you, so take your time and be specific.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="symptoms" className="block text-sm font-medium text-slate-700 mb-1.5">
            What symptoms are you experiencing? <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={5}
            placeholder="E.g. Fever since yesterday evening, mild headache, feeling weak..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-slate-700 mb-1.5">
            How long has this been going on?
          </label>
          <input
            id="duration"
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="E.g. 2 days"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          />
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-slate-700">
              Medical history <span className="text-slate-400 font-normal">(optional)</span>
            </span>
            <span className="text-slate-400 text-sm">{showHistory ? 'Hide' : 'Add'}</span>
          </button>
          {showHistory && (
            <div className="px-4 pb-4">
              <textarea
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                rows={3}
                placeholder="Existing conditions, current medications, allergies..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Sharing this helps the doctor reviewing your case make a more accurate call.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-xl py-3 transition-colors"
        >
          {submitting ? 'Submitting...' : 'Check my symptoms'}
        </button>
      </form>
    </div>
  );
}