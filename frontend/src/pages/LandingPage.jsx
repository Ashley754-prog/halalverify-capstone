import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Package,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Search,
  LogIn,
  LayoutDashboard,
  X,
  Building2,
  Plus,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ContributionModal from '../components/submissions/ContributionModal';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import LandingMarketingSections from '../components/landing/LandingMarketingSections';

export default function LandingPage({ onViewChange, userRole }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [allEstablishments, setAllEstablishments] = useState([]);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [initialContributionTab, setInitialContributionTab] = useState('establishment');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const handleOpenContribution = (tab = 'establishment') => {
    setInitialContributionTab(tab);
    if (!userRole) {
      setShowAuthPrompt(true);
    } else {
      setShowContributionModal(true);
    }
  };

  const searchDebounceRef = useRef(null);
  const landingScrollRef = useRef(null);
  const programmaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef(null);

  // Scrollspy & Scroll Progress: dynamically track active section and topbar progress beam
  useEffect(() => {
    const container = landingScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Skip intermediate section overrides during click-triggered smooth scrolling
      if (programmaticScrollRef.current) return;

      const scrollTop = container.scrollTop;

      const headerOffset = window.innerWidth >= 640 ? 80 : 64;

      if (scrollTop < 180) {
        setActiveSection('');
        return;
      }

      if (container.scrollHeight - scrollTop - container.clientHeight < 40) {
        setActiveSection('certifiers');
        return;
      }

      const sections = ['features', 'how-it-works', 'certifiers'];
      const viewportCenter = headerOffset + (window.innerHeight - headerOffset) / 2;
      let closestId = '';
      let closestDistance = Infinity;

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const sectionCenter = rect.top + rect.height / 2;
          const distance = Math.abs(sectionCenter - viewportCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestId = id;
          }
        }
      }

      if (closestId) {
        setActiveSection(closestId);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (programmaticScrollTimerRef.current) {
        clearTimeout(programmaticScrollTimerRef.current);
      }
    };
  }, []);

  // Mobile Menu accessibility: Lock background scroll and listen for Escape key
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const container = landingScrollRef.current;
    const originalOverflow = container ? container.style.overflowY : '';
    if (container) {
      container.style.overflowY = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (container) {
        container.style.overflowY = originalOverflow || '';
      }
    };
  }, [isMobileMenuOpen]);

  const handleScrollToTop = () => {
    setIsMobileMenuOpen(false);
    setActiveSection('');
    programmaticScrollRef.current = true;
    if (programmaticScrollTimerRef.current) clearTimeout(programmaticScrollTimerRef.current);
    programmaticScrollTimerRef.current = setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 650);

    if (landingScrollRef.current) {
      landingScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState({ view: 'landing', params: {} }, '', '/');
    }
  };

  const handleScrollToSection = (e, sectionId) => {
    if (e) e.preventDefault();
    const wasMobileMenuOpen = isMobileMenuOpen;
    setIsMobileMenuOpen(false);
    setActiveSection(sectionId);
    programmaticScrollRef.current = true;
    if (programmaticScrollTimerRef.current) clearTimeout(programmaticScrollTimerRef.current);

    const performScroll = () => {
      const container = landingScrollRef.current;
      const target = document.getElementById(sectionId);
      if (container && target) {
        const isDesktop = window.innerWidth >= 640;
        const headerOffset = isDesktop ? 80 : 64;
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const sectionTopInScroll = container.scrollTop + (targetRect.top - containerRect.top);
        const visibleViewportHeight = container.clientHeight - headerOffset;
        const sectionHeight = target.offsetHeight;

        let scrollTarget = sectionTopInScroll - headerOffset;
        if (isDesktop && sectionHeight < visibleViewportHeight) {
          const sectionCenterInScroll = sectionTopInScroll + sectionHeight / 2;
          const visibleCenterOffset = headerOffset + visibleViewportHeight / 2;
          scrollTarget = sectionCenterInScroll - visibleCenterOffset;
        }

        container.scrollTo({
          top: Math.max(0, scrollTarget),
          behavior: 'smooth',
        });
      }

      programmaticScrollTimerRef.current = setTimeout(() => {
        programmaticScrollRef.current = false;
      }, 700);
    };

    if (wasMobileMenuOpen) {
      setTimeout(performScroll, 75);
    } else {
      performScroll();
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadRegistryData = async () => {
      try {
        const [prodRes, estRes] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, brand, category, status')
            .not('status', 'in', '(REJECTED,rejected,PENDING_VERIFICATION,pending,needs_review,draft)')
            .limit(300),
          supabase
            .from('establishments')
            .select('id, name, address, halal_status')
            .not('halal_status', 'in', '(rejected,REJECTED,needs_review,pending,pending_review,flagged,suspended)')
            .limit(200),
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
    return () => {
      isMounted = false;
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleSearch = (term) => {
    setSearchQuery(term);
    const q = term.trim();
    if (!q) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      setSearchResults(null);
      return;
    }

    const qLower = q.toLowerCase();

    const matchedProducts = allProducts.filter((p) =>
      (p.name && p.name.toLowerCase().includes(qLower)) ||
      (p.brand && p.brand.toLowerCase().includes(qLower)) ||
      (p.category && p.category.toLowerCase().includes(qLower))
    );

    const matchedEstablishments = allEstablishments.filter((e) =>
      (e.name && e.name.toLowerCase().includes(qLower)) ||
      (e.address && e.address.toLowerCase().includes(qLower))
    );

    setSearchResults({
      products: matchedProducts,
      establishments: matchedEstablishments,
      totalCount: matchedProducts.length + matchedEstablishments.length,
    });

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const safeQ = q.replace(/[,()'"%&|{}]/g, '').trim().slice(0, 100);
        if (!safeQ) return;
        const [liveProdRes, liveEstRes] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, brand, category, status')
            .or(`name.ilike.%${safeQ}%,brand.ilike.%${safeQ}%,category.ilike.%${safeQ}%`)
            .not('status', 'in', '(REJECTED,rejected,PENDING_VERIFICATION,pending,needs_review,draft)')
            .limit(25),
          supabase
            .from('establishments')
            .select('id, name, address, halal_status')
            .or(`name.ilike.%${safeQ}%,address.ilike.%${safeQ}%`)
            .not('halal_status', 'in', '(rejected,REJECTED,needs_review,pending,pending_review,flagged,suspended)')
            .limit(25),
        ]);

        const mergedProdsMap = new Map();
        matchedProducts.forEach(p => mergedProdsMap.set(p.id, p));
        (liveProdRes.data || []).forEach(p => mergedProdsMap.set(p.id, p));

        const mergedEstMap = new Map();
        matchedEstablishments.forEach(e => mergedEstMap.set(e.id, e));
        (liveEstRes.data || []).forEach(e => mergedEstMap.set(e.id, e));

        const finalProducts = Array.from(mergedProdsMap.values());
        const finalEstablishments = Array.from(mergedEstMap.values());

        setSearchResults({
          products: finalProducts,
          establishments: finalEstablishments,
          totalCount: finalProducts.length + finalEstablishments.length,
        });
      } catch (err) {
        console.warn('Live search error:', err);
      }
    }, 250);
  };

  return (
    <div
      ref={landingScrollRef}
      className="h-full max-h-[100dvh] overflow-y-auto overflow-x-hidden scroll-smooth bg-[#0e1625] text-slate-100 selection:bg-emerald-500 selection:text-white w-full max-w-full"
    >
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0e1625]/95 backdrop-blur-md shadow-md shadow-black/20 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:gap-5 min-w-0">
            <div
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0 lg:pr-5 xl:pr-6 lg:border-r lg:border-slate-800/80"
              onClick={handleScrollToTop}
              title="Scroll back to top"
            >
              <img
                src="/halalverify-logo.png"
                alt="HalalVerify Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-emerald-500/30 shadow-md group-hover:scale-105 transition duration-200"
              />
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-sm sm:text-xl tracking-[0.1em] sm:tracking-[0.18em] text-white">HALALVERIFY</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-full">
                    Zamboanga
                  </span>
                </div>
                <p className="hidden xs:block text-[10px] sm:text-xs text-slate-400 tracking-wide">Verification &amp; Compliance Pipeline</p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-3 xl:gap-5 text-xs xl:text-sm font-medium whitespace-nowrap">
              <a
                href="#features"
                onClick={(e) => handleScrollToSection(e, 'features')}
                className={`transition-colors duration-150 whitespace-nowrap shrink-0 ${
                  activeSection === 'features'
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-300 hover:text-emerald-400'
                }`}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => handleScrollToSection(e, 'how-it-works')}
                className={`transition-colors duration-150 whitespace-nowrap shrink-0 ${
                  activeSection === 'how-it-works'
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-300 hover:text-emerald-400'
                }`}
              >
                How It Works
              </a>
              <a
                href="#certifiers"
                onClick={(e) => handleScrollToSection(e, 'certifiers')}
                className={`transition-colors duration-150 whitespace-nowrap shrink-0 ${
                  activeSection === 'certifiers'
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-300 hover:text-emerald-400'
                }`}
              >
                Certifiers
              </a>
              <button
                onClick={() => onViewChange('products')}
                className="text-slate-300 hover:text-emerald-400 transition-colors duration-150 font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                Catalog
              </button>
              <button
                onClick={() => onViewChange('map')}
                className="text-slate-300 hover:text-emerald-400 transition-colors duration-150 font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                Map
              </button>
              <button
                onClick={() => handleOpenContribution('establishment')}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 xl:px-3.5 h-9 text-xs xl:text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-200 transition active:scale-95 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                title="Submit an establishment or product to the registry"
              >
                <Plus size={14} strokeWidth={2.5} className="text-emerald-400" />
                <span>Submit a Listing</span>
              </button>
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 xl:gap-3 shrink-0 whitespace-nowrap">
            {userRole ? (
              <button
                onClick={() => onViewChange('dashboard')}
                className="flex items-center gap-1.5 xl:gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 h-9 px-3.5 xl:px-4 text-xs xl:text-sm font-semibold text-white transition shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LayoutDashboard size={15} className="text-emerald-400" />
                <span>Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => onViewChange('login')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white h-9 px-3 xl:px-3.5 text-xs xl:text-sm font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn size={15} className="text-slate-400" />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={() => onViewChange('scanner')}
              className="flex items-center gap-1.5 xl:gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 h-9 px-3.5 xl:px-4 text-xs xl:text-sm font-bold text-white shadow-md shadow-emerald-900/40 transition transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Camera size={15} />
              <span>Start Scanning</span>
            </button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {!isMobileMenuOpen && (
              <button
                type="button"
                onClick={() => onViewChange('scanner')}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-900/40 transition active:scale-95 cursor-pointer"
                aria-label="Quick launch scanner"
              >
                <Camera size={14} />
                <span>Scan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition focus:outline-none cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMobileMenuOpen ? <X size={22} className="text-emerald-400" /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 top-16 sm:top-20 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-50 lg:hidden border-t border-slate-800 bg-[#0e1625]/98 backdrop-blur-xl animate-in slide-in-from-top-3 duration-200 shadow-2xl max-h-[calc(100dvh-4.5rem)] overflow-y-auto">
              <div className="px-4 py-3.5 space-y-3">
                {/* Group 1: EXPLORE */}
                <div className="space-y-1">
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                    Explore
                  </p>
                  <nav className="flex flex-col space-y-0.5 text-sm font-medium">
                    <a
                      href="#features"
                      onClick={(e) => handleScrollToSection(e, 'features')}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl transition ${
                        activeSection === 'features'
                          ? 'bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-800/60'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800/80 text-emerald-400 flex items-center justify-center shrink-0">
                          <Sparkles size={15} />
                        </div>
                        <span className="text-xs sm:text-sm">Features</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </a>
                    <a
                      href="#how-it-works"
                      onClick={(e) => handleScrollToSection(e, 'how-it-works')}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl transition ${
                        activeSection === 'how-it-works'
                          ? 'bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-800/60'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800/80 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={15} />
                        </div>
                        <span className="text-xs sm:text-sm">How It Works</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </a>
                    <a
                      href="#certifiers"
                      onClick={(e) => handleScrollToSection(e, 'certifiers')}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl transition ${
                        activeSection === 'certifiers'
                          ? 'bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-800/60'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800/80 text-emerald-400 flex items-center justify-center shrink-0">
                          <ShieldCheck size={15} />
                        </div>
                        <span className="text-xs sm:text-sm">Certifiers</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onViewChange('products');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition text-left cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800/80 text-emerald-400 flex items-center justify-center shrink-0">
                          <Package size={15} />
                        </div>
                        <span className="text-xs sm:text-sm">Product Catalog</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onViewChange('map');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition text-left cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800/80 text-teal-400 flex items-center justify-center shrink-0">
                          <MapPin size={15} />
                        </div>
                        <span className="text-xs sm:text-sm">Establishments Map</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </button>
                  </nav>
                </div>

                {/* Group 2: CONTRIBUTE */}
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                    Contribute
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleOpenContribution('establishment');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-500/50 transition cursor-pointer active:scale-[0.99] group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Plus size={15} strokeWidth={2.5} />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-emerald-200">Submit Establishment / Product</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Community
                    </span>
                  </button>
                </div>

                {/* Group 3: QUICK ACTIONS */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <p className="px-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                    Quick Actions
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onViewChange('scanner');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/60 transition active:scale-[0.98] cursor-pointer"
                  >
                    <Camera size={16} className="shrink-0" />
                    <span>Start Optical Scanner</span>
                  </button>

                  {userRole ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onViewChange('dashboard');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm transition active:scale-[0.98] cursor-pointer"
                    >
                      <LayoutDashboard size={15} className="text-emerald-400 shrink-0" />
                      <span>Open Dashboard</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onViewChange('login');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm transition active:scale-[0.98] cursor-pointer"
                    >
                      <LogIn size={15} className="text-emerald-400 shrink-0" />
                      <span>Sign In / Register</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-8 pb-12 sm:pt-16 sm:pb-24 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl sm:max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs sm:text-sm font-semibold mb-5 sm:mb-6 backdrop-blur-sm shadow-inner">
              <Sparkles size={14} className="text-emerald-400 shrink-0" />
              <span>Optical Character Recognition &amp; Verified Database</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight text-white leading-tight sm:leading-[1.15] max-w-3xl sm:max-w-4xl mx-auto">
              Verify Halal Authenticity{' '}
              <span className="block sm:inline mt-1 sm:mt-0">
                in{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent whitespace-nowrap">
                  Zamboanga City.
                </span>
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Empowering consumers and families to inspect food packaging labels, detect certifying logos, and discover certified dining establishments across Zamboanga City, instantly and freely.
            </p>

            {/* Interactive Search Interface */}
            <div className="mt-6 sm:mt-8 max-w-2xl mx-auto text-left">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  aria-label="Search products, brands, or verified establishments"
                  placeholder="Search product names, brands, or verified establishments in Zamboanga..."
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-900/90 py-3 pl-4 pr-20 sm:py-3.5 sm:pl-4 sm:pr-24 text-sm sm:text-base text-white placeholder:text-slate-400/90 outline-none transition duration-200 hover:border-slate-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 shadow-xl backdrop-blur-xl"
                />
                <button
                  type="button"
                  onClick={() => handleSearch(searchQuery)}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-950 hover:text-emerald-300 ${searchQuery ? 'right-10 sm:right-12' : ''}`}
                  aria-label="Search"
                  title="Search"
                >
                  <Search size={18} />
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {searchQuery.trim() && searchResults && (
                <div className="mt-3">
                  {searchResults.totalCount > 0 ? (
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl space-y-2.5 backdrop-blur-xl max-h-80 overflow-y-auto">
                      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                        <span>Found {searchResults.totalCount} matching record(s)</span>
                        <button
                          onClick={() => onViewChange('products', { searchQuery })}
                          className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                        >
                          View In Catalog &rarr;
                        </button>
                      </div>

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
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 transition transform hover:-translate-y-0.5 active:translate-y-0 duration-150 cursor-pointer"
                        >
                          <Camera size={18} />
                          <span>Scan Package with Camera</span>
                        </button>
                        <button
                          onClick={() => handleOpenContribution('establishment')}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition cursor-pointer"
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

            {!searchQuery.trim() && (
              <>
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
                  <button
                    onClick={() => onViewChange('scanner')}
                    className="h-11 sm:h-12 px-6 sm:px-7 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-white text-sm sm:text-base shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 transition duration-150 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera size={19} className="shrink-0" />
                    <span>Launch Scanner</span>
                  </button>

                  <button
                    onClick={() => onViewChange('products')}
                    className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 font-semibold text-slate-200 hover:text-white text-sm sm:text-base transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Package size={18} className="shrink-0 text-slate-400" />
                    <span>Browse Products</span>
                  </button>

                  <button
                    onClick={() => onViewChange('map')}
                    className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 font-semibold text-slate-200 hover:text-white text-sm sm:text-base transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MapPin size={18} className="shrink-0 text-emerald-400" />
                    <span>Establishments Map</span>
                  </button>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-slate-400 font-medium">
                  No account required for scanning and searches.
                </p>
              </>
            )}
          </div>

          {/* Interactive Feature Mockup Preview */}
          <div className="mt-8 sm:mt-16 max-w-4xl mx-auto">
            <div className="relative rounded-xl sm:rounded-3xl border border-slate-700/80 bg-slate-900/90 p-2 sm:p-6 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-4 mb-3 sm:mb-5">
                <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-red-500/80 sm:h-3 sm:w-3" />
                  <div className="h-2 w-2 shrink-0 rounded-full bg-amber-500/80 sm:h-3 sm:w-3" />
                  <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500/80 sm:h-3 sm:w-3" />
                  <span className="ml-0.5 truncate text-[10px] sm:ml-1.5 sm:text-xs font-mono text-slate-300">HalalVerify Inspection Engine</span>
                </div>
                <span className="shrink-0 rounded-md bg-emerald-950 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800 sm:px-2.5 sm:text-xs">
                  RapidOCR Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left">
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3 sm:rounded-2xl sm:p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 sm:mb-2 sm:text-xs">
                      <span className="font-semibold uppercase tracking-wider text-emerald-400">Step 1</span>
                      <Camera size={13} className="sm:h-[14px] sm:w-[14px]" />
                    </div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Label OCR Extraction</h4>
                    <p className="mt-1 text-[10px] text-slate-400 sm:text-xs leading-relaxed">High-speed optical text recognition reads ingredients on packaging.</p>
                  </div>
                  <div className="mt-3 rounded-lg bg-slate-950/80 p-2 font-mono text-[11px] text-slate-200 border border-slate-800 sm:rounded-xl sm:p-2.5 sm:text-xs">
                    <span className="text-emerald-400">&gt;</span> Wheat flour, water, salt, yeast, vegetable oil...
                  </div>
                </div>

                <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3 sm:rounded-2xl sm:p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 sm:mb-2 sm:text-xs">
                      <span className="font-semibold uppercase tracking-wider text-emerald-400">Step 2</span>
                      <ShieldCheck size={13} className="sm:h-[14px] sm:w-[14px]" />
                    </div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Ingredient &amp; Logo Audit</h4>
                    <p className="mt-1 text-[10px] text-slate-400 sm:text-xs leading-relaxed">Cross-referenced with prohibited and doubtful additives and certifiers.</p>
                  </div>
                  <div className="mt-3 rounded-lg bg-slate-950/80 p-2 font-mono text-[11px] text-slate-200 border border-slate-800 sm:rounded-xl sm:p-2.5 sm:text-xs space-y-0.5">
                    <span className="block"><span className="text-emerald-400">&gt;</span> 0 Flagged Prohibited Additives</span>
                    <span className="block"><span className="text-emerald-400">&gt;</span> Logo: HDIP Philippines</span>
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-950/30 border border-emerald-700/40 p-3 sm:rounded-2xl sm:p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 sm:mb-2 sm:text-xs">
                      <span className="font-semibold uppercase tracking-wider text-emerald-400">Step 3</span>
                      <CheckCircle2 size={13} className="text-emerald-400 sm:h-[14px] sm:w-[14px]" />
                    </div>
                    <h4 className="font-bold text-emerald-300 text-xs sm:text-sm">Instant Verdict</h4>
                    <p className="mt-1 text-[10px] text-slate-300 sm:text-xs leading-relaxed">Clear confidence rating and certifier accreditation details.</p>
                  </div>
                  <div className="mt-3 rounded-lg bg-emerald-900/40 p-2 text-center border border-emerald-700/60 sm:rounded-xl sm:p-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300 sm:text-sm">
                      ✓ Halal Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingMarketingSections
        onViewChange={onViewChange}
        onScrollToTop={handleScrollToTop}
        userRole={userRole}
      />

      <ContributionModal
        isOpen={showContributionModal}
        onClose={() => setShowContributionModal(false)}
        initialTab={initialContributionTab}
        onSubmitted={() => {}}
      />

      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        onNavigate={(v) => onViewChange(v)}
        actionTitle="Contribute to Registry"
      />
    </div>
  );
}
