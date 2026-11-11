import { useEffect, useState } from 'react';
import { 
    ShieldCheck, 
    MapPin, 
    Plus, 
    Award,
    Store,
    ExternalLink
} from 'lucide-react';

import Toast from '../components/ui/Toast';
import ContributionModal from '../components/submissions/ContributionModal';
import AuthPromptModal from '../components/submissions/AuthPromptModal';
import ReportIssueModal from '../components/reports/ReportIssueModal';
import AdditivesRegistryTab from '../components/registry/AdditivesRegistryTab';
import HcbsRegistryTab from '../components/registry/HcbsRegistryTab';
import EstablishmentsRegistryTab from '../components/registry/EstablishmentsRegistryTab';
import RegistryModals, { normalizeAdditiveCode } from '../components/registry/RegistryModals';
import RegistryDeleteModal from '../components/registry/RegistryDeleteModal';
import { API_BASE_URL, authFetch } from '../utils/api';
import { supabase } from '../lib/supabaseClient';
import {
    getStatusConfig,
    ESTABLISHMENT_TYPES,
    geocodeZamboangaAddress,
    parseZamboangaAddress,
    formatZamboangaAddress,
    resolveEstablishmentCoordinates,
    cleanAmenities,
} from '../data/constants';
import { extractMenuHighlights } from '../utils/verificationNotes';

const emptyAdditiveForm = {
    code: '',
    name: '',
    status: 'Doubtful',
    origin: 'Plant',
    source: '',
    reason: '',
};

const emptyEstablishmentForm = {
    name: '',
    type: 'Restaurant',
    street: '',
    barangay: '',
    address: '',
    city: 'Zamboanga City',
    status: 'verified',
    halal_tier: 'halal_certified',
    phone: '',
    certNo: '',
    expiry: '',
    certificate_url: '',
    facebook_url: '',
    photo_url: '',
    amenities: [],
    menu_highlights: [],
};

const emptyHcbForm = {
    name: '',
    code: '',
    acronym: '',
    category: 'Local & Regional HCB',
    status: 'Accredited',
    country: 'Philippines',
    validity_period: '',
    registry_reference: '',
    website: '',
    accreditation_details: '',
};

