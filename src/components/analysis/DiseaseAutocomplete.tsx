import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchDisease } from "@/services/api";

interface DiseaseAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface DiseaseSearchRecord {
  Disease: string;
  [key: string]: unknown;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export default function DiseaseAutocomplete({
  value,
  onChange,
  placeholder = "e.g. Cystic Fibrosis",
}: DiseaseAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local input text in sync if the parent resets formData (e.g. resetForm()).
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setInputValue(next);
    onChange(next);
    setError(false);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (next.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results: DiseaseSearchRecord[] = await searchDisease(next.trim());
        const names = Array.from(
          new Set(
            results
              .map((r) => r.Disease)
              .filter((name): name is string => Boolean(name))
          )
        );
        setSuggestions(names);
        setIsOpen(names.length > 0);
      } catch (err) {
        console.error(err);
        setError(true);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  function handleSelect(name: string) {
    setInputValue(name);
    onChange(name);
    setIsOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
          {suggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => handleSelect(name)}
                className="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-600">
          Couldn't reach the disease database. You can still type a name manually.
        </p>
      )}
    </div>
  );
}