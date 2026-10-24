import {
  Camera,
  Package,
  MapPin,
  BookOpen,
  ArrowRight,
  ExternalLink,
  LogIn,
} from 'lucide-react';

export default function LandingMarketingSections({ onViewChange }) {
  return (
    <>
      {/* Core Features Grid */}
      <section id="features" className="py-10 sm:py-20 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Core Capabilities
            </h2>
            <p className="mt-2 text-xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed for Everyday Shoppers &amp; Diners
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Complete transparency at your fingertips, whether you are shopping at grocery aisles or dining in Zamboanga City.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {/* Feature 1 */}
            <div
              onClick={() => onViewChange('scanner')}
              className="group w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30 sm:rounded-2xl sm:p-6"
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-3 sm:mb-4 group-hover:scale-110 transition duration-200">
                <Camera size={18} className="sm:h-[22px] sm:w-[22px]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition">
                Halal Scanner &amp; OCR
              </h3>
              <p className="mt-1 text-xs sm:mt-1.5 sm:text-sm text-slate-400 leading-relaxed">
                Scan packaged goods using RapidOCR to analyze ingredient lists for doubtful additives and verify certifying logos.
              </p>
              <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span>Try Scanner</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 2 */}
            <div
              onClick={() => onViewChange('products')}
              className="group w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30 sm:rounded-2xl sm:p-6"
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-3 sm:mb-4 group-hover:scale-110 transition duration-200">
                <Package size={18} className="sm:h-[22px] sm:w-[22px]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition">
                Product Catalog
              </h3>
              <p className="mt-1 text-xs sm:mt-1.5 sm:text-sm text-slate-400 leading-relaxed">
                Search verified consumer food, beverages, and household goods sold across local Zamboanga stores and supermarkets.
              </p>
              <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span>View Products</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 3 */}
            <div
              onClick={() => onViewChange('map')}
              className="group w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30 sm:rounded-2xl sm:p-6"
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-3 sm:mb-4 group-hover:scale-110 transition duration-200">
                <MapPin size={18} className="sm:h-[22px] sm:w-[22px]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition">
                Establishments Map
              </h3>
              <p className="mt-1 text-xs sm:mt-1.5 sm:text-sm text-slate-400 leading-relaxed">
                Interactive map pinpointing halal-certified dining options, restaurants, cafes, and caterers across Zamboanga City.
              </p>
              <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span>Open Map</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 4 */}
            <div
              onClick={() => onViewChange('registry')}
              className="group w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30 sm:rounded-2xl sm:p-6"
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-3 sm:mb-4 group-hover:scale-110 transition duration-200">
                <BookOpen size={18} className="sm:h-[22px] sm:w-[22px]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition">
                Accredited Registry
              </h3>
              <p className="mt-1 text-xs sm:mt-1.5 sm:text-sm text-slate-400 leading-relaxed">
                Direct public lookup of certified bodies, standards, and accreditation statuses recognized under Philippine frameworks.
              </p>
              <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span>Check Registry</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-10 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Simple Workflow
            </h2>
            <p className="mt-2 text-xl sm:text-4xl font-extrabold text-white tracking-tight">
              How HalalVerify Verifies Products
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div
              className="workflow-step flex min-h-[200px] flex-col items-center rounded-xl border border-emerald-500/50 bg-slate-900/60 p-3 text-center shadow-lg shadow-emerald-950/30 sm:p-5"
              style={{ animationDelay: '0s' }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white shadow-lg shadow-emerald-900/30 sm:h-12 sm:w-12 sm:text-lg">
                1
              </div>
              <h3 className="mb-2 text-sm font-bold text-white sm:text-lg">Snap or Upload</h3>
              <p className="text-[10px] leading-relaxed text-slate-400 sm:text-sm">
                Position your phone camera over the product packaging, ingredient panel, or halal certification logo.
              </p>
            </div>

            <div
              className="workflow-step flex min-h-[200px] flex-col items-center rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-center sm:p-5"
              style={{ animationDelay: '2s' }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white shadow-lg shadow-emerald-900/30 sm:h-12 sm:w-12 sm:text-lg">
                2
              </div>
              <h3 className="mb-2 text-sm font-bold text-white sm:text-lg">OCR Parsing &amp; Match</h3>
              <p className="text-[10px] leading-relaxed text-slate-400 sm:text-sm">
                RapidOCR extracts textual content and tests each word against verified halal listings and prohibited additives.
              </p>
            </div>

            <div
              className="workflow-step flex min-h-[200px] flex-col items-center rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-center sm:p-5"
              style={{ animationDelay: '4s' }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white shadow-lg shadow-emerald-900/30 sm:h-12 sm:w-12 sm:text-lg">
                3
              </div>
              <h3 className="mb-2 text-sm font-bold text-white sm:text-lg">Transparent Verdict</h3>
              <p className="text-[10px] leading-relaxed text-slate-400 sm:text-sm">
                Receive an instant compliance verdict with detailed reasons, certifier logo verification, and guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .workflow-step {
          animation: workflowStepCycle 6s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes workflowStepCycle {
          0%, 24% {
            opacity: 1;
            transform: translateY(0) scale(1);
            border-color: rgba(52, 211, 153, 0.6);
            box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.15), 0 16px 25px rgba(6, 78, 59, 0.25);
          }
          28%, 31% {
            opacity: 0.8;
            transform: translateY(4px) scale(0.985);
            border-color: rgba(51, 65, 85, 1);
            box-shadow: none;
          }
          32%, 100% {
            opacity: 0.35;
            transform: translateY(8px) scale(0.97);
            border-color: rgba(51, 65, 85, 1);
            box-shadow: none;
          }
        }
      `}</style>

      {/* Recognized Certifiers & Scope Section */}
      <section id="certifiers" className="py-10 sm:py-20 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Philippine Halal Accreditation
            </h2>
            <p className="mt-2 text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Supported Certifying Bodies &amp; Local Scope
            </p>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              HalalVerify is focused specifically on the local food ecosystem of <strong>Zamboanga City</strong>, recognizing certifications issued by authorized Islamic bodies such as the National Commission on Muslim Filipinos (NCMF), Halal Development Institute of the Philippines (HDIP), Islamic Da&apos;wah Council of the Philippines (IDCP), and international mutual recognition partners.
            </p>

            <div className="mt-6 sm:mt-8">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Philippine Halal Bodies</h3>
              <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 text-left">
                {[
                  {
                    name: 'NCMF',
                    fullName: 'National Commission on Muslim Filipinos',
                    description: 'Government agency supporting Muslim affairs and halal development in the Philippines.',
                    url: 'https://www.foi.gov.ph/agencies/ncmf/',
                  },
                  {
                    name: 'HDIP',
                    fullName: 'Halal Development Institute of the Philippines',
                    description: 'Philippine halal development and certification organization serving local businesses.',
                    url: 'https://www.hdiphilippineshalal.com/',
                  },
                  {
                    name: 'IDCP',
                    fullName: "Islamic Da'wah Council of the Philippines",
                    description: 'Islamic organization providing halal certification and related community services.',
                    url: 'https://www.idcphalal.org/',
                  },
                  {
                    name: 'DTI',
                    fullName: 'Department of Trade and Industry',
                    description: 'Government trade agency supporting Philippine halal industry and export development.',
                    url: 'https://tradelinephilippines.dti.gov.ph/ca/web/tradeline-portal/philippine-halal-export-development',
                  },
                ].map((body) => (
                  <div key={body.name} className="flex min-h-[180px] flex-col rounded-xl border border-slate-800 bg-slate-900 p-2.5 sm:p-4">
                    <span className="font-extrabold text-emerald-400 text-sm sm:text-base">{body.name}</span>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-slate-300 sm:text-[10px]">{body.fullName}</p>
                    <p className="mt-2 flex-1 text-[10px] leading-relaxed text-slate-400 sm:text-[11px]">{body.description}</p>
                    <a
                      href={body.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-1 rounded-md border border-emerald-700/70 px-2 py-1 text-[9px] font-bold text-emerald-300 transition hover:border-emerald-500 hover:bg-emerald-950 sm:px-2.5 sm:py-1.5 sm:text-[10px]"
                    >
                      Official Website <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 sm:mt-10">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">International Halal Bodies</h3>
              <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-2 text-left">
                {[
                  {
                    name: 'JAKIM',
                    fullName: 'Jabatan Kemajuan Islam Malaysia',
                    description: "Malaysia's Department of Islamic Development and national halal certification authority.",
                    url: 'https://www.islam.gov.my/ms/hukum-undang-undang/semakan-status-halal',
                  },
                  {
                    name: 'MUIS',
                    fullName: 'Majlis Ugama Islam Singapura',
                    description: "Singapore's Islamic Religious Council, providing halal certification and verification services.",
                    url: 'https://halal.muis.gov.sg/account/login',
                  },
                ].map((body) => (
                  <div key={body.name} className="flex min-h-[180px] flex-col rounded-xl border border-slate-800 bg-slate-900 p-2.5 sm:p-4">
                    <span className="font-extrabold text-emerald-400 text-sm sm:text-base">{body.name}</span>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-slate-300 sm:text-[10px]">{body.fullName}</p>
                    <p className="mt-2 flex-1 text-[10px] leading-relaxed text-slate-400 sm:text-[11px]">{body.description}</p>
                    <a
                      href={body.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-1 rounded-md border border-emerald-700/70 px-2 py-1 text-[9px] font-bold text-emerald-300 transition hover:border-emerald-500 hover:bg-emerald-950 sm:px-2.5 sm:py-1.5 sm:text-[10px]"
                    >
                      Official Website <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-10 sm:py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-700/50 p-5 sm:p-14 shadow-2xl relative">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl sm:text-4xl font-extrabold text-white tracking-tight">
                Start Verifying Products Today
              </h2>
              <p className="mt-4 text-xs sm:text-base text-slate-300 leading-relaxed">
                Scan your first product, check halal logos, or browse certified local restaurants across Zamboanga City right now.
              </p>

              <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
                <button
                  onClick={() => onViewChange('scanner')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 sm:px-6 sm:py-3.5 font-bold text-white text-xs sm:text-base shadow-lg shadow-emerald-900/50 transition hover:from-emerald-500 hover:to-teal-500"
                >
                  <Camera size={18} className="sm:h-5 sm:w-5" />
                  <span>Open Halal Scanner</span>
                </button>

                <button
                  onClick={() => onViewChange('login')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 sm:px-6 sm:py-3.5 font-semibold text-slate-200 text-xs sm:text-base transition hover:bg-slate-700"
                >
                  <LogIn size={17} className="sm:h-[18px] sm:w-[18px]" />
                  <span>Sign In / Register</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-[#0a0f19] py-7 sm:py-10 text-[11px] sm:text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <img src="/halalverify-logo.png" alt="HalalVerify" className="h-7 w-7 rounded-full opacity-80" />
            <span className="font-bold text-slate-300 tracking-wider">HALALVERIFY ZAMBOANGA</span>
          </div>

          <p className="text-center text-slate-400">
            Capstone Research Project &bull; Western Mindanao State University &bull; Zamboanga City
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <button onClick={() => onViewChange('scanner')} className="hover:text-emerald-400 transition">Scanner</button>
            <button onClick={() => onViewChange('products')} className="hover:text-emerald-400 transition">Catalog</button>
            <button onClick={() => onViewChange('map')} className="hover:text-emerald-400 transition">Map</button>
            <button onClick={() => onViewChange('login')} className="hover:text-emerald-400 transition">Sign In</button>
          </div>
        </div>
      </footer>
    </>
  );
}
