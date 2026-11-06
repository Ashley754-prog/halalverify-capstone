import { Building2, Package, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import { getSafeUrl } from '../../utils/security';

function formatDate(value) {
  if (!value) return 'Not provided';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

export default function ProductCardDetail({ product, onClose }) {
  if (!product) return null;

  const imageUrl = getSafeUrl(product.image_url);
  const manufacturer = Array.isArray(product.manufacturers)
    ? product.manufacturers[0]
    : product.manufacturers;
  const certifier = Array.isArray(product.certifying_bodies)
    ? product.certifying_bodies[0]
    : product.certifying_bodies;

  return (
    <Modal
      isOpen={Boolean(product)}
      title="Product details"
      description="Registry information for this product"
      onClose={onClose}
      size="lg"
      maxHeightClass="max-h-[78dvh] sm:max-h-[92vh]"
    >
      <div className="grid gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-6">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-[#DCE7E0] bg-[#F4F8F5]">
          <div className="absolute inset-0 flex items-center justify-center text-emerald-700/50">
            <Package size={48} strokeWidth={1.5} />
          </div>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={product.name}
              onError={(event) => event.currentTarget.classList.add('hidden')}
              className="absolute inset-0 h-full w-full object-contain p-5"
            />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            {product.category || 'Product'}
          </p>
          <h2 className="mt-1 break-words text-xl font-extrabold text-[#17251F] sm:text-2xl">
            {product.name}
          </h2>

          <dl className="mt-5 divide-y divide-[#DCE7E0] border-y border-[#DCE7E0]">
            <div className="py-3">
              <dt className="flex items-center gap-2 text-xs font-semibold text-[#52645B]">
                <Building2 size={14} /> Company
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#17251F]">
                {manufacturer?.name || 'Not provided'}
              </dd>
            </div>
            <div className="py-3">
              <dt className="text-xs font-semibold text-[#52645B]">Brand</dt>
              <dd className="mt-1 text-sm font-medium text-[#17251F]">
                {product.brand || 'Not provided'}
              </dd>
            </div>
            <div className="py-3">
              <dt className="flex items-center gap-2 text-xs font-semibold text-[#52645B]">
                <ShieldCheck size={14} /> Certification body
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#17251F]">
                {certifier?.name || certifier?.code || 'Not provided'}
              </dd>
            </div>
            <div className="py-3">
              <dt className="text-xs font-semibold text-[#52645B]">Certificate expiry date</dt>
              <dd className="mt-1 text-sm font-medium text-[#17251F]">
                {formatDate(product.expiry_date)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <strong>Disclaimer:</strong> Product and certification details are shown as recorded in the registry. Confirm current certification with the issuing body before relying on this information.
          </p>
        </div>
      </div>
    </Modal>
  );
}
