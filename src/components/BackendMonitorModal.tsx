import React, { useState, useEffect } from 'react';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  Activity,
  Database,
  RefreshCw,
  ExternalLink,
  Code,
  Stethoscope,
  ShieldAlert,
  ArrowRight,
  Info,
  Laptop,
  Cloud
} from 'lucide-react';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  checkBackendHealth,
  getLastApiDebugLog,
  runFullBackendDiagnostics,
  EndpointDiagnostic,
  DEFAULT_RENDER_URL
} from '../services/api';

interface BackendMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBackendConnected: boolean;
  onStatusChange: (isLive: boolean) => void;
}

export const BackendMonitorModal: React.FC<BackendMonitorModalProps> = ({
  isOpen,
  onClose,
  isBackendConnected,
  onStatusChange
}) => {
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [isPinging, setIsPinging] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'doctor' | 'quickstart' | 'inspector' | 'schema'>('doctor');
  const [diagnostics, setDiagnostics] = useState<EndpointDiagnostic[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticRunTime, setDiagnosticRunTime] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiUrl(getApiBaseUrl());
      // Auto-run diagnostics on open if not run yet
      if (diagnostics.length === 0) {
        handleRunDiagnostics(getApiBaseUrl());
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const debugLog = getLastApiDebugLog();

  const handlePing = async (targetUrl?: string) => {
    const url = (targetUrl || apiUrl).trim().replace(/\/$/, '');
    setIsPinging(true);
    setApiBaseUrl(url);
    setApiUrl(url);
    const live = await checkBackendHealth();
    setIsPinging(false);
    onStatusChange(live);
    handleRunDiagnostics(url);
  };

  const handleRunDiagnostics = async (customUrl?: string) => {
    const url = (customUrl || apiUrl).trim().replace(/\/$/, '');
    setIsRunningDiagnostics(true);
    try {
      const results = await runFullBackendDiagnostics(url);
      setDiagnostics(results);
      setDiagnosticRunTime(new Date().toLocaleTimeString());
      const hasOnline = results.some(r => r.status === 'online');
      onStatusChange(hasOnline);
    } catch (err) {
      console.error('Diagnostics error:', err);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const uvicornCommand = 'uvicorn main:app --reload --host 127.0.0.1 --port 8000';
  const pipCommand = 'pip install fastapi uvicorn supabase sentence-transformers groq pydantic';
  const ngrokCommand = 'npx localtunnel --port 8000';

  const hasAny500 = diagnostics.some(d => d.statusCode === 500);
  const hasMixedContentWarning = apiUrl.startsWith('http://127.0.0.1') || apiUrl.startsWith('http://localhost');

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#FAF9F5] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
              isBackendConnected ? 'bg-[#284E38]' : 'bg-amber-600'
            }`}>
              <Server className="w-5 h-5 text-amber-300" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#284E38]">
                  Backend Connection Doctor & Gateway
                </h3>
                {isBackendConnected ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    ONLINE
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    FALLBACK ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Live endpoint diagnostics for your FastAPI, pgvector, and LLM services
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-bold p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 px-6 pt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('doctor')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'doctor'
                ? 'border-[#284E38] text-[#284E38] bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#8C6D23]" />
            Live Diagnostics Suite
            {hasAny500 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'inspector'
                ? 'border-[#284E38] text-[#284E38] bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Last API Call Log
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quickstart')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'quickstart'
                ? 'border-[#284E38] text-[#284E38] bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Local Python Setup
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-[#284E38] text-[#284E38] bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Supabase DB Schema
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-left">
          {/* Active Target Server Input */}
          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#8C6D23]" />
                Active Target Backend URL
              </label>
              {diagnosticRunTime && (
                <span className="text-[10px] text-stone-400 font-mono">
                  Last tested: {diagnosticRunTime}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                placeholder="https://project-eklavya-5yuy.onrender.com"
                className="flex-1 text-xs font-mono px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
              />
              <button
                type="button"
                onClick={() => handlePing(apiUrl)}
                disabled={isPinging || isRunningDiagnostics}
                className="px-5 py-2.5 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPinging || isRunningDiagnostics ? 'animate-spin' : ''}`} />
                <span>{isRunningDiagnostics ? 'Testing...' : 'Test All Endpoints'}</span>
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200/60">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Quick Presets:</span>
              <button
                type="button"
                onClick={() => handlePing(DEFAULT_RENDER_URL)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  apiUrl.includes('project-eklavya-5yuy.onrender.com')
                    ? 'bg-[#284E38] text-white border-[#284E38] shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                Render Cloud (project-eklavya)
              </button>
              <button
                type="button"
                onClick={() => handlePing('http://127.0.0.1:8000')}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  apiUrl.includes('127.0.0.1:8000') || apiUrl.includes('localhost:8000')
                    ? 'bg-[#284E38] text-white border-[#284E38] shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                Localhost:8000
              </button>
            </div>
          </div>

          {/* TAB 1: DOCTOR (Interactive Diagnostic Suite) */}
          {activeTab === 'doctor' && (
            <div className="space-y-4">
              {/* Mixed Content Warning if user selected localhost on HTTPS preview */}
              {hasMixedContentWarning && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Browser Security Notice: Mixed Content Restriction</span>
                  </div>
                  <p className="leading-relaxed">
                    This preview is running securely on <strong>HTTPS</strong>. Web browsers strictly block plain <code>http://localhost:8000</code> requests from HTTPS pages.
                  </p>
                  <div className="bg-amber-100/70 p-2.5 rounded-xl font-mono text-[11px] flex items-center justify-between">
                    <span>{ngrokCommand}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ngrokCommand, 'localtunnel')}
                      className="text-amber-800 hover:text-amber-950 font-bold ml-2 underline text-xs"
                    >
                      {copiedCmd === 'localtunnel' ? 'Copied!' : 'Copy Command'}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Run the command above in your local terminal to get an HTTPS tunnel URL, then paste it into the URL box! Or use the pre-configured <strong>Render Cloud</strong> preset.
                  </p>
                </div>
              )}

              {/* Specific Solution for Render 500 error */}
              {hasAny500 && (
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-300 text-xs text-orange-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-orange-900">
                    <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Why did /api/query or /api/upload return HTTP 500 on Render?</span>
                  </div>
                  <p className="leading-relaxed text-stone-700">
                    Your frontend is <strong>successfully connected</strong> to Render (ping & user sync pass with 200 OK). However, when FastAPI runs the AI Mentor or upload code, Python throws an unhandled exception because <strong>API keys or DB variables are missing in your Render service environment</strong>.
                  </p>
                  <div className="p-3 bg-white rounded-xl border border-orange-200 space-y-1.5 text-stone-800">
                    <span className="font-bold text-xs text-[#284E38] block">How to enable real AI responses on Render in 2 minutes:</span>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                      <li>Open <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-bold">dashboard.render.com</a> and click your <code>project-eklavya</code> web service.</li>
                      <li>Navigate to the <strong>Environment</strong> tab on the left sidebar.</li>
                      <li>Add your key: <code>GROQ_API_KEY</code> (or <code>GEMINI_API_KEY</code>) and your <code>SUPABASE_URL</code> + <code>SUPABASE_KEY</code>.</li>
                      <li>Click <strong>Save Changes</strong> (Render will redeploy with active AI in ~45s).</li>
                    </ol>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Meanwhile, Project Eklavya's pedagogical tutor automatically answers every question and preserves your uploaded PDFs so your learning workflow is never broken!
                  </p>
                </div>
              )}

              {/* Endpoint Diagnostics Results Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 pb-1">
                  <span>Backend Endpoint Test Results:</span>
                  <span className="text-[11px] font-normal text-stone-500">
                    {diagnostics.filter(d => d.status === 'online').length} of {diagnostics.length} healthy
                  </span>
                </div>

                <div className="space-y-2">
                  {diagnostics.map((diag, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        diag.status === 'online'
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : diag.statusCode === 500
                          ? 'bg-amber-50/70 border-amber-300'
                          : 'bg-red-50/60 border-red-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            diag.method === 'GET' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {diag.method}
                          </span>
                          <span className="font-mono font-bold text-stone-900 text-xs">
                            {diag.endpoint}
                          </span>
                          <span className="text-stone-500 text-[11px]">
                            ({diag.name})
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-tight">
                          {diag.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 sm:self-center">
                        <span className="text-[11px] font-mono text-stone-500">
                          {diag.latencyMs}ms
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                          diag.status === 'online'
                            ? 'bg-emerald-600 text-white'
                            : diag.statusCode === 500
                            ? 'bg-amber-500 text-white'
                            : 'bg-red-600 text-white'
                        }`}>
                          {diag.statusCode ? `HTTP ${diag.statusCode}` : 'OFFLINE'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {diagnostics.length === 0 && !isRunningDiagnostics && (
                    <div className="p-8 text-center text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">
                      Click "Test All Endpoints" above to probe your backend.
                    </div>
                  )}

                  {isRunningDiagnostics && (
                    <div className="p-8 text-center text-stone-600 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#284E38]" />
                      <p className="text-xs font-bold">Probing FastAPI server & validating database routes...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSPECTOR (Live API Call Log) */}
          {activeTab === 'inspector' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Last Outgoing API Call:</span>
                <span className="text-[11px] font-mono text-[#8C6D23] font-bold bg-[#FCECD4] px-2 py-0.5 rounded">
                  {debugLog.endpoint || 'POST /api/query'}
                </span>
              </div>

              <div className="bg-stone-900 text-stone-100 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-64 leading-relaxed">
                <div className="text-stone-400 mb-1">// Request Payload:</div>
                <pre>{JSON.stringify(debugLog.requestPayload, null, 2)}</pre>
                <div className="text-stone-400 my-2 pt-2 border-t border-stone-800">
                  // Response Received ({debugLog.latencyMs}ms):
                </div>
                <pre>{JSON.stringify(debugLog.responseSummary, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: QUICKSTART (Local Python Setup) */}
          {activeTab === 'quickstart' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-600 leading-relaxed">
                Run your FastAPI server locally on your machine with Sentence-Transformers and Groq / Supabase:
              </div>

              {/* Step 1: Install */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Step 1: Install Dependencies
                </span>
                <div className="flex items-center justify-between bg-stone-900 text-stone-100 rounded-xl p-3 text-xs font-mono">
                  <span className="truncate pr-2">{pipCommand}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(pipCommand, 'pip')}
                    className="text-stone-400 hover:text-white p-1 rounded transition-colors shrink-0"
                    title="Copy to clipboard"
                  >
                    {copiedCmd === 'pip' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Step 2: Start */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Step 2: Launch FastAPI Server on Port 8000
                </span>
                <div className="flex items-center justify-between bg-stone-900 text-stone-100 rounded-xl p-3 text-xs font-mono">
                  <span className="truncate pr-2">{uvicornCommand}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(uvicornCommand, 'uvicorn')}
                    className="text-stone-400 hover:text-white p-1 rounded transition-colors shrink-0"
                    title="Copy to clipboard"
                  >
                    {copiedCmd === 'uvicorn' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Step 3: Tunnel for HTTPS Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Step 3: Expose Localhost for HTTPS Browser Preview
                </span>
                <div className="flex items-center justify-between bg-stone-900 text-stone-100 rounded-xl p-3 text-xs font-mono">
                  <span className="truncate pr-2">{ngrokCommand}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ngrokCommand, 'ngrok')}
                    className="text-stone-400 hover:text-white p-1 rounded transition-colors shrink-0"
                    title="Copy to clipboard"
                  >
                    {copiedCmd === 'ngrok' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-3 text-xs text-stone-700">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-[#284E38] block mb-1">1. profiles</span>
                <code className="text-[11px] font-mono text-stone-600">
                  user_id (PK text), name, xp, streak, last_active, subjects, class_grade, course_type, board
                </code>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-[#284E38] block mb-1">2. user_documents</span>
                <code className="text-[11px] font-mono text-stone-600">
                  id (PK uuid), user_id (FK), filename, custom_name, subject, created_at
                </code>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-[#284E38] block mb-1">3. curriculum_documents</span>
                <code className="text-[11px] font-mono text-stone-600">
                  id (PK bigint), user_id, subject, doc_id (FK), content, embedding (vector 384)
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>Target: <strong className="font-mono text-stone-800">{apiUrl}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-[#284E38] text-white font-bold text-xs hover:bg-[#1E3B2A] transition-all cursor-pointer shadow-xs"
          >
            Close Doctor
          </button>
        </div>
      </div>
    </div>
  );
};
