import { useState } from "react";

interface AutocompleteProps {
    value: string;
    onChange: (val: string) => void;
    suggestions: string[];
    placeholder: string;
    className?: string;
    id?: string;
}

export default function Autocomplete({
    value,
    onChange,
    suggestions,
    placeholder,
    className = "",
    id,
}: AutocompleteProps) {
    const [open, setOpen] = useState(false);
    const filtered = suggestions.filter(
        (s) => s.toLowerCase().includes(value.toLowerCase()) && s !== value
    );

    return (
        <div className={`relative ${className}`}>
            <input
                id={id}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 200)}
                placeholder={placeholder}
                className="w-full h-10 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-900 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            {open && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg no-scrollbar">
                    {filtered.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onMouseDown={() => {
                                onChange(s);
                                setOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
