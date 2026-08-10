import { supabase } from './supabaseClient';

export const AUTH_VIEWS = new Set([
    'login',
    'create-account',
    'forgot-password',
    'reset-password',
]);

export async function fetchUserRole(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error) {
        return null;
    }

    return data?.role || 'user';
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
}

export function getAuthRedirectUrl() {
    return window.location.origin;
}
