// src/hooks/useOpenCV.ts
import { useState, useEffect } from 'react';
import { loadOpenCV } from '../utils/opencvUtils';

interface UseOpenCVState {
  cv: any | null;
  isLoading: boolean;
  error: Error | null;
}

export const useOpenCV = (): UseOpenCVState => {
  const [cvState, setCvState] = useState<UseOpenCVState>({
    cv: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    loadOpenCV()
      .then((cvInstance) => {
        if (isMounted) {
          setCvState({ cv: cvInstance, isLoading: false, error: null });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setCvState({ cv: null, isLoading: false, error: err });
        }
      });

    return () => {
      isMounted = false; // Cleanup function to set the flag to false when component unmounts
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  return cvState;
};
