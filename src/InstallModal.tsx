import React, { useState } from 'react';
import { X, Smartphone, Copy, Check, ExternalLink, MoreVertical, PlusSquare } from 'lucide-react';
import { useStore } from './store';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
}

export function InstallModal({ isOpen, onClose, deferredPrompt }: InstallModalProps) {
  const { state } = useStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onClose();
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const isInIframe = window.self !== window.top;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* App Info Header */}
        <div className="flex items-center gap-4 mb-5 pr-8">
          <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
            {state.appIcon ? (
              <img src={state.appIcon} alt="App Icon" className="w-full h-full object-cover" />
            ) : (
              <Smartphone className="w-8 h-8 text-cyan-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {state.appName || 'MockApp Player'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              安卓 Chrome PWA 原生应用安装指南
            </p>
          </div>
        </div>

        {/* Direct Native Install Button (If Browser Triggered Event) */}
        {deferredPrompt ? (
          <button
            onClick={handleNativeInstall}
            className="w-full py-3 mb-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.98]"
          >
            <Smartphone size={18} />
            立即唤起安卓系统安装弹窗
          </button>
        ) : (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 flex items-start gap-2">
            <Smartphone size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong>为什么没直接自动弹窗？</strong>
              <p className="mt-0.5 text-emerald-200/80">
                {isInIframe
                  ? '当前应用处于内嵌预览框中，系统禁止弹窗。请点击下方“在新标签页打开”后再安装。'
                  : '安卓 Chrome 对自动弹窗有严格安全限制。请按照下方步骤通过 Chrome 菜单 1 秒完成安装：'}
              </p>
            </div>
          </div>
        )}

        {/* Visual Installation Steps for Chrome Android */}
        <div className="space-y-3 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>安卓 Chrome 手动安装 3 步指南：</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold shrink-0">
              1
            </div>
            <div className="flex-1">
              点击 Chrome 浏览器右上角 <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono"><MoreVertical size={12} /> 菜单</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold shrink-0">
              2
            </div>
            <div className="flex-1">
              在菜单列表中找到并点击 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-medium"><PlusSquare size={12} /> 添加到主屏幕</span> 或 <strong>安装应用</strong>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold shrink-0">
              3
            </div>
            <div className="flex-1">
              确认添加，应用图标即会以您设定的<strong>自定义 Logo 与名称</strong>出现在手机桌面上！
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleOpenNewTab}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink size={14} />
            新标签页打开
          </button>
          <button
            onClick={handleCopyLink}
            className="py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
          >
            {copied ? <Check size={14} className="text-white" /> : <Copy size={14} />}
            {copied ? '已复制链接' : '复制网址去 Chrome'}
          </button>
        </div>

      </div>
    </div>
  );
}