export const Registry = ({ userRole, onViewChange, initialMode = 'additives' }) => {
    const [registryMode, setRegistryMode] = useState(initialMode || 'additives');

    useEffect(() => {
        if (initialMode && ['additives', 'hcb', 'establishments'].includes(initialMode)) {
            setRegistryMode(initialMode);
        }
    }, [initialMode]);
    const [dictSearch, setDictSearch] = useState('');
    const [localSearch, setLocalSearch] = useState('');
    const [hcbSearch, setHcbSearch] = useState('');
    
    // Filters
    const [additiveStatusFilter, setAdditiveStatusFilter] = useState('all');
    const [additiveOriginFilter, setAdditiveOriginFilter] = useState('all');
    const [hcbCategoryFilter, setHcbCategoryFilter] = useState('all');

    // Data lists
    const [additives, setAdditives] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [hcbs, setHcbs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalForm, setModalForm] = useState({});
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
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

    const handleReportEstablishment = (shop) => {
        if (!userRole) {
            setShowAuthPrompt(true);
        } else {
            setReportingTarget({
                relatedTo: 'establishment',
                subjectName: shop.name,
                establishmentId: shop.id,
                halalTier: shop.halal_status || shop.tier,
            });
            setShowReportModal(true);
        }
    };

    useEffect(() => {
        const fetchRegistryData = async () => {
            try {
                setLoading(true);
                setError('');

                // 1. Direct Supabase Query (Instant ~150ms, zero cold start)
                try {
                    const [sbAdd, sbEst, sbHcb] = await Promise.all([
                        supabase.from('additives').select('*').order('code'),
                        supabase.from('establishments').select('*').order('name'),
                        supabase.from('certifying_bodies').select('*').order('name'),
                    ]);

                    if (!sbAdd.error && !sbEst.error) {
                        setAdditives(sbAdd.data || []);
                        setEstablishments(sbEst.data || []);
                        setHcbs(sbHcb.data || []);
                        return;
                    }
                } catch (sbErr) {
                    console.warn('Direct Supabase registry fetch failed, attempting backend fallback:', sbErr);
                }

                // 2. Fallback to Backend API with a 2-second timeout
                try {
                    const [additivesResponse, establishmentsResponse, hcbsResponse] = await Promise.all([
                        authFetch(`${API_BASE_URL}/registry/additives`, { timeout: 2000 }),
                        authFetch(`${API_BASE_URL}/registry/establishments`, { timeout: 2000 }),
                        authFetch(`${API_BASE_URL}/api/v1/hcb-registry`, { timeout: 2000 }),
                    ]);

                    if (additivesResponse.ok && establishmentsResponse.ok) {
                        const additivesJson = await additivesResponse.json();
                        const establishmentsJson = await establishmentsResponse.json();
                        const hcbsJson = hcbsResponse.ok ? await hcbsResponse.json() : { data: [] };

                        setAdditives(additivesJson.data || []);
                        setEstablishments(establishmentsJson.data || []);
                        setHcbs(hcbsJson.data || []);
                        return;
                    }
                } catch (apiErr) {
                    console.warn('Backend registry endpoint unavailable or timed out:', apiErr);
                }

                throw new Error('Failed to load core registry data from both database and API');
            } catch (err) {
                console.error(err);
                setError('Could not load registry data. Please check if the backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchRegistryData();
    }, []);

    const openModal = (modalType, item = null) => {
        setSelectedItem(item);
        setActiveModal(modalType);

        if (modalType === 'add-additive') {
            setModalForm(emptyAdditiveForm);
            return;
        }

        if (modalType === 'add-establishment') {
            setModalForm(emptyEstablishmentForm);
            return;
        }

        if (modalType === 'add-hcb') {
            setModalForm(emptyHcbForm);
            return;
        }

        if (modalType === 'flag-additive') {
            setModalForm({
                reason: item.flagReason || item.reason || '',
                status: item.status || 'Doubtful',
            });
        } else if (modalType === 'edit-additive') {
            setModalForm({
                code: item.code || '',
                name: item.name || '',
                status: item.status || 'Doubtful',
                origin: item.origin || 'Plant',
                source: item.source_description || item.source || '',
                reason: item.reason || '',
            });
        } else if (modalType === 'edit-hcb') {
            setModalForm({
                name: item.name || '',
                code: item.code || '',
                acronym: item.acronym || '',
                category: item.category || 'Accredited HCB',
                status: item.status || 'Accredited',
                country: item.country || 'Philippines',
                validity_period: item.validity_period || '',
                registry_reference: item.registry_reference || '',
                website: item.website || '',
                accreditation_details: item.accreditation_details || '',
            });
        } else if (modalType === 'flag-establishment') {
            setModalForm({
                reason: item.flagReason || '',
                status: item.halal_status || item.status || 'needs_review',
            });
        } else {
            const statusConfig = getStatusConfig(item);
            const isCert = (statusConfig.key === 'verified' || item.halal_tier === 'halal_certified') && Boolean(item.certifying_body_id || item.certifying_bodies);
            const validTiers = ['halal_certified', 'muslim_owned', 'muslim_friendly'];
            let tierKey;
            if (item.halal_tier && validTiers.includes(item.halal_tier)) {
                tierKey = item.halal_tier;
            } else if (isCert) {
                tierKey = 'halal_certified';
            } else if (statusConfig.key === 'muslim_owned' || statusConfig.key === 'community') {
                tierKey = 'muslim_owned';
            } else {
                tierKey = 'muslim_friendly';
            }

            const hasPrayer = Boolean(
                item.has_prayer_space ||
                (item.description && (item.description.toLowerCase().includes('prayer') || item.description.toLowerCase().includes('musalah')))
            );
            let initialAmenities = [];
            if (Array.isArray(item.amenities)) {
                initialAmenities = [...item.amenities];
            } else if (typeof item.amenities === 'string' && item.amenities.trim()) {
                try {
                    initialAmenities = JSON.parse(item.amenities);
                } catch {
                    initialAmenities = item.amenities.split(',').map(s => s.trim()).filter(Boolean);
                }
            } else if (item.description && item.description.includes('Amenities:')) {
                initialAmenities = item.description.split('Amenities:')[1].split('|').map(s => s.trim()).filter(Boolean);
            }
            initialAmenities = cleanAmenities(initialAmenities);

            if (hasPrayer && !initialAmenities.some(a => a.toLowerCase().includes('prayer'))) {
                initialAmenities.push('Dedicated Prayer Space (Musalah)');
            }

            const detectedRole = item.submitter_role || (
                (item.source && item.source.toLowerCase().includes('owner')) ? 'owner' : 'community'
            );

            const rawStatus = (item.halal_status || item.status || '').toLowerCase().trim();
            const normalizedStatus =
                ['needs_review', 'pending', 'pending_review', 'review', 'pending_verification'].includes(rawStatus)
                    ? 'needs_review'
                    : ['suspended', 'flagged'].includes(rawStatus)
                    ? 'suspended'
                    : ['permanently_closed', 'closed', 'demolished', 'relocated', 'moved'].includes(rawStatus)
                    ? 'permanently_closed'
                    : 'verified';

            const parsedAddress = parseZamboangaAddress(item.address || '');
            const initialCoords = resolveEstablishmentCoordinates(item);

            setModalForm({
                name: item.name || '',
                type: item.type || 'Restaurant',
                street: parsedAddress.street,
                barangay: parsedAddress.barangay,
                address: item.address || '',
                city: item.city || 'Zamboanga City',
                latitude: initialCoords.latitude,
                longitude: initialCoords.longitude,
                pin_source: null,
                phone: item.phone || '',
                certNo: item.certificate_number || item.certNo || '',
                expiry: item.expiry_date || item.expiry || '',
                status: normalizedStatus,
                halal_tier: tierKey,
                admin_notes: item.admin_notes || '',
                submitter_role: detectedRole,
                source: item.source || (detectedRole === 'owner' ? 'Business Owner Submission' : 'Community User Submission'),
                has_prayer_space: hasPrayer,
                amenities: initialAmenities,
                description: item.description || '',
                certificate_url: (tierKey === 'halal_certified') ? (item.certificate_url || '') : '',
                facebook_url: item.facebook_url || '',
                photo_url: item.logo_url || item.photo_url || item.image_url || '',
                isCustomType: Boolean(item.type && !ESTABLISHMENT_TYPES.includes(item.type)),
                menu_highlights: extractMenuHighlights(item),
            });
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedItem(null);
        setModalForm({});
    };

    const updateToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
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
            errorMsg = 'Admin privileges required. Your account does not have permission to modify registry records.';
        }

        return errorMsg;
    };

    const saveRegistryRecord = async (endpoint, method, payload) => {
        const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: payload ? JSON.stringify(payload) : undefined,
        });

        if (!response.ok) {
            const msg = await parseApiError(response, 'Failed to save registry record');
            throw new Error(msg);
        }

        const json = await response.json();
        return json.data;
    };

    const deleteRegistryRecord = async (endpoint) => {
        const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const msg = await parseApiError(response, 'Failed to delete registry record');
            throw new Error(msg);
        }
    };

    const handleDeleteAdditive = (item) => {
        setDeleteTarget({ item, type: 'additive' });
    };

    const handleDeleteHcb = (item) => {
        setDeleteTarget({ item, type: 'hcb' });
    };

    const handleDeleteEstablishment = (item) => {
        setDeleteTarget({ item, type: 'establishment' });
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget?.item) return;
        const { item, type } = deleteTarget;

        try {
            setIsDeleting(true);
            if (type === 'additive') {
                await deleteRegistryRecord(`/api/v1/admin/additives/${item.id}`);
                setAdditives(prev => prev.filter(entry => entry.id !== item.id));
                updateToast('Additive deleted from chemical database.', 'success');
            } else if (type === 'hcb') {
                await deleteRegistryRecord(`/api/v1/admin/hcb-registry/${item.id}`);
                setHcbs(prev => prev.filter(entry => entry.id !== item.id));
                updateToast('Certifying body removed from registry.', 'success');
            } else if (type === 'establishment') {
                try {
                    const { error: sbErr } = await supabase
                        .from('establishments')
                        .delete()
                        .eq('id', item.id);
                    if (sbErr) throw sbErr;
                } catch (sbDelErr) {
                    await deleteRegistryRecord(`/registry/establishments/${item.id}`);
                }
                setEstablishments(prev => prev.filter(entry => entry.id !== item.id));
                updateToast('Establishment deleted from database.', 'success');
            }
            setDeleteTarget(null);
        } catch (err) {
            console.error(err);
            updateToast(err.message || 'Could not delete record.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const requireText = (value, label) => {
        if (!value || !value.trim()) {
            throw new Error(`${label} is required.`);
        }
        return value.trim();
    };

    const handleModalSubmit = async (event) => {
        event.preventDefault();

        try {
            if (activeModal === 'add-additive') {
                const addStatus = modalForm.status === 'Needs Review' ? 'Doubtful' : (modalForm.status || 'Doubtful');
                const rawCode = requireText(modalForm.code, 'Code');
                const created = await saveRegistryRecord('/api/v1/admin/additives', 'POST', {
                    code: normalizeAdditiveCode(rawCode),
                    name: requireText(modalForm.name, 'Name'),
                    status: addStatus,
                    origin: modalForm.origin || 'Plant',
                    source_description: safeTrim(modalForm.source),
                    reason: safeTrim(modalForm.reason),
                });

                setAdditives(prev => [created, ...prev]);
                updateToast('New chemical additive saved.', 'success');
            } else if (activeModal === 'edit-additive') {
                const addStatus = modalForm.status === 'Needs Review' ? 'Doubtful' : (modalForm.status || 'Doubtful');
                const rawCode = requireText(modalForm.code, 'Code');
                const updated = await saveRegistryRecord(
                    `/api/v1/admin/additives/${selectedItem.id}`,
                    'PUT',
                    {
                        code: normalizeAdditiveCode(rawCode),
                        name: requireText(modalForm.name, 'Name'),
                        status: addStatus,
                        origin: modalForm.origin || 'Plant',
                        source_description: safeTrim(modalForm.source),
                        reason: safeTrim(modalForm.reason),
                    }
                );

                setAdditives(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Additive record updated.', 'success');
            } else if (activeModal === 'flag-additive') {
                const addStatus = modalForm.status === 'Needs Review' ? 'Doubtful' : (modalForm.status || 'Doubtful');
                const updated = await saveRegistryRecord(
                    `/api/v1/admin/additives/${selectedItem.id}`,
                    'PATCH',
                    {
                        status: addStatus,
                        reason: safeTrim(modalForm.reason),
                    }
                );

                setAdditives(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Additive status review saved.', 'success');
            } else if (activeModal === 'add-hcb') {
                const created = await saveRegistryRecord('/api/v1/admin/hcb-registry', 'POST', {
                    name: requireText(modalForm.name, 'Organization name'),
                    code: safeTrim(modalForm.code),
                    acronym: safeTrim(modalForm.acronym) || safeTrim(modalForm.code),
                    category: modalForm.category || 'Accredited HCB',
                    status: modalForm.status || 'Accredited',
                    country: safeTrim(modalForm.country) || 'Philippines',
                    validity_period: safeTrim(modalForm.validity_period),
                    registry_reference: safeTrim(modalForm.registry_reference),
                    website: safeTrim(modalForm.website),
                    accreditation_details: safeTrim(modalForm.accreditation_details),
                });

                setHcbs(prev => [created, ...prev]);
                updateToast('New certifying body registered.', 'success');
            } else if (activeModal === 'edit-hcb') {
                const updated = await saveRegistryRecord(
                    `/api/v1/admin/hcb-registry/${selectedItem.id}`,
                    'PUT',
                    {
                        name: requireText(modalForm.name, 'Organization name'),
                        code: safeTrim(modalForm.code),
                        acronym: safeTrim(modalForm.acronym) || safeTrim(modalForm.code),
                        category: modalForm.category,
                        status: modalForm.status,
                        country: safeTrim(modalForm.country),
                        validity_period: safeTrim(modalForm.validity_period),
                        registry_reference: safeTrim(modalForm.registry_reference),
                        website: safeTrim(modalForm.website),
                        accreditation_details: safeTrim(modalForm.accreditation_details),
                    }
                );

                setHcbs(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Certifying body updated.', 'success');
            } else if (activeModal === 'add-establishment') {
                const tier = modalForm.halal_tier || 'halal_certified';
                let adminNotes = '';

                if (tier === 'muslim_owned') {
                    adminNotes = '[Tier: muslim_owned] Community Listed - Muslim-Owned (Pork-Free Kitchen)';
                } else if (tier === 'muslim_friendly') {
                    adminNotes = '[Tier: muslim_friendly] Community Listed - Muslim-Friendly Venue';
                } else if (tier === 'halal_certified') {
                    adminNotes = '[Tier: halal_certified] Formally Certified Halal Establishment';
                }

                const amList = cleanAmenities(modalForm.amenities);
                if (modalForm.has_prayer_space && !amList.some(a => a.toLowerCase().includes('prayer'))) {
                    amList.push('Dedicated Prayer Space (Musalah)');
                }
                const dishList = Array.isArray(modalForm.menu_highlights) ? modalForm.menu_highlights.filter(Boolean) : [];
                const descParts = [];
                if (amList.length > 0) descParts.push(`Amenities: ${amList.join(' | ')}`);
                if (dishList.length > 0) descParts.push(`Dishes: ${dishList.join(', ')}`);
                const description = descParts.join(' | ') || (modalForm.description || null);

                const role = modalForm.submitter_role || 'community';
                const createStreet = modalForm.street !== undefined
                    ? modalForm.street
                    : parseZamboangaAddress(modalForm.address || '').street;
                const createBarangay = modalForm.barangay !== undefined
                    ? modalForm.barangay
                    : parseZamboangaAddress(modalForm.address || '').barangay;
                const cleanCity = safeTrim(modalForm.city) || 'Zamboanga City';
                const cleanAddress = formatZamboangaAddress(createStreet, createBarangay, cleanCity);
                const hasManualPin =
                    (modalForm.pin_source === 'map' || modalForm.pin_source === 'gps') &&
                    Number.isFinite(Number(modalForm.latitude)) &&
                    Number.isFinite(Number(modalForm.longitude));
                const createCoords = hasManualPin
                    ? { latitude: Number(modalForm.latitude), longitude: Number(modalForm.longitude) }
                    : await geocodeZamboangaAddress(cleanAddress, cleanCity, createBarangay);

                const estCreatePayload = {
                    name: requireText(modalForm.name, 'Establishment name'),
                    type: safeTrim(modalForm.type) || 'Restaurant',
                    address: cleanAddress,
                    city: cleanCity,
                    latitude: createCoords.latitude,
                    longitude: createCoords.longitude,
                    certificate_number: tier === 'halal_certified' ? safeTrim(modalForm.certNo) : null,
                    expiry_date: tier === 'halal_certified' ? safeTrim(modalForm.expiry) : null,
                    halal_status: modalForm.status || 'verified',
                    halal_tier: tier,
                    submitter_role: role,
                    source: modalForm.source || (role === 'owner' ? 'Business Owner Submission' : 'Community User Submission'),
                    amenities: amList,
                    menu_highlights: dishList,
                    description: description,
                    phone: safeTrim(modalForm.phone),
                    admin_notes: adminNotes,
                    certificate_url: (tier === 'halal_certified' || tier === 'verified')
                        ? (modalForm.photo_url === 'none' ? null : safeTrim(modalForm.certificate_url))
                        : null,
                    logo_url: modalForm.photo_url === 'none' ? 'none' : safeTrim(modalForm.photo_url || modalForm.certificate_url),
                    facebook_url: safeTrim(modalForm.facebook_url) || null,
                    photo_url: modalForm.photo_url === 'none' ? 'none' : (safeTrim(modalForm.photo_url) || null),
                };

                let created = null;
                try {
                    const { data, error } = await supabase
                        .from('establishments')
                        .insert(estCreatePayload)
                        .select()
                        .single();
                    if (error) {
                        console.warn('Direct Supabase insert returned error, attempting backend fallback:', error);
                    } else if (data) {
                        created = data;
                    }
                } catch (sbErr) {
                    console.warn('Direct Supabase insert failed, attempting backend fallback:', sbErr);
                }

                if (!created) {
                    created = await saveRegistryRecord('/registry/establishments', 'POST', estCreatePayload);
                    if (estCreatePayload.halal_status && estCreatePayload.halal_status !== 'needs_review' && created?.id) {
                        await supabase
                            .from('establishments')
                            .update({ halal_status: estCreatePayload.halal_status })
                            .eq('id', created.id);
                        created.halal_status = estCreatePayload.halal_status;
                    }
                }

                const safeCreated = {
                    ...created,
                    latitude: createCoords.latitude,
                    longitude: createCoords.longitude,
                    halal_tier: tier,
                    halal_status: modalForm.status || 'verified',
                    submitter_role: role,
                    source: modalForm.source || (role === 'owner' ? 'Business Owner Submission' : 'Community User Submission'),
                    amenities: amList,
                    menu_highlights: dishList,
                    admin_notes: adminNotes,
                };

                setEstablishments(prev => [safeCreated, ...prev]);
                updateToast('New establishment saved to database.', 'success');
            } else if (activeModal === 'edit-establishment') {
                const tier = (modalForm.halal_tier === 'verified' ? 'halal_certified' : modalForm.halal_tier) || 'halal_certified';
                let adminNotes = '';

                if (tier === 'muslim_owned') {
                    adminNotes = '[Tier: muslim_owned] Community Listed - Muslim-Owned (Pork-Free Kitchen)';
                } else if (tier === 'muslim_friendly') {
                    adminNotes = '[Tier: muslim_friendly] Community Listed - Muslim-Friendly Venue';
                } else if (tier === 'halal_certified') {
                    adminNotes = '[Tier: halal_certified] Formally Certified Halal Establishment';
                }

                const amList = cleanAmenities(modalForm.amenities);
                if (modalForm.has_prayer_space && !amList.some(a => a.toLowerCase().includes('prayer'))) {
                    amList.push('Dedicated Prayer Space (Musalah)');
                }
                const dishList = Array.isArray(modalForm.menu_highlights) ? modalForm.menu_highlights.filter(Boolean) : [];
                const descParts = [];
                if (amList.length > 0) descParts.push(`Amenities: ${amList.join(' | ')}`);
                if (dishList.length > 0) descParts.push(`Dishes: ${dishList.join(', ')}`);
                const description = descParts.join(' | ') || (modalForm.description || null);

                const role = modalForm.submitter_role || 'community';
                const editStreet = modalForm.street !== undefined
                    ? modalForm.street
                    : parseZamboangaAddress(modalForm.address || '').street;
                const editBarangay = modalForm.barangay !== undefined
                    ? modalForm.barangay
                    : parseZamboangaAddress(modalForm.address || '').barangay;
                const cleanCity = safeTrim(modalForm.city) || 'Zamboanga City';
                const cleanAddress = formatZamboangaAddress(editStreet, editBarangay, cleanCity);

                const prevParsed = parseZamboangaAddress(selectedItem.address || '');
                const addressChanged =
                    cleanAddress.toLowerCase() !== (safeTrim(selectedItem.address) || '').toLowerCase() ||
                    (editBarangay || '').toLowerCase() !== (prevParsed.barangay || '').toLowerCase();

                const validatedExisting = resolveEstablishmentCoordinates({
                    ...selectedItem,
                    address: cleanAddress,
                    barangay: editBarangay,
                });
                const coordsMismatched =
                    !selectedItem.latitude ||
                    !selectedItem.longitude ||
                    Math.abs(Number(selectedItem.latitude) - validatedExisting.latitude) > 0.001 ||
                    Math.abs(Number(selectedItem.longitude) - validatedExisting.longitude) > 0.001;

                const hasManualEditPin =
                    (modalForm.pin_source === 'map' || modalForm.pin_source === 'gps') &&
                    Number.isFinite(Number(modalForm.latitude)) &&
                    Number.isFinite(Number(modalForm.longitude));

                let coordsPatch = {};
                if (hasManualEditPin) {
                    coordsPatch = {
                        latitude: Number(modalForm.latitude),
                        longitude: Number(modalForm.longitude),
                    };
                } else if (addressChanged || coordsMismatched) {
                    const resolvedCoords = await geocodeZamboangaAddress(cleanAddress, cleanCity, editBarangay);
                    coordsPatch = {
                        latitude: resolvedCoords.latitude,
                        longitude: resolvedCoords.longitude,
                    };
                }

                const patchPayload = {
                    name: requireText(modalForm.name, 'Establishment name'),
                    type: safeTrim(modalForm.type) || 'Restaurant',
                    address: cleanAddress,
                    city: cleanCity,
                    ...coordsPatch,
                    certificate_number: (tier === 'halal_certified' || tier === 'verified') ? safeTrim(modalForm.certNo) : null,
                    expiry_date: (tier === 'halal_certified' || tier === 'verified') ? safeTrim(modalForm.expiry) : null,
                    halal_status: modalForm.status || 'verified',
                    halal_tier: tier,
                    submitter_role: role,
                    amenities: amList,
                    menu_highlights: dishList,
                    phone: safeTrim(modalForm.phone),
                    admin_notes: adminNotes,
                    source: modalForm.source || (role === 'owner' ? 'Business Owner Submission' : 'Community User Submission'),
                    description: description,
                    certificate_url: (tier === 'halal_certified' || tier === 'verified')
                        ? (modalForm.photo_url === 'none' ? null : safeTrim(modalForm.certificate_url))
                        : null,
                    logo_url: modalForm.photo_url === 'none' ? 'none' : safeTrim(modalForm.photo_url || modalForm.certificate_url),
                    facebook_url: safeTrim(modalForm.facebook_url) || null,
                    photo_url: modalForm.photo_url === 'none' ? 'none' : (safeTrim(modalForm.photo_url) || null),
                };

                let updated = null;
                try {
                    const { data, error } = await supabase
                        .from('establishments')
                        .update(patchPayload)
                        .eq('id', selectedItem.id)
                        .select()
                        .single();
                    if (error) {
                        console.warn('Direct Supabase update returned error, attempting backend fallback:', error);
                    } else if (data) {
                        updated = data;
                    }
                } catch (sbErr) {
                    console.warn('Direct Supabase update failed, attempting backend fallback:', sbErr);
                }

                if (!updated) {
                    updated = await saveRegistryRecord(
                        `/registry/establishments/${selectedItem.id}`,
                        'PATCH',
                        patchPayload
                    );
                    if (patchPayload.halal_status && patchPayload.halal_status !== 'needs_review') {
                        await supabase
                            .from('establishments')
                            .update({ halal_status: patchPayload.halal_status, ...coordsPatch })
                            .eq('id', selectedItem.id);
                        if (updated) {
                            updated.halal_status = patchPayload.halal_status;
                        }
                    }
                }

                const resolvedLogoUrl = modalForm.photo_url === 'none'
                    ? 'none'
                    : (updated?.logo_url !== undefined ? updated.logo_url : safeTrim(modalForm.photo_url || modalForm.certificate_url));

                const resolvedPhotoUrl = modalForm.photo_url === 'none'
                    ? 'none'
                    : (updated?.photo_url !== undefined ? updated.photo_url : (safeTrim(modalForm.photo_url) || null));

                const safeUpdated = {
                    ...selectedItem,
                    ...updated,
                    ...coordsPatch,
                    halal_tier: tier,
                    halal_status: modalForm.status || 'verified',
                    submitter_role: role,
                    source: modalForm.source || (role === 'owner' ? 'Business Owner Submission' : 'Community User Submission'),
                    amenities: amList,
                    menu_highlights: dishList,
                    admin_notes: adminNotes,
                    description: description,
                    logo_url: resolvedLogoUrl,
                    photo_url: resolvedPhotoUrl,
                };

                setEstablishments(prev =>
                    prev.map(item => item.id === selectedItem.id ? safeUpdated : item)
                );
                updateToast('Establishment record saved to database.', 'success');
            } else if (activeModal === 'flag-establishment') {
                const patchPayload = {
                    halal_status: modalForm.status || 'needs_review',
                };

                let updated = null;
                try {
                    const { data, error } = await supabase
                        .from('establishments')
                        .update(patchPayload)
                        .eq('id', selectedItem.id)
                        .select()
                        .single();
                    if (error) {
                        console.warn('Direct Supabase flag update returned error:', error);
                    } else if (data) {
                        updated = data;
                    }
                } catch (sbErr) {
                    console.warn('Direct Supabase flag update failed, attempting backend fallback:', sbErr);
                }

                if (!updated) {
                    updated = await saveRegistryRecord(
                        `/registry/establishments/${selectedItem.id}`,
                        'PATCH',
                        patchPayload
                    );
                    if (patchPayload.halal_status && patchPayload.halal_status !== 'needs_review') {
                        await supabase
                            .from('establishments')
                            .update({ halal_status: patchPayload.halal_status })
                            .eq('id', selectedItem.id);
                        if (updated) {
                            updated.halal_status = patchPayload.halal_status;
                        }
                    }
                }

                setEstablishments(prev =>
                    prev.map(item => item.id === selectedItem.id ? updated : item)
                );
                updateToast('Establishment review saved to database.', 'success');
            }

            closeModal();
        } catch (err) {
            console.error(err);
            updateToast(err.message || 'Could not save registry changes.', 'error');
        }
    };

    const activeEstablishmentsCount = establishments.filter((shop) => {
        const sLower = (shop.halal_status || '').toLowerCase().trim();
        return !(
            sLower === 'rejected' ||
            sLower.includes('reject') ||
            sLower === 'flagged' ||
            sLower === 'suspended' ||
            sLower === 'expired' ||
            sLower === 'needs_review' ||
            sLower === 'pending' ||
            sLower.includes('pending') ||
            sLower.includes('needs_review')
        );
    }).length;

    return (
        <div className="p-3 sm:p-6 md:p-8 space-y-3 sm:space-y-5 w-full min-h-full pb-8">
            {/* Module Title and Actions Header */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 pb-1 border-b border-slate-200/80 shrink-0">
                <div className="min-w-0">
                    <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Store className="text-emerald-600 shrink-0" size={22} />
                        Local Halal Registry
                    </h2>
                    <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5">
                        Verified reference ledgers for food additives, certifying authorities, and Zamboanga establishments.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {registryMode === 'establishments' && (
                        <button
                            type="button"
                            onClick={handleOpenContribution}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-sm font-bold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                        >
                            <Plus size={14} />
                            <span>Submit <span className="hidden sm:inline">Establishment</span></span>
                        </button>
                    )}

                    {isAdmin && registryMode !== 'establishments' && (
                        <button
                            type="button"
                            onClick={() => {
                                if (registryMode === 'additives') openModal('add-additive');
                                else if (registryMode === 'hcb') openModal('add-hcb');
                            }}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                        >
                            <Plus size={14} />
                            <span>{registryMode === 'additives' ? 'Add Additive' : 'Register HCB'}</span>
                        </button>
                    )}

                </div>
            </div>

            {/* Segmented Tab Navigation Control: Guaranteed Single Row on All Devices */}
            <div className="bg-slate-100/90 p-1 rounded-xl sm:rounded-2xl border border-slate-200/90 grid grid-cols-3 gap-1 shrink-0">
                <button
                    type="button"
                    onClick={() => setRegistryMode('additives')}
                    className={`py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 truncate ${
                        registryMode === 'additives'
                            ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <ShieldCheck size={14} className={`shrink-0 ${registryMode === 'additives' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="truncate"><span className="hidden sm:inline">Food </span>Additives</span>
                    <span className={`text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 rounded-full shrink-0 ${
                        registryMode === 'additives' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                        {additives.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setRegistryMode('hcb')}
                    className={`py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 truncate ${
                        registryMode === 'hcb'
                            ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Award size={14} className={`shrink-0 ${registryMode === 'hcb' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="truncate"><span className="hidden sm:inline">Certifiers (</span>HCB<span className="hidden sm:inline">)</span></span>
                    <span className={`text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 rounded-full shrink-0 ${
                        registryMode === 'hcb' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                        {hcbs.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setRegistryMode('establishments')}
                    className={`py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs md:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 truncate ${
                        registryMode === 'establishments'
                            ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <MapPin size={14} className={`shrink-0 ${registryMode === 'establishments' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="truncate"><span className="hidden sm:inline">Regulatory </span>Audits (Venues)</span>
                    <span className={`text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 rounded-full shrink-0 ${
                        registryMode === 'establishments' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                        {activeEstablishmentsCount}
                    </span>
                </button>
            </div>



            {loading && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    Loading directory records from Supabase...
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            {/* TAB 1: ADDITIVES LEDGER */}
            {registryMode === 'additives' && (
                <AdditivesRegistryTab
                    additives={additives}
                    dictSearch={dictSearch}
                    setDictSearch={setDictSearch}
                    additiveStatusFilter={additiveStatusFilter}
                    setAdditiveStatusFilter={setAdditiveStatusFilter}
                    additiveOriginFilter={additiveOriginFilter}
                    setAdditiveOriginFilter={setAdditiveOriginFilter}
                    isAdmin={isAdmin}
                    onOpenModal={openModal}
                    onDeleteAdditive={handleDeleteAdditive}
                />
            )}

            {/* TAB 2: ACCREDITED HCB & REGULATORY BODIES */}
            {registryMode === 'hcb' && (
                <HcbsRegistryTab
                    hcbs={hcbs}
                    hcbSearch={hcbSearch}
                    setHcbSearch={setHcbSearch}
                    hcbCategoryFilter={hcbCategoryFilter}
                    setHcbCategoryFilter={setHcbCategoryFilter}
                    isAdmin={isAdmin}
                    onOpenModal={openModal}
                    onDeleteHcb={handleDeleteHcb}
                />
            )}

            {/* TAB 3: ESTABLISHMENTS LEDGER */}
            {registryMode === 'establishments' && (
                <div className="space-y-3 sm:space-y-4 w-full">
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800">Looking for nearby dining on the GPS Map?</h4>
                                <p className="text-[11px] sm:text-xs text-slate-500">This registry records formal regulatory audit documents. For live distances, menus, and directions, open the Establishments Map.</p>
                            </div>
                        </div>
                        {onViewChange && (
                            <button
                                type="button"
                                onClick={() => onViewChange('map')}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition shrink-0 cursor-pointer active:scale-95"
                            >
                                <span>Open Interactive Map</span>
                                <ExternalLink size={13} />
                            </button>
                        )}
                    </div>
                    <EstablishmentsRegistryTab
                    establishments={establishments}
                    localSearch={localSearch}
                    setLocalSearch={setLocalSearch}
                    isAdmin={isAdmin}
                    onOpenModal={openModal}
                    onDeleteEstablishment={handleDeleteEstablishment}
                    onReportEstablishment={handleReportEstablishment}
                    onViewChange={onViewChange}
                />
                </div>
            )}

            {/* UNIFIED RECORD MODAL */}
            <RegistryModals
                activeModal={activeModal}
                modalForm={modalForm}
                setModalForm={setModalForm}
                onClose={closeModal}
                onSubmit={handleModalSubmit}
            />

            {/* Community Contribution Modal */}
            <ContributionModal
                isOpen={showContributionModal}
                onClose={() => setShowContributionModal(false)}
                initialTab="establishment"
                onSubmitted={() => {
                    updateToast('Thank you! Establishment submitted for verification.', 'success');
                }}
            />

            {/* Guest Authentication Prompt Modal */}
            <AuthPromptModal
                isOpen={showAuthPrompt}
                onClose={() => setShowAuthPrompt(false)}
                onNavigate={(v) => onViewChange?.(v)}
                actionTitle="Submit Establishment"
            />

            {/* Context-Aware Report / Flag Modal */}
            <ReportIssueModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                initialData={reportingTarget || {}}
                onSubmitted={() => {
                    updateToast('Report submitted for administrative review.', 'success');
                }}
            />

            {/* Delete Confirmation Modal */}
            <RegistryDeleteModal
                isOpen={Boolean(deleteTarget)}
                item={deleteTarget?.item}
                type={deleteTarget?.type}
                isDeleting={isDeleting}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
            />

            <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ visible: false, message: '', type: 'info' })} />
        </div>
    );
};

export default Registry;
