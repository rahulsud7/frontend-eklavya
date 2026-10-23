import React, { useState } from 'react';
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
  Code
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, checkBackendHealth, getLastApiDebugLog } from '../services/api';

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
  const [activeTab, setActiveTab] = useState<'quickstart' | 'inspector' | 'schema'>('quickstart');

  if (!isOpen) return null;

  const debugLog = getLastApiDebugLog();

  const handlePing = async () => {
    setIsPinging(true);
    setApiBaseUrl(apiUrl);
    const live = await checkBackendHealth();
    setIsPinging(false);
    onStatusChange(live);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const uvicornCommand = 'uvicorn main:app --reload --host 127.0.0.1 --port 8000';
  const pipCommand = 'pip install fastapi uvicorn supabase sentence-transformers groq pydantic';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#FAF9F5] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
              isBackendConnected ? 'bg-emerald-600' : 'bg-[#284E38]'
            }`}>
              <Server className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-extrabold text-[#284E38] flex items-center gap-2">
                FastAPI & Supabase Backend Link
                {isBackendConnected ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    LIVE ON PORT 8000
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    BROWSER RAG FALLBACK ACTIVE
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-500">
                Connect your local Python/FastAPI server with pgvector embeddings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('quickstart')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'quickstart'
                ? 'border-[#284E38] text-[#284E38] bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Launch Guide
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'inspector'
                ? 'border-[#284E38] text-[#284E38] bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live API Inspector
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'schema'
                ? 'border-[#284E38] text-[#284E38] bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Database Schema
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-left flex-1">
          {/* Base URL Configuration bar */}
          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-stone-200">
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Backend Endpoint URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="flex-1 text-xs font-mono px-3.5 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
              />
              <button
                type="button"
                onClick={handlePing}
                disabled={isPinging}
                className="px-4 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                <span>{isPinging ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setApiUrl('https://project-eklavya-5yuy.onrender.com');
                  setApiBaseUrl('https://project-eklavya-5yuy.onrender.com');
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  apiUrl.includes('project-eklavya-5yuy.onrender.com')
                    ? 'bg-[#284E38] text-white border-[#284E38]'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                }`}
              >
                ☁️ Render Cloud (Live)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApiUrl('http://127.0.0.1:8000');
                  setApiBaseUrl('http://127.0.0.1:8000');
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  apiUrl.includes('127.0.0.1:8000') || apiUrl.includes('localhost:8000')
                    ? 'bg-[#284E38] text-white border-[#284E38]'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                }`}
              >
                💻 Localhost:8000
              </button>
            </div>
          </div>

          {activeTab === 'quickstart' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-600 leading-relaxed">
                Start your FastAPI server locally to process real PDF uploads via Sentence-Transformers and query Groq Llama-3 with Supabase pgvector.
              </div>

              {/* Step 1: Install */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Step 1: Install Python Dependencies
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

              {/* Step 3: Status Note */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Zero-Setup Hybrid Engine:</strong> If your terminal is closed or you are on mobile, Project Eklavya automatically switches to the built-in NCERT vector database. All quizzes, flashcards, and tutor answers continue working seamlessly!
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inspector' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Last Outgoing API Call:</span>
                <span className="text-[11px] font-mono text-[#8C6D23] font-bold bg-[#FCECD4] px-2 py-0.5 rounded">
                  {debugLog.endpoint || 'POST /api/query'}
                </span>
              </div>

              <div className="bg-stone-900 text-stone-100 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed">
                <div className="text-stone-400 mb-1">// Request Payload Sent:</div>
                <pre>{JSON.stringify(debugLog.requestPayload, null, 2)}</pre>
                <div className="text-stone-400 my-2 pt-2 border-t border-stone-800">// Response Received ({debugLog.latencyMs}ms):</div>
                <pre>{JSON.stringify(debugLog.responseSummary, null, 2)}</pre>
              </div>
            </div>
          )}

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
            {isBackendConnected ? 'Live Connection Active' : 'Fallback Engine Ready'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#284E38] text-white font-bold text-xs hover:bg-[#1E3B2A] transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
