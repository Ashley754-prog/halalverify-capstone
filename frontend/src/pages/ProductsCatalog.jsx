import { useEffect, useState, useMemo } from 'react';
import {
    Search,
    AlertCircle,
    Filter,
    Plus,
    Camera,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import Topbar from '../components/layouts/Topbar';
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedStatus, setSelectedStatus] = useState('All Statuses');
    const [currentPage, setCurrentPage] = useState(1);
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
        const cats = new Set();
        products.forEach((p) => {
            if (p.category && p.category.trim()) {
                cats.add(p.category.trim());
            }
        });
        return cats.size > 0
            ? ['All Categories', ...Array.from(cats).sort()]
            : PRODUCT_CATEGORIES;
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

            // 1. Direct Supabase Query (Instant ~150ms response, zero cold start)
            try {
                const [productsRes, mfgRes] = await Promise.all([
                    supabase
                        .from('products')
                        .select('*, manufacturers(*), certifying_bodies(*)')
                        .order('name'),
                    supabase
                        .from('manufacturers')
                        .select('*')
                        .order('name'),
                ]);

                if (!productsRes.error && productsRes.data && productsRes.data.length > 0) {
                    loadedProducts = productsRes.data;
                    if (mfgRes.data) loadedMfg = mfgRes.data;
                }
            } catch (sbErr) {
                console.warn('Direct Supabase fetch failed, attempting backend fallback:', sbErr);
            }

            // 2. Fallback to Backend API with a 3.5s timeout if direct Supabase didn't return items
            if (!loadedProducts || loadedProducts.length === 0) {
                try {
                    const [productsRes, mfgRes] = await Promise.all([
                        authFetch(`${API_BASE_URL}/products?limit=200`, { timeout: 3500 }),
                        authFetch(`${API_BASE_URL}/manufacturers?limit=200`, { timeout: 3500 }),
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
                    console.warn('Backend API request timed out or unavailable:', apiErr);
                }
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
    }, [searchQuery, selectedCategory, selectedStatus]);

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
                onBack={() => onViewChange?.('back')}
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
                        onChange={(e) => setSelectedCategory(e.target.value)}
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
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="min-w-0 flex-1 sm:flex-initial rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] sm:text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
                    >
                        {PRODUCT_STATUSES.map((st) => (
                            <option key={st} value={st}>
                                {st}
                            </option>
                        ))}
                    </select>

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
            {!loading && filteredProducts.length > 0 && totalPages > 1 && (
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
