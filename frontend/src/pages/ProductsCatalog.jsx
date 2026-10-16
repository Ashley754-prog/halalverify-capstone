import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
    Search,
    AlertCircle,
    Filter,
    Plus,
    Camera,
    ChevronLeft,
    ChevronRight,
    X,
    RotateCcw,
} from 'lucide-react';
import Toast from '../components/ui/Toast';
import ContributionModal from '../components/submissions/ContributionModal';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import ReportIssueModal from '../components/reports/ReportIssueModal';
import ProductCard from '../components/catalog/ProductCard';
import ProductFormModal from '../components/catalog/ProductFormModal';
import ProductDeleteModal from '../components/catalog/ProductDeleteModal';
import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL, authFetch } from '../utils/api';

const PRODUCT_CATEGORIES = [
    'All Categories',
    'Food & Beverage',
    'Spices & Seasonings',
    'Bakery & Biscuits',
    'Dairy & Milk',
    'Cooking Oils & Fats',
    'Condiments & Sauces',
    'Canned Fish & Meat',
    'Beverages',
    'Instant Noodles & Pasta',
    'Snacks & Chips',
    'Dressings & Mayonnaise',
    'Fresh & Farm Produce',
    'Personal Care & Household',
    'Restaurant & Catering Menu',
];

const PRODUCT_STATUSES = [
    'All Statuses',
    'Halal',
    'Pork-Free Declared',
    'Vegetarian / Vegan',
    'Expired',
    'Doubtful',
];

const CERTIFIER_ORIGINS = [
    { label: 'All Certifiers & Registries', value: 'ALL' },
    { label: "IDCP (Islamic Da'wah Council)", value: 'IDCP' },
    { label: 'HDIP (Halal Development Institute)', value: 'HDIP' },
    { label: 'BPCC (Bangsamoro Consultative Council)', value: 'BPCC' },
    { label: 'BUSC (Basilan Ulama Council)', value: 'BUSC' },
    { label: 'DTI Region IX (ZAMPEN MSMEs)', value: 'ZAMPEN' },
    { label: 'Muslim in Manila Directory', value: 'Muslim in Manila' },
    { label: 'Community User Submissions', value: 'Community' },
];

const CB_UUID_MAP = {
    IDCP: '8885f308-1697-4541-b352-bcbd76227e8b',
    HDIP: '4ef9426c-63f7-44b7-9738-f2b3144c77a5',
    BPCC: '1656c3e6-250c-4b70-81c0-3c084eb7ce80',
    BUSC: '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    MMHCB: 'e276a8c2-bbd9-438e-9ec3-30f2073a3ef3',
    MASLAHA: 'c8db6788-4d40-4bd0-b5b9-da35ea7c175e',
    PRIME: '99538551-f559-4ef1-b6d8-db35692200d8',
    PUCOI: '74e41329-0872-4031-ad9b-436210534063',
};

const emptyProductForm = {
    name: '',
    brand: '',
    category: 'Food & Beverage',
    barcode: '',
    manufacturer_id: '',
    certifying_body_id: '',
    certificate_no: '',
    expiry_date: '',
    status: 'Halal',
    halal_logo_present: true,
    ingredients_summary: '',
    source: 'Manual Registry Entry',
    source_url: '',
};

