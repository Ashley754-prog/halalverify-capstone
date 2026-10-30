import { Search, X } from 'lucide-react';

export default function SearchBar({
    value = '',
    onChange,
    onClear,
    placeholder = 'Search...',
    className = '',
    inputClassName = '',
    ariaLabel = 'Search',
    size = 'md',
    autoFocus = false,
}) {
    const handleClear = () => {
        if (onClear) {
            onClear();
        } else if (onChange) {
            onChange('');
        }
    };

    const isSmall = size === 'sm';

    return (
        <div className={`relative flex items-center min-w-0 ${className}`}>
            <Search
                size={isSmall ? 13 : 14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none shrink-0"
                aria-hidden="true"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                aria-label={ariaLabel}
                autoFocus={autoFocus}
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                    isSmall
                        ? 'h-8 sm:h-8.5 pl-8 pr-7 text-xs'
                        : 'h-9 sm:h-9.5 pl-8.5 pr-8 text-xs sm:text-sm'
                } ${inputClassName}`}
            />
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                    aria-label="Clear search input"
                    title="Clear search"
                >
                    <X size={isSmall ? 12 : 13} />
                </button>
            )}
        </div>
    );
}
