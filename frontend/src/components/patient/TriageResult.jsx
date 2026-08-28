import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const STEPS = ['submitted', 'ai_analysis', 'doctor_review', 'reviewed'];

const URGENCY_STYLES = {
  teleconsultation: { label: 'Teleconsultation recommended', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  doctor_visit: { label: 'In-person doctor visit recommended', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  emergency: { label: 'Seek emergency care now', color: 'bg-rose-50 text-rose-800 border-rose-200' },
};

export default function TriageResult() {
  const { requestId } = useParams();
  const [status, setStatus] = useState('submitted');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let interval;

    const poll = async () => {
      try {
        const res = await fetch(`/api/triage/${requestId}/status`, { credentials: 'include' });
        if (!res.ok) throw new Error('Could not fetch your triage status.');
        const data = await res.json();
        if (!active) return;

        setStatus(data.status);
        if (data.status === 'reviewed') {
          setResult(data.finalResult); // { urgency, guidance, reviewedBy }
          clearInterval(interval);
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    };

    poll();
    interval = setInterval(poll, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [requestId]);

  const currentStepIndex = STEPS.indexOf(status);

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Your triage result</h1>

      {/* Progress stepper */}
      <div className="flex items-center mb-10">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                i <= currentStepIndex ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i < currentStepIndex ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-teal-700' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {status !== 'reviewed' && !error && (
        <div className="text-center py-10">
          <div className="w-10 h-10 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">
            {status === 'submitted' && 'Your symptoms have been received...'}
            {status === 'ai_analysis' && 'Analyzing your symptoms...'}
            {status === 'doctor_review' && 'A doctor is reviewing your case...'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            A licensed doctor confirms every recommendation before it's shown to you.
          </p>
        </div>
      )}

      {status === 'reviewed' && result && (
        <div className={`rounded-xl border px-5 py-4 ${URGENCY_STYLES[result.urgency]?.color}`}>
          <p className="font-semibold">{URGENCY_STYLES[result.urgency]?.label}</p>
          <p className="text-sm mt-2 leading-relaxed">{result.guidance}</p>
          {result.reviewedBy && (
            <p className="text-xs mt-3 opacity-70">Reviewed by Dr. {result.reviewedBy}</p>
          )}
        </div>
      )}
    </div>
  );
}