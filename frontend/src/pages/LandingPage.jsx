import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Package, 
  MapPin, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Smartphone, 
  Search, 
  Info, 
  Check, 
  AlertCircle,
  LogIn,
  LayoutDashboard,
  ExternalLink,
  X,
  Building2,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ContributionModal from '../components/submissions/ContributionModal';
import AuthPromptModal from '../components/submissions/AuthPromptModal';

export default function LandingPage({ onViewChange, userRole }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [allEstablishments, setAllEstablishments] = useState([]);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [initialContributionTab, setInitialContributionTab] = useState('establishment');

  const handleOpenContribution = (tab = 'establishment') => {
    setInitialContributionTab(tab);
    if (!userRole) {
      setShowAuthPrompt(true);
    } else {
      setShowContributionModal(true);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadRegistryData = async () => {
      try {
        const [prodRes, estRes] = await Promise.all([
          supabase.from('products').select('id, name, brand, category, status').neq('status', 'PENDING_VERIFICATION').limit(200),
          supabase.from('establishments').select('id, name, address, halal_status').neq('halal_status', 'PENDING_VERIFICATION').limit(200),
        ]);

        if (isMounted) {
          if (prodRes.data) setAllProducts(prodRes.data);
          if (estRes.data) setAllEstablishments(estRes.data);
        }
      } catch (err) {
        console.warn('Failed to pre-fetch registry data for search:', err);
      }
    };

    loadRegistryData();
    return () => { isMounted = false; };
  }, []);

  const handleSearch = (term) => {
    setSearchQuery(term);
    const q = term.trim().toLowerCase();
    if (!q) {
      setSearchResults(null);
      return;
    }

    const matchedProducts = allProducts.filter((p) =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );

    const matchedEstablishments = allEstablishments.filter((e) =>
      (e.name && e.name.toLowerCase().includes(q)) ||
      (e.address && e.address.toLowerCase().includes(q))
    );

    setSearchResults({
      products: matchedProducts,
      establishments: matchedEstablishments,
      totalCount: matchedProducts.length + matchedEstablishments.length,
    });
  };
  return (
    <div className="min-h-screen bg-[#0e1625] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0e1625]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 px-3 py-2 sm:h-20 sm:flex-nowrap sm:gap-y-0 sm:px-6 sm:py-0 lg:px-8">
          <div 
            className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:flex-none cursor-pointer group"
            onClick={() => onViewChange('landing')}
          >
            <img 
              src="/halalverify-logo.png" 
              alt="HalalVerify Logo" 
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-emerald-500/30 shadow-md group-hover:scale-105 transition duration-200" 
            />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-[13px] sm:text-xl tracking-[0.1em] sm:tracking-[0.18em] text-white">HALALVERIFY</span>
                <span className="inline-block px-1.5 py-0.5 text-[8px] sm:px-2 sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-full">
                  Zamboanga
                </span>
              </div>
              <p className="block text-[8px] sm:text-[10px] text-slate-400 tracking-wide">Verification & Compliance Pipeline</p>
            </div>
          </div>

          <nav className="order-3 flex w-full min-w-0 items-center gap-5 overflow-x-auto no-scrollbar text-[11px] font-medium text-slate-300 md:order-none md:w-auto md:gap-8 md:overflow-visible md:text-sm">
            <a href="#features" className="shrink-0 hover:text-emerald-400 transition">Features</a>
            <a href="#how-it-works" className="shrink-0 hover:text-emerald-400 transition">How It Works</a>
            <a href="#certifiers" className="shrink-0 hover:text-emerald-400 transition">Certifiers</a>
            <button 
              onClick={() => onViewChange('products')}
              className="shrink-0 hover:text-emerald-400 transition"
            >
              Catalog
            </button>
            <button 
              onClick={() => onViewChange('map')}
              className="shrink-0 hover:text-emerald-400 transition"
            >
              Map
            </button>
            <button 
              onClick={() => handleOpenContribution('establishment')}
              className="shrink-0 hover:text-emerald-400 transition flex items-center gap-1 text-emerald-400 font-semibold"
            >
              <span>+ Contribute</span>
            </button>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {userRole ? (
              <button
                onClick={() => onViewChange('dashboard')}
                className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 text-[10px] sm:text-sm font-semibold text-white transition shadow-sm"
              >
                <LayoutDashboard size={16} className="text-emerald-400" />
                <span>Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => onViewChange('login')}
                className="flex items-center gap-1 rounded-lg text-slate-300 hover:text-white px-1 py-0.5 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2 text-[9px] sm:text-sm font-semibold transition"
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={() => onViewChange('scanner')}
                className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-1.5 py-0.5 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 text-[9px] sm:text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition active:scale-95"
            >
              <Camera size={16} />
              <span className="hidden sm:inline">Start Scanning</span>
              <span className="sm:hidden">Scan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-7 pb-10 sm:pt-16 sm:pb-24 overflow-hidden">
        {/* Background Subtle Gradient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-[10px] sm:text-xs font-semibold mb-4 sm:mb-6 backdrop-blur-sm shadow-inner">
              <Sparkles size={12} className="text-emerald-400 sm:h-3.5 sm:w-3.5" />
              <span>Optical Character Recognition & Verified Database</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight">
              Verify Halal Authenticity in{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                Zamboanga City
              </span>{' '}
              with Confidence.
            </h1>

            {/* Subtitle */}
            <p className="mt-3 sm:mt-5 text-xs sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Empowering consumers and families to inspect food packaging labels, detect certifying logos, and discover certified dining establishments across Zamboanga City — instantly and freely.
            </p>

            {/* Interactive Search Interface (Finalized Features Section 1) */}
            <div className="mt-5 sm:mt-8 max-w-2xl mx-auto text-left">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  aria-label="Search products, brands, or verified establishments"
                  placeholder="Search product names, brands, or verified establishments in Zamboanga..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-3 pr-20 sm:rounded-2xl sm:py-4 sm:pl-4 sm:pr-24 text-[11px] sm:text-sm text-white placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xl backdrop-blur-xl"
                />
                <button
                  type="button"
                  onClick={() => handleSearch(searchQuery)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-950 hover:text-emerald-300 ${searchQuery ? 'right-10 sm:right-12' : ''}`}
                  aria-label="Search"
                  title="Search"
                >
                  <Search size={17} />
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Live Search Results & Visual Product Scan Fallback Engine */}
              {searchQuery.trim() && searchResults && (
                <div className="mt-3">
                  {searchResults.totalCount > 0 ? (
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl space-y-2.5 backdrop-blur-xl max-h-80 overflow-y-auto">
                      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                        <span>Found {searchResults.totalCount} matching record(s)</span>
                        <button 
                          onClick={() => onViewChange('products', { searchQuery })}
                          className="text-emerald-400 hover:underline font-semibold"
                        >
                          View In Catalog &rarr;
                        </button>
                      </div>

                      {/* Products matches */}
                      {searchResults.products.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => onViewChange('products', { searchQuery: p.name })}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer border border-slate-700/50 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <Package size={18} className="text-emerald-400 shrink-0" />
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-white">{p.name}</p>
                              <p className="text-[11px] text-slate-400">{p.brand} &bull; {p.category}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {p.status || 'Halal'}
                          </span>
                        </div>
                      ))}

                      {/* Establishments matches */}
                      {searchResults.establishments.map(e => (
                        <div 
                          key={e.id}
                          onClick={() => onViewChange('map')}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer border border-slate-700/50 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <Building2 size={18} className="text-teal-400 shrink-0" />
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-white">{e.name}</p>
                              <p className="text-[11px] text-slate-400">{e.address}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-950 text-teal-300 border border-teal-800">
                            {e.halal_status || 'Verified'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Visual Product Scan Fallback Engine (Section 2 of Finalized Features) */
                    <div className="rounded-2xl border border-emerald-500/50 bg-slate-900/95 p-6 shadow-2xl text-center backdrop-blur-xl space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto">
                        <Camera size={22} />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        Product or Establishment not found. Scan package to verify.
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                        &quot;{searchQuery}&quot; was not found in the verified database. Use the visual scanner to inspect the package label, detect certifying seals, and parse ingredients.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={() => onViewChange('scanner')}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 transition transform hover:-translate-y-0.5 active:translate-y-0 duration-150"
                        >
                          <Camera size={18} />
                          <span>Scan Package with Camera</span>
                        </button>
                        <button
                          onClick={() => handleOpenContribution('establishment')}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition"
                        >
                          <Building2 size={16} className="text-teal-400" />
                          <span>Submit to Registry</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main CTAs */}
            <div className="mt-5 sm:mt-8 grid grid-cols-3 items-stretch gap-1.5 sm:flex sm:items-center sm:justify-center sm:gap-4">
              <button
                onClick={() => onViewChange('scanner')}
                className="flex min-w-0 flex-row items-center justify-center gap-0.5 px-0.5 py-2 sm:gap-2 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-[8px] sm:text-base shadow-xl shadow-emerald-900/50 transition transform hover:-translate-y-0.5 active:translate-y-0 duration-150"
              >
                <Camera size={14} className="shrink-0 sm:h-5 sm:w-5" />
                <span className="text-center leading-tight">Launch Scanner</span>
              </button>

              <button
                onClick={() => onViewChange('products')}
                className="flex min-w-0 flex-row items-center justify-center gap-0.5 px-0.5 py-2 sm:gap-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 font-semibold text-slate-200 text-[8px] sm:text-base transition"
              >
                <Search size={14} className="shrink-0 text-slate-400 sm:h-[18px] sm:w-[18px]" />
                <span className="text-center leading-tight">Browse Products</span>
              </button>

              <button
                onClick={() => onViewChange('map')}
                className="flex min-w-0 flex-row items-center justify-center gap-0.5 px-0.5 py-2 sm:gap-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 font-semibold text-slate-200 text-[8px] sm:text-base transition"
              >
                <MapPin size={14} className="shrink-0 text-emerald-400 sm:h-[18px] sm:w-[18px]" />
                <span className="text-center leading-tight">Establishments Map</span>
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              No account required for scanning and searches.
            </p>
          </div>

          {/* Interactive Feature Mockup Preview */}
          <div className="mt-8 sm:mt-16 max-w-4xl mx-auto">
            <div className="relative rounded-xl sm:rounded-3xl border border-slate-700/80 bg-slate-900/90 p-2 sm:p-6 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-4 mb-3 sm:mb-5">
                <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-red-500/80 sm:h-3 sm:w-3" />
                  <div className="h-2 w-2 shrink-0 rounded-full bg-amber-500/80 sm:h-3 sm:w-3" />
                  <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500/80 sm:h-3 sm:w-3" />
                  <span className="ml-0.5 truncate text-[8px] sm:ml-1.5 sm:text-xs font-mono text-slate-400">HalalVerify Inspection Engine</span>
                </div>
                <span className="shrink-0 rounded-md bg-emerald-950 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-400 border border-emerald-800 sm:px-2 sm:text-[11px]">
                  EasyOCR Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-left sm:grid-cols-1 sm:gap-4 md:grid-cols-3">
                {/* Simulated Step 1 */}
                <div className="no-scrollbar h-36 min-w-0 overflow-y-auto rounded-xl bg-slate-800/60 border border-slate-700/50 p-2 sm:h-auto sm:rounded-2xl sm:p-4">
                  <div>
                    <div className="flex items-center justify-between text-[8px] text-slate-400 mb-1 sm:mb-2 sm:text-xs">
                      <span className="font-semibold uppercase tracking-wider text-emerald-400">Step 1</span>
                      <Camera size={12} className="sm:h-[14px] sm:w-[14px]" />
                    </div>
                    <h4 className="font-bold text-white text-[9px] sm:text-sm">Label OCR Extraction</h4>
                    <p className="mt-1 max-h-10 overflow-y-auto text-[8px] text-slate-400 sm:max-h-none sm:overflow-visible sm:text-xs">High-speed optical text recognition reads ingredients on packaging.</p>
                  </div>
                  <div className="mt-2 max-h-10 overflow-y-auto rounded-lg bg-slate-950/80 p-1.5 font-mono text-[8px] text-slate-300 border border-slate-800 sm:mt-3 sm:max-h-none sm:overflow-visible sm:rounded-xl sm:p-2.5 sm:text-[11px]">
                    <span className="text-emerald-400">&gt;</span> Wheat flour, water, salt, yeast, vegetable oil...
                  </div>
                </div>

                {/* Simulated Step 2 */}
                <div className="no-scrollbar h-36 min-w-0 overflow-y-auto rounded-xl bg-slate-800/60 border border-slate-700/50 p-2 sm:h-auto sm:rounded-2xl sm:p-4">
                  <div>
                    <div className="flex items-center justify-between text-[8px] text-slate-400 mb-1 sm:mb-2 sm:text-xs">
                      <span className="font-semibold uppercase tracking-wider text-emerald-400">Step 2</span>
                      <ShieldCheck size={12} className="sm:h-[14px] sm:w-[14px]" />
                    </div>
                    <h4 className="font-bold text-white text-[9px] sm:text-sm">Ingredient & Logo Audit</h4>
                    <p className="mt-1 max-h-10 overflow-y-auto text-[8px] text-slate-400 sm:max-h-none sm:overflow-visible sm:text-xs">Cross-referenced with haram/mashbooh additives and certifiers.</p>
                  </div>
                  <div className="mt-2 max-h-10 overflow-y-auto rounded-lg bg-slate-950/80 p-1.5 font-mono text-[8px] text-slate-300 border border-slate-800 sm:mt-3 sm:max-h-none sm:overflow-visible sm:rounded-xl sm:p-2.5 sm:text-[11px]">
                    <span className="block"><span className="text-emerald-400">&gt;</span> 0 Flagged Haram Additives</span>
                    <span className="block"><span className="text-emerald-400">&gt;</span> Logo: HDIP Philippines</span>
                  </div>
                </div>

                {/* Simulated Step 3 */}
                <div className="no-scrollbar h-36 min-w-0 overflow-y-auto rounded-xl bg-emerald-950/30 border border-emerald-700/40 p-2 sm:h-auto sm:rounded-2xl sm:p-4">
                  <div>
                    <div className="flex items-center justify-between text-[8px] text-slate-400 mb-1 sm:mb-2 sm:text-xs">
                      <span className="font-semibold uppercase tracking-wider text-emerald-400">Step 3</span>
                      <CheckCircle2 size={12} className="text-emerald-400 sm:h-[14px] sm:w-[14px]" />
                    </div>
                    <h4 className="font-bold text-emerald-300 text-[9px] sm:text-sm">Instant Verdict</h4>
                    <p className="mt-1 max-h-10 overflow-y-auto text-[8px] text-slate-300 sm:max-h-none sm:overflow-visible sm:text-xs">Clear confidence rating and certifier accreditation details.</p>
                  </div>
                  <div className="mt-2 max-h-10 overflow-y-auto rounded-lg bg-emerald-900/40 p-1.5 text-center border border-emerald-700/60 sm:mt-3 sm:max-h-none sm:overflow-visible sm:rounded-xl sm:p-2.5">
                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-300 sm:text-xs">
                      ✓ Halal Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-10 sm:py-20 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Core Capabilities
            </h2>
            <p className="mt-2 text-xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed for Everyday Shoppers & Diners
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Complete transparency at your fingertips, whether you are shopping at grocery aisles or dining in Zamboanga City.
            </p>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
            {/* Feature 1 */}
            <div 
              onClick={() => onViewChange('scanner')}
              className="group w-[70vw] shrink-0 cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-3 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30 sm:w-auto sm:rounded-2xl sm:p-6"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2 sm:mb-4 group-hover:scale-110 transition duration-200">
                <Camera size={16} className="sm:h-[22px] sm:w-[22px]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition">
                Halal Scanner & OCR
              </h3>
              <p className="mt-1 text-[11px] sm:mt-1.5 sm:text-sm text-slate-400 leading-relaxed">
                Scan packaged goods using EasyOCR to analyze ingredient lists for doubtful additives and verify certifying logos.
              </p>
              <div className="mt-2 sm:mt-4 flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-400">
                <span>Try Scanner</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 2 */}
            <div 
              onClick={() => onViewChange('products')}
              className="group w-[70vw] shrink-0 cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-3 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30 sm:w-auto sm:rounded-2xl sm:p-6"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2 sm:mb-4 group-hover:scale-110 transition duration-200">
                <Package size={16} className="sm:h-[22px] sm:w-[22px]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition">
                Product Catalog
              </h3>
              <p className="mt-1 text-[11px] sm:mt-1.5 sm:text-sm text-slate-400 leading-relaxed">
                Search verified consumer food, beverages, and household goods sold across local Zamboanga stores and supermarkets.
              </p>
              <div className="mt-2 sm:mt-4 flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-400">
                <span>View Products</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 3 */}
            <div 
              onClick={() => onViewChange('map')}
              className="group w-[70vw] shrink-0 cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-3 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30 sm:w-auto sm:rounded-2xl sm:p-6"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2 sm:mb-4 group-hover:scale-110 transition duration-200">
                <MapPin size={16} className="sm:h-[22px] sm:w-[22px]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition">
                Establishments Map
              </h3>
              <p className="mt-1 text-[11px] sm:mt-1.5 sm:text-sm text-slate-400 leading-relaxed">
                Interactive map pinpointing halal-certified dining options, restaurants, cafes, and caterers across Zamboanga City.
              </p>
              <div className="mt-2 sm:mt-4 flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-400">
                <span>Open Map</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 4 */}
            <div 
              onClick={() => onViewChange('registry')}
              className="group w-[70vw] shrink-0 cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-3 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30 sm:w-auto sm:rounded-2xl sm:p-6"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2 sm:mb-4 group-hover:scale-110 transition duration-200">
                <BookOpen size={16} className="sm:h-[22px] sm:w-[22px]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition">
                Accredited Registry
              </h3>
              <p className="mt-1 text-[11px] sm:mt-1.5 sm:text-sm text-slate-400 leading-relaxed">
                Direct public lookup of certified bodies, standards, and accreditation statuses recognized under Philippine frameworks.
              </p>
              <div className="mt-2 sm:mt-4 flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-400">
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

          <div className="relative grid grid-cols-3 gap-2 sm:gap-6">
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
              <h3 className="mb-2 text-sm font-bold text-white sm:text-lg">OCR Parsing & Match</h3>
              <p className="text-[10px] leading-relaxed text-slate-400 sm:text-sm">
                EasyOCR extracts textual content and tests each word against verified halal listings and prohibited additives.
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
              Supported Certifying Bodies & Local Scope
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
                    fullName: 'Islamic Da&apos;wah Council of the Philippines',
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

              <div className="mt-5 sm:mt-8 flex flex-row items-center justify-center gap-2 sm:gap-4">
                <button
                  onClick={() => onViewChange('scanner')}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 font-bold text-white text-[10px] shadow-lg shadow-emerald-900/50 transition hover:bg-emerald-500 sm:gap-2 sm:px-6 sm:py-3.5 sm:text-base"
                >
                  <Camera size={16} className="sm:h-5 sm:w-5" />
                  <span>Open Halal Scanner</span>
                </button>

                <button
                  onClick={() => onViewChange('login')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 font-semibold text-slate-200 text-[10px] transition hover:bg-slate-700 sm:gap-2 sm:px-6 sm:py-3.5 sm:text-base"
                >
                  <LogIn size={15} className="sm:h-[18px] sm:w-[18px]" />
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

      {/* Community Contribution Modal */}
      <ContributionModal
        isOpen={showContributionModal}
        onClose={() => setShowContributionModal(false)}
        initialTab={initialContributionTab}
        onSubmitted={() => {}}
      />

      {/* Guest Authentication Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        onNavigate={(v) => onViewChange(v)}
        actionTitle="Contribute to Registry"
      />
    </div>
  );
}
