import { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import PreviewIcon from '@mui/icons-material/Preview';
import { useOpenCV } from '../hooks/useOpenCV';

interface SvgCalculatedDimensions {
  viewBoxMinX: number;
  viewBoxMinY: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  outputWidth: string;
  outputHeight: string;
  isScaledToMm: boolean;
}

const Trace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cv, loaded: opencvLoaded, error: opencvHookError } = useOpenCV();

  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null);
  const [pixelsPerMm, setPixelsPerMm] = useState<number | null>(null);

  const [svgString, setSvgString] = useState<string | null>(null);
  const [svgCalculatedDimensions, setSvgCalculatedDimensions] = useState<SvgCalculatedDimensions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null);
  
  const [canUndo, setCanUndo] = useState(false); 
  const [canRedo, setCanRedo] = useState(false); 

  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageLoadRef = useRef<HTMLImageElement | null>(null); 

  useEffect(() => {
    // Retrieve data from location state
    if (location.state) {
      const { processedImageSrc: newSrc, pixelsPerMm: newPpm } = location.state as { processedImageSrc?: string; pixelsPerMm?: number };
      if (newSrc) {
        setProcessedImageSrc(newSrc);
      } else {
        setError("Critical: Processed image source not found in location state. Please go back and re-process.");
      }

      if (newPpm !== undefined && newPpm > 0) {
        setPixelsPerMm(newPpm);
      } else {
        if (newPpm !== undefined) { 
            console.warn(`Invalid pixelsPerMm value (${newPpm}) received. Proceeding without scaling to mm.`);
        }
        setPixelsPerMm(null); 
      }
    } else {
      setError("Critical: Location state not found. Please go back to the adjustment page and re-process the image.");
    }
  }, [location.state]);

  useEffect(() => {
    // Main effect for processing the image
    if (!opencvLoaded || !cv) {
      if (opencvHookError && !error) setError(`OpenCV Loading Error: ${opencvHookError.message || String(opencvHookError)}`);
      return;
    }
    if (!processedImageSrc) {
      // This case should ideally be handled by the UI based on processedImageSrc being null
      return; 
    }
    
    // Cleanup previous processing attempts before starting a new one
    if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
    }
    if (imageLoadRef.current) { 
        imageLoadRef.current.onload = null;
        imageLoadRef.current.onerror = null;
        imageLoadRef.current.src = ''; // Stop any previous image loading
    }
    
    const processImage = () => {
        setIsLoading(true);
        setError(null); 
        setSvgString(null);
        setSvgCalculatedDimensions(null);

        const img = new Image();
        imageLoadRef.current = img; // Store current image in ref to manage its lifecycle
        img.crossOrigin = "anonymous"; 
        img.src = processedImageSrc;

        img.onload = () => {
          // Ensure this onload callback is not from a stale image object
          if (img !== imageLoadRef.current) {
            console.log("Stale image onload event ignored.");
            return;
          }

          let srcMat, grayMat, contoursMatVector, hierarchyMat;
          let currentContour, approxContour; // Mats for loop iterations

          try {
            const canvas = canvasRef.current ?? document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get 2D context from canvas");
            
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
            srcMat = cv.imread(canvas);

            grayMat = new cv.Mat();
            // Image from Adjustment.tsx is binary (white trace on black background from THRESH_BINARY_INV).
            // cv.findContours expects white objects (255) on black background (0).
            if (srcMat.channels() === 4) cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
            else if (srcMat.channels() === 3) cv.cvtColor(srcMat, grayMat, cv.COLOR_RGB2GRAY);
            else if (srcMat.channels() === 1) grayMat = srcMat.clone(); // Already grayscale
            else throw new Error(`Unexpected number of image channels: ${srcMat.channels()}`);
            
            contoursMatVector = new cv.MatVector();
            hierarchyMat = new cv.Mat();
            // cv.RETR_EXTERNAL: retrieves only the extreme outer contours.
            // cv.CHAIN_APPROX_SIMPLE: compresses horizontal, vertical, and diagonal segments and leaves only their end points.
            cv.findContours(grayMat, contoursMatVector, hierarchyMat, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            const svgPaths: string[] = [];
            let tempMinX = Infinity, tempMinY = Infinity, tempMaxX = -Infinity, tempMaxY = -Infinity;
            const useScalingToMm = pixelsPerMm !== null && pixelsPerMm > 0;

            for (let i = 0; i < contoursMatVector.size(); ++i) {
              currentContour = contoursMatVector.get(i); // Get individual contour Mat from MatVector
              approxContour = new cv.Mat(); // Mat for simplified contour
              
              try {
                const peri = cv.arcLength(currentContour, true); // true for closed contour
                const epsilonFactor = 0.002; // Simplification factor (0.2% of perimeter)
                const epsilon = epsilonFactor * peri;
                cv.approxPolyDP(currentContour, approxContour, epsilon, true);

                if (approxContour.rows > 1) { // Need at least 2 points for a line
                  let pathData = "M"; // Start of SVG path data
                  for (let j = 0; j < approxContour.rows; ++j) {
                    // Accessing contour points: data32S for integer coordinates from CHAIN_APPROX_SIMPLE
                    let x = approxContour.data32S[j * 2];     // X coordinate
                    let y = approxContour.data32S[j * 2 + 1]; // Y coordinate

                    if (useScalingToMm) {
                      x /= pixelsPerMm!; // Safe due to useScalingToMm check
                      y /= pixelsPerMm!;
                    }

                    // Update min/max coordinates for viewBox calculation
                    tempMinX = Math.min(tempMinX, x);
                    tempMinY = Math.min(tempMinY, y);
                    tempMaxX = Math.max(tempMaxX, x);
                    tempMaxY = Math.max(tempMaxY, y);

                    // Append point to path string (L for subsequent points)
                    pathData += `${j === 0 ? '' : ' L'} ${x.toFixed(3)} ${y.toFixed(3)}`;
                  }
                  // Add linecap and linejoin for smoother lines
                  svgPaths.push(`<path d="${pathData.trim()}" stroke-linecap="round" stroke-linejoin="round" />`);
                }
              } finally {
                approxContour?.delete(); approxContour = undefined;
                currentContour?.delete(); currentContour = undefined; // Delete the Mat obtained from .get()
              }
            }
            
            let vbMinX = 0, vbMinY = 0, vbWidth = 0, vbHeight = 0;
            let outWidthStr = "", outHeightStr = "";
            const padding = useScalingToMm ? 5 : (img.naturalWidth > 200 ? 20 : 10); // 5mm or 20/10px padding

            if (svgPaths.length > 0 && isFinite(tempMaxX) && isFinite(tempMaxY)) {
              vbMinX = tempMinX - padding;
              vbMinY = tempMinY - padding;
              vbWidth = (tempMaxX - tempMinX) + 2 * padding;
              vbHeight = (tempMaxY - tempMinY) + 2 * padding;
            } else { // Fallback if no contours
              vbWidth = useScalingToMm ? img.naturalWidth / pixelsPerMm! : img.naturalWidth;
              vbHeight = useScalingToMm ? img.naturalHeight / pixelsPerMm! : img.naturalHeight;
            }
            
            // Ensure positive dimensions
            if (vbWidth <= 0) vbWidth = useScalingToMm ? 100 : (img.naturalWidth > 0 ? img.naturalWidth : 300);
            if (vbHeight <= 0) vbHeight = useScalingToMm ? 100 : (img.naturalHeight > 0 ? img.naturalHeight : 200);

            outWidthStr = useScalingToMm ? `${vbWidth.toFixed(3)}mm` : `${Math.round(vbWidth)}px`;
            outHeightStr = useScalingToMm ? `${vbHeight.toFixed(3)}mm` : `${Math.round(vbHeight)}px`;

            setSvgCalculatedDimensions({
                viewBoxMinX: vbMinX, viewBoxMinY: vbMinY,
                viewBoxWidth: vbWidth, viewBoxHeight: vbHeight,
                outputWidth: outWidthStr, outputHeight: outHeightStr,
                isScaledToMm: useScalingToMm,
            });
            
            const strokeWidth = useScalingToMm ? "0.5" : "1"; // 0.5mm or 1px stroke
            const finalSvg = `<svg width="${outWidthStr}" height="${outHeightStr}" viewBox="${vbMinX.toFixed(3)} ${vbMinY.toFixed(3)} ${vbWidth.toFixed(3)} ${vbHeight.toFixed(3)}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="black" stroke-width="${strokeWidth}">${svgPaths.join('')}</svg>`;
            setSvgString(finalSvg);

          } catch (err: any) {
            console.error("Error during OpenCV processing:", err);
            setError(`Processing error: ${err.message || String(err)}`);
          } finally {
            // Clean up all top-level OpenCV Mats
            srcMat?.delete();
            grayMat?.delete();
            contoursMatVector?.delete(); 
            hierarchyMat?.delete();
            // Loop-scoped Mats (approxContour, currentContour) are deleted in their own finally blocks.
            setIsLoading(false); 
          }
        };

        img.onerror = () => {
          // Ensure this onerror callback is not from a stale image object
          if (img !== imageLoadRef.current) {
            console.log("Stale image onerror event ignored.");
            return;
          }
          setError("Failed to load the processed image for tracing. It might be corrupted or the source URL invalid.");
          setIsLoading(false);
        };
    };
    
    // Using setTimeout to ensure that state updates from parent components or previous effects
    // are flushed, and to avoid potential rapid re-triggering cycles during development or due to fast dependency changes.
    processingTimeoutRef.current = setTimeout(processImage, 100); // Delay processing slightly
    
    return () => { 
        // Cleanup: clear the timeout if the component unmounts or dependencies change before it fires.
        if(processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
        }
        // Cleanup image handlers to prevent them from firing on an unmounted component or old image instance
        if (imageLoadRef.current) { 
            imageLoadRef.current.onload = null;
            imageLoadRef.current.onerror = null;
        }
    };
  // Key dependencies for re-running the processing.
  }, [cv, opencvLoaded, opencvHookError, processedImageSrc, pixelsPerMm]); 

