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
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ContributionModal from '../components/submissions/ContributionModal';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import LandingMarketingSections from '../components/landing/LandingMarketingSections';
import ProductCardDetail from '../components/landing/ProductCardDetail';
import { getSafeUrl } from '../utils/security';
import { getStatusConfig, LOCAL_ESTABLISHMENT_PHOTOS, getEstablishmentPhoto } from '../data/constants';

const INITIAL_RECENT_ESTABLISHMENTS = [
  {
    id: '80a35ff3-cf63-4c94-97cb-ba9cd807b6ef',
    name: 'Aldznisa Halal Food',
    type: 'Halal Carinderia',
    address: 'W34J+4JV, Lustre St, Zamboanga City, Zamboanga del Sur, Philippines',
    city: 'Zamboanga City',
    halal_status: 'verified',
    halal_tier: 'muslim_owned',
    admin_notes: '[Tier: muslim_owned] Synced from Muslim in Manila (ID: 1161). Amenities: Standard Dining.',
    description: 'Traditional Tausug and Muslim Filipino carinderia along Lustre Street in Zamboanga City, serving home-cooked morning and lunchtime rice meals. Muslim-owned and operated with pork-free kitchen.',
  },
  {
    id: 'b6e80b2a-6379-4e7a-9773-452fcf118d09',
    name: 'Al Halal Grill',
    type: 'Barbecue House',
    address: '193 Don Toribio St, Zamboanga City, Philippines',
    city: 'Zamboanga City',
    halal_status: 'verified',
    halal_tier: 'muslim_friendly',
    admin_notes: '[Tier: muslim_friendly] Synced from Muslim in Manila (ID: 1157). Amenities: Pork-Free Kitchen.',
    description: 'Local barbecue grill house on Don Toribio Street in Zamboanga City, serving flame-grilled chicken, beef skewers, and rice meals. Operates an owner-declared pork-free kitchen with dine-in and takeout options.',
  },
  {
    id: 'a091b028-4a49-4123-9596-eeb47e410b49',
    name: "Andy's Satti",
    type: 'Satti House',
    address: 'W39Q+Q63, Don Toribio St, Zamboanga City, 7000 Zamboanga del Sur, Philippines',
    city: 'Zamboanga City',
    halal_status: 'verified',
    halal_tier: 'muslim_owned',
    admin_notes: '[Tier: muslim_owned] Synced from Muslim in Manila (ID: 660). Amenities: Parking.',
    description: 'Well-known traditional satti dining house along Don Toribio Street, featuring skewered beef and chicken served in sweet and spicy satti broth with rice cubes. Muslim-owned and pork-free.',
  },
  {
    id: '2963602c-699b-4f27-8bc5-cff67277df18',
    name: 'AntiEns Home of Authentic Muslim Cuisine',
    type: 'Tausug Cuisine Restaurant',
    address: 'Pilar St, Zamboanga City, 7000 Zamboanga del Sur, Philippines',
    city: 'Zamboanga City',
    halal_status: 'verified',
    halal_tier: 'muslim_owned',
    admin_notes: '[Tier: muslim_owned] Synced from Muslim in Manila (ID: 657). Amenities: 100% Alcohol-Free Premises, Pork-Free Kitchen.',
    description: 'Traditional Tausug dining establishment at Yubenco Tetuan, preparing Moro specialties including biyungkus kagang, traditional Latal platter sets, and native pastries. Muslim-owned kitchen.',
  },
  {
    id: '313afb85-516c-40e5-a0de-6bce43c577d0',
    name: 'Bambas by Chef Mick',
    type: 'Casual Dining Bistro',
    address: 'MP Tower, Nuñez Ext. St, Barangay Zone IV, Zamboanga City, 7000 Zamboanga del Sur, Philippines',
    city: 'Zamboanga City',
    halal_status: 'verified',
    halal_tier: 'muslim_friendly',
    admin_notes: '[Tier: muslim_friendly] Synced from Muslim in Manila (ID: 1156). Amenities: Standard Dining.',
    description: 'Casual dining bistro on Campaner Street offering modern comfort meals, pasta, and savory plates. Provides pork-free accommodations for Muslim diners.',
  },
  {
    id: 'bd22d2e5-955d-4de0-86c1-e2c410991a28',
    name: 'Bandit Burger',
    type: 'Burger House',
    address: 'Veterans Ave Ext., Zamboanga City, 7000 Zamboanga del Sur, Philippines',
    city: 'Zamboanga City',
    halal_status: 'verified',
    halal_tier: 'halal_certified',
    facebook_url: 'https://www.facebook.com/banditburger',
    admin_notes: '[Tier: halal_certified] Synced from Muslim in Manila (ID: 1237). Amenities: Standard Dining.',
    description: 'Smash burger establishment on Veterans Avenue Extension serving handcrafted beef patties, specialty burgers, and fries. Formally certified Halal by the Ulama Council of Zamboanga Peninsula.',
  },
  {
    id: 'bay-tal-mal-initial',
    name: 'Bay Tal Mal Restaurant Zamboanga City',
    type: 'Moro & Tausug Restaurant',
    address: '4th Floor, SM City Mindpro, La Purisima St, Zamboanga City, 7000 Zamboanga del Sur, Philippines',
    city: 'Zamboanga City',
    halal_status: 'verified',
    halal_tier: 'halal_certified',
    admin_notes: '[Tier: halal_certified] Synced from Muslim in Manila (ID: 468). Amenities: Air-Conditioned, Prayer Room Nearby.',
    description: 'Flagship Moro and Tausug restaurant located at SM City Mindpro, serving authentic Latal platters, beef kulma, and traditional dishes in a Moroccan-inspired setting. Halal certified by MMHCBI.',
  },
  {
    id: 'black-plate-initial',
    name: 'Black Plate Zamboanga',
    type: 'Sizzling & Grill House',
    address: 'Mayor Jaldon St, Canelar, Zamboanga City, 7000 Zamboanga del Sur, Philippines',
    city: 'Zamboanga City',
    halal_status: 'verified',
    halal_tier: 'halal_certified',
    admin_notes: '[Tier: halal_certified] Synced from Muslim in Manila (ID: 1157). Amenities: Standard Dining.',
    description: 'Casual dining venue on Mayor Jaldon Street offering grilled meats, rice bowls, and contemporary comfort dishes. Halal certified by the Ulama Council of Zamboanga Peninsula.',
  },
];

