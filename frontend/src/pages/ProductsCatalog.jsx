import { useEffect, useState, useCallback, useRef } from 'react';
import {
    AlertCircle,
    Filter,
    Plus,
    RotateCcw,
    Package,
} from 'lucide-react';
import Toast from '../components/ui/Toast';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import ContributionModal from '../components/submissions/ContributionModal';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import ReportIssueModal from '../components/reports/ReportIssueModal';
import ProductCard from '../components/catalog/ProductCard';
import ProductCardDetail from '../components/landing/ProductCardDetail';
import ProductFormModal from '../components/catalog/ProductFormModal';
import ProductDeleteModal from '../components/catalog/ProductDeleteModal';
import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL, authFetch } from '../utils/api';
import { getTodayIsoDate } from '../data/constants';
import { SEED_ESTABLISHMENTS } from '../data/seedEstablishments';

const PRODUCT_CATEGORIES = [
    'All Categories',
    'Food & Beverage',
    'Spices & Seasonings',
    'Bakery & Biscuits',
    'Cooking Oils & Fats',
    'Condiments & Sauces',
    'Dairy & Milk',
    'Beverages',
    'Dressings & Mayonnaise',
    'Canned Fish & Meat',
    'Snacks & Chips',
    'Instant Noodles & Pasta',
    'Personal Care & Household',
    'Fresh & Farm Produce',
];

const QUICK_CATEGORIES = [
    { label: 'All Items', value: 'All Categories' },
    { label: 'Food & Beverage', value: 'Food & Beverage' },
    { label: 'Spices & Seasonings', value: 'Spices & Seasonings' },
    { label: 'Bakery & Biscuits', value: 'Bakery & Biscuits' },
    { label: 'Cooking Oils & Fats', value: 'Cooking Oils & Fats' },
    { label: 'Condiments & Sauces', value: 'Condiments & Sauces' },
    { label: 'Dairy & Milk', value: 'Dairy & Milk' },
    { label: 'Beverages', value: 'Beverages' },
    { label: 'Dressings & Mayonnaise', value: 'Dressings & Mayonnaise' },
    { label: 'Canned Fish & Meat', value: 'Canned Fish & Meat' },
    { label: 'Snacks & Chips', value: 'Snacks & Chips' },
    { label: 'Instant Noodles & Pasta', value: 'Instant Noodles & Pasta' },
    { label: 'Personal Care', value: 'Personal Care & Household' },
    { label: 'Fresh & Farm Produce', value: 'Fresh & Farm Produce' },
];

const PRODUCT_STATUSES = [
    'All Statuses',
    'Halal',
    'Pork-Free Declared',
    'Vegetarian / Vegan',
    'Expired',
    'Doubtful',
];

const STATUS_FILTER_OPTIONS = [
    { label: 'All Halal Statuses', value: 'All Statuses' },
    { label: 'Certified Halal', value: 'Halal' },
    { label: 'For Renewal', value: 'For Renewal' },
    { label: 'Pork-Free / Self-Declared', value: 'Pork-Free Declared' },
    { label: 'Vegetarian / Plant-Based', value: 'Vegetarian / Vegan' },
    { label: 'Expired Certificate', value: 'Expired' },
    { label: 'Doubtful / Needs Check', value: 'Doubtful' },
];

const CERTIFIER_ORIGINS = [
    { label: 'All Certifiers', value: 'ALL' },
    { label: 'Local & Zampen HCBs (BUSC, UCZP, BPCC, DTI)', value: 'REGION_IX' },
    { label: 'IDCP Certified', value: 'IDCP' },
    { label: 'BUSC Regional Certified', value: 'BUSC' },
    { label: 'UCZP Regional Certified', value: 'UCZP' },
    { label: 'BPCC Regional Certified', value: 'BPCC' },
    { label: 'DTI Zampen Local MSMEs', value: 'ZAMPEN' },
];

const CB_UUID_MAP = {
    IDCP: '8885f308-1697-4541-b352-bcbd76227e8b',
    HDIP: '4ef9426c-63f7-44b7-9738-f2b3144c77a5',
    BPCC: '1656c3e6-250c-4b70-81c0-3c084eb7ce80',
    BUSC: '7ffdaf0a-c5a2-4c14-b9c8-3f27d9568b48',
    UCZP: '8d4eef9f-b276-4f0c-97f2-89c8b6a5677d',
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
    image_url: '',
};