export default function ProductsCatalog({ userRole, onViewChange, initialSearchQuery = '' }) {
    const [products, setProducts] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [certifyingBodies, setCertifyingBodies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedStatus, setSelectedStatus] = useState('All Statuses');
    const [selectedCertifier, setSelectedCertifier] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalServerCount, setTotalServerCount] = useState(13239);
    const itemsPerPage = 24;

    const [activeModal, setActiveModal] = useState(null); // 'add-product', 'edit-product', 'delete-product', 'view-product'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalForm, setModalForm] = useState(emptyProductForm);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const [showContributionModal, setShowContributionModal] = useState(false);
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportingTarget, setReportingTarget] = useState(null);
    const isAdmin = userRole === 'admin';

    const availableCategories = useMemo(() => {
        const cats = new Set(PRODUCT_CATEGORIES);
        products.forEach((p) => {
            if (p.category && p.category.trim()) {
                cats.add(p.category.trim());
            }
        });
        return Array.from(cats);
    }, [products]);
    const handleOpenContribution = () => {
        if (!userRole) {
            setShowAuthPrompt(true);
        } else {
            setShowContributionModal(true);
        }
    };

    const handleReportProduct = (product) => {
        if (!userRole) {
            setShowAuthPrompt(true);
        } else {
            setReportingTarget({
                relatedTo: 'product',
                subjectName: product.name,
                productId: product.id,
            });
            setShowReportModal(true);
        }
    };

    const searchDebounceRef = useRef(null);
    const filtersRef = useRef({
        searchQuery: initialSearchQuery || '',
        category: 'All Categories',
        status: 'All Statuses',
        certifier: 'ALL',
        page: 1,
    });

    // 1. Load static metadata (manufacturers and certifying bodies) once on component mount
    useEffect(() => {
        let isMounted = true;
        async function fetchMetadata() {
            try {
                const [mfgRes, cbRes] = await Promise.all([
                    supabase.from('manufacturers').select('*').order('name').limit(200),
                    supabase.from('certifying_bodies').select('*').order('name'),
                ]);
                if (isMounted) {
                    if (mfgRes.data) setManufacturers(mfgRes.data);
                    if (cbRes.data) setCertifyingBodies(cbRes.data);
                }
            } catch (err) {
                console.warn('Metadata fetch failed:', err);
            }
        }
        fetchMetadata();
        return () => {
            isMounted = false;
        };
    }, []);

    // 2. Stable product loader that does not cause infinite re-render cascades
    const loadData = useCallback(async (
        targetPage,
        queryParam,
        categoryParam,
        statusParam,
        certifierParam
    ) => {
        try {
            setLoading(true);
            setError('');

            const page = targetPage !== undefined ? targetPage : filtersRef.current.page;
            const q = (queryParam !== undefined ? queryParam : filtersRef.current.searchQuery).trim();
            const cat = categoryParam !== undefined ? categoryParam : filtersRef.current.category;
            const st = statusParam !== undefined ? statusParam : filtersRef.current.status;
            const cert = certifierParam !== undefined ? certifierParam : filtersRef.current.certifier;
            const from = (page - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            let loadedProducts = null;

            // Direct Supabase Query with true count & range (Instant ~120ms response)
            try {
                let pBuilder = supabase
                    .from('products')
                    .select('*, manufacturers(*), certifying_bodies(*)', { count: 'exact' });

                const safeQ = q.replace(/[,()'"%&|{}]/g, '').trim().slice(0, 100);
                if (safeQ) {
                    pBuilder = pBuilder.or(`name.ilike.%${safeQ}%,brand.ilike.%${safeQ}%,barcode.ilike.%${safeQ}%,certificate_no.ilike.%${safeQ}%`);
                }

                if (cat && cat !== 'All Categories') {
                    pBuilder = pBuilder.ilike('category', `%${cat}%`);
                }

                if (st && st !== 'All Statuses') {
                    if (st === 'Halal') {
                        pBuilder = pBuilder.in('status', ['Halal', 'VERIFIED', 'Verified']);
                    } else if (st === 'Pork-Free Declared') {
                        pBuilder = pBuilder.or('status.ilike.%pork-free%,admin_notes.ilike.%pork-free%')
                            .not('status', 'in', '(REJECTED,rejected,PENDING_VERIFICATION,pending,needs_review,draft)');
                    } else if (st === 'Vegetarian / Vegan') {
                        pBuilder = pBuilder.or('status.ilike.%vegetarian%,status.ilike.%vegan%,admin_notes.ilike.%vegetarian%')
                            .not('status', 'in', '(REJECTED,rejected,PENDING_VERIFICATION,pending,needs_review,draft)');
                    } else {
                        pBuilder = pBuilder.eq('status', st)
                            .not('status', 'in', '(REJECTED,rejected,PENDING_VERIFICATION,pending,needs_review,draft)');
                    }
                } else {
                    pBuilder = pBuilder.not('status', 'in', '(REJECTED,rejected,PENDING_VERIFICATION,pending,needs_review,draft)');
                }

                if (cert && cert !== 'ALL' && cert !== 'All Certifiers / Origins') {
                    const cbId = CB_UUID_MAP[cert];
                    if (cbId) {
                        pBuilder = pBuilder.or(`certifying_body_id.eq.${cbId},source.ilike.%${cert}%`);
                    } else {
                        pBuilder = pBuilder.ilike('source', `%${cert}%`);
                    }
                }

                // Prioritize active Verified & Halal food items over expired items
                pBuilder = pBuilder
                    .order('status', { ascending: false })
                    .order('name', { ascending: true })
                    .range(from, to);

                const productsRes = await pBuilder;

                if (!productsRes.error && productsRes.data) {
                    loadedProducts = productsRes.data;
                    if (typeof productsRes.count === 'number') {
                        setTotalServerCount(productsRes.count);
                    }
                }
            } catch (sbErr) {
                console.warn('Direct Supabase fetch failed, attempting backend fallback:', sbErr);
            }

            // Fallback to Backend API with a 3.5s timeout if direct Supabase didn't return items
            if (!loadedProducts) {
                try {
                    const searchArg = q ? `&query=${encodeURIComponent(q)}` : '';
                    const productsRes = await authFetch(
                        `${API_BASE_URL}/products?limit=24&page=${page}${searchArg}`,
                        { timeout: 3500 }
                    );

                    if (productsRes.ok) {
                        const productsJson = await productsRes.json();
                        loadedProducts = productsJson.data || [];
                        if (typeof productsJson.total === 'number') {
                            setTotalServerCount(productsJson.total);
                        }
                    }
                } catch (apiErr) {
                    console.warn('Backend API request timed out or unavailable:', apiErr);
                }
            }

            setProducts(loadedProducts || []);
        } catch (err) {
            console.error('Error loading products catalog:', err);
            setError(err.message || 'Could not load products. Please check your network connection.');
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    // Synchronize initialSearchQuery if passed dynamically, or load initial catalog items
    useEffect(() => {
        const q = initialSearchQuery || '';
        setSearchQuery(q);
        filtersRef.current.searchQuery = q;
        loadData(1, q, selectedCategory, selectedStatus, selectedCertifier);
    }, [initialSearchQuery, loadData]);

    const handleSearchChange = (val) => {
        setSearchQuery(val);
        filtersRef.current.searchQuery = val;
        filtersRef.current.page = 1;
        setCurrentPage(1);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            loadData(1, val, selectedCategory, selectedStatus, selectedCertifier);
        }, 350);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        filtersRef.current.searchQuery = '';
        filtersRef.current.page = 1;
        setCurrentPage(1);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        loadData(1, '', selectedCategory, selectedStatus, selectedCertifier);
    };

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    const openModal = (type, product = null) => {
        setSelectedProduct(product);
        setActiveModal(type);

        if (type === 'add-product') {
            setModalForm(emptyProductForm);
        } else if (type === 'edit-product' && product) {
            let initialStatus = product.status || 'Halal';
            const adminNotes = (product.admin_notes || '').toLowerCase();
            if (initialStatus === 'COMMUNITY_LISTED') {
                if (adminNotes.includes('pork-free')) {
                    initialStatus = 'Pork-Free Declared';
                } else if (adminNotes.includes('vegetarian') || adminNotes.includes('vegan')) {
                    initialStatus = 'Vegetarian / Vegan';
                }
            }

            setModalForm({
                name: product.name || '',
                brand: product.brand || '',
                category: product.category || 'Food & Beverage',
                barcode: product.barcode || '',
                manufacturer_id: product.manufacturer_id || '',
                certifying_body_id: product.certifying_body_id || '',
                certificate_no: product.certificate_no || '',
                expiry_date: product.expiry_date || '',
                status: initialStatus,
                halal_logo_present: product.halal_logo_present ?? true,
                ingredients_summary: product.ingredients_summary || '',
                source: product.source || 'Manual Registry Entry',
                source_url: product.source_url || '',
            });
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedProduct(null);
        setModalForm(emptyProductForm);
    };

    const safeTrim = (v) => (typeof v === 'string' ? v.trim() : null) || null;

    const parseApiError = async (response, fallbackMsg) => {
        let errorMsg = fallbackMsg;
        try {
            const errJson = await response.json();
            if (errJson?.detail) {
                errorMsg = typeof errJson.detail === 'string'
                    ? errJson.detail
                    : JSON.stringify(errJson.detail);
            } else if (errJson?.message) {
                errorMsg = errJson.message;
            }
        } catch {
            try {
                const text = await response.text();
                if (text) errorMsg = text;
            } catch {
                void 0;
            }
        }

        if (response.status === 401) {
            errorMsg = 'Authentication required. Please sign in with an administrator account.';
        } else if (response.status === 403) {
            errorMsg = 'Admin privileges required. Your account does not have permission to manage products.';
        }

        return errorMsg;
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!modalForm.name || !modalForm.name.trim()) {
            showToast('Product name is required', 'error');
            return;
        }

        try {
            setIsSaving(true);
            const isEdit = activeModal === 'edit-product';
            const endpoint = isEdit
                ? `${API_BASE_URL}/products/${selectedProduct.id}`
                : `${API_BASE_URL}/products`;
            const method = isEdit ? 'PATCH' : 'POST';

            const payload = {
                name: modalForm.name.trim(),
                brand: safeTrim(modalForm.brand),
                category: modalForm.category || 'Food & Beverage',
                barcode: safeTrim(modalForm.barcode),
                manufacturer_id: safeTrim(modalForm.manufacturer_id),
                certifying_body_id: safeTrim(modalForm.certifying_body_id),
                certificate_no: safeTrim(modalForm.certificate_no),
                expiry_date: safeTrim(modalForm.expiry_date),
                status: modalForm.status || 'Halal',
                halal_logo_present: Boolean(modalForm.halal_logo_present),
                ingredients_summary: safeTrim(modalForm.ingredients_summary),
                source: safeTrim(modalForm.source) || 'Manual Registry Entry',
                source_url: safeTrim(modalForm.source_url) || null,
            };

            const response = await authFetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await parseApiError(response, isEdit ? 'Failed to update product' : 'Failed to add product');
                throw new Error(errText);
            }

            showToast(isEdit ? 'Product updated successfully' : 'Product added successfully', 'success');
            closeModal();
            loadData(currentPage, searchQuery, selectedCategory, selectedStatus, selectedCertifier);
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Error saving product', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;

        try {
            setIsSaving(true);
            const response = await authFetch(`${API_BASE_URL}/products/${selectedProduct.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errText = await parseApiError(response, 'Failed to delete product');
                throw new Error(errText);
            }

            showToast('Product removed from catalog', 'success');
            closeModal();
            loadData(currentPage, searchQuery, selectedCategory, selectedStatus, selectedCertifier);
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Error deleting product', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const totalItems = totalServerCount;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + products.length, totalItems);
    const paginatedProducts = products;

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
        setCurrentPage(newPage);
        filtersRef.current.page = newPage;
        loadData(newPage, searchQuery, selectedCategory, selectedStatus, selectedCertifier);
        window.scrollTo({ top: 120, behavior: 'smooth' });
    };

    const isFilterActive = Boolean(
        (searchQuery && searchQuery.trim()) ||
        (selectedCategory && selectedCategory !== 'All Categories') ||
        (selectedStatus && selectedStatus !== 'All Statuses') ||
        (selectedCertifier && selectedCertifier !== 'ALL')
    );

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('All Categories');
        setSelectedStatus('All Statuses');
        setSelectedCertifier('ALL');
        filtersRef.current = {
            searchQuery: '',
            category: 'All Categories',
            status: 'All Statuses',
            certifier: 'ALL',
            page: 1,
        };
        setCurrentPage(1);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        loadData(1, '', 'All Categories', 'All Statuses', 'ALL');
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 flex flex-col h-full bg-slate-50">
            {/* Actions & Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
                <div className="flex flex-row gap-2 sm:gap-3 items-center">
                    {/* Search Box */}
                    <div className="relative flex-1 min-w-0">
                        <Search
                            size={16}
                            className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                                    loadData(1, searchQuery, selectedCategory, selectedStatus, selectedCertifier);
                                }
                            }}
                            placeholder="Search by product name, brand, manufacturer, or certificate #..."
                            className="w-full pl-8 sm:pl-10 pr-8 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50/50 text-base sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded transition"
                                title="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Community Submit Button (Accessible to all users; triggers auth prompt if guest) */}
                    <button
                        type="button"
                        onClick={handleOpenContribution}
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-emerald-600 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 transition active:scale-[0.98] shrink-0 whitespace-nowrap"
                        title="Submit Missing Product"
                    >
                        <Plus size={15} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Submit Missing Product</span>
                        <span className="sm:hidden">Submit</span>
                    </button>
                </div>

                {/* Filter Tags */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-2.5 items-center pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1 text-slate-500 font-medium shrink-0">
                        <Filter size={13} className="sm:w-3.5 sm:h-3.5" /> Filter:
                    </div>

                    {/* Category Selector */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSelectedCategory(val);
                            filtersRef.current.category = val;
                            filtersRef.current.page = 1;
                            setCurrentPage(1);
                            loadData(1, searchQuery, val, selectedStatus, selectedCertifier);
                        }}
                        className="min-w-0 flex-1 sm:flex-initial rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] sm:text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
                    >
                        {availableCategories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    {/* Status Selector */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSelectedStatus(val);
                            filtersRef.current.status = val;
                            filtersRef.current.page = 1;
                            setCurrentPage(1);
                            loadData(1, searchQuery, selectedCategory, val, selectedCertifier);
                        }}
                        className="min-w-0 flex-1 sm:flex-initial rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] sm:text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
                    >
                        {PRODUCT_STATUSES.map((st) => (
                            <option key={st} value={st}>
                                {st}
                            </option>
                        ))}
                    </select>

                    {/* Certifying Body / Origin Source Selector */}
                    <select
                        value={selectedCertifier}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSelectedCertifier(val);
                            filtersRef.current.certifier = val;
                            filtersRef.current.page = 1;
                            setCurrentPage(1);
                            loadData(1, searchQuery, selectedCategory, selectedStatus, val);
                        }}
                        className="min-w-0 flex-1 sm:flex-initial rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] sm:text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500 max-w-[210px] truncate"
                        title="Filter by certifying body or registry origin"
                    >
                        {CERTIFIER_ORIGINS.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>

                    {/* Reset Filters button */}
                    {isFilterActive && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-600 font-semibold transition shrink-0"
                            title="Reset all search and filter conditions"
                        >
                            <RotateCcw size={12} />
                            <span>Reset Filters</span>
                        </button>
                    )}

                    <span className="text-slate-400 w-full sm:w-auto sm:ml-auto text-left sm:text-right whitespace-nowrap text-[10px] sm:text-xs pt-1 sm:pt-0">
                        Showing <strong className="text-slate-700">{totalItems === 0 ? 0 : `${startIndex + 1}–${endIndex}`}</strong> of{' '}
                        <strong className="text-slate-700">{totalItems}</strong> products
                    </span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-800 flex items-start gap-2.5 shadow-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
                    <div>
                        <p className="font-bold">Catalog Notice</p>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Products List Grid */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-sm text-slate-500">
                    Loading verified product directory...
                </div>
            ) : products.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <Camera size={26} />
                    </div>
                    {searchQuery ? (
                        <>
                            <h3 className="text-base sm:text-lg font-bold text-slate-800">
                                Product or Establishment not found. Scan package to verify.
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                                &quot;{searchQuery}&quot; is not yet recorded in the local verified registry. Use the Halal Scanner to inspect the physical packaging, verify certifying logos, and check ingredient additives.
                            </p>
                            <button
                                onClick={() => onViewChange?.('scanner')}
                                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition transform hover:-translate-y-0.5 active:translate-y-0 duration-150"
                            >
                                <Camera size={18} />
                                <span>Scan Package with Camera</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="text-base font-bold text-slate-700">No Products in Registry</h3>
                            <p className="text-xs text-slate-500 max-w-md">
                                No verified products currently match the selected category.
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-3 gap-y-5 sm:gap-x-5 sm:gap-y-6">
                    {paginatedProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isAdmin={isAdmin}
                            onReport={handleReportProduct}
                            onEdit={(p) => openModal('edit-product', p)}
                            onDelete={(p) => openModal('delete-product', p)}
                        />
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && products.length > 0 && totalPages > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <span>
                            Showing <strong className="font-semibold text-slate-700">{startIndex + 1}</strong>–<strong className="font-semibold text-slate-700">{endIndex}</strong> of <strong className="font-semibold text-slate-700">{totalItems}</strong> products
                        </span>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span className="hidden sm:inline">Page <strong className="font-semibold text-slate-700">{currentPage}</strong> of <strong className="font-semibold text-slate-700">{totalPages}</strong></span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition ${
                                currentPage === 1
                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                                    : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                            aria-label="Previous Page"
                        >
                            <ChevronLeft size={16} />
                            <span className="hidden sm:inline">Prev</span>
                        </button>

                        {getPageNumbers().map((p, idx) =>
                            p === '...' ? (
                                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 select-none">
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => handlePageChange(p)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                                        currentPage === p
                                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                                            : 'text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                                    }`}
                                >
                                    {p}
                                </button>
                            )
                        )}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition ${
                                currentPage === totalPages
                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                                    : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                            aria-label="Next Page"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            <ProductFormModal
                isOpen={activeModal === 'add-product' || activeModal === 'edit-product'}
                isEdit={activeModal === 'edit-product'}
                modalForm={modalForm}
                setModalForm={setModalForm}
                manufacturers={manufacturers}
                certifyingBodies={certifyingBodies}
                categories={PRODUCT_CATEGORIES}
                statuses={PRODUCT_STATUSES}
                isSaving={isSaving}
                onClose={closeModal}
                onSubmit={handleFormSubmit}
            />

            {/* Delete Confirmation Modal */}
            <ProductDeleteModal
                isOpen={activeModal === 'delete-product'}
                product={selectedProduct}
                isSaving={isSaving}
                onClose={closeModal}
                onDelete={handleDeleteProduct}
            />

            {/* Community Contribution Modal */}
            <ContributionModal
                isOpen={showContributionModal}
                onClose={() => setShowContributionModal(false)}
                initialTab="product"
                onSubmitted={() => {
                    showToast('Thank you! Product submitted for verification.', 'success');
                    loadData();
                }}
            />

            {/* Guest Authentication Prompt Modal */}
            <AuthPromptModal
                isOpen={showAuthPrompt}
                onClose={() => setShowAuthPrompt(false)}
                onNavigate={(v) => onViewChange?.(v)}
                actionTitle="Submit Product"
            />

            {/* Context-Aware Report / Flag Modal */}
            <ReportIssueModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                initialData={reportingTarget || {}}
                onSubmitted={() => {
                    showToast('Report submitted for administrative review.', 'success');
                }}
            />

            {/* Toast Notification */}
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, visible: false })}
            />
        </div>
    );
}
