import { supabase } from './supabaseClient';

export const AUTH_VIEWS = new Set([
    'login',
    'create-account',
    'forgot-password',
    'reset-password',
]);

export async function fetchUserRole(userId) {
    if (!userId) return null;
    const profile = await getUserProfile({ id: userId });
    return profile?.role || null;
}

export async function getUserProfile(user) {
    if (!user) return null;
    const userId = user.id || user;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .eq('id', userId)
            .single();

        if (data && !error) {
            return data;
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
            .select('id, full_name, email, role')
            .single();

        if (!upsertError && newProfile) {
            return newProfile;
        }

        return { id: userId, email: email, full_name: fullName, role: 'user' };
    } catch (err) {
        console.warn('Profile sync fallback:', err);
        return { id: userId, email: user.email || null, full_name: 'User', role: 'user' };
    }
}

export async function ensureUserProfile(user) {
    const profile = await getUserProfile(user);
    return profile?.role || 'user';
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
}

export async function signInWithProvider(provider) {
    const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: getAuthRedirectUrl(),
        },
    });

    if (error) {
        throw error;
    }
}

export function getAuthRedirectUrl() {
    return window.location.origin;
}
