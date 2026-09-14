/**
 * Standardized API client wrapper for FastAPI backend communication.
 * Handles multipart form uploads, JSON payloads, progress callbacks, and blob downloads.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://krishna-pdf-backend.onrender.com/api';;

export const apiClient = {
  /**
   * Performs a POST request with multipart/form-data for PDF processing tools.
   * @param {string} endpoint - API endpoint path (e.g., '/merge', '/split', '/ai/summarize')
   * @param {FormData} formData - FormData object containing files and parameters
   * @param {Function} [onProgress] - Optional upload progress callback (0 - 100)
   * @returns {Promise<Blob>} - Returns response blob for file downloads or JSON text
   */
  async postFormData(endpoint, formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      xhr.open('POST', `${API_BASE_URL}${cleanEndpoint}`, true);
      xhr.responseType = 'blob';

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded * 100) / event.total);
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          try {
            const text = await new Response(xhr.response).text();
            let errorMessage = `Request failed with status ${xhr.status}`;
            try {
              const errorJson = JSON.parse(text);
              if (errorJson.detail) {
                errorMessage = errorJson.detail;
              }
            } catch (parseErr) {
              if (text) errorMessage = text;
            }
            reject(new Error(errorMessage));
          } catch (e) {
            reject(new Error(`Request failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred. Please check your connection and ensure the Python backend is running.'));
      };

      xhr.send(formData);
    });
  },

  /**
   * Performs a standard JSON POST request.
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Payload data object
   * @returns {Promise<Object>} - Parsed JSON response
   */
  async postJson(endpoint, data) {
    try {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error.message || 'Failed to connect to backend server.');
    }
  },

  /**
   * Utility to trigger browser file download from a response Blob.
   * @param {Blob} blob - File blob data
   * @param {string} filename - Desired output filename
   */
  downloadBlob(blob, filename = 'processed_document.pdf') {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
