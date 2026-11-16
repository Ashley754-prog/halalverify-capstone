import { supabase } from './supabaseClient';

export const AUTH_VIEWS = new Set([
    'login',
    'create-account',
    'forgot-password',
    'reset-password',
]);

export async function fetchUserRole(userOrId) {
    if (!userOrId) return null;
    const userObj = typeof userOrId === 'object' ? userOrId : { id: userOrId };
    return await ensureUserProfile(userObj);
}

export async function ensureUserProfile(user) {
    if (!user) return null;
    const userId = typeof user === 'object' ? user.id : user;
    if (!userId) return null;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.warn('Profile role lookup failed:', error.message);
            return null;
        }

        if (data?.role) {
            return data.role;
        }

        // Auto-provision profile record for first-time OAuth or new sign-up users
        const email = (typeof user === 'object' ? user.email : null) || null;
        const fullName =
            (typeof user === 'object' ? (user.user_metadata?.full_name || user.user_metadata?.name) : null) ||
            (email ? email.split('@')[0] : 'Community User');

        const { data: newProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                full_name: fullName,
                role: 'user',
            }, { onConflict: 'id', ignoreDuplicates: true })
            .select('role')
            .maybeSingle();

        if (upsertError) {
            console.warn('Profile provisioning failed:', upsertError.message);
            return null;
        }

        if (newProfile?.role) {
            return newProfile.role;
        }

        const { data: fallbackProfile, error: fallbackError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle();

        if (fallbackError || !fallbackProfile?.role) {
            return null;
        }

        return fallbackProfile.role;
    } catch (err) {
        console.warn('Profile sync failed:', err);
        return null;
    }
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
}

export async function signInWithProvider(provider) {
    const options = {
        redirectTo: getAuthRedirectUrl(),
    };

    if (provider === 'google') {
        options.queryParams = {
            prompt: 'select_account',
            access_type: 'offline',
        };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
    });

    if (error) {
        throw error;
    }

    if (data?.url && typeof window !== 'undefined' && window.location.href !== data.url) {
        window.location.assign(data.url);
    }

    return data;
}

export function getAuthRedirectUrl(path = '') {
    if (typeof window === 'undefined') return '';
    if (!path) return window.location.origin;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${window.location.origin}${normalizedPath}`;
}
