import {
  Camera,
  Package,
  MapPin,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function LandingMarketingSections({ onViewChange, onScrollToTop, userRole }) {
  return (
    <>
      {/* Core Features Grid */}
      <section
        id="features"
        className="sm:min-h-[calc(100dvh-5rem)] sm:flex sm:flex-col sm:justify-center py-10 sm:py-12 bg-[#EAF3ED] scroll-mt-16 sm:scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-emerald-800">
              Features &bull; Core Capabilities
            </h2>
            <p className="mt-2 text-xl sm:text-4xl font-extrabold text-[#17251F] tracking-tight">
              Designed for Everyday Shoppers &amp; Diners
            </p>
            <p className="mt-2.5 text-sm text-[#52645B]">
              Complete transparency at your fingertips, whether you are shopping at grocery aisles or dining in Zamboanga City.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* Feature 1 */}
            <div
              onClick={() => onViewChange('scanner')}
              className="group w-full cursor-pointer rounded-xl border border-[#DCE7E0] bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/10 sm:rounded-2xl sm:p-5 flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#EAF3ED] border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3 sm:mb-3.5 group-hover:scale-110 transition duration-200">
                  <Camera size={18} className="sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#17251F] group-hover:text-emerald-800 transition">
                  Halal Scanner &amp; OCR
                </h3>
                <p className="mt-1 text-xs sm:mt-1.5 sm:text-sm text-[#52645B] leading-relaxed">
                  Scan packaged goods using RapidOCR to analyze ingredient lists for doubtful additives and verify certifying logos.
                </p>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <span>Try Scanner</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 2 */}
            <div
              onClick={() => onViewChange('products')}
              className="group w-full cursor-pointer rounded-xl border border-[#DCE7E0] bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/10 sm:rounded-2xl sm:p-5 flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#EAF3ED] border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3 sm:mb-3.5 group-hover:scale-110 transition duration-200">
                  <Package size={18} className="sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#17251F] group-hover:text-emerald-800 transition">
                  Product Catalog
                </h3>
                <p className="mt-1 text-xs sm:mt-1.5 sm:text-sm text-[#52645B] leading-relaxed">
                  Search verified consumer food, beverages, and household goods sold across local Zamboanga stores and supermarkets.
                </p>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <span>View Products</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 3 */}
            <div
              onClick={() => onViewChange('map')}
              className="group w-full cursor-pointer rounded-xl border border-[#DCE7E0] bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/10 sm:rounded-2xl sm:p-5 flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#EAF3ED] border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3 sm:mb-3.5 group-hover:scale-110 transition duration-200">
                  <MapPin size={18} className="sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#17251F] group-hover:text-emerald-800 transition">
                  Establishments Map
                </h3>
                <p className="mt-1 text-xs sm:mt-1.5 sm:text-sm text-[#52645B] leading-relaxed">
                  Interactive map pinpointing halal-certified dining options, restaurants, cafes, and caterers across Zamboanga City.
                </p>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <span>Open Map</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 4 */}
            <div
              onClick={() => onViewChange('registry')}
              className="group w-full cursor-pointer rounded-xl border border-[#DCE7E0] bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/10 sm:rounded-2xl sm:p-5 flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#EAF3ED] border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3 sm:mb-3.5 group-hover:scale-110 transition duration-200">
                  <BookOpen size={18} className="sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#17251F] group-hover:text-emerald-800 transition">
                  Accredited Registry
                </h3>
                <p className="mt-1 text-xs sm:mt-1.5 sm:text-sm text-[#52645B] leading-relaxed">
                  Direct public lookup of certified bodies, standards, and accreditation statuses recognized under Philippine frameworks.
                </p>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <span>Check Registry</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="sm:min-h-[calc(100dvh-5rem)] sm:flex sm:flex-col sm:justify-center py-10 sm:py-12 border-t border-[#DCE7E0] scroll-mt-16 sm:scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-emerald-800">
              How It Works &bull; Simple Workflow
            </h2>
            <p className="mt-2 text-xl sm:text-4xl font-extrabold text-[#17251F] tracking-tight">
              How HalalVerify Verifies Products
            </p>
            <p className="mt-2.5 text-sm text-[#52645B]">
              Three automated steps from camera capture to ingredient and certification verification.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div
              className="workflow-step flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-emerald-300 bg-white p-4 text-center shadow-lg shadow-emerald-900/10 sm:p-6"
              style={{ animationDelay: '0s' }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-base font-bold text-white shadow-lg shadow-emerald-900/15 sm:h-12 sm:w-12 sm:text-lg">
                1
              </div>
              <h3 className="mb-2 text-sm font-bold text-[#17251F] sm:text-lg">Snap or Upload</h3>
              <p className="text-xs leading-relaxed text-[#52645B] sm:text-sm">
                Position your phone camera over the product packaging, ingredient panel, or halal certification logo.
              </p>
            </div>

            <div
              className="workflow-step flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-[#DCE7E0] bg-white p-4 text-center sm:p-6"
              style={{ animationDelay: '2s' }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-base font-bold text-white shadow-lg shadow-emerald-900/15 sm:h-12 sm:w-12 sm:text-lg">
                2
              </div>
              <h3 className="mb-2 text-sm font-bold text-[#17251F] sm:text-lg">OCR Parsing &amp; Match</h3>
              <p className="text-xs leading-relaxed text-[#52645B] sm:text-sm">
                RapidOCR extracts textual content and tests each word against verified halal listings and prohibited additives.
              </p>
            </div>

            <div
              className="workflow-step flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-[#DCE7E0] bg-white p-4 text-center sm:p-6"
              style={{ animationDelay: '4s' }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-base font-bold text-white shadow-lg shadow-emerald-900/15 sm:h-12 sm:w-12 sm:text-lg">
                3
              </div>
              <h3 className="mb-2 text-sm font-bold text-[#17251F] sm:text-lg">Transparent Verdict</h3>
              <p className="text-xs leading-relaxed text-[#52645B] sm:text-sm">
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
            border-color: rgba(4, 120, 87, 0.45);
            box-shadow: 0 0 0 1px rgba(4, 120, 87, 0.1), 0 16px 25px rgba(23, 37, 31, 0.08);
          }
          28%, 31% {
            opacity: 0.8;
            transform: translateY(4px) scale(0.985);
            border-color: rgba(220, 231, 224, 1);
            box-shadow: none;
          }
          32%, 100% {
            opacity: 0.35;
            transform: translateY(8px) scale(0.97);
            border-color: rgba(220, 231, 224, 1);
            box-shadow: none;
          }
        }
      `}</style>

      {/* Recognized Certifiers & Scope Section */}
      <section
        id="certifiers"
        className="sm:min-h-[calc(100dvh-5rem)] sm:flex sm:flex-col sm:justify-center py-10 sm:py-12 bg-[#EAF3ED] border-t border-[#DCE7E0] scroll-mt-16 sm:scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-2xl text-center sm:text-left">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-emerald-800">
                Certifiers &bull; Philippine Halal Accreditation
              </h2>
              <p className="mt-1.5 text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#17251F] tracking-tight">
                Supported Certifying Bodies &amp; Local Scope
              </p>
              <p className="mt-2 text-xs sm:text-sm text-[#52645B] leading-relaxed">
                HalalVerify is focused on the local food ecosystem of <strong>Zamboanga City</strong>, recognizing certifications issued by authorized Philippine Islamic bodies alongside international mutual recognition partners.
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end shrink-0">
              <button
                type="button"
                onClick={() => onViewChange('registry', { registryMode: 'hcb' })}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#DCE7E0] bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#17251F] shadow-2xs transition hover:border-emerald-400 hover:bg-[#F4F8F5] cursor-pointer"
              >
                <span>View all 19</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-6 gap-5 lg:gap-6 text-left">
            {/* Framed Group 1: Philippine Halal Bodies (4 of 6 columns on desktop) */}
            <div className="lg:col-span-4 rounded-2xl bg-white/80 border-2 border-emerald-600/25 p-3.5 sm:p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-[#DCE7E0]">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-900">
                  Philippine Halal Bodies
                </h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/60 px-2.5 py-0.5 rounded-full shrink-0">
                  Local &amp; National
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 flex-1">
                {[
                  {
                    name: 'NCMF',
                    tag: 'PH Government',
                    logo: '/logos/NCMF.png',
                    fullName: 'National Commission on Muslim Filipinos',
                    description: 'Government agency supporting Muslim affairs and halal development in the Philippines.',
                    url: 'https://www.foi.gov.ph/agencies/ncmf/',
                  },
                  {
                    name: 'HDIP',
                    tag: 'PH Accredited',
                    logo: '/logos/HDIP.svg',
                    fullName: 'Halal Development Institute of the Philippines',
                    description: 'Philippine halal development and certification organization serving local businesses.',
                    url: 'https://www.hdiphilippineshalal.com/',
                  },
                  {
                    name: 'IDCP',
                    tag: 'PH Pioneer',
                    logo: '/logos/IDCP.svg',
                    fullName: "Islamic Da'wah Council of the Philippines",
                    description: 'Islamic organization providing halal certification and related community services.',
                    url: 'https://www.idcphalal.org/',
                  },
                  {
                    name: 'DTI',
                    tag: 'PH Trade Board',
                    logo: '/logos/DTI.svg',
                    fullName: 'Department of Trade and Industry',
                    description: 'Government trade agency supporting Philippine halal industry and export development.',
                    url: 'https://tradelinephilippines.dti.gov.ph/ca/web/tradeline-portal/philippine-halal-export-development',
                  },
                ].map((body) => (
                  <div key={body.name} className="flex min-h-[240px] flex-col items-center text-center rounded-xl border border-[#DCE7E0] bg-white p-3.5 sm:p-4 shadow-2xs transition hover:border-emerald-600/40 hover:shadow-md">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-emerald-600/30 bg-white p-1 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                      <img src={body.logo} alt={`${body.name} logo`} className="h-full w-full object-contain rounded-full" loading="lazy" />
                    </div>
                    <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {body.tag}
                    </span>
                    <span className="mt-1.5 font-extrabold text-emerald-800 text-sm sm:text-base">{body.name}</span>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#17251F] sm:text-xs leading-snug">{body.fullName}</p>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-[#52645B] sm:text-[13px]">{body.description}</p>
                    <a
                      href={body.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 w-full inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-700/50 px-2 py-1.5 text-xs font-bold text-emerald-800 transition hover:border-emerald-600 hover:bg-[#EAF3ED]"
                    >
                      Official Website <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Framed Group 2: International Halal Bodies (2 of 6 columns on desktop) */}
            <div className="lg:col-span-2 rounded-2xl bg-[#F4F8F6] border-2 border-teal-700/25 p-3.5 sm:p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-[#DCE7E0]">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.16em] text-teal-900">
                  International Partners
                </h3>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 border border-teal-300/60 px-2.5 py-0.5 rounded-full shrink-0">
                  Foreign Recognized
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 flex-1">
                {[
                  {
                    name: 'JAKIM',
                    tag: 'Malaysia Partner',
                    logo: '/logos/JAKIM.svg',
                    fullName: 'Jabatan Kemajuan Islam Malaysia',
                    description: "Malaysia's Department of Islamic Development and national halal certification authority.",
                    url: 'https://www.islam.gov.my/ms/hukum-undang-undang/semakan-status-halal',
                  },
                  {
                    name: 'MUIS',
                    tag: 'Singapore Partner',
                    logo: '/logos/MUIS.svg',
                    fullName: 'Majlis Ugama Islam Singapura',
                    description: "Singapore's Islamic Religious Council, providing halal certification and verification services.",
                    url: 'https://halal.muis.gov.sg/account/login',
                  },
                ].map((body) => (
                  <div key={body.name} className="flex min-h-[240px] flex-col items-center text-center rounded-xl border border-[#DCE7E0] bg-white p-3.5 sm:p-4 shadow-2xs transition hover:border-teal-600/40 hover:shadow-md">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-teal-600/30 bg-white p-1 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                      <img src={body.logo} alt={`${body.name} logo`} className="h-full w-full object-contain rounded-full" loading="lazy" />
                    </div>
                    <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {body.tag}
                    </span>
                    <span className="mt-1.5 font-extrabold text-teal-900 text-sm sm:text-base">{body.name}</span>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#17251F] sm:text-xs leading-snug">{body.fullName}</p>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-[#52645B] sm:text-[13px]">{body.description}</p>
                    <a
                      href={body.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 w-full inline-flex items-center justify-center gap-1 rounded-lg border border-teal-700/50 px-2 py-1.5 text-xs font-bold text-teal-800 transition hover:border-teal-600 hover:bg-[#EAF3ED]"
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

      {/* Footer */}
      <footer className="border-t border-[#DCE7E0] bg-white py-6 sm:py-8 text-[11px] sm:text-xs text-[#52645B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div
            onClick={onScrollToTop}
            className="flex items-center gap-3 cursor-pointer group"
            title="Scroll back to top"
          >
            <img src="/halalverify-logo.png" alt="HalalVerify" className="h-7 w-7 rounded-full opacity-80 group-hover:opacity-100 transition" />
            <span className="font-bold text-[#17251F] group-hover:text-emerald-800 tracking-wider transition">HALALVERIFY ZAMBOANGA</span>
          </div>

          <p className="text-center text-[#52645B]">
            Capstone Research Project &bull; Western Mindanao State University &bull; Zamboanga City
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button onClick={() => onViewChange('scanner')} className="hover:text-emerald-800 transition">Scanner</button>
            <button onClick={() => onViewChange('products')} className="hover:text-emerald-800 transition">Catalog</button>
            <button onClick={() => onViewChange('map')} className="hover:text-emerald-800 transition">Map</button>
            <button
              onClick={() => onViewChange(userRole ? 'dashboard' : 'login')}
              className="hover:text-emerald-800 transition"
            >
              {userRole ? 'Dashboard' : 'Sign In'}
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
