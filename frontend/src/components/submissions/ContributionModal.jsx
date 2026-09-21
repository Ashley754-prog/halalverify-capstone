import { useState } from 'react';
import {
  Building2,
  Package,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL, authFetch } from '../../utils/api';
import { validateUploadFile } from '../../utils/security';
import EstablishmentContributionForm from './EstablishmentContributionForm';
import ProductContributionForm from './ProductContributionForm';

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

    const validation = validateUploadFile(file, { maxSizeMB: 10 });
    if (!validation.valid) {
      setErrorMessage(validation.error);
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

          {/* Sub-form components */}
          {activeTab === 'establishment' ? (
            <EstablishmentContributionForm
              estForm={estForm}
              setEstForm={setEstForm}
              onSubmit={handleEstablishmentSubmit}
              submitting={submitting}
              uploadingImage={uploadingImage}
              onFileUpload={handleFileUpload}
              onCancel={onClose}
            />
          ) : (
            <ProductContributionForm
              prodForm={prodForm}
              setProdForm={setProdForm}
              onSubmit={handleProductSubmit}
              submitting={submitting}
              uploadingImage={uploadingImage}
              onFileUpload={handleFileUpload}
              onCancel={onClose}
            />
          )}
        </div>
      )}
    </Modal>
  );
}
