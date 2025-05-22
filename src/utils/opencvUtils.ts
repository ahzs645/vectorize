// src/utils/opencvUtils.ts

let isCvReady = false;
let cvPromise: Promise<any> | null = null;

/**
 * Loads the OpenCV.js script and resolves when cv is ready.
 * Ensures that OpenCV is only initialized once.
 */
export const loadOpenCV = (): Promise<any> => {
  if (isCvReady && (window as any).cv) {
    return Promise.resolve((window as any).cv);
  }

  if (cvPromise) {
    return cvPromise;
  }

  cvPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.x/opencv.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const checkCvReady = () => {
        if ((window as any).cv && (window as any).cv.Mat) {
          isCvReady = true;
          resolve((window as any).cv);
        } else {
          setTimeout(checkCvReady, 50); // Check again shortly
        }
      };
      checkCvReady();
    };

    script.onerror = (err) => {
      cvPromise = null; // Allow retrying if there was an error
      reject(new Error(`Failed to load opencv.js: ${err}`));
    };

    document.body.appendChild(script);
  });

  return cvPromise;
};
