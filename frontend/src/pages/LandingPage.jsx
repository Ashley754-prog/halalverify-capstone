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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onViewChange('landing')}
          >
            <img 
              src="/halalverify-logo.png" 
              alt="HalalVerify Logo" 
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-emerald-500/30 shadow-md group-hover:scale-105 transition duration-200" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-xl tracking-[0.18em] text-white">HALALVERIFY</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-full">
                  Zamboanga
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">Verification & Compliance Pipeline</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition">Features</a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition">How It Works</a>
            <a href="#certifiers" className="hover:text-emerald-400 transition">Certifiers</a>
            <button 
              onClick={() => onViewChange('products')}
              className="hover:text-emerald-400 transition"
            >
              Catalog
            </button>
            <button 
              onClick={() => onViewChange('map')}
              className="hover:text-emerald-400 transition"
            >
              Map
            </button>
            <button 
              onClick={() => handleOpenContribution('establishment')}
              className="hover:text-emerald-400 transition flex items-center gap-1 text-emerald-400 font-semibold"
            >
              <span>+ Contribute</span>
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {userRole ? (
              <button
                onClick={() => onViewChange('dashboard')}
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition shadow-sm"
              >
                <LayoutDashboard size={16} className="text-emerald-400" />
                <span>Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => onViewChange('login')}
                className="flex items-center gap-1.5 rounded-xl text-slate-300 hover:text-white px-3 py-2 text-xs sm:text-sm font-semibold transition"
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={() => onViewChange('scanner')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition active:scale-95"
            >
              <Camera size={16} />
              <span className="hidden sm:inline">Start Scanning</span>
              <span className="sm:hidden">Scan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 overflow-hidden">
        {/* Background Subtle Gradient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-semibold mb-6 backdrop-blur-sm shadow-inner">
              <Sparkles size={14} className="text-emerald-400" />
              <span>Optical Character Recognition & Verified Database</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight">
              Verify Halal Authenticity in{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                Zamboanga City
              </span>{' '}
              with Confidence.
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Empowering consumers and families to inspect food packaging labels, detect certifying logos, and discover certified dining establishments across Zamboanga City — instantly and freely.
            </p>

            {/* Interactive Search Interface (Finalized Features Section 1) */}
            <div className="mt-8 max-w-2xl mx-auto text-left">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search product names, brands, or verified establishments in Zamboanga..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 pl-12 pr-12 py-3.5 sm:py-4 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xl backdrop-blur-xl"
                />
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
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => onViewChange('scanner')}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm sm:text-base shadow-xl shadow-emerald-900/50 transition transform hover:-translate-y-0.5 active:translate-y-0 duration-150"
              >
                <Camera size={20} />
                <span>Launch Halal Scanner</span>
              </button>

              <button
                onClick={() => onViewChange('products')}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 font-semibold text-slate-200 text-sm sm:text-base transition"
              >
                <Search size={18} className="text-slate-400" />
                <span>Browse Products</span>
              </button>

              <button
                onClick={() => onViewChange('map')}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 font-semibold text-slate-200 text-sm sm:text-base transition"
              >
                <MapPin size={18} className="text-emerald-400" />
                <span>Establishments Map</span>
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              No account required for scanning and searches.
            </p>
          </div>

          {/* Interactive Feature Mockup Preview */}
          <div className="mt-12 sm:mt-16 max-w-4xl mx-auto">
            <div className="relative rounded-3xl border border-slate-700/80 bg-slate-900/90 p-4 sm:p-6 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400">HalalVerify Inspection Engine</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-semibold">
                  EasyOCR Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {/* Simulated Step 1 */}
                <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-semibold uppercase tracking-wider text-emerald-400">Step 1</span>
                      <Camera size={14} />
                    </div>
                    <h4 className="font-bold text-white text-sm">Label OCR Extraction</h4>
                    <p className="text-xs text-slate-400 mt-1">High-speed optical text recognition reads ingredients on packaging.</p>
                  </div>
                  <div className="mt-3 bg-slate-950/80 rounded-xl p-2.5 font-mono text-[11px] text-slate-300 border border-slate-800">
                    <span className="text-emerald-400">&gt;</span> Wheat flour, water, salt, yeast, vegetable oil...
                  </div>
                </div>

                {/* Simulated Step 2 */}
                <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-semibold uppercase tracking-wider text-emerald-400">Step 2</span>
                      <ShieldCheck size={14} />
                    </div>
                    <h4 className="font-bold text-white text-sm">Ingredient & Logo Audit</h4>
                    <p className="text-xs text-slate-400 mt-1">Cross-referenced with haram/mashbooh additives and certifiers.</p>
                  </div>
                  <div className="mt-3 bg-slate-950/80 rounded-xl p-2.5 font-mono text-[11px] text-slate-300 border border-slate-800">
                    <span className="text-emerald-400">&gt;</span> 0 Flagged Haram Additives<br />
                    <span className="text-emerald-400">&gt;</span> Logo: HDIP Philippines
                  </div>
                </div>

                {/* Simulated Step 3 */}
                <div className="rounded-2xl bg-emerald-950/30 border border-emerald-700/40 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-semibold uppercase tracking-wider text-emerald-400">Step 3</span>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    </div>
                    <h4 className="font-bold text-emerald-300 text-sm">Instant Verdict</h4>
                    <p className="text-xs text-slate-300 mt-1">Clear confidence rating and certifier accreditation details.</p>
                  </div>
                  <div className="mt-3 bg-emerald-900/40 rounded-xl p-2.5 text-center border border-emerald-700/60">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
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
      <section id="features" className="py-16 sm:py-20 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Core Capabilities
            </h2>
            <p className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed for Everyday Shoppers & Diners
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Complete transparency at your fingertips, whether you are shopping at grocery aisles or dining in Zamboanga City.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div 
              onClick={() => onViewChange('scanner')}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/90 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition duration-200">
                <Camera size={22} />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                Halal Scanner & OCR
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Scan packaged goods using EasyOCR to analyze ingredient lists for doubtful additives and verify certifying logos.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span>Try Scanner</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 2 */}
            <div 
              onClick={() => onViewChange('products')}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/90 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition duration-200">
                <Package size={22} />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                Product Catalog
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Search verified consumer food, beverages, and household goods sold across local Zamboanga stores and supermarkets.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span>View Products</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 3 */}
            <div 
              onClick={() => onViewChange('map')}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/90 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition duration-200">
                <MapPin size={22} />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                Establishments Map
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Interactive map pinpointing halal-certified dining options, restaurants, cafes, and caterers across Zamboanga City.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span>Open Map</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Feature 4 */}
            <div 
              onClick={() => onViewChange('registry')}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/90 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition duration-200">
                <BookOpen size={22} />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                Accredited Registry
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Direct public lookup of certified bodies, standards, and accreditation statuses recognized under Philippine frameworks.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <span>Check Registry</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Simple Workflow
            </h2>
            <p className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              How HalalVerify Verifies Products
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-lg shadow-emerald-900/30">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Snap or Upload</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Position your phone camera over the product packaging, ingredient panel, or halal certification logo.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-lg shadow-emerald-900/30">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">OCR Parsing & Match</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                EasyOCR extracts textual content and tests each word against verified halal listings and prohibited additives.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-lg shadow-emerald-900/30">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Transparent Verdict</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Receive an instant compliance verdict with detailed reasons, certifier logo verification, and guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recognized Certifiers & Scope Section */}
      <section id="certifiers" className="py-16 sm:py-20 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Philippine Halal Accreditation
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Supported Certifying Bodies & Local Scope
            </p>
            <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              HalalVerify is focused specifically on the local food ecosystem of <strong>Zamboanga City</strong>, recognizing certifications issued by authorized Islamic bodies such as the National Commission on Muslim Filipinos (NCMF), Halal Development Institute of the Philippines (HDIP), Islamic Da&apos;wah Council of the Philippines (IDCP), and international mutual recognition partners.
            </p>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="font-extrabold text-emerald-400 text-base">NCMF</span>
                <p className="text-[11px] text-slate-400 mt-1">National Commission on Muslim Filipinos</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="font-extrabold text-emerald-400 text-base">HDIP</span>
                <p className="text-[11px] text-slate-400 mt-1">Halal Development Institute of the PH</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="font-extrabold text-emerald-400 text-base">IDCP</span>
                <p className="text-[11px] text-slate-400 mt-1">Islamic Da&apos;wah Council of the Philippines</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="font-extrabold text-emerald-400 text-base">JAKIM / MUI</span>
                <p className="text-[11px] text-slate-400 mt-1">Recognized Bilateral Partners</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-700/50 p-8 sm:p-14 shadow-2xl relative">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Start Verifying Products Today
              </h2>
              <p className="mt-4 text-xs sm:text-base text-slate-300 leading-relaxed">
                Scan your first product, check halal logos, or browse certified local restaurants across Zamboanga City right now.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => onViewChange('scanner')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm sm:text-base shadow-lg shadow-emerald-900/50 transition"
                >
                  <Camera size={20} />
                  <span>Open Halal Scanner</span>
                </button>

                <button
                  onClick={() => onViewChange('login')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-slate-200 text-sm sm:text-base transition"
                >
                  <LogIn size={18} />
                  <span>Sign In / Register</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-[#0a0f19] py-10 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/halalverify-logo.png" alt="HalalVerify" className="h-7 w-7 rounded-full opacity-80" />
            <span className="font-bold text-slate-300 tracking-wider">HALALVERIFY ZAMBOANGA</span>
          </div>

          <p className="text-center text-slate-400">
            Capstone Research Project &bull; Western Mindanao State University &bull; Zamboanga City
          </p>

          <div className="flex items-center gap-6">
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