function getEstablishmentTierLabel(establishment) {
  return getStatusConfig(establishment).label;
}

function getEstablishmentImageUrl(establishment) {
  if (!establishment) return null;
  const localPhoto = getEstablishmentPhoto(establishment);
  if (localPhoto) return localPhoto;
  return getSafeUrl(establishment.logo_url || establishment.certificate_url);
}

export default function LandingPage({ onViewChange, userRole }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [activeRecentProductIndex, setActiveRecentProductIndex] = useState(0);
  const [selectedRecentProduct, setSelectedRecentProduct] = useState(null);
  const [allEstablishments, setAllEstablishments] = useState([]);
  const [recentEstablishments, setRecentEstablishments] = useState(INITIAL_RECENT_ESTABLISHMENTS);
  const [activeRecentEstablishmentIndex, setActiveRecentEstablishmentIndex] = useState(0);

  const recentProductsDisplay = recentProducts;
  const recentEstablishmentsDisplay = recentEstablishments;
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
  const recentProductsScrollRef = useRef(null);
  const recentProductsPauseUntilRef = useRef(0);
  const recentEstablishmentsScrollRef = useRef(null);
  const recentEstablishmentsPauseUntilRef = useRef(0);
  const programmaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef(null);

  const scrollRecentProducts = (direction) => {
    const carousel = recentProductsScrollRef.current;
    const cards = carousel?.querySelectorAll('[data-recent-product-card]');
    if (!carousel || !cards?.length) return;

    recentProductsPauseUntilRef.current = Date.now() + 6000;
    const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
    const step = cards[0].getBoundingClientRect().width + gap;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;

    if (direction > 0) {
      if (carousel.scrollLeft >= maxScroll - 8 || activeRecentProductIndex >= recentProducts.length - 1) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      carousel.scrollBy({ left: step, behavior: 'smooth' });
    } else {
      if (carousel.scrollLeft <= 8 || activeRecentProductIndex === 0) {
        const lastIndex = Math.min(cards.length - 1, (recentProducts.length || 1) - 1);
        const targetCard = cards[lastIndex];
        if (targetCard) {
          carousel.scrollTo({ left: targetCard.offsetLeft - carousel.offsetLeft, behavior: 'smooth' });
        }
        return;
      }
      carousel.scrollBy({ left: -step, behavior: 'smooth' });
    }
  };

  const scrollToRecentProduct = (index) => {
    const carousel = recentProductsScrollRef.current;
    const card = carousel?.querySelectorAll('[data-recent-product-card]')[index];
    if (!carousel || !card) return;

    recentProductsPauseUntilRef.current = Date.now() + 6000;
    carousel.scrollTo({ left: card.offsetLeft - carousel.offsetLeft, behavior: 'smooth' });
    setActiveRecentProductIndex(index);
  };

  const handleRecentProductsScroll = (event) => {
    const carousel = event.currentTarget;
    const cards = [...carousel.querySelectorAll('[data-recent-product-card]')];
    if (!cards.length) return;

    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    if (maxScroll > 0 && carousel.scrollLeft >= maxScroll - 6) {
      const visibleStops = cards.filter((card) => card.offsetLeft - carousel.offsetLeft <= maxScroll + 8);
      setActiveRecentProductIndex(Math.max(0, visibleStops.length - 1));
      return;
    }

    let closestIndex = 0;
    let closestDistance = Infinity;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft - carousel.offsetLeft - carousel.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    const baseCount = recentProducts.length || 1;
    setActiveRecentProductIndex(closestIndex % baseCount);
  };

  const scrollRecentEstablishments = (direction) => {
    const carousel = recentEstablishmentsScrollRef.current;
    const cards = carousel?.querySelectorAll('[data-recent-establishment-card]');
    if (!carousel || !cards?.length) return;

    recentEstablishmentsPauseUntilRef.current = Date.now() + 6000;
    const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
    const step = cards[0].getBoundingClientRect().width + gap;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;

    if (direction > 0) {
      if (carousel.scrollLeft >= maxScroll - 8) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      carousel.scrollBy({ left: step, behavior: 'smooth' });
    } else {
      if (carousel.scrollLeft <= 8) {
        carousel.scrollTo({ left: maxScroll, behavior: 'smooth' });
        return;
      }
      carousel.scrollBy({ left: -step, behavior: 'smooth' });
    }
  };

  const scrollToRecentEstablishment = (index) => {
    const carousel = recentEstablishmentsScrollRef.current;
    const card = carousel?.querySelectorAll('[data-recent-establishment-card]')[index];
    if (!carousel || !card) return;

    recentEstablishmentsPauseUntilRef.current = Date.now() + 6000;
    carousel.scrollTo({ left: card.offsetLeft - carousel.offsetLeft, behavior: 'smooth' });
    setActiveRecentEstablishmentIndex(index);
  };

  const handleRecentEstablishmentsScroll = (event) => {
    const carousel = event.currentTarget;
    const cards = [...carousel.querySelectorAll('[data-recent-establishment-card]')];
    if (!cards.length) return;

    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    if (maxScroll > 0 && carousel.scrollLeft >= maxScroll - 6) {
      const visibleStops = cards.filter((card) => card.offsetLeft - carousel.offsetLeft <= maxScroll + 8);
      setActiveRecentEstablishmentIndex(Math.max(0, visibleStops.length - 1));
      return;
    }

    let closestIndex = 0;
    let closestDistance = Infinity;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft - carousel.offsetLeft - carousel.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    const baseCount = recentEstablishments.length || 1;
    setActiveRecentEstablishmentIndex(closestIndex % baseCount);
  };

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

  useEffect(() => {
    if (recentProducts.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const intervalId = window.setInterval(() => {
      const carousel = recentProductsScrollRef.current;
      const firstCard = carousel?.querySelector('[data-recent-product-card]');
      if (
        !carousel ||
        !firstCard ||
        Date.now() < recentProductsPauseUntilRef.current ||
        carousel.matches(':hover') ||
        carousel.contains(document.activeElement)
      ) {
        return;
      }

      const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
      const step = firstCard.getBoundingClientRect().width + gap;
      const endPosition = carousel.scrollWidth - carousel.clientWidth;
      const nextPosition = carousel.scrollLeft + step;

      carousel.scrollTo({
        left: nextPosition >= endPosition - 8 ? 0 : nextPosition,
        behavior: 'smooth',
      });
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, [recentProducts.length]);

  useEffect(() => {
    if (recentEstablishments.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const intervalId = window.setInterval(() => {
      const carousel = recentEstablishmentsScrollRef.current;
      const firstCard = carousel?.querySelector('[data-recent-establishment-card]');
      if (
        !carousel ||
        !firstCard ||
        Date.now() < recentEstablishmentsPauseUntilRef.current ||
        carousel.matches(':hover') ||
        carousel.contains(document.activeElement)
      ) {
        return;
      }

      const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
      const step = firstCard.getBoundingClientRect().width + gap;
      const endPosition = carousel.scrollWidth - carousel.clientWidth;
      const nextPosition = carousel.scrollLeft + step;

      carousel.scrollTo({
        left: nextPosition >= endPosition - 8 ? 0 : nextPosition,
        behavior: 'smooth',
      });
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, [recentEstablishments.length]);

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
        const [prodRes, estRes, recentProductsRes, recentEstablishmentsRes] = await Promise.all([
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
          supabase
            .from('products')
            .select('id, name, brand, category, status, image_url, created_at, expiry_date, manufacturers(name), certifying_bodies(name, code)')
            .not('status', 'in', '(REJECTED,rejected,PENDING_VERIFICATION,pending,needs_review,draft)')
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('establishments')
            .select('id, name, type, address, city, halal_status, halal_tier, expiry_date, certificate_number, logo_url, certificate_url, description, admin_notes, created_at, facebook_url, website_url, certifying_bodies(name, code)')
            .in('halal_status', ['verified', 'VERIFIED', 'halal_certified', 'Halal Certified'])
            .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString().slice(0, 10)}`)
            .order('created_at', { ascending: false })
            .limit(100),
        ]);

        if (isMounted) {
          if (prodRes.data) setAllProducts(prodRes.data);
          if (estRes.data) setAllEstablishments(estRes.data);
          if (recentProductsRes.data) setRecentProducts(recentProductsRes.data);
          if (recentEstablishmentsRes.data) {
            const approvedEstablishments = recentEstablishmentsRes.data.filter((establishment) => {
              const cfg = getStatusConfig(establishment);
              return cfg.key !== 'needs_review' && cfg.key !== 'rejected' && cfg.key !== 'flagged';
            });
            const aldznisa = approvedEstablishments.find((e) => e.name.toLowerCase().includes('aldznisa')) ||
              INITIAL_RECENT_ESTABLISHMENTS[0];
            const alHalal = approvedEstablishments.find((e) => e.name.toLowerCase().includes('al halal')) ||
              INITIAL_RECENT_ESTABLISHMENTS[1];
            const andys = approvedEstablishments.find((e) => e.name.toLowerCase().includes('andy')) ||
              INITIAL_RECENT_ESTABLISHMENTS[2];
            const antiens = approvedEstablishments.find((e) => e.name.toLowerCase().includes('antiens')) ||
              INITIAL_RECENT_ESTABLISHMENTS[3];
            const bambas = approvedEstablishments.find((e) => e.name.toLowerCase().includes('bambas')) ||
              INITIAL_RECENT_ESTABLISHMENTS[4];
            const bandit = approvedEstablishments.find((e) => e.name.toLowerCase().includes('bandit')) ||
              INITIAL_RECENT_ESTABLISHMENTS[5];
            const bayTalMal = approvedEstablishments.find((e) => e.name.toLowerCase().includes('bay tal mal')) ||
              INITIAL_RECENT_ESTABLISHMENTS[6];
            const blackPlate = approvedEstablishments.find((e) => e.name.toLowerCase().includes('black plate')) ||
              INITIAL_RECENT_ESTABLISHMENTS[7];
            const rest = approvedEstablishments.filter((e) =>
              !e.name.toLowerCase().includes('aldznisa') &&
              !e.name.toLowerCase().includes('al halal') &&
              !e.name.toLowerCase().includes('andy') &&
              !e.name.toLowerCase().includes('antiens') &&
              !e.name.toLowerCase().includes('bambas') &&
              !e.name.toLowerCase().includes('bandit') &&
              !e.name.toLowerCase().includes('bay tal mal') &&
              !e.name.toLowerCase().includes('black plate')
            );
            const featuredWithPhotos = [aldznisa, alHalal, andys, antiens, bambas, bandit, bayTalMal, blackPlate].filter(Boolean);
            const combined = [...featuredWithPhotos, ...rest];
            setRecentEstablishments(combined.slice(0, 8));
          }
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
      className="h-full max-h-[100dvh] overflow-y-auto overflow-x-hidden scroll-smooth bg-[#F4F8F5] text-[#17251F] selection:bg-emerald-500 selection:text-white w-full max-w-full"
    >
      {/* Top Navigation Bar */}
      <header className="fixed top-3 left-1/2 z-50 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 rounded-2xl border border-[#DCE7E0]/80 bg-white/90 shadow-lg shadow-[#17251F]/10 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6 lg:px-8 gap-4">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
            onClick={handleScrollToTop}
            title="Scroll back to top"
          >
            <img
              src="/halalverify-logo.png"
              alt="HalalVerify Logo"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-emerald-500/30 shadow-md group-hover:scale-105 transition duration-200"
            />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-sm sm:text-xl tracking-[0.1em] sm:tracking-[0.18em] text-[#17251F]">HALALVERIFY</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-[#EAF3ED] text-emerald-800 border border-emerald-200 rounded-full">
                Zamboanga
              </span>
            </div>
          </div>

          {/* Centered Navigation Links */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs xl:text-sm font-medium whitespace-nowrap">
            <a
              href="#features"
              onClick={(e) => handleScrollToSection(e, 'features')}
              className={`transition-colors duration-150 whitespace-nowrap shrink-0 ${
                activeSection === 'features'
                  ? 'text-emerald-800 font-bold'
                  : 'text-[#52645B] hover:text-emerald-800'
              }`}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleScrollToSection(e, 'how-it-works')}
              className={`transition-colors duration-150 whitespace-nowrap shrink-0 ${
                activeSection === 'how-it-works'
                  ? 'text-emerald-800 font-bold'
                  : 'text-[#52645B] hover:text-emerald-800'
              }`}
            >
              How It Works
            </a>
            <a
              href="#certifiers"
              onClick={(e) => handleScrollToSection(e, 'certifiers')}
              className={`transition-colors duration-150 whitespace-nowrap shrink-0 ${
                activeSection === 'certifiers'
                  ? 'text-emerald-800 font-bold'
                  : 'text-[#52645B] hover:text-emerald-800'
              }`}
            >
              Certifiers
            </a>
            <button
              type="button"
              onClick={() => onViewChange('products')}
              className="text-[#52645B] hover:text-emerald-800 transition-colors duration-150 font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              Catalog
            </button>
            <button
              type="button"
              onClick={() => onViewChange('map')}
              className="text-[#52645B] hover:text-emerald-800 transition-colors duration-150 font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              Map
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0 whitespace-nowrap">
            <button
              type="button"
              onClick={() => handleOpenContribution('establishment')}
              className="hidden xl:flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#EAF3ED] px-3 xl:px-3.5 h-9 text-xs xl:text-sm font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-900 transition active:scale-95 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
              title="Add an establishment or food place"
            >
              <Plus size={14} strokeWidth={2.5} className="text-emerald-800" />
              <span>Add a Place</span>
            </button>

            {userRole ? (
              <button
                type="button"
                onClick={() => onViewChange('dashboard')}
                className="flex items-center gap-1.5 xl:gap-2 rounded-xl bg-white hover:bg-[#EAF3ED] border border-[#DCE7E0] h-9 px-3.5 xl:px-4 text-xs xl:text-sm font-semibold text-[#17251F] transition shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LayoutDashboard size={15} className="text-emerald-700" />
                <span>Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onViewChange('login')}
                className="flex items-center gap-1.5 rounded-xl border border-[#DCE7E0] bg-white hover:bg-[#EAF3ED] text-[#52645B] hover:text-[#17251F] h-9 px-3 xl:px-3.5 text-xs xl:text-sm font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn size={15} className="text-[#52645B]" />
                <span>Sign In</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onViewChange('scanner')}
              className="flex items-center gap-1.5 xl:gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 h-9 px-3.5 xl:px-4 text-xs xl:text-sm font-bold text-white shadow-md shadow-emerald-900/20 transition transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0 cursor-pointer"
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
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
                aria-label="Quick launch scanner"
              >
                <Camera size={14} />
                <span>Scan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl text-[#52645B] hover:text-[#17251F] hover:bg-[#EAF3ED] transition focus:outline-none cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMobileMenuOpen ? <X size={22} className="text-emerald-700" /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 top-16 sm:top-20 bg-slate-950/25 z-40 lg:hidden backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-50 lg:hidden border-t border-[#DCE7E0] bg-white/98 backdrop-blur-xl animate-in slide-in-from-top-3 duration-200 shadow-2xl max-h-[calc(100dvh-4.5rem)] overflow-y-auto">
              <div className="px-4 py-3.5 space-y-3">
                {/* Group 1: EXPLORE */}
                <div className="space-y-1">
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#52645B] select-none">
                    Explore
                  </p>
                  <nav className="flex flex-col space-y-0.5 text-sm font-medium">
                    <a
                      href="#features"
                      onClick={(e) => handleScrollToSection(e, 'features')}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl transition ${
                        activeSection === 'features'
                          ? 'bg-[#EAF3ED] text-emerald-800 font-bold border border-emerald-200'
                          : 'text-[#52645B] hover:text-[#17251F] hover:bg-[#F4F8F5] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#EAF3ED] text-emerald-700 flex items-center justify-center shrink-0">
                          <Sparkles size={15} />
                        </div>
                        <span className="text-xs sm:text-sm">Features</span>
                      </div>
                      <ChevronRight size={14} className="text-[#52645B]" />
                    </a>
                    <a
                      href="#how-it-works"
                      onClick={(e) => handleScrollToSection(e, 'how-it-works')}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl transition ${
                        activeSection === 'how-it-works'
                          ? 'bg-[#EAF3ED] text-emerald-800 font-bold border border-emerald-200'
                          : 'text-[#52645B] hover:text-[#17251F] hover:bg-[#F4F8F5] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#EAF3ED] text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={15} />
                        </div>
                        <span className="text-xs sm:text-sm">How It Works</span>
                      </div>
                      <ChevronRight size={14} className="text-[#52645B]" />
                    </a>
                    <a
                      href="#certifiers"
                      onClick={(e) => handleScrollToSection(e, 'certifiers')}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl transition ${
                        activeSection === 'certifiers'
                          ? 'bg-[#EAF3ED] text-emerald-800 font-bold border border-emerald-200'
                          : 'text-[#52645B] hover:text-[#17251F] hover:bg-[#F4F8F5] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#EAF3ED] text-emerald-700 flex items-center justify-center shrink-0">
                          <ShieldCheck size={15} />
                        </div>
                        <span className="text-xs sm:text-sm">Certifiers</span>
                      </div>
                      <ChevronRight size={14} className="text-[#52645B]" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onViewChange('products');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#52645B] hover:text-[#17251F] hover:bg-[#F4F8F5] transition text-left cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#EAF3ED] text-emerald-700 flex items-center justify-center shrink-0">
                          <Package size={15} />
                        </div>
                        <span className="text-xs sm:text-sm">Product Catalog</span>
                      </div>
                      <ChevronRight size={14} className="text-[#52645B]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onViewChange('map');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#52645B] hover:text-[#17251F] hover:bg-[#F4F8F5] transition text-left cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#EAF3ED] text-emerald-700 flex items-center justify-center shrink-0">
                          <MapPin size={15} />
                        </div>
                        <span className="text-xs sm:text-sm">Establishments Map</span>
                      </div>
                      <ChevronRight size={14} className="text-[#52645B]" />
                    </button>
                  </nav>
                </div>

                {/* Group 2: CONTRIBUTE */}
                <div className="pt-2 border-t border-[#DCE7E0]">
                  <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#52645B] select-none">
                    Contribute
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleOpenContribution('establishment');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#EAF3ED] border border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition cursor-pointer active:scale-[0.99] group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Plus size={15} strokeWidth={2.5} />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-emerald-900">Submit Establishment / Product</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200">
                      Community
                    </span>
                  </button>
                </div>

                {/* Group 3: QUICK ACTIONS */}
                <div className="pt-2 border-t border-[#DCE7E0] space-y-2">
                  <p className="px-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#52645B] select-none">
                    Account
                  </p>

                  {userRole ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onViewChange('dashboard');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-[#EAF3ED] border border-[#DCE7E0] text-[#17251F] font-semibold text-xs sm:text-sm transition active:scale-[0.98] cursor-pointer"
                    >
                      <LayoutDashboard size={15} className="text-emerald-700 shrink-0" />
                      <span>Open Dashboard</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onViewChange('login');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-[#EAF3ED] border border-[#DCE7E0] text-[#17251F] font-semibold text-xs sm:text-sm transition active:scale-[0.98] cursor-pointer"
                    >
                      <LogIn size={15} className="text-emerald-700 shrink-0" />
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
      <section
        className="landing-hero-background relative border-b border-[#DCE7E0] pt-24 pb-12 sm:pt-28 sm:pb-24 overflow-hidden"
        style={{
          '--hero-food-image': "url('/hero-background/hero-food-bg.png')",
        }}
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl sm:max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3ED] border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold mb-5 sm:mb-6 backdrop-blur-sm shadow-inner">
              <Sparkles size={14} className="text-emerald-700 shrink-0" />
              <span>AI Food Label &amp; Ingredient Scanner</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#17251F] leading-tight sm:leading-[1.15] max-w-3xl sm:max-w-4xl mx-auto">
              Verify Halal Authenticity{' '}
              <span className="block sm:inline mt-1 sm:mt-0">
                in{' '}
                <span className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-600 bg-clip-text text-transparent whitespace-nowrap">
                  Zamboanga City.
                </span>
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[#52645B] leading-relaxed max-w-2xl mx-auto">
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
                  className="w-full rounded-xl sm:rounded-2xl border border-[#DCE7E0] bg-white py-3 pl-4 pr-20 sm:py-3.5 sm:pl-4 sm:pr-24 text-sm sm:text-base text-[#17251F] placeholder:text-[#52645B]/70 outline-none transition duration-200 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 shadow-xl backdrop-blur-xl"
                />
                <button
                  type="button"
                  onClick={() => handleSearch(searchQuery)}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-emerald-700 transition hover:bg-[#EAF3ED] hover:text-emerald-900 ${searchQuery ? 'right-10 sm:right-12' : ''}`}
                  aria-label="Search"
                  title="Search"
                >
                  <Search size={18} />
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#52645B] hover:text-[#17251F] p-1 rounded-lg transition cursor-pointer"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {searchQuery.trim() && searchResults && (
                <div className="mt-3">
                  {searchResults.totalCount > 0 ? (
                    <div className="rounded-2xl border border-[#DCE7E0] bg-white p-4 shadow-2xl space-y-2.5 backdrop-blur-xl max-h-80 overflow-y-auto">
                      <div className="flex items-center justify-between text-xs text-[#52645B] border-b border-[#DCE7E0] pb-2">
                        <span>Found {searchResults.totalCount} matching record(s)</span>
                        <button
                          onClick={() => onViewChange('products', { searchQuery })}
                          className="text-emerald-800 hover:underline font-semibold cursor-pointer"
                        >
                          View In Catalog &rarr;
                        </button>
                      </div>

                      {searchResults.products.map(p => (
                        <div
                          key={p.id}
                          onClick={() => onViewChange('products', { searchQuery: p.name })}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-[#F4F8F5] cursor-pointer border border-[#DCE7E0] transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <Package size={18} className="text-emerald-700 shrink-0" />
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-[#17251F]">{p.name}</p>
                              <p className="text-[11px] text-[#52645B]">{p.brand} &bull; {p.category}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#EAF3ED] text-emerald-800 border border-emerald-200">
                            {p.status || 'Halal'}
                          </span>
                        </div>
                      ))}

                      {searchResults.establishments.map(e => (
                        <div
                          key={e.id}
                          onClick={() => onViewChange('map')}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-[#F4F8F5] cursor-pointer border border-[#DCE7E0] transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <Building2 size={18} className="text-teal-700 shrink-0" />
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-[#17251F]">{e.name}</p>
                              <p className="text-[11px] text-[#52645B]">{e.address}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                            {e.halal_status || 'Verified'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xl text-center backdrop-blur-xl space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#EAF3ED] border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
                        <Camera size={22} />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#17251F]">
                        Product or Establishment not found. Scan package to verify.
                      </h3>
                      <p className="text-xs sm:text-sm text-[#52645B] max-w-md mx-auto leading-relaxed">
                        &quot;{searchQuery}&quot; was not found in the verified database. Use the visual scanner to inspect the package label, detect certifying seals, and parse ingredients.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={() => onViewChange('scanner')}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/20 transition transform hover:-translate-y-0.5 active:translate-y-0 duration-150 cursor-pointer"
                        >
                          <Camera size={18} />
                          <span>Scan Package with Camera</span>
                        </button>
                        <button
                          onClick={() => handleOpenContribution('establishment')}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-[#EAF3ED] text-[#17251F] font-semibold text-xs sm:text-sm border border-[#DCE7E0] transition cursor-pointer"
                        >
                          <Building2 size={16} className="text-teal-700" />
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
                    className="h-11 sm:h-12 px-6 sm:px-7 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 font-bold text-white text-sm sm:text-base shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 transition duration-150 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera size={19} className="shrink-0" />
                    <span>Launch Scanner</span>
                  </button>

                  <button
                    onClick={() => onViewChange('products')}
                    className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-white hover:bg-[#EAF3ED] border border-[#DCE7E0] hover:border-emerald-300 font-semibold text-[#17251F] text-sm sm:text-base transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Package size={18} className="shrink-0 text-[#52645B]" />
                    <span>Browse Products</span>
                  </button>

                  <button
                    onClick={() => onViewChange('map')}
                    className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-white hover:bg-[#EAF3ED] border border-[#DCE7E0] hover:border-emerald-300 font-semibold text-[#17251F] text-sm sm:text-base transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MapPin size={18} className="shrink-0 text-emerald-700" />
                    <span>Establishments Map</span>
                  </button>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-[#52645B] font-medium">
                  No account required for scanning and searches.
                </p>
              </>
            )}
          </div>

        </div>
      </section>

      <section className="bg-[#EAF3ED] px-4 py-10 sm:py-14 border-b border-[#DCE7E0]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-5 sm:mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">From the local registry</p>
              <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-[#17251F]">Recently Added Products</h2>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onViewChange('products')}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#DCE7E0] bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-[#17251F] transition hover:border-emerald-300 hover:bg-[#F4F8F5]"
              >
                View all <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {recentProducts.length > 0 ? (
            <div className="relative" role="group" aria-label="Product carousel controls">
              <button
                type="button"
                onClick={() => scrollRecentProducts(-1)}
                aria-label="Previous products"
                title="Previous products"
                className="absolute left-1 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-transparent text-white transition hover:scale-110 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                <ChevronLeft size={34} strokeWidth={3} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
              </button>
              <div
                ref={recentProductsScrollRef}
                onPointerDown={() => { recentProductsPauseUntilRef.current = Date.now() + 6000; }}
                onScroll={handleRecentProductsScroll}
                className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 sm:gap-4"
                aria-label="Recently added products"
              >
                {recentProductsDisplay.map((product) => {
                  const imageUrl = getSafeUrl(product.image_url);

                  return (
                    <article
                      key={product.id}
                      data-recent-product-card
                      aria-hidden={product._isClone ? 'true' : undefined}
                      tabIndex={product._isClone ? -1 : undefined}
                      className="w-[84%] shrink-0 snap-start overflow-hidden rounded-lg border border-[#DCE7E0] bg-white sm:w-[calc((100%_-_1rem)/2)] lg:w-[calc((100%_-_2rem)/3)]"
                    >
                      <div className="relative aspect-[4/3] bg-[#F4F8F5]">
                        <div className="absolute inset-0 flex items-center justify-center text-emerald-700/50">
                          <Package size={38} strokeWidth={1.5} />
                        </div>
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            loading="lazy"
                            onError={(event) => event.currentTarget.classList.add('hidden')}
                            className="absolute inset-0 h-full w-full object-contain p-4"
                          />
                        )}
                      </div>
                      <div className="flex min-h-32 flex-col p-3 sm:p-4">
                        <p className="text-[11px] font-semibold text-[#52645B]">
                          {product.brand || product.category || 'Local product'}
                        </p>
                        <h3 className="mt-1 line-clamp-2 text-sm font-bold text-[#17251F]">{product.name}</h3>
                        <button
                          type="button"
                          onClick={() => setSelectedRecentProduct(product)}
                          className="mt-auto self-start pt-3 text-xs font-bold text-emerald-800 hover:text-emerald-950"
                        >
                          See details <span aria-hidden="true">&rarr;</span>
                        </button>
                      </div>
                    </article>
                  );
                })}

              </div>
              <button
                type="button"
                onClick={() => scrollRecentProducts(1)}
                aria-label="Next products"
                title="Next products"
                className="absolute right-1 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-transparent text-white transition hover:scale-110 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                <ChevronRight size={34} strokeWidth={3} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
              </button>
              <div className="mt-3 flex justify-center gap-2" role="group" aria-label="Choose a product">
                {recentProducts.map((product, index) => {
                  const isHiddenOnTablet = index > Math.max(0, recentProducts.length - 2);
                  const isHiddenOnDesktop = index > Math.max(0, recentProducts.length - 3);
                  const responsiveDotClass = isHiddenOnTablet
                    ? 'sm:hidden'
                    : isHiddenOnDesktop
                      ? 'lg:hidden'
                      : '';

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => scrollToRecentProduct(index)}
                      aria-label={`Go to product ${index + 1}: ${product.name}`}
                      aria-current={activeRecentProductIndex === index ? 'true' : undefined}
                      className={`h-2.5 w-2.5 rounded-full transition-colors cursor-pointer ${responsiveDotClass} ${
                        activeRecentProductIndex === index
                          ? 'bg-emerald-700'
                          : 'bg-emerald-900/20 hover:bg-emerald-700/50'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-[#DCE7E0] bg-white p-5 text-sm text-[#52645B]">
              Recently added products will appear here.
            </p>
          )}
        </div>
      </section>

      <section className="bg-[#EAF3ED] px-4 py-10 sm:py-14 border-b border-[#DCE7E0]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-5 sm:mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Verified local places</p>
              <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-[#17251F]">Recently Added Establishments</h2>
              <p className="mt-1 text-xs sm:text-sm text-[#52645B]">
                Showing featured dining spots from 40+ verified establishments across Zamboanga City.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onViewChange('map')}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#DCE7E0] bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-[#17251F] transition hover:border-emerald-300 hover:bg-[#F4F8F5]"
              >
                View all on map <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {recentEstablishments.length > 0 ? (
            <div className="relative" role="group" aria-label="Verified establishment carousel controls">
              <button
                type="button"
                onClick={() => scrollRecentEstablishments(-1)}
                aria-label="Previous establishments"
                title="Previous establishments"
                className="absolute left-1 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-transparent text-white transition hover:scale-110 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                <ChevronLeft size={34} strokeWidth={3} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
              </button>
              <div
                ref={recentEstablishmentsScrollRef}
                onPointerDown={() => { recentEstablishmentsPauseUntilRef.current = Date.now() + 6000; }}
                onScroll={handleRecentEstablishmentsScroll}
                className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 sm:gap-4"
                aria-label="Recently added verified establishments"
              >
                {recentEstablishmentsDisplay.map((establishment) => {
                  const imageUrl = getEstablishmentImageUrl(establishment);

                  return (
                    <article
                      key={establishment.id}
                      data-recent-establishment-card
                      aria-hidden={establishment._isClone ? 'true' : undefined}
                      tabIndex={establishment._isClone ? -1 : undefined}
                      className="flex min-h-[220px] w-[84%] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-[#DCE7E0] bg-white sm:w-[calc((100%_-_1rem)/2)] lg:w-[calc((100%_-_2rem)/3)]"
                    >
                      <div className="relative aspect-[4/3] bg-[#F4F8F5] overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center text-emerald-700/50">
                          <Building2 size={38} strokeWidth={1.5} />
                        </div>
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={`${establishment.name} photo or logo`}
                            loading="lazy"
                            onError={(event) => event.currentTarget.classList.add('hidden')}
                            className={`absolute inset-0 h-full w-full ${imageUrl.includes('/logos/') ? 'object-contain p-4' : 'object-cover'}`}
                          />
                        )}
                      </div>

                      <div className="flex min-h-[220px] flex-1 flex-col p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#52645B]">
                              {establishment.type || 'Establishment'}
                            </p>
                            <h3 className="mt-1 line-clamp-2 text-sm font-bold text-[#17251F] sm:text-base">
                              {establishment.name}
                            </h3>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${
                            getStatusConfig(establishment).badgeBg || 'border-emerald-200 bg-[#EAF3ED] text-emerald-800'
                          }`}>
                            {getEstablishmentTierLabel(establishment)}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-xs text-[#52645B]">
                          <p className="flex items-start gap-2">
                            <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-700" />
                            <span className="line-clamp-2">
                              {[
                                establishment.address,
                                establishment.city && !establishment.address?.toLowerCase().includes(establishment.city.toLowerCase())
                                  ? establishment.city
                                  : null,
                              ].filter(Boolean).join(', ') || 'Address not provided'}
                            </span>
                          </p>
                          <p className="flex items-start gap-2">
                            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-700" />
                            <span className="line-clamp-2">
                              {establishment.certifying_bodies?.name || establishment.certifying_bodies?.code || 'Certifying body not listed'}
                              {establishment.expiry_date && ` · Valid until ${establishment.expiry_date}`}
                            </span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onViewChange('map', { searchQuery: establishment.name })}
                          className="mt-auto inline-flex items-center gap-1.5 self-start pt-4 text-xs font-bold text-emerald-800 transition hover:text-emerald-950"
                        >
                          <MapPin size={14} /> View on map
                        </button>
                      </div>
                    </article>
                  );
                })}

              </div>
              <button
                type="button"
                onClick={() => scrollRecentEstablishments(1)}
                aria-label="Next establishments"
                title="Next establishments"
                className="absolute right-1 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-transparent text-white transition hover:scale-110 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                <ChevronRight size={34} strokeWidth={3} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
              </button>
              <div className="mt-3 flex justify-center gap-2" role="group" aria-label="Choose an establishment">
                {recentEstablishments.map((establishment, index) => {
                  const isHiddenOnTablet = index > Math.max(0, recentEstablishments.length - 2);
                  const isHiddenOnDesktop = index > Math.max(0, recentEstablishments.length - 3);
                  const responsiveDotClass = isHiddenOnTablet
                    ? 'sm:hidden'
                    : isHiddenOnDesktop
                      ? 'lg:hidden'
                      : '';

                  return (
                    <button
                      key={establishment.id}
                      type="button"
                      onClick={() => scrollToRecentEstablishment(index)}
                      aria-label={`Go to establishment ${index + 1}: ${establishment.name}`}
                      aria-current={activeRecentEstablishmentIndex === index ? 'true' : undefined}
                      className={`h-2.5 w-2.5 rounded-full transition-colors cursor-pointer ${responsiveDotClass} ${
                        activeRecentEstablishmentIndex === index
                          ? 'bg-emerald-700'
                          : 'bg-emerald-900/20 hover:bg-emerald-700/50'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-[#DCE7E0] bg-white p-5 text-sm text-[#52645B]">
              Verified establishments will appear here when available.
            </p>
          )}
        </div>
      </section>

        <section className="relative bg-[#EAF3ED] px-4 pt-8 pb-12 sm:pt-16 sm:pb-16">
          {/* Interactive Feature Mockup Preview */}
          <div className="max-w-4xl mx-auto">
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

      <ProductCardDetail
        product={selectedRecentProduct}
        onClose={() => setSelectedRecentProduct(null)}
      />
    </div>
  );
}
