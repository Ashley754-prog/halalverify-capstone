import React from 'react';
import { LogIn, ShieldAlert, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal';

export default function AuthPromptModal({
  isOpen,
  onClose,
  onNavigate,
  actionTitle = 'Contribute to the Registry',
}) {
  const handleLogin = () => {
    onClose();
    onNavigate?.('login');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
    >
      <div className="text-center py-2 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
          <ShieldAlert size={28} />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900">
            Account Required to Contribute
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            To prevent spam and protect the verified Zamboanga City halal registry, only registered users can submit new establishments, logos, or products for verification.
          </p>
        </div>

        <div className="rounded-xl bg-emerald-950/5 border border-emerald-600/20 p-3 text-left flex items-start gap-3 text-xs text-emerald-900">
          <Sparkles size={18} className="shrink-0 text-emerald-600 mt-0.5" />
          <span>
            Contributing takes under a minute! Every submission is audited by local certifying administrators and credited to your account.
          </span>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <LogIn size={18} />
            <span>Log In or Create Account</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition"
          >
            Cancel and Continue Browsing
          </button>
        </div>
      </div>
    </Modal>
  );
}
