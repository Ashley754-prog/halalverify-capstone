import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bell,
    CheckCheck,
    Clock,
    CircleAlert,
    Info,
    ShieldCheck,
    Inbox,
    ChevronRight,
    X,
} from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../utils/api';
import { supabase } from '../../lib/supabaseClient';

function formatRelativeTime(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);

        if (diffSeconds < 60) return 'Just now';
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return '';
    }
}

function CategoryIcon({ category }) {
    switch (category) {
        case 'verification':
            return (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} />
                </div>
            );
        case 'submission':
            return (
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                </div>
            );
        case 'report':
            return (
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <CircleAlert size={16} />
                </div>
            );
        default:
            return (
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Info size={16} />
                </div>
            );
    }
}

export default function NotificationBell({ onViewChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const containerRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        let loaded = false;

        // 1. Primary fast path via direct Supabase query (works instantaneously on both local and deployed)
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('recipient_id', session.user.id)
                    .order('created_at', { ascending: false })
                    .limit(25);
                if (!error && Array.isArray(data)) {
                    setNotifications(data);
                    setUnreadCount(data.filter((n) => !n.read_at).length);
                    loaded = true;
                }
            }
        } catch {
            // Fall through to backend API if direct query encounters an issue
        }

        // 2. Fallback to backend API if direct Supabase did not load
        if (!loaded) {
            try {
                const res = await authFetch(`${API_BASE_URL}/api/v1/notifications?limit=25`, {
                    timeout: 8000,
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.data || []);
                    setUnreadCount(data.unread_count || 0);
                }
            } catch {
                // Ignore fallback error
            }
        }
    }, []);

    // Initial fetch on mount, periodic 30s refresh, and instant event-driven refresh
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            if (!document.hidden) {
                fetchNotifications();
            }
        }, 30000);

        let delayedTimer = null;
        const handleImmediateRefresh = () => {
            fetchNotifications();
            if (delayedTimer) clearTimeout(delayedTimer);
            delayedTimer = setTimeout(() => {
                fetchNotifications();
            }, 800);
        };

        window.addEventListener('notifications-updated', handleImmediateRefresh);
        window.addEventListener('verification-queue-changed', handleImmediateRefresh);
        window.addEventListener('focus', fetchNotifications);

        return () => {
            clearInterval(interval);
            if (delayedTimer) clearTimeout(delayedTimer);
            window.removeEventListener('notifications-updated', handleImmediateRefresh);
            window.removeEventListener('verification-queue-changed', handleImmediateRefresh);
            window.removeEventListener('focus', fetchNotifications);
        };
    }, [fetchNotifications]);

    // Realtime notification listener via Supabase
    useEffect(() => {
        let channel = null;

        const setupRealtime = async (userId) => {
            if (channel) {
                supabase.removeChannel(channel);
                channel = null;
            }
            if (!userId) return;

            channel = supabase
                .channel(`notifs:${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `recipient_id=eq.${userId}`,
                    },
                    (payload) => {
                        if (payload.new) {
                            setNotifications((prev) => {
                                const exists = prev.some((p) => p.id === payload.new.id);
                                const next = [payload.new, ...prev.filter((p) => p.id !== payload.new.id)];
                                if (!exists && !payload.new.read_at) {
                                    setUnreadCount((c) => c + 1);
                                }
                                return next;
                            });
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'notifications',
                        filter: `recipient_id=eq.${userId}`,
                    },
                    (payload) => {
                        if (payload.new) {
                            setNotifications((prev) => {
                                const next = prev.map((p) => (p.id === payload.new.id ? payload.new : p));
                                setUnreadCount(next.filter((n) => !n.read_at).length);
                                return next;
                            });
                        }
                    }
                )
                .subscribe();
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) {
                setupRealtime(session.user.id);
            }
        });

        const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user?.id) {
                setupRealtime(session.user.id);
                fetchNotifications();
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        });

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
            authSub?.subscription?.unsubscribe();
        };
    }, [fetchNotifications]);

    // Close dropdown on outside click or Escape key
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleToggle = () => {
        if (!isOpen) {
            setIsLoading(true);
            fetchNotifications().finally(() => setIsLoading(false));
        }
        setIsOpen((prev) => !prev);
    };

    const handleItemClick = async (notif) => {
        const nowIso = new Date().toISOString();

        // Optimistically mark as read in local state
        if (!notif.read_at) {
            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === notif.id
                        ? { ...item, read_at: nowIso }
                        : item
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));

            // Sync with direct Supabase and backend in background
            try {
                supabase
                    .from('notifications')
                    .update({ read_at: nowIso })
                    .eq('id', notif.id)
                    .then(() => {});
                authFetch(`${API_BASE_URL}/api/v1/notifications/${notif.id}/read`, {
                    method: 'PATCH',
                    timeout: 8000,
                }).catch(() => {});
            } catch {
                // Background update failure is non-blocking
            }
        }

        setIsOpen(false);

        // Navigate to relevant view and specific tab if requested
        if (notif.action_view && typeof onViewChange === 'function') {
            const resolvedParams = { ...(notif.action_params || {}) };
            if (!resolvedParams.tab && (notif.action_view === 'verification-queue' || notif.action_view === 'profile')) {
                if (notif.entity_type === 'product') {
                    resolvedParams.tab = 'products';
                } else if (notif.entity_type === 'issue_report') {
                    resolvedParams.tab = 'reports';
                } else if (notif.entity_type === 'establishment') {
                    resolvedParams.tab = 'establishments';
                }
            }
            onViewChange(notif.action_view, resolvedParams);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0 || isMarkingAll) return;
        setIsMarkingAll(true);

        const nowIso = new Date().toISOString();
        setNotifications((prev) =>
            prev.map((item) => (item.read_at ? item : { ...item, read_at: nowIso }))
        );
        setUnreadCount(0);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                await supabase
                    .from('notifications')
                    .update({ read_at: nowIso })
                    .eq('recipient_id', session.user.id)
                    .is('read_at', null);
            }
            authFetch(`${API_BASE_URL}/api/v1/notifications/read-all`, {
                method: 'POST',
                timeout: 8000,
            }).catch(() => {});
        } catch {
            // Silently swallow
        } finally {
            setIsMarkingAll(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Bell Icon Button */}
            <button
                type="button"
                onClick={handleToggle}
                aria-expanded={isOpen}
                aria-label={
                    unreadCount > 0
                        ? `${unreadCount} unread notifications`
                        : 'Notifications inbox'
                }
                title="Notifications"
                className={`relative h-9 w-9 sm:h-10 sm:w-10 rounded-full transition cursor-pointer flex items-center justify-center shrink-0 ${
                    isOpen
                        ? 'bg-slate-800 text-emerald-400 ring-2 ring-emerald-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
            >
                <Bell size={20} />

                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-in zoom-in-50">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Mobile Backdrop Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="fixed inset-x-3 top-16 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 max-w-sm sm:max-w-none mx-auto sm:mx-0 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 text-slate-800">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-bold text-sm text-slate-900 tracking-tight truncate">
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAllAsRead}
                                    disabled={isMarkingAll}
                                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition cursor-pointer disabled:opacity-50"
                                >
                                    <CheckCheck size={14} />
                                    <span>Mark all as read</span>
                                </button>
                            )}

                            {/* Mobile Dismiss Close Button */}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition sm:hidden"
                                aria-label="Close notifications"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="max-h-[calc(100dvh-200px)] sm:max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                        {isLoading && notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                                <p className="text-xs">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-slate-500">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                    <Inbox size={24} />
                                </div>
                                <p className="font-semibold text-sm text-slate-700 mb-1">
                                    No notifications yet
                                </p>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
                                    Updates regarding your submissions and issue reports will appear here.
                                </p>
                            </div>
                        ) : (
                            notifications.map((item) => {
                                const isUnread = !item.read_at;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleItemClick(item)}
                                        className={`flex items-start gap-3 p-3.5 transition cursor-pointer relative hover:bg-slate-50 active:bg-slate-100 ${
                                            isUnread ? 'bg-emerald-50/40' : 'bg-white'
                                        }`}
                                    >
                                        {/* Unread indicator bar */}
                                        {isUnread && (
                                            <span className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full" />
                                        )}

                                        <CategoryIcon category={item.category} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <h4 className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                    {item.title}
                                                </h4>
                                                <span className="text-[10px] text-slate-400 shrink-0">
                                                    {formatRelativeTime(item.created_at)}
                                                </span>
                                            </div>

                                            {item.message && (
                                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                    {item.message}
                                                </p>
                                            )}

                                            {item.action_view && (
                                                <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700">
                                                    <span>View details</span>
                                                    <ChevronRight size={12} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                            <span className="text-[11px] text-slate-400">
                                Status tracking is also available in My Contributions
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
