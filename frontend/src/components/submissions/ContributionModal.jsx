import React, { useState } from 'react';
import {
  Building2,
  Package,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  MapPin,
  Tag,
  ShieldCheck,
  X,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL, authFetch } from '../../utils/api';

const ESTABLISHMENT_TYPES = [
  'Restaurant',
  'Cafeteria / Eatery',
  'Bakery & Pastry',
  'Fast Food',
  'Halal Meat & Poultry Shop',
  'Grocery / Supermarket',
  'Food Processing Facility',
];

const PRODUCT_CATEGORIES = [
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

export default function ContributionModal({
  isOpen,
  onClose,
  initialTab = 'establishment', // 'establishment' | 'product'
  onSubmitted,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state for establishment
  const [estForm, setEstForm] = useState({
    name: '',
    type: 'Restaurant',
    address: '',
    city: 'Zamboanga City',
    certificate_number: '',
    expiry_date: '',
    certificate_url: '',
    logo_url: '',
    product_names: '',
  });

  // Form state for product
  const [prodForm, setProdForm] = useState({
    name: '',
    brand: '',
    category: 'Food & Beverage',
    barcode: '',
    certificate_no: '',
    expiry_date: '',
    image_url: '',
    ingredients_summary: '',
  });

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid image (PNG, JPG, WEBP) or PDF document.');
      return;
    }

    try {
      setUploadingImage(true);
      setErrorMessage('');

      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${type}/${Date.now()}_${cleanFileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(data.path);

      const url = publicUrlData?.publicUrl || '';

      if (type === 'certificates') {
        setEstForm((prev) => ({ ...prev, certificate_url: url }));
      } else if (type === 'logos') {
        setEstForm((prev) => ({ ...prev, logo_url: url }));
      } else if (type === 'products') {
        setProdForm((prev) => ({ ...prev, image_url: url }));
      }
    } catch (err) {
      console.error('File upload error:', err);
      setErrorMessage('Failed to upload file to storage. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEstablishmentSubmit = async (e) => {
    e.preventDefault();
    if (!estForm.name.trim()) {
      setErrorMessage('Establishment name is required.');
      return;
    }
    if (!estForm.address.trim()) {
      setErrorMessage('Address in Zamboanga City is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const payload = {
        name: estForm.name.trim(),
        type: estForm.type,
        address: estForm.address.trim(),
        city: estForm.city || 'Zamboanga City',
        certificate_number: estForm.certificate_number.trim() || null,
        expiry_date: estForm.expiry_date || null,
        certificate_url: estForm.certificate_url || null,
        logo_url: estForm.logo_url || null,
        product_names: estForm.product_names
          ? estForm.product_names.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      let success = false;

      // 1. Try Backend API
      try {
        const response = await authFetch(`${API_BASE_URL}/establishments/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          success = true;
        }
      } catch (apiErr) {
        console.warn('Backend submission endpoint unavailable, falling back to direct Supabase:', apiErr);
      }

      // 2. Direct Supabase Fallback
      if (!success) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          throw new Error('You must be logged in to submit an establishment.');
        }

        const { error: sbErr } = await supabase.from('establishments').insert({
          name: payload.name,
          type: payload.type,
          address: payload.address,
          city: payload.city,
          certificate_number: payload.certificate_number,
          expiry_date: payload.expiry_date,
          certificate_url: payload.certificate_url,
          logo_url: payload.logo_url,
          halal_status: 'PENDING_VERIFICATION',
          submitted_by: userId,
          source: 'Community User Submission',
        });

        if (sbErr) throw sbErr;
      }

      setIsSuccess(true);
      onSubmitted?.();
    } catch (err) {
      console.error('Establishment submission error:', err);
      setErrorMessage(err.message || 'Submission failed. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!prodForm.name.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const payload = {
        name: prodForm.name.trim(),
        brand: prodForm.brand.trim() || null,
        category: prodForm.category,
        barcode: prodForm.barcode.trim() || null,
        certificate_no: prodForm.certificate_no.trim() || null,
        expiry_date: prodForm.expiry_date || null,
        image_url: prodForm.image_url || null,
        ingredients_summary: prodForm.ingredients_summary.trim() || null,
      };

      let success = false;

      // 1. Try Backend API
      try {
        const response = await authFetch(`${API_BASE_URL}/products/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          success = true;
        }
      } catch (apiErr) {
        console.warn('Backend submission endpoint unavailable, falling back to direct Supabase:', apiErr);
      }

      // 2. Direct Supabase Fallback
      if (!success) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          throw new Error('You must be logged in to submit a product.');
        }

        const { error: sbErr } = await supabase.from('products').insert({
          name: payload.name,
          brand: payload.brand,
          category: payload.category,
          barcode: payload.barcode,
          certificate_no: payload.certificate_no,
          expiry_date: payload.expiry_date,
          image_url: payload.image_url,
          ingredients_summary: payload.ingredients_summary,
          status: 'PENDING_VERIFICATION',
          submitted_by: userId,
          source: 'Community User Submission',
        });

        if (sbErr) throw sbErr;
      }

      setIsSuccess(true);
      onSubmitted?.();
    } catch (err) {
      console.error('Product submission error:', err);
      setErrorMessage(err.message || 'Submission failed. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setErrorMessage('');
    setEstForm({
      name: '',
      type: 'Restaurant',
      address: '',
      city: 'Zamboanga City',
      certificate_number: '',
      expiry_date: '',
      certificate_url: '',
      logo_url: '',
      product_names: '',
    });
    setProdForm({
      name: '',
      brand: '',
      category: 'Food & Beverage',
      barcode: '',
      certificate_no: '',
      expiry_date: '',
      image_url: '',
      ingredients_summary: '',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuccess ? '' : 'Contribute to Halal Registry'}
      description={
        isSuccess
          ? ''
          : 'Submit a local Zamboanga dining spot or packaged product for administrative halal verification.'
      }
      size="lg"
    >
      {isSuccess ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Submission Received!</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Your contribution has been successfully queued in{' '}
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                PENDING_VERIFICATION
              </span>{' '}
              status. It will be audited by the administrative team before public release.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition"
            >
              Submit Another
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('establishment');
                setErrorMessage('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                activeTab === 'establishment'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 size={16} />
              <span>Halal Establishment</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('product');
                setErrorMessage('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                activeTab === 'product'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package size={16} />
              <span>Packaged Product</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Establishment Form */}
          {activeTab === 'establishment' && (
            <form onSubmit={handleEstablishmentSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Establishment Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Al-Makkah Restaurant"
                    value={estForm.name}
                    onChange={(e) => setEstForm({ ...estForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category / Type</label>
                  <select
                    value={estForm.type}
                    onChange={(e) => setEstForm({ ...estForm, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 bg-white"
                  >
                    {ESTABLISHMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Physical Address in Zamboanga City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., Gov. Lim Ave, Zone II, Zamboanga City"
                    value={estForm.address}
                    onChange={(e) => setEstForm({ ...estForm, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Halal Certificate Number (if displayed)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., IDCP-ZC-2024-019"
                    value={estForm.certificate_number}
                    onChange={(e) => setEstForm({ ...estForm, certificate_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Certificate Validity / Expiry</label>
                  <input
                    type="date"
                    value={estForm.expiry_date}
                    onChange={(e) => setEstForm({ ...estForm, expiry_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Upload Certificate Photo / Document */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Upload Certificate Document / Photo (Recommended for Fast Verification)
                </label>
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center hover:border-emerald-500 transition">
                  {estForm.certificate_url ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={18} className="text-emerald-600 shrink-0" />
                        <span className="text-xs text-emerald-900 font-medium truncate">Certificate Uploaded</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEstForm({ ...estForm, certificate_url: '' })}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload size={22} className="text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-emerald-600 hover:underline">
                        {uploadingImage ? 'Uploading to storage...' : 'Click to select certificate image'}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, PDF up to 10MB</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        disabled={uploadingImage}
                        onChange={(e) => handleFileUpload(e, 'certificates')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verified Food / Menu Items (Separated by commas)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Beef Satti, Chicken Inasal, Roti Canai"
                  value={estForm.product_names}
                  onChange={(e) => setEstForm({ ...estForm, product_names: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50 transition"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>{submitting ? 'Submitting...' : 'Submit for Verification'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Product Form */}
          {activeTab === 'product' && (
            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Lucky Me! Pancit Canton"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Monde Nissin"
                    value={prodForm.brand}
                    onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 bg-white"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barcode (EAN-13)</label>
                  <input
                    type="text"
                    placeholder="e.g., 4800016445566"
                    value={prodForm.barcode}
                    onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Upload Product Package Photo */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product Packaging / Halal Logo Photo
                </label>
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center hover:border-emerald-500 transition">
                  {prodForm.image_url ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={18} className="text-emerald-600 shrink-0" />
                        <span className="text-xs text-emerald-900 font-medium truncate">Package Photo Uploaded</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProdForm({ ...prodForm, image_url: '' })}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload size={22} className="text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-emerald-600 hover:underline">
                        {uploadingImage ? 'Uploading to storage...' : 'Click to select packaging photo'}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG up to 10MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={(e) => handleFileUpload(e, 'products')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ingredients Summary</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Wheat Flour, Palm Oil, Salt, Tartrazine (E102)"
                  value={prodForm.ingredients_summary}
                  onChange={(e) => setProdForm({ ...prodForm, ingredients_summary: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50 transition"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>{submitting ? 'Submitting...' : 'Submit for Verification'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
