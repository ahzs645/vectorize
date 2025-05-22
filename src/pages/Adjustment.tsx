import { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Slider, Switch, FormControlLabel, Paper } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useOpenCV } from '../hooks/useOpenCV'; // Adjust path as needed

const KNOWN_MARKER_PHYSICAL_SIZE_MM = 50; // Example size, adjust as needed

const Adjustment = () => {
  const { cv, isLoading: cvLoading, error: cvError } = useOpenCV();
  const navigate = useNavigate();
  const location = useLocation();
  const { imageSrc, markers: detectedMarkers } = location.state || { imageSrc: null, markers: null }; // Renamed for clarity

  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const correctedImageMatRef = useRef<any>(null); // To store cv.Mat of corrected image
  const binaryImageMatRef = useRef<any>(null); // To store cv.Mat of thresholded image
  const paperBoundaryPointsRef = useRef<any[] | null>(null);
  const pixelsPerMmRef = useRef<number | null>(null);

  const [threshold, setThreshold] = useState(128);
  const [perspectiveCorrection, setPerspectiveCorrection] = useState(true);
  const [displayProcessedImage, setDisplayProcessedImage] = useState(true); // Controls canvas content

  useEffect(() => {
    // Cleanup image mats when component unmounts or imageSrc changes
    return () => {
      if (correctedImageMatRef.current) {
        correctedImageMatRef.current.delete();
        correctedImageMatRef.current = null;
      }
      if (binaryImageMatRef.current) {
        binaryImageMatRef.current.delete();
        binaryImageMatRef.current = null;
      }
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!cv || !imageSrc || !imageCanvasRef.current) {
      if (cvError) console.error("OpenCV Error in Adjustment:", cvError);
      if (!imageSrc) console.warn("No imageSrc provided to Adjustment page.");
      return;
    }

    const canvas = imageCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Draw original image first to get its dimensions for canvas
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      let originalMat = cv.imread(canvas); // For processing
      let displayMat = originalMat.clone(); // Mat for perspective correction or initial display
      let processedForDisplayMat = null; // This will hold the mat that's finally displayed (binary)

      paperBoundaryPointsRef.current = null; // Reset boundary points

      if (detectedMarkers && detectedMarkers.ids && detectedMarkers.ids.length > 0) {
        // Draw markers on the displayMat if not doing perspective correction or as a fallback
        let markerCornersVec = new cv.MatVector();
        let markerIdsMat = cv.matFromArray(detectedMarkers.ids.length, 1, cv.CV_32SC1, detectedMarkers.ids.flat());
        detectedMarkers.corners.forEach((cornerSet: any[]) => {
          const points = cornerSet.flatMap(p => [p.x, p.y]);
          let cornerMat = cv.matFromArray(1, 4, cv.CV_32FC2, points);
          markerCornersVec.push_back(cornerMat);
          cornerMat.delete();
        });

        try {
          cv.aruco.drawDetectedMarkers(displayMat, markerCornersVec, markerIdsMat);
        } catch(e) {
          console.error("Error drawing markers on initial displayMat:", e);
        }
        markerCornersVec.delete();
        markerIdsMat.delete();

        // --- Paper Boundary Determination ---
        const allCorners = detectedMarkers.corners.flat(); // Array of {x,y} points
        if (allCorners.length >= 4) { // Need at least 4 points for a quadrilateral
            let topLeft = allCorners.reduce((prev, curr) => (curr.x + curr.y) < (prev.x + prev.y) ? curr : prev);
            let bottomRight = allCorners.reduce((prev, curr) => (curr.x + curr.y) > (prev.x + prev.y) ? curr : prev);
            let topRight = allCorners.reduce((prev, curr) => (curr.y - curr.x) < (prev.y - prev.x) ? curr : prev); // min diff y-x
            let bottomLeft = allCorners.reduce((prev, curr) => (curr.y - curr.x) > (prev.y - prev.x) ? curr : prev); // max diff y-x
            
            paperBoundaryPointsRef.current = [topLeft, topRight, bottomRight, bottomLeft];
            console.log("Calculated paper boundary points:", paperBoundaryPointsRef.current);
        } else {
            console.warn("Not enough marker corners to determine paper boundary reliably.");
        }
      }

      if (perspectiveCorrection && paperBoundaryPointsRef.current && paperBoundaryPointsRef.current.length === 4) {
        if (correctedImageMatRef.current) { // Delete previous corrected mat if any
            correctedImageMatRef.current.delete();
            correctedImageMatRef.current = null;
        }
        
        const outputWidth = 600; // Desired output width
        const outputHeight = Math.floor(outputWidth * (img.height / img.width)); // Maintain aspect ratio, or use fixed e.g. 800
        
        const srcPts = paperBoundaryPointsRef.current.flatMap(p => [p.x, p.y]);
        let sourcePointsMat = cv.matFromArray(4, 1, cv.CV_32FC2, srcPts);
        
        const destPts = [0, 0, outputWidth - 1, 0, outputWidth - 1, outputHeight - 1, 0, outputHeight - 1];
        let destPointsMat = cv.matFromArray(4, 1, cv.CV_32FC2, destPts);
        
        let transformMatrix = new cv.Mat();
        try {
            transformMatrix = cv.getPerspectiveTransform(sourcePointsMat, destPointsMat);
            let tempCorrectedMat = new cv.Mat();
            cv.warpPerspective(originalMat, tempCorrectedMat, transformMatrix, new cv.Size(outputWidth, outputHeight), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
            
            if (correctedImageMatRef.current) correctedImageMatRef.current.delete();
            correctedImageMatRef.current = tempCorrectedMat.clone(); // Store the new corrected mat
            tempCorrectedMat.delete();

            displayMat.delete(); // Delete the cloned original with markers
            displayMat = correctedImageMatRef.current.clone(); // Use the corrected one for further processing
            
            // --- Calculate pixelsPerMm ---
            if (detectedMarkers && detectedMarkers.corners && detectedMarkers.corners.length > 0 && detectedMarkers.corners[0].length === 4) {
              const firstMarkerOriginalCorners = detectedMarkers.corners[0].flatMap((p: {x: number, y: number}) => [p.x, p.y]);
              let firstMarkerOriginalMat = cv.matFromArray(4, 1, cv.CV_32FC2, firstMarkerOriginalCorners);
              let transformedMarkerCornersMat = new cv.Mat();
              
              try {
                cv.perspectiveTransform(firstMarkerOriginalMat, transformedMarkerCornersMat, transformMatrix);
                
                const pt0 = { x: transformedMarkerCornersMat.data32F[0], y: transformedMarkerCornersMat.data32F[1] };
                const pt1 = { x: transformedMarkerCornersMat.data32F[2], y: transformedMarkerCornersMat.data32F[3] };
                // Using only top-left and top-right for width. Could also average with bottom side.
                const markerPixelWidth = Math.sqrt(Math.pow(pt1.x - pt0.x, 2) + Math.pow(pt1.y - pt0.y, 2));
                
                if (markerPixelWidth > 0) {
                  pixelsPerMmRef.current = markerPixelWidth / KNOWN_MARKER_PHYSICAL_SIZE_MM;
                  console.log('Calculated pixelsPerMm:', pixelsPerMmRef.current, 'from markerPixelWidth:', markerPixelWidth);
                } else {
                  pixelsPerMmRef.current = null;
                  console.warn('Marker pixel width is zero, cannot calculate pixelsPerMm.');
                }
              } catch(err) {
                console.error("Error transforming marker corners or calculating pixelsPerMm:", err);
                pixelsPerMmRef.current = null;
              } finally {
                firstMarkerOriginalMat.delete();
                transformedMarkerCornersMat.delete();
              }
            } else {
              pixelsPerMmRef.current = null;
              console.warn('Not enough marker data to calculate pixelsPerMm after perspective correction.');
            }

        } catch (e) {
            console.error("Error during perspective transformation:", e);
            pixelsPerMmRef.current = null; // Reset if perspective transform failed
            // Fallback to displayMat (original with markers) if error
        } finally {
            sourcePointsMat.delete();
            destPointsMat.delete();
            if(transformMatrix && !transformMatrix.empty()) transformMatrix.delete(); // Ensure transformMatrix is deleted only if valid
        }
      } else {
         pixelsPerMmRef.current = null; // No perspective correction, so no pixelsPerMm from it
      }
      
      // --- Grayscale and Thresholding ---
      let grayMat = new cv.Mat();
      try {
        // Ensure displayMat is RGBA before converting, if it came directly from a canvas.
        // If displayMat is from correctedImageMatRef, it might be 3-channel (BGR or RGB).
        // cv.imread reads as BGR by default. warpPerspective preserves channels.
        // Let's assume displayMat is 3 or 4 channel and cvtColor handles it.
        if (displayMat.channels() === 4) {
            cv.cvtColor(displayMat, grayMat, cv.COLOR_RGBA2GRAY);
        } else if (displayMat.channels() === 3) {
            cv.cvtColor(displayMat, grayMat, cv.COLOR_RGB2GRAY); // Or BGR2GRAY if imread was used without RGBA conversion
        } else { // Already grayscale or unexpected
            grayMat = displayMat.clone();
        }

        if (binaryImageMatRef.current) {
            binaryImageMatRef.current.delete();
            binaryImageMatRef.current = null;
        }
        binaryImageMatRef.current = new cv.Mat();
        cv.threshold(grayMat, binaryImageMatRef.current, threshold, 255, cv.THRESH_BINARY_INV);
        
        processedForDisplayMat = binaryImageMatRef.current;
        canvas.width = processedForDisplayMat.cols; // Update canvas size for binary image
        canvas.height = processedForDisplayMat.rows;

      } catch (e) {
        console.error("Error during grayscale/thresholding:", e);
        // Fallback to displayMat (color, possibly corrected) if error
        processedForDisplayMat = displayMat.clone(); // Use a clone as displayMat will be deleted
        canvas.width = processedForDisplayMat.cols;
        canvas.height = processedForDisplayMat.rows;
      } finally {
        grayMat.delete();
      }
      
      // --- Display final processed image ---
      try {
        cv.imshow(canvas, processedForDisplayMat);
      } catch(e) {
        console.error("Error with final cv.imshow:", e);
        ctx.clearRect(0,0, canvas.width, canvas.height);
        // Fallback to drawing original image if all else fails
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
      }

      originalMat.delete();
      displayMat.delete(); // This was the input to grayscale/threshold, or the perspective corrected mat.
      if (processedForDisplayMat !== binaryImageMatRef.current) { // If fallback occurred & clone was made
        processedForDisplayMat.delete();
      }
    };
    img.onerror = () => {
      console.error("Failed to load image in Adjustment page.");
    };
    img.src = imageSrc;

  }, [cv, imageSrc, detectedMarkers, cvError, perspectiveCorrection, displayProcessedImage, threshold]);


  const handleThresholdChange = (_event: Event, newValue: number | number[]) => {
    setThreshold(newValue as number);
  };
  
  const handlePerspectiveCorrectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPerspectiveCorrection(event.target.checked);
  };

  const handleUseThisImage = () => {
    let dataUrl = null;
    if (binaryImageMatRef.current && !binaryImageMatRef.current.empty()) {
        const tempCanvas = document.createElement('canvas');
        cv.imshow(tempCanvas, binaryImageMatRef.current);
        dataUrl = tempCanvas.toDataURL('image/jpeg'); // Or 'image/png' for lossless
        console.log("Using binary processed image for trace.");
    } else {
        console.error("Binary image not available to proceed to trace.");
        // Optionally, show an error to the user or fallback to imageCanvasRef.current if that's desired
        // For this task, we strictly want to pass the binary image.
        return;
    }

    if (dataUrl) {
        navigate('/trace', { state: { processedImageSrc: dataUrl, pixelsPerMm: pixelsPerMmRef.current } });
    } else {
        console.error("Binary image not available to proceed to trace. PixelsPerMm not passed.");
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white', boxShadow: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(location.state?.fromCapture ? '/capture' : '/')}
        >
          Back
        </Button>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Adjust Image {cvLoading && '(OpenCV Loading...)'} {cvError && '(Error!)'}
        </Typography>
      </Box>

      {/* Image Preview Area */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, overflow: 'hidden', bgcolor: 'grey.200' }}>
        {/* Combined Image Canvas */}
        <Paper
          elevation={3}
          sx={{
            maxWidth: '100%', 
            maxHeight: '100%',
            display: 'flex', // Ensure canvas is centered if smaller than paper
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'white', // Canvas background if image is transparent or smaller
            overflow: 'hidden', // Hide parts of canvas if it's larger than paper due to fixed aspect ratio
          }}
        >
          {imageSrc ? (
            <canvas ref={imageCanvasRef} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <Typography color="text.secondary" sx={{ p: 2 }}>No image captured or available.</Typography>
          )}
        </Paper>
      </Box>

      {/* Controls */}
      <Box sx={{ p: 2, bgcolor: 'white', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Threshold</Typography>
          <Slider
            value={threshold}
            onChange={handleThresholdChange}
            min={0}
            max={255}
            step={1} // Ensure integer values for threshold
            valueLabelDisplay="auto"
            disabled={cvLoading || !imageSrc || cvError}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={perspectiveCorrection}
                onChange={handlePerspectiveCorrectionChange}
                disabled={cvLoading || !imageSrc || !detectedMarkers || !detectedMarkers.corners || detectedMarkers.corners.flat().length < 4 || cvError}
              />
            }
            label="Correct Perspective"
          />
           <Button
            variant="contained"
            onClick={handleUseThisImage}
            endIcon={<ArrowForwardIcon />}
            disabled={cvLoading || !imageSrc || cvError || !binaryImageMatRef.current || (binaryImageMatRef.current && binaryImageMatRef.current.empty && binaryImageMatRef.current.empty())}
          >
            Use This Image
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Adjustment; 