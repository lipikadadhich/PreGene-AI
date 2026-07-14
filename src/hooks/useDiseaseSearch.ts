import { useEffect, useRef, useState } from "react";
import {
  searchDisease,
  getDiseaseDetail,
} from "@/services/api";

export interface DiseaseSearchResult {
  Disease: string;
  Gene: string;
  Gene_Name?: string;
  Inheritance_Type?: string;
  Age_Of_Onset?: string;
  [key: string]: unknown;
}

export function useDiseaseSearch(
  minLength = 2,
  debounceMs = 300
) {
  const [query, setQuery] = useState("");

  const [results, setResults] = useState<DiseaseSearchResult[]>([]);

  const [loading, setLoading] = useState(false);

  const [selectedDisease, setSelectedDisease] =
    useState<any>(null);

  const timeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.trim().length < minLength) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const data = await searchDisease(query);

        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, minLength, debounceMs]);

  async function selectDisease(
    disease: DiseaseSearchResult
  ) {
    try {
      setLoading(true);

      const detail = await getDiseaseDetail(
        disease.Disease
      );

      setSelectedDisease(detail);

      setQuery(disease.Disease);

      setResults([]);
    } catch (error) {
      console.error(error);

      setSelectedDisease(disease);
    } finally {
      setLoading(false);
    }
  }

  function clearSelection() {
    setSelectedDisease(null);

    setQuery("");

    setResults([]);
  }

  return {
    query,
    setQuery,
    results,
    loading,
    selectedDisease,
    selectDisease,
    clearSelection,
  };
}