import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker source using CDN matching the version 3.11.174
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * Loads a PDF document from ArrayBuffer bytes with detached ArrayBuffer protection (.slice(0)).
 * @param {ArrayBuffer} arrayBuffer 
 * @returns {Promise<pdfjsLib.PDFDocumentProxy>}
 */
export async function loadPdfDocument(arrayBuffer) {
  try {
    if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) {
      throw new Error("Invalid ArrayBuffer passed to loadPdfDocument");
    }
    
    // CRITICAL: Clone ArrayBuffer via .slice(0) to prevent DataCloneError / detached buffer issues
    const safeBuffer = arrayBuffer.slice(0);
    
    const loadingTask = pdfjsLib.getDocument({ data: safeBuffer });
    const pdfDoc = await loadingTask.promise;
    return pdfDoc;
  } catch (error) {
    console.error("Error loading PDF document with PDF.js:", error);
    throw error;
  }
}

/**
 * Renders a specific page of a PDF document onto an HTML Canvas element.
 * @param {pdfjsLib.PDFDocumentProxy} pdfDoc 
 * @param {number} pageNumber - 1-based page index
 * @param {HTMLCanvasElement} canvasElement 
 * @param {number} scale - Rendering scale factor (default: 1.5)
 * @returns {Promise<{width: number, height: number}>}
 */
export async function renderPageToCanvas(pdfDoc, pageNumber, canvasElement, scale = 1.5) {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    const context = canvasElement.getContext('2d');
    canvasElement.height = viewport.height;
    canvasElement.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
    return { width: viewport.width, height: viewport.height };
  } catch (error) {
    console.error(`Error rendering page ${pageNumber} to canvas:`, error);
    throw error;
  }
}

/**
 * Generates a Data URL thumbnail for a specific page of a PDF.
 * @param {pdfjsLib.PDFDocumentProxy} pdfDoc 
 * @param {number} pageNumber - 1-based page index
 * @param {number} scale - Thumbnail scale factor (default: 0.3)
 * @returns {Promise<string>} - Base64 Data URL of the thumbnail image
 */
export async function renderPageThumbnail(pdfDoc, pageNumber, scale = 0.3) {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error(`Error rendering thumbnail for page ${pageNumber}:`, error);
    return '';
  }
}