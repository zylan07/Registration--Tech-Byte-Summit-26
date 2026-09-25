import React, { useState } from "react";
import { Terminal, Settings, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { getActiveApiUrl, setActiveApiUrl, DEFAULT_API_URL } from "../utils/api";

export default function Header() {
  const [showConfig, setShowConfig] = useState(false);
  const currentUrl = getActiveApiUrl();
  const isConfigured = Boolean(currentUrl && currentUrl.includes("/exec") && !currentUrl.includes("PASTE_EXEC_URL"));
  const [inputUrl, setInputUrl] = useState(currentUrl || "");
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setActiveApiUrl(inputUrl);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      setShowConfig(false);
      window.location.reload();
    }, 900);
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#090b12]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-rose-900 border border-rose-500/30 shadow-lg shadow-rose-950/40 text-white font-mono font-bold text-lg">
            TB
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-2xl tracking-wider text-white">
                TECHBYTE SUMMIT 26
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono tracking-wider font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                OFFICIAL PORTAL
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 tracking-wide uppercase">
              Team Registration Portal
            </p>
          </div>
        </div>

        {/* Right Info & API Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfig(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              isConfigured
                ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/40"
                : "bg-amber-950/30 text-amber-300 border-amber-500/30 hover:bg-amber-900/40"
            }`}
            title="Configure / Verify Google Apps Script Web App Endpoint"
          >
            {isConfigured ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">API Endpoint: Connected</span>
                <span className="md:hidden">Connected</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span className="hidden md:inline">Configure /exec URL</span>
                <span className="md:hidden">Config</span>
              </>
            )}
            <Settings className="w-3 h-3 text-slate-400 ml-1 opacity-70" />
          </button>
        </div>
      </div>

      {/* Backend API Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e121e] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-sm uppercase tracking-wider font-semibold">
                <Terminal className="w-4 h-4" />
                <span>Backend API Configuration</span>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Submissions are posted as <code className="text-rose-300 bg-rose-950/40 px-1 py-0.5 rounded font-mono">text/plain</code> to your Google Apps Script Web App endpoint. Make sure the URL ends with <code className="text-emerald-300 bg-emerald-950/40 px-1 py-0.5 rounded font-mono">/exec</code>.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 font-medium">
                  Google Apps Script Web App URL (/exec):
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full bg-[#080a11] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                />
              </div>

              {savedNotice && (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>API URL saved successfully! Refreshing...</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-mono font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg shadow-rose-950/40 transition-colors"
                >
                  Save Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
