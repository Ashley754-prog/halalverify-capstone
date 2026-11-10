import { Building2, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import ProductImage from '../catalog/ProductImage';
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

  const manufacturer = Array.isArray(product.manufacturers)
    ? product.manufacturers[0]
    : product.manufacturers;
  const certifier = Array.isArray(product.certifying_bodies)
    ? product.certifying_bodies[0]
    : product.certifying_bodies;
  const sourceUrl = getSafeUrl(product.source_url);

  return (
    <Modal
      isOpen={Boolean(product)}
      title="Product details"
      description="Product record from the registry"
      onClose={onClose}
      size="md"
      maxHeightClass="max-h-[calc(100dvh-3rem)] sm:max-h-[82vh]"
    >
      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-x-5 sm:gap-y-2">
        <ProductImage
          product={product}
          className="aspect-[16/9] rounded-xl border border-[#DCE7E0] sm:aspect-auto sm:h-full"
        />

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 sm:text-xs">
            {product.category || 'Product'}
          </p>
          <h2 className="mt-1 break-words text-base font-extrabold leading-snug text-[#17251F] sm:text-lg">
            {product.name}
          </h2>
          <dl className="mt-3 divide-y divide-[#DCE7E0] border-t border-[#DCE7E0] sm:mt-4">
            <div className="py-2.5">
              <dt className="flex items-center gap-2 text-[11px] font-semibold text-[#52645B]">
                <Building2 size={13} /> Company
              </dt>
              <dd className="mt-1 break-words text-xs font-medium text-[#17251F] sm:text-sm">
                {manufacturer?.name || 'Not provided'}
              </dd>
            </div>
            <div className="py-2.5">
              <dt className="text-[11px] font-semibold text-[#52645B]">Brand</dt>
              <dd className="mt-1 break-words text-xs font-medium text-[#17251F] sm:text-sm">
                {product.brand || 'Not provided'}
              </dd>
            </div>
          </dl>
        </div>

        <dl className="grid min-w-0 grid-cols-1 divide-y divide-[#DCE7E0] border-y border-[#DCE7E0] sm:col-span-2 sm:grid-cols-2 sm:divide-y-0 sm:gap-x-5">
          <div className="py-2.5 sm:border-b sm:border-[#DCE7E0]">
            <dt className="flex items-center gap-2 text-[11px] font-semibold text-[#52645B]">
              <ShieldCheck size={13} /> Certification body
            </dt>
            <dd className="mt-1 break-words text-xs font-medium text-[#17251F] sm:text-sm">
              {certifier?.name || certifier?.code || 'Not provided'}
            </dd>
          </div>
          <div className="py-2.5 sm:border-b sm:border-[#DCE7E0]">
            <dt className="text-[11px] font-semibold text-[#52645B]">Recorded status</dt>
            <dd className="mt-1 break-words text-xs font-medium text-[#17251F] sm:text-sm">
              {product.status || 'Not provided'}
            </dd>
          </div>
          <div className="py-2.5 sm:border-b sm:border-[#DCE7E0]">
            <dt className="text-[11px] font-semibold text-[#52645B]">Certificate number</dt>
            <dd className="mt-1 break-words text-xs font-medium text-[#17251F] sm:text-sm">
              {product.certificate_no || 'Not provided'}
            </dd>
          </div>
          <div className="py-2.5 sm:border-b sm:border-[#DCE7E0]">
            <dt className="text-[11px] font-semibold text-[#52645B]">Registry source</dt>
            <dd className="mt-1 break-words text-xs font-medium text-[#17251F] sm:text-sm">
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-800 underline underline-offset-2"
                >
                  {product.source || sourceUrl}
                </a>
              ) : (
                product.source || 'Not provided'
              )}
            </dd>
          </div>
          <div className="py-2.5">
            <dt className="text-[11px] font-semibold text-[#52645B]">Certificate expiry date</dt>
            <dd className="mt-1 break-words text-xs font-medium text-[#17251F] sm:text-sm">
              {formatDate(product.expiry_date)}
            </dd>
          </div>
        </dl>

        <p className="mt-3 w-full rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900 sm:col-span-2 sm:mt-0 sm:p-3 sm:text-xs">
          <strong>Disclaimer:</strong> Product and certification details are shown as recorded in the registry. Confirm current certification with the issuing body before relying on this information.
        </p>
      </div>
    </Modal>
  );
}