const handleRetryProcessing = () => {
  setError(null); 
  setIsLoading(false); // Reset loading state
  setSvgString(null); // Clear previous SVG string
  setSvgCalculatedDimensions(null); // Clear previous dimensions

  // Force re-trigger of the main useEffect by briefly changing processedImageSrc
  // This simulates a change in dependencies, causing the effect to re-run.
  const currentSrc = processedImageSrc;
  setProcessedImageSrc(null); // Temporarily change a core dependency
  setTimeout(() => {
      setProcessedImageSrc(currentSrc); // Restore it, triggering the effect
  }, 10); // Short delay to ensure React processes the null state first
};

  const handlePreview = () => {
    if (svgString && svgCalculatedDimensions) {
      navigate('/preview', { 
        state: { 
          svgString, 
          finalWidthMm: svgCalculatedDimensions.isScaledToMm ? svgCalculatedDimensions.viewBoxWidth : undefined,
          finalHeightMm: svgCalculatedDimensions.isScaledToMm ? svgCalculatedDimensions.viewBoxHeight : undefined,
        } 
      });
    } else {
      // This should ideally not happen if button is disabled correctly
      setError("SVG data not available for preview. Wait for processing or resolve errors.");
    }
  };
  
  // --- UI Rendering ---

  // Initial OpenCV loading state
  if (!opencvLoaded && !opencvHookError && !error) { 
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <CircularProgress /> <Typography sx={{ mt: 2 }}>Loading OpenCV Libraries...</Typography>
      </Box>
    );
  }

  // Critical errors (OpenCV load failure, missing location state)
  if (error && (error.startsWith("Critical:") || error.startsWith("OpenCV Loading Error:"))) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', p:3, textAlign: 'center' }}>
        <Typography color="error" variant="h5">Initialization Error</Typography>
        <Typography color="error" sx={{my: 2}}>{error}</Typography>
        {error.includes("OpenCV") && <Button onClick={() => window.location.reload()} variant="outlined">Reload Page</Button>}
        {error.includes("Location state") && <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/adjust')} variant="outlined">Back to Adjust Page</Button>}
      </Box>
    );
  }
  
  // If processedImageSrc is missing (and not caught by "Critical" error, though it should be)
  if (!processedImageSrc && !isLoading && !error) {
     return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', p:3, textAlign: 'center' }}>
        <Typography variant="h6">Image Data Not Available</Typography>
        <Typography>Please go back to the adjustment page and process an image first.</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/adjust')} sx={{mt: 2}} variant="contained">Back to Adjust Page</Button>
      </Box>
    );
  }

  // Main component UI
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} /> {/* Hidden canvas for cv.imread */}
      
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white', boxShadow: 1, flexShrink: 0 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/adjust')}>Back</Button>
        <Typography variant="h6" sx={{ flex: 1 }}>Trace to SVG</Typography>
        <Tooltip title="Undo (Not Implemented)"><span><IconButton disabled={!canUndo}><UndoIcon /></IconButton></span></Tooltip>
        <Tooltip title="Redo (Not Implemented)"><span><IconButton disabled={!canRedo}><RedoIcon /></IconButton></span></Tooltip>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, p: 2, overflow: 'hidden' }}>
        {/* SVG Display Area */}
        <Paper
          elevation={3}
          sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'white', position: 'relative', overflow: 'auto', minHeight: 300 }}
        >
          {isLoading && (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 1 }}>Processing Image into SVG...</Typography>
              <Typography variant="caption" sx={{display:'block', mt:0.5}}>(This may take a moment for complex images)</Typography>
            </Box>
          )}
          {/* Processing Error Display */}
          {error && !isLoading && ( // Error occurred during processing, not an init error
            <Box sx={{ textAlign: 'center', p:2, color: 'error.main' }}>
              <Typography variant="h6">Processing Failed</Typography>
              <Typography sx={{my:1, fontSize:'0.9rem'}}>{error}</Typography>
               <Button onClick={handleRetryProcessing} variant="outlined" color="error">Retry Processing</Button>
            </Box>
          )}
          {/* SVG Display */}
          {!isLoading && !error && svgString && (
            <Box 
              dangerouslySetInnerHTML={{ __html: svgString }} 
              sx={{ 
                width: '100%', height: '100%',
                '& svg': { 
                  width: '100%', height: '100%', 
                  objectFit: 'contain', // Scale down to fit, maintains aspect ratio
                  display: 'block', margin: 'auto',
                  border: '1px solid #ddd', // Visual aid for SVG boundary
                  // Checkerboard background for transparency visualization
                  background: `
                    linear-gradient(45deg, #eee 25%, transparent 25%), 
                    linear-gradient(-45deg, #eee 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #eee 75%),
                    linear-gradient(-45deg, transparent 75%, #eee 75%)`,
                  backgroundSize: '20px 20px',
                  backgroundColor: 'white' // Fallback background
                } 
              }}
            />
          )}
          {/* Fallback messages if no SVG and not loading/error */}
          {!isLoading && !error && !svgString && processedImageSrc && ( // Waiting for processing to start
            <Typography color="text.secondary">Ready to process. If processing doesn't start, check console for errors.</Typography>
          )}
        </Paper>

        {/* Controls and Info Panel */}
        <Paper elevation={3} sx={{ width: 300, p: 2, display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          <Typography variant="h6">Controls & Info</Typography>
          <Button variant="outlined" startIcon={<AutoFixHighIcon />} fullWidth disabled title="Future: Manual line adjustments or re-triggering">
            Adjust Lines (N/A)
          </Button>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', border: '1px solid #e0e0e0', p:1.5, borderRadius:1, background: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom>SVG Output Details</Typography>
            {pixelsPerMm ? (
              <Typography variant="body2" sx={{mb:0.5}}>Input Scale: {pixelsPerMm.toFixed(2)} px/mm</Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{mb:0.5}}>Scale: Using pixel coordinates (pixelsPerMm not set).</Typography>
            )}
            {svgCalculatedDimensions ? (
              <>
                <Typography variant="caption" display="block">ViewBox:</Typography>
                <Typography variant="body2" sx={{ml:1}}>X: {svgCalculatedDimensions.viewBoxMinX.toFixed(2)}</Typography>
                <Typography variant="body2" sx={{ml:1}}>Y: {svgCalculatedDimensions.viewBoxMinY.toFixed(2)}</Typography>
                <Typography variant="body2" sx={{ml:1}}>W: {svgCalculatedDimensions.viewBoxWidth.toFixed(2)}</Typography>
                <Typography variant="body2" sx={{ml:1}}>H: {svgCalculatedDimensions.viewBoxHeight.toFixed(2)}</Typography>
                <Typography variant="caption" display="block" sx={{mt:0.5}}>Output Size:</Typography>
                <Typography variant="body2" sx={{ml:1}}>W: {svgCalculatedDimensions.outputWidth}</Typography>
                <Typography variant="body2" sx={{ml:1}}>H: {svgCalculatedDimensions.outputHeight}</Typography>
              </>
            ) : ( !isLoading && <Typography variant="caption">SVG data not yet generated.</Typography> )}
             {isLoading && <Typography variant="caption">Calculating dimensions...</Typography>}
          </Box>
          <Button
            variant="contained" startIcon={<PreviewIcon />} fullWidth
            onClick={handlePreview}
            disabled={!svgString || isLoading || !!error} // Disable if no SVG, loading, or error exists
          >
            Preview Vector
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Trace;