export default function ProductsCatalog({ userRole, onViewChange, initialSearchQuery = '', initialStatusFilter = '' }) {
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
    const [totalServerCount, setTotalServerCount] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(24);

    const [activeModal, setActiveModal] = useState(null); // 'add-product', 'edit-product', 'delete-product', 'view-product'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalForm, setModalForm] = useState(emptyProductForm);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const [showContributionModal, setShowContributionModal] = useState(false);
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportingTarget, setReportingTarget] = useState(null);
    const [optionalStatusesPresent, setOptionalStatusesPresent] = useState(() => new Set());
    const isAdmin = userRole === 'admin';

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
    const establishmentsMapRef = useRef({});

    // 1. Load static metadata (manufacturers, certifying bodies, establishments) once on component mount
    useEffect(() => {
        let isMounted = true;
        async function fetchMetadata() {
            const seedMap = {};
            SEED_ESTABLISHMENTS.forEach((e) => {
                if (e.id) seedMap[e.id] = e;
            });
            establishmentsMapRef.current = seedMap;

            try {
                const [mfgRes, cbRes, estRes, optStatusRes] = await Promise.all([
                    supabase.from('manufacturers').select('*').order('name').limit(200),
                    supabase.from('certifying_bodies').select('*').order('name'),
                    supabase.from('establishments').select('id, name, address, city, latitude, longitude'),
                    supabase.from('products').select('status').in('status', ['Pork-Free Declared', 'Vegetarian / Vegan', 'Doubtful']).limit(50),
                ]);
                if (isMounted) {
                    if (mfgRes.data) setManufacturers(mfgRes.data);
                    if (cbRes.data) setCertifyingBodies(cbRes.data);
                    if (optStatusRes.data) {
                        setOptionalStatusesPresent(new Set(optStatusRes.data.map((r) => r.status).filter(Boolean)));
                    }
                    if (estRes.data && estRes.data.length > 0) {
                        const merged = { ...seedMap };
                        estRes.data.forEach((e) => {
                            if (e.id) merged[e.id] = e;
                        });
                        establishmentsMapRef.current = merged;
                    }
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
        certifierParam,
        limitParam
    ) => {
        try {
            setLoading(true);
            setError('');

            const page = targetPage !== undefined ? targetPage : filtersRef.current.page;
            const q = (queryParam !== undefined ? queryParam : filtersRef.current.searchQuery).trim();
            const cat = categoryParam !== undefined ? categoryParam : filtersRef.current.category;
            const st = statusParam !== undefined ? statusParam : filtersRef.current.status;
            const cert = certifierParam !== undefined ? certifierParam : filtersRef.current.certifier;
            const limit = limitParam !== undefined ? limitParam : itemsPerPage;
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            let loadedProducts = null;
            const estMap = establishmentsMapRef.current || {};
            const excludedStatuses = '(REJECTED,rejected,PENDING_VERIFICATION,pending,needs_review,draft,Flagged,flagged,Suspended,suspended,Expired,expired,EXPIRED,HARAM,haram)';

            // Direct Supabase Query with true count & range (Instant ~120ms response)
            try {
                let pBuilder = supabase
                    .from('products')
                    .select('*, manufacturers(*), certifying_bodies(*)', { count: 'exact' })
                    .or('establishment_id.is.null,brand.not.is.null,barcode.not.is.null,ingredients_summary.not.is.null');

                const safeQ = q.replace(/[,()'"%&|{}\s]+/g, '%').slice(0, 200).replace(/^%+|%+$/g, '');
                if (safeQ) {
                    pBuilder = pBuilder.or(`name.ilike.%${safeQ}%,brand.ilike.%${safeQ}%,barcode.ilike.%${safeQ}%,certificate_no.ilike.%${safeQ}%`);
                }

                if (cat && cat !== 'All Categories') {
                    pBuilder = pBuilder.ilike('category', `%${cat}%`);
                }

                const todayIso = getTodayIsoDate();

                if (st && st !== 'All Statuses') {
                    if (st === 'Halal') {
                        pBuilder = pBuilder
                            .in('status', ['Halal', 'VERIFIED', 'Verified', 'For Renewal', 'for_renewal'])
                            .or(`expiry_date.is.null,expiry_date.gte.${todayIso}`);
                    } else if (st === 'Expired') {
                        pBuilder = pBuilder
                            .or(`status.eq.Expired,and(status.in.(Halal,Verified,VERIFIED,For Renewal,for_renewal),expiry_date.lt.${todayIso})`)
                            .not('status', 'in', '(REJECTED,rejected,PENDING_VERIFICATION,pending,needs_review,draft,Flagged,flagged,Suspended,suspended,HARAM,haram)');
                    } else if (st === 'For Renewal') {
                        pBuilder = pBuilder
                            .in('status', ['For Renewal', 'for_renewal'])
                            .or(`expiry_date.is.null,expiry_date.gte.${todayIso}`);
                    } else if (st === 'Pork-Free Declared') {
                        pBuilder = pBuilder
                            .in('status', ['Pork-Free Declared', 'COMMUNITY_LISTED'])
                            .not('status', 'in', excludedStatuses);
                    } else if (st === 'Vegetarian / Vegan') {
                        pBuilder = pBuilder
                            .eq('status', 'Vegetarian / Vegan')
                            .not('status', 'in', excludedStatuses);
                    } else {
                        pBuilder = pBuilder.eq('status', st)
                            .not('status', 'in', excludedStatuses);
                    }
                } else {
                    pBuilder = pBuilder
                        .not('status', 'in', excludedStatuses)
                        .or(`expiry_date.is.null,expiry_date.gte.${todayIso}`);
                }

                if (cert && cert !== 'ALL' && cert !== 'All Certifiers / Origins') {
                    if (cert === 'REGION_IX') {
                        const localIds = [CB_UUID_MAP.BUSC, CB_UUID_MAP.UCZP, CB_UUID_MAP.BPCC].filter(Boolean);
                        pBuilder = pBuilder.or(
                            `certifying_body_id.in.(${localIds.join(',')}),source.ilike.%ZAMPEN%,source.ilike.%UCZP%,source.ilike.%BUSC%`
                        );
                    } else {
                        const cbId = CB_UUID_MAP[cert];
                        if (cbId) {
                            pBuilder = pBuilder.or(`certifying_body_id.eq.${cbId},source.ilike.%${cert}%`);
                        } else {
                            pBuilder = pBuilder.ilike('source', `%${cert}%`);
                        }
                    }
                }

                // Prioritize active Halal products with future expiry dates on Page 1
                pBuilder = pBuilder
                    .order('expiry_date', { ascending: false, nullsFirst: false })
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
                    const params = new URLSearchParams({
                        limit: String(limit),
                        page: String(page),
                    });
                    if (q) params.set('query', q);
                    if (cat && cat !== 'All Categories') params.set('category', cat);
                    if (st && st !== 'All Statuses' && (isAdmin || st !== 'Expired')) {
                        params.set('status', st);
                    }
                    if (cert && CB_UUID_MAP[cert]) {
                        params.set('certifying_body_id', CB_UUID_MAP[cert]);
                    }
                    const productsRes = await authFetch(
                        `${API_BASE_URL}/products?${params.toString()}`,
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

            // Enrich with establishment info if linked and guard fallback against dish-only rows
            const finalProducts = (loadedProducts || [])
                .filter((p) => !(p.establishment_id && !p.brand && !p.barcode && !p.ingredients_summary))
                .map((p) => ({
                    ...p,
                    establishments: p.establishment_id ? estMap[p.establishment_id] : p.establishments,
                }));

            setProducts(finalProducts);
        } catch (err) {
            console.error('Error loading products catalog:', err);
            setError(err.message || 'Could not load products. Please check your network connection.');
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage, isAdmin]);

    // Synchronize initialSearchQuery and initialStatusFilter if passed dynamically, or load initial catalog items
    useEffect(() => {
        const q = initialSearchQuery || '';
        const allowedStatuses = STATUS_FILTER_OPTIONS
            .filter((opt) => isAdmin || opt.value !== 'Expired')
            .map((opt) => opt.value);
        const st = initialStatusFilter && allowedStatuses.includes(initialStatusFilter)
            ? initialStatusFilter
            : 'All Statuses';
        setSearchQuery(q);
        setSelectedStatus(st);
        filtersRef.current.searchQuery = q;
        filtersRef.current.status = st;
        filtersRef.current.page = 1;
        setCurrentPage(1);
        loadData(1, q, filtersRef.current.category, st, filtersRef.current.certifier);
    }, [initialSearchQuery, initialStatusFilter, isAdmin, loadData]);

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

    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        filtersRef.current.category = cat;
        filtersRef.current.page = 1;
        setCurrentPage(1);
        loadData(1, searchQuery, cat, selectedStatus, selectedCertifier);
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
                image_url: product.image_url || '',
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
                errorMsg = Array.isArray(errJson.detail)
                    ? errJson.detail.map((d) => d?.msg || JSON.stringify(d)).join('; ')
                    : typeof errJson.detail === 'string'
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
                image_url: safeTrim(modalForm.image_url) || null,
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
            if (['Pork-Free Declared', 'Vegetarian / Vegan', 'Doubtful'].includes(payload.status)) {
                setOptionalStatusesPresent((prev) => new Set([...prev, payload.status]));
            }
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

    const handleItemsPerPageChange = (newLimit) => {
        setItemsPerPage(newLimit);
        setCurrentPage(1);
        filtersRef.current.page = 1;
        loadData(1, searchQuery, selectedCategory, selectedStatus, selectedCertifier, newLimit);
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

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 flex flex-col h-full bg-slate-50">
            {/* Actions & Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
                <div className="flex flex-row gap-2 sm:gap-3 items-center">
                    {/* Search Box */}
                    <SearchBar
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onClear={handleClearSearch}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                                loadData(1, searchQuery, selectedCategory, selectedStatus, selectedCertifier);
                            }
                        }}
                        placeholder="Search product name, brand, or certificate #..."
                        className="flex-1 min-w-0"
                    />

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => openModal('add-product')}
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-[0.98] shrink-0 whitespace-nowrap"
                            title="Add Product to Registry"
                        >
                            <Plus size={15} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Add Product</span>
                        </button>
                    )}

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

                {/* Fast 1-Tap Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none -mx-1 px-1">
                    {QUICK_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.value;
                        return (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => handleCategorySelect(cat.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                    isSelected
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                                }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* Filter Row */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-2.5 items-center pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1 text-slate-500 font-medium shrink-0">
                        <Filter size={13} className="sm:w-3.5 sm:h-3.5" /> Filter:
                    </div>

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
                        aria-label="Filter by halal status"
                        className="h-8.5 sm:h-9 min-w-0 flex-1 sm:flex-initial rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] sm:text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500 whitespace-nowrap shrink-0"
                    >
                        {STATUS_FILTER_OPTIONS.filter((opt) => {
                            if (!isAdmin && opt.value === 'Expired') return false;
                            if (['Pork-Free Declared', 'Vegetarian / Vegan', 'Doubtful'].includes(opt.value)) {
                                return opt.value === selectedStatus || optionalStatusesPresent.has(opt.value);
                            }
                            return true;
                        }).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
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
                        aria-label="Filter by certifier"
                        className="h-8.5 sm:h-9 min-w-0 flex-1 sm:flex-initial rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] sm:text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500 max-w-[210px] truncate whitespace-nowrap"
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
                            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-600 font-semibold transition shrink-0 cursor-pointer"
                            title="Reset all search and filter conditions"
                        >
                            <RotateCcw size={12} />
                            <span>Reset</span>
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
                <EmptyState
                    icon={Package}
                    title={searchQuery ? 'Product not found in registry' : 'No products match your criteria'}
                    description={
                        searchQuery
                            ? `"${searchQuery}" is not yet indexed in the local verified registry. You can scan the physical packaging with the camera scanner to inspect additives and certifying logos.`
                            : 'No verified products currently match the selected filters.'
                    }
                    resetText={isFilterActive ? 'Reset Filters' : undefined}
                    onReset={isFilterActive ? handleResetFilters : undefined}
                    actionText="Scan Package with Camera"
                    onAction={() => onViewChange?.('scanner')}
                    className="bg-white"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-3 gap-y-5 sm:gap-x-5 sm:gap-y-6">
                    {paginatedProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isAdmin={isAdmin}
                            onViewDetails={(p) => openModal('view-product', p)}
                            onReport={handleReportProduct}
                            onEdit={(p) => openModal('edit-product', p)}
                            onDelete={(p) => openModal('delete-product', p)}
                        />
                    ))}
                </div>
            )}

            {/* Standardized Global Pagination */}
            {!loading && products.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    itemsPerPageOptions={[12, 24, 48]}
                    itemLabel="products"
                    className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm"
                />
            )}

            {/* Add / Edit Modal */}
            <ProductCardDetail
                product={activeModal === 'view-product' ? selectedProduct : null}
                onClose={closeModal}
            />

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
