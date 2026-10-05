import { supabase } from './supabaseClient';

export const AUTH_VIEWS = new Set([
    'login',
    'create-account',
    'forgot-password',
    'reset-password',
]);

export async function fetchUserRole(userId) {
    if (!userId) return null;
    return await ensureUserProfile({ id: userId });
}

export async function ensureUserProfile(user) {
    if (!user) return null;
    const userId = user.id || user;

    try {
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (data?.role) {
            return data.role;
        }

        // Auto-provision profile record for first-time Google / Facebook OAuth sign-in
        const email = user.email || null;
        const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            (email ? email.split('@')[0] : 'Community User');

        const { data: newProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                full_name: fullName,
                role: 'user',
            }, { onConflict: 'id' })
            .select('role')
            .single();

        if (!upsertError && newProfile?.role) {
            return newProfile.role;
        }

        return 'user';
    } catch (err) {
        console.warn('Profile sync fallback:', err);
        return 'user';
    }
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
}

export async function signInWithProvider(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: getAuthRedirectUrl(),
        },
    });

    if (error) {
        throw error;
    }

    if (data?.url && typeof window !== 'undefined' && window.location.href !== data.url) {
        window.location.assign(data.url);
    }

    return data;
}

export function getAuthRedirectUrl() {
    return window.location.origin;
}
