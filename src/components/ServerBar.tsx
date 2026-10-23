import React, { useState, useEffect } from 'react';
import {
  Server,
  Cloud,
  Laptop,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Zap,
  Activity,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  checkBackendHealth,
  getLastApiDebugLog,
  DEFAULT_RENDER_URL
} from '../services/api';
import { BackendMonitorModal } from './BackendMonitorModal';

interface ServerBarProps {
  isBackendConnected: boolean;
  onServerChange: () => Promise<void>;
  onGrantXp?: (amount: number) => void;
}

export const ServerBar: React.FC<ServerBarProps> = ({
  isBackendConnected,
  onServerChange,
  onGrantXp
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(getApiBaseUrl());
  const [inputUrl, setInputUrl] = useState<string>(getApiBaseUrl());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [showMonitorModal, setShowMonitorModal] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [latency, setLatency] = useState<number | null>(null);

  // Sync internal state with active URL
  useEffect(() => {
    const url = getApiBaseUrl();
    setCurrentUrl(url);
    setInputUrl(url);
  }, []);

  const handleConnect = async (targetUrl?: string) => {
    const urlToTest = (targetUrl !== undefined ? targetUrl : inputUrl).trim().replace(/\/$/, '');
    if (!urlToTest) return;

    setIsConnecting(true);
    setConnectionMessage('Pinging server...');
    setApiBaseUrl(urlToTest);
    setCurrentUrl(urlToTest);
    setInputUrl(urlToTest);

    const startTime = Date.now();
    const isLive = await checkBackendHealth();
    const elapsed = Date.now() - startTime;
    setLatency(elapsed);
    setIsConnecting(false);

    if (isLive) {
      setConnectionMessage(`Connected successfully (${elapsed}ms)!`);
      if (onGrantXp) onGrantXp(25);
      confetti({
        particleCount: 45,
        spread: 50,
        origin: { y: 0.1 }
      });
    } else {
      setConnectionMessage('Server unreachable. Running in offline browser mode.');
    }

    await onServerChange();

    setTimeout(() => {
      setConnectionMessage(null);
    }, 4500);
  };

  const handlePresetSelect = (url: string) => {
    setInputUrl(url);
    handleConnect(url);
  };

  const isRenderPresetActive =
    currentUrl.includes('project-eklavya-5yuy.onrender.com') ||
    currentUrl === DEFAULT_RENDER_URL;

  const isLocalhostActive =
    currentUrl.includes('127.0.0.1:8000') || currentUrl.includes('localhost:8000');

  return (
    <div className="w-full bg-[#1E3B2A] text-stone-100 border-b border-[#8C6D23]/30 shadow-md transition-all select-none relative z-30">
      {/* Collapsed Bar View */}
      {isCollapsed ? (
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-stone-300">
              Backend:{' '}
              <span className="font-mono text-amber-200 truncate max-w-[220px] sm:max-w-sm inline-block align-bottom">
                {currentUrl}
              </span>
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isBackendConnected
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isBackendConnected ? 'ONLINE' : 'FALLBACK'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleConnect(currentUrl)}
              disabled={isConnecting}
              className="text-[11px] px-2 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isConnecting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="text-[11px] text-amber-300 hover:text-white flex items-center gap-0.5 font-bold cursor-pointer"
            >
              <span>Server Settings</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Full Expanded Server Bar */
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Status & Identity */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${
                  isBackendConnected ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}
              >
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-100 tracking-wide uppercase">
                    API Server Gateway
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isBackendConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    {isBackendConnected ? 'LIVE CONNECTED' : 'OFFLINE FALLBACK'}
                  </span>
                  {latency !== null && (
                    <span className="text-[10px] font-mono text-stone-400 hidden sm:inline">
                      {latency}ms
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-300 leading-tight">
                  FastAPI & Supabase pgvector endpoints for RAG query and document ingestion
                </p>
              </div>
            </div>

            {/* Center: Server Input Bar */}
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleConnect();
                  }}
                  placeholder="Enter API Base URL (e.g., https://project-eklavya-5yuy.onrender.com)"
                  className="w-full text-xs font-mono px-3 py-1.5 pr-20 rounded-xl bg-black/30 border border-stone-600 text-emerald-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleConnect()}
                  disabled={isConnecting}
                  className="absolute right-1 top-1 bottom-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePresetSelect(DEFAULT_RENDER_URL)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    isRenderPresetActive
                      ? 'bg-amber-400 text-[#1E3B2A] shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-stone-200 border border-white/10'
                  }`}
                  title="Connect to hosted Render FastAPI server"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Render Cloud</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('http://127.0.0.1:8000')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    isLocalhostActive
                      ? 'bg-amber-400 text-[#1E3B2A] shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-stone-200 border border-white/10'
                  }`}
                  title="Connect to local FastAPI server on port 8000"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Local:8000</span>
                </button>
              </div>
            </div>

            {/* Right: Actions & Collapse */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowMonitorModal(true)}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 flex items-center gap-1 border border-white/10 cursor-pointer transition-colors"
                title="Open API monitor and schema docs"
              >
                <Activity className="w-3 h-3 text-amber-300" />
                <span className="hidden md:inline">Inspect Logs</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Minimize server bar"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toast / Status Notification Message */}
          {connectionMessage && (
            <div className="mt-2 text-[11px] flex items-center gap-1.5 text-amber-300 bg-black/40 px-3 py-1 rounded-lg border border-amber-500/30">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{connectionMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Backend Monitor Modal */}
      <BackendMonitorModal
        isOpen={showMonitorModal}
        onClose={() => setShowMonitorModal(false)}
        isBackendConnected={isBackendConnected}
        onStatusChange={async () => {
          await onServerChange();
        }}
      />
    </div>
  );
};
