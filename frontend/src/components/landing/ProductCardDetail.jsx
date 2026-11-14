import { AlertCircle, Building2, CheckCircle2, Leaf, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import ProductImage from '../catalog/ProductImage';
import { getSafeUrl } from '../../utils/security';
import { parseProductVariants, simplifyStatus } from '../../utils/textFormatters';

function formatDate(value) {
  if (!value) return '';
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...(match ? { timeZone: 'UTC' } : {}),
      }).format(date);
}

function getStatusMeta(product) {
  const statusLower = (product?.status || '').toLowerCase();
  const adminNotesLower = (product?.admin_notes || '').toLowerCase();

  const isPorkFree =
    statusLower.includes('pork-free') ||
    (statusLower === 'community_listed' && adminNotesLower.includes('pork-free'));
  const isVegetarian =
    statusLower.includes('vegetarian') ||
    statusLower.includes('vegan') ||
    (statusLower === 'community_listed' &&
      (adminNotesLower.includes('vegetarian') || adminNotesLower.includes('vegan')));
  const isHalal = statusLower === 'halal' || statusLower === 'verified';
  const isDoubtful = statusLower === 'doubtful' || statusLower.includes('syubhah');
  const isExpired = statusLower === 'expired';
  const isCommunityListed = statusLower === 'community_listed' && !isPorkFree && !isVegetarian;

  if (isPorkFree) {
    return {
      label: 'Pork-Free Declared',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      Icon: CheckCircle2,
    };
  }
  if (isVegetarian) {
    return {
      label: 'Vegetarian / Vegan',
      badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
      Icon: Leaf,
    };
  }
  if (isHalal) {
    return {
      label: simplifyStatus(product?.status),
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Icon: CheckCircle2,
    };
  }
  if (isCommunityListed) {
    return {
      label: 'Community Listed',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      Icon: CheckCircle2,
    };
  }
  if (isDoubtful || isExpired) {
    return {
      label: simplifyStatus(product?.status),
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      Icon: AlertCircle,
    };
  }
  return {
    label: product?.status ? simplifyStatus(product.status) : 'Registry Listed',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    Icon: AlertCircle,
  };
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
  const variants = parseProductVariants(product.admin_notes);
  const statusMeta = getStatusMeta(product);
  const StatusIcon = statusMeta.Icon;

  const companyName = manufacturer?.name || product.brand || 'Not provided';
  const hasDistinctBrand =
    Boolean(product.brand) &&
    product.brand.trim().toLowerCase() !== companyName.trim().toLowerCase();

  const isDtiDirectory = `${product.source || ''}`.toLowerCase().includes('zampen') ||
    `${product.source || ''}`.toLowerCase().includes('dti region ix');
  const certifierLabel =
    certifier?.name ||
    certifier?.code ||
    (isDtiDirectory ? 'DTI Region IX ZAMPEN Directory' : 'Not provided');
  const hasCertificateMeta = Boolean(product.certificate_no || product.expiry_date);

  return (
    <Modal
      isOpen={Boolean(product)}
      title="Product details"
      description="Product record from the registry"
      onClose={onClose}
      size="lg"
      maxHeightClass="max-h-[calc(100dvh-2rem)] sm:max-h-[88vh]"
    >
      <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] sm:gap-x-6 sm:gap-y-4">
        <ProductImage
          product={product}
          className="w-full rounded-xl border border-[#DCE7E0] sm:self-start"
        />

        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
              {product.category || 'Product'}
            </p>
            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold ${statusMeta.badgeClass}`}
            >
              <StatusIcon size={12} aria-hidden="true" />
              {statusMeta.label}
            </span>
          </div>
          <h2 className="mt-1.5 break-words text-lg font-extrabold leading-snug text-[#17251F] sm:text-xl">
            {product.name}
          </h2>
          <dl className="mt-3 divide-y divide-[#DCE7E0] border-t border-[#DCE7E0]">
            <div className="py-2.5">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-[#52645B]">
                <Building2 size={13} aria-hidden="true" /> Company
              </dt>
              <dd className="mt-0.5 break-words text-xs font-medium text-[#17251F] sm:text-sm">
                {companyName}
              </dd>
            </div>
            {hasDistinctBrand && (
              <div className="py-2.5">
                <dt className="text-[11px] font-semibold text-[#52645B]">Brand</dt>
                <dd className="mt-0.5 break-words text-xs font-medium text-[#17251F] sm:text-sm">
                  {product.brand}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <dl className="grid min-w-0 grid-cols-1 border-t border-[#DCE7E0] sm:col-span-2 sm:grid-cols-2 sm:gap-x-6">
          <div className="border-b border-[#DCE7E0] py-2.5">
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-[#52645B]">
              <ShieldCheck size={13} aria-hidden="true" /> Certification body
            </dt>
            <dd className="mt-0.5 break-words text-xs font-medium text-[#17251F] sm:text-sm">
              {certifierLabel}
            </dd>
          </div>
          {hasCertificateMeta && (
            <>
              <div className="border-b border-[#DCE7E0] py-2.5">
                <dt className="text-[11px] font-semibold text-[#52645B]">Certificate number</dt>
                <dd className="mt-0.5 break-words text-xs font-medium text-[#17251F] sm:text-sm">
                  {product.certificate_no || 'Not on file'}
                </dd>
              </div>
              <div className="border-b border-[#DCE7E0] py-2.5">
                <dt className="text-[11px] font-semibold text-[#52645B]">Certificate expiry date</dt>
                <dd className="mt-0.5 break-words text-xs font-medium text-[#17251F] sm:text-sm">
                  {product.expiry_date ? formatDate(product.expiry_date) : 'Not on file'}
                </dd>
              </div>
            </>
          )}
          <div className="border-b border-[#DCE7E0] py-2.5">
            <dt className="text-[11px] font-semibold text-[#52645B]">Registry source</dt>
            <dd className="mt-0.5 break-words text-xs font-medium text-[#17251F] sm:text-sm">
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
          {variants.length > 0 && (
            <div className="border-b border-[#DCE7E0] py-2.5 sm:col-span-2">
              <dt className="text-[11px] font-semibold text-[#52645B]">
                Available flavors and variants ({variants.length})
              </dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {variants.map((variant) => (
                  <span
                    key={variant}
                    className="inline-flex items-center rounded-md border border-[#DCE7E0] bg-[#F4F8F5] px-2 py-0.5 text-xs font-medium text-[#17251F]"
                  >
                    {variant}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {product.ingredients_summary && !product.ingredients_summary.toLowerCase().startsWith('verified product certified under') && (
            <div className="border-b border-[#DCE7E0] py-2.5 sm:col-span-2">
              <dt className="text-[11px] font-semibold text-[#52645B]">
                Ingredients summary
              </dt>
              <dd className="mt-1 break-words text-xs leading-relaxed text-[#17251F] sm:text-sm">
                {product.ingredients_summary}
              </dd>
            </div>
          )}
        </dl>

        <p className="w-full rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900 sm:col-span-2 sm:p-3 sm:text-xs">
          <strong>Disclaimer:</strong> Product and certification details are shown as recorded in the registry. Confirm current certification with the issuing body before relying on this information.
        </p>
      </div>
    </Modal>
  );
}
