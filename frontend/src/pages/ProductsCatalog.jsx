import React, { useEffect, useState } from 'react';
import {
    Search,
    Package,
    Building2,
    ShieldCheck,
    AlertCircle,
    Calendar,
    ExternalLink,
    Filter,
    Plus,
    Pencil,
    Trash2,
    CheckCircle2,
    Clock,
    Tag,
    Barcode,
    FileText,
    Camera,
    Flag,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import ContributionModal from '../components/submissions/ContributionModal';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import ReportIssueModal from '../components/reports/ReportIssueModal';
import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL, authFetch } from '../utils/api';

const PRODUCT_CATEGORIES = [
    'All Categories',
    'Food & Beverage',
    'Processed Meat',
    'Poultry',
    'Canned Seafood',
    'Snacks',
    'Beverages',
    'Instant Noodles',
    'Dairy & Bakery',
    'Condiments & Sauces',
];

const PRODUCT_STATUSES = ['All Statuses', 'Halal', 'Doubtful', 'Revoked'];

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
    source: 'IDCP Published Registry',
    source_url: 'https://www.idcphalal.org/certified-product-page',
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
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

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

    // Synchronize initialSearchQuery if passed dynamically
    useEffect(() => {
        if (initialSearchQuery) {
            setSearchQuery(initialSearchQuery);
        }
    }, [initialSearchQuery]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            let loadedProducts = null;
            let loadedMfg = null;

            // 1. First attempt to load via Backend API
            try {
                const [productsRes, mfgRes] = await Promise.all([
                    authFetch(`${API_BASE_URL}/products?limit=200`),
                    authFetch(`${API_BASE_URL}/manufacturers?limit=200`),
                ]);

                if (productsRes.ok) {
                    const productsJson = await productsRes.json();
                    loadedProducts = productsJson.data || [];
                }
                if (mfgRes && mfgRes.ok) {
                    const mfgJson = await mfgRes.json();
                    loadedMfg = mfgJson.data || [];
                }
            } catch (apiErr) {
                console.warn('Backend API request not available, loading directly via Supabase client:', apiErr);
            }

            // 2. If backend API was unreachable or returned empty, query Supabase directly
            if (!loadedProducts) {
                const { data: sbProducts, error: sbErr } = await supabase
                    .from('products')
                    .select('*, manufacturers(*), certifying_bodies(*)')
                    .order('name');

                if (sbErr) {
                    throw sbErr;
                }
                loadedProducts = sbProducts || [];

                const { data: sbMfg } = await supabase
                    .from('manufacturers')
                    .select('*')
                    .order('name');
                if (sbMfg) loadedMfg = sbMfg;
            }

            setProducts(loadedProducts || []);
            if (loadedMfg) setManufacturers(loadedMfg);
        } catch (err) {
            console.error('Error loading products catalog:', err);
            setError(err.message || 'Could not load products. Please check your network connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    const openModal = (type, product = null) => {
        setSelectedProduct(product);
        setActiveModal(type);

        if (type === 'add-product') {
            setModalForm(emptyProductForm);
        } else if (type === 'edit-product' && product) {
            setModalForm({
                name: product.name || '',
                brand: product.brand || '',
                category: product.category || 'Food & Beverage',
                barcode: product.barcode || '',
                manufacturer_id: product.manufacturer_id || '',
                certifying_body_id: product.certifying_body_id || '',
                certificate_no: product.certificate_no || '',
                expiry_date: product.expiry_date || '',
                status: product.status || 'Halal',
                halal_logo_present: product.halal_logo_present ?? true,
                ingredients_summary: product.ingredients_summary || '',
                source: product.source || 'IDCP Published Registry',
                source_url: product.source_url || '',
            });
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedProduct(null);
        setModalForm(emptyProductForm);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!modalForm.name.trim()) {
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
                brand: modalForm.brand.trim() || null,
                category: modalForm.category || 'Food & Beverage',
                barcode: modalForm.barcode.trim() || null,
                manufacturer_id: modalForm.manufacturer_id || null,
                certifying_body_id: modalForm.certifying_body_id || null,
                certificate_no: modalForm.certificate_no.trim() || null,
                expiry_date: modalForm.expiry_date || null,
                status: modalForm.status,
                halal_logo_present: modalForm.halal_logo_present,
                ingredients_summary: modalForm.ingredients_summary.trim() || null,
                source: modalForm.source.trim() || 'IDCP Published Registry',
                source_url: modalForm.source_url.trim() || null,
            };

            const response = await authFetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Failed to save product');
            }

            showToast(isEdit ? 'Product updated successfully' : 'Product added successfully', 'success');
            closeModal();
            loadData();
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
                const errText = await response.text();
                throw new Error(errText || 'Failed to delete product');
            }

            showToast('Product removed from catalog', 'success');
            closeModal();
            loadData();
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Error deleting product', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProducts = products.filter((item) => {
        const matchesQuery =
            !searchQuery ||
            item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.manufacturers?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            selectedCategory === 'All Categories' || item.category === selectedCategory;

        const matchesStatus =
            selectedStatus === 'All Statuses' || item.status === selectedStatus;

        return matchesQuery && matchesCategory && matchesStatus;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, selectedStatus, itemsPerPage]);

    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
        setCurrentPage(newPage);
        window.scrollTo({ top: 120, behavior: 'smooth' });
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
            <Topbar
                title="Verified Halal Product Catalog"
                subtitle="Cross-referenced food products and brands verified against accredited certifying-body published registries."
            />

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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by product name, brand, manufacturer, or barcode..."
                            className="w-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                        />
                    </div>

                    {/* Community Submit Button (Accessible to all users; triggers auth prompt if guest) */}
                    <button
                        type="button"
                        onClick={handleOpenContribution}
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-emerald-600 px-2.5 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 transition active:scale-[0.98] shrink-0 whitespace-nowrap"
                    >
                        <Plus size={14} className="sm:w-4 sm:h-4" />
                        Submit Missing Product
                    </button>
                </div>

                {/* Filter Tags */}
                <div className="flex flex-nowrap gap-1.5 sm:gap-2.5 items-center pt-2 border-t border-slate-100 text-[10px] sm:text-xs">
                    <div className="flex items-center gap-1 text-slate-500 font-medium shrink-0">
                        <Filter size={13} className="sm:w-3.5 sm:h-3.5" /> Filter:
                    </div>

                    {/* Category Selector */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
                    >
                        {PRODUCT_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    {/* Status Selector */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
                    >
                        {PRODUCT_STATUSES.map((st) => (
                            <option key={st} value={st}>
                                {st}
                            </option>
                        ))}
                    </select>

                    <span className="text-slate-400 ml-auto whitespace-nowrap text-[9px] sm:text-xs">
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
            ) : filteredProducts.length === 0 ? (
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
                    {paginatedProducts.map((product) => {
                        const isHalal = product.status === 'Halal';
                        const isDoubtful = product.status === 'Doubtful';

                        return (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 mb-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3 sm:space-y-4 min-w-0"
                            >
                                <div className="space-y-2 sm:space-y-3">
                                    {/* Header: Brand & Status Badge */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-0.5 min-w-0">
                                            {product.brand && (
                                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-100">
                                                    {product.brand}
                                                </span>
                                            )}
                                            <h3 className="text-xs sm:text-base font-bold text-slate-900 leading-tight pt-1 break-words">
                                                {product.name}
                                            </h3>
                                        </div>

                                        <span
                                            className={`text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 border ${
                                                isHalal
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : isDoubtful
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                            }`}
                                        >
                                            {isHalal && <CheckCircle2 size={10} className="sm:w-3 sm:h-3" />}
                                            {isDoubtful && <AlertCircle size={10} className="sm:w-3 sm:h-3" />}
                                            {product.status}
                                        </span>
                                    </div>

                                    {/* Category & Barcode */}
                                    <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-500 pt-1">
                                        <span className="flex items-center gap-1 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md">
                                            <Tag size={10} className="sm:w-3 sm:h-3" /> {product.category || 'Food'}
                                        </span>
                                        {product.barcode && (
                                            <span className="flex items-center gap-1 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md font-mono text-[9px] sm:text-[11px]">
                                                <Barcode size={10} className="sm:w-3 sm:h-3" /> {product.barcode}
                                            </span>
                                        )}
                                    </div>

                                    {/* Manufacturer & Certification Info */}
                                    <div className="space-y-1 text-[11px] sm:text-xs text-slate-600 bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                            <Building2 size={11} className="text-slate-400 shrink-0 sm:w-[13px] sm:h-[13px]" />
                                            <span className="font-semibold text-slate-800">
                                                {product.manufacturers?.name || 'Manufacturer Unspecified'}
                                            </span>
                                        </div>

                                        {product.certificate_no && (
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                                                <span>
                                                    Cert: <strong className="font-mono text-slate-700">{product.certificate_no}</strong>
                                                    {product.certifying_bodies?.code && (
                                                        <span className="ml-1 text-slate-400">({product.certifying_bodies.code})</span>
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        {product.expiry_date && (
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Calendar size={13} className="text-slate-400 shrink-0" />
                                                <span>Valid until: {product.expiry_date}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Ingredients Summary */}
                                    {product.ingredients_summary && (
                                        <div className="text-xs text-slate-600">
                                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                                Ingredients:
                                            </p>
                                            <p className="line-clamp-2 text-slate-600 text-[10px] sm:text-[11px] leading-relaxed">
                                                {product.ingredients_summary}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer: Provenance & Admin Actions */}
                                <div className="pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] sm:text-xs gap-1">
                                    <span className="text-[10px] sm:text-[10px] text-slate-400 flex items-center gap-1 min-w-0" title={product.source_url || product.source}>
                                        <FileText size={10} className="shrink-0 sm:w-[11px] sm:h-[11px]" />
                                        {product.source || 'IDCP Registry'}
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleReportProduct(product)}
                                            className="text-[10px] sm:text-[11px] font-semibold text-slate-400 hover:text-amber-600 flex items-center gap-1 transition px-1 sm:px-1.5 py-0.5 rounded hover:bg-amber-50"
                                            title="Flag issue or report non-compliance"
                                        >
                                            <Flag size={10} className="sm:w-[11px] sm:h-[11px]" />
                                            <span>Flag</span>
                                        </button>

                                        {isAdmin ? (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openModal('edit-product', product)}
                                                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                                                    title="Edit Product"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openModal('delete-product', product)}
                                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            product.source_url && (
                                                <a
                                                    href={product.source_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                                                >
                                                    Source <ExternalLink size={10} />
                                                </a>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && filteredProducts.length > 0 && totalPages > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <span>Show</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
                        >
                            <option value={12}>12 per page</option>
                            <option value={24}>24 per page</option>
                            <option value={48}>48 per page</option>
                        </select>
                        <span className="hidden sm:inline text-slate-400">|</span>
                        <span className="hidden sm:inline">Page {currentPage} of {totalPages}</span>
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
            {(activeModal === 'add-product' || activeModal === 'edit-product') && (
                <Modal
                    isOpen={true}
                    onClose={closeModal}
                    title={activeModal === 'add-product' ? 'Register New Halal Product' : 'Edit Product Record'}
                >
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="sm:col-span-2 space-y-1">
                                <label className="text-xs font-bold text-slate-700">Product Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={modalForm.name}
                                    onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                                    placeholder="e.g. Purefoods Corned Beef 150g"
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Brand</label>
                                <input
                                    type="text"
                                    value={modalForm.brand}
                                    onChange={(e) => setModalForm({ ...modalForm, brand: e.target.value })}
                                    placeholder="e.g. Purefoods"
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Category</label>
                                <select
                                    value={modalForm.category}
                                    onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                                >
                                    {PRODUCT_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Barcode (GTIN / EAN)</label>
                                <input
                                    type="text"
                                    value={modalForm.barcode}
                                    onChange={(e) => setModalForm({ ...modalForm, barcode: e.target.value })}
                                    placeholder="e.g. 4800016012345"
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Halal Status</label>
                                <select
                                    value={modalForm.status}
                                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                                >
                                    {PRODUCT_STATUSES.filter((s) => s !== 'All Statuses').map((st) => (
                                        <option key={st} value={st}>
                                            {st}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Manufacturer</label>
                                <select
                                    value={modalForm.manufacturer_id}
                                    onChange={(e) => setModalForm({ ...modalForm, manufacturer_id: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                                >
                                    <option value="">-- Select Manufacturer --</option>
                                    {manufacturers.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Certificate Number</label>
                                <input
                                    type="text"
                                    value={modalForm.certificate_no}
                                    onChange={(e) => setModalForm({ ...modalForm, certificate_no: e.target.value })}
                                    placeholder="e.g. IDCP-2024-0891"
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Certificate Expiry Date</label>
                                <input
                                    type="date"
                                    value={modalForm.expiry_date}
                                    onChange={(e) => setModalForm({ ...modalForm, expiry_date: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">Data Source</label>
                                <input
                                    type="text"
                                    value={modalForm.source}
                                    onChange={(e) => setModalForm({ ...modalForm, source: e.target.value })}
                                    placeholder="e.g. IDCP Published Registry"
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                                <label className="text-xs font-bold text-slate-700">Ingredients Summary</label>
                                <textarea
                                    rows={2}
                                    value={modalForm.ingredients_summary}
                                    onChange={(e) => setModalForm({ ...modalForm, ingredients_summary: e.target.value })}
                                    placeholder="e.g. Cooked Beef, Beef Broth, Iodized Salt, Sugar, Spices..."
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-5 py-2 text-xs sm:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Product'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {activeModal === 'delete-product' && selectedProduct && (
                <Modal isOpen={true} onClose={closeModal} title="Confirm Product Deletion">
                    <div className="space-y-4">
                        <p className="text-xs sm:text-sm text-slate-600">
                            Are you sure you want to remove{' '}
                            <strong className="text-slate-900">{selectedProduct.name}</strong> from the verified
                            product directory? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteProduct}
                                disabled={isSaving}
                                className="px-5 py-2 text-xs sm:text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-50"
                            >
                                {isSaving ? 'Deleting...' : 'Delete Product'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

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
