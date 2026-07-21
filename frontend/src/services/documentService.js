import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

const getEmail = () => localStorage.getItem('email');

export const getHistory = async () => {
  const email = getEmail();
  const response = await axios.get(`${API_BASE}/tools/history/${email}`);
  return response.data;
};

export const deleteHistory = async (id) => {
  const response = await axios.delete(`${API_BASE}/tools/history/${id}`);
  return response.data;
};

export const getStats = async () => {
  const email = getEmail();
  const response = await axios.get(`${API_BASE}/tools/stats/${email}`);
  return response.data;
};

export const downloadFile = (id, filename) => {
  // Triggers browser download by window.open or hidden link
  window.open(`${API_BASE}/tools/download/${id}`, '_blank');
};

// Generic Multipart API request with upload progress callback
const postMultipart = async (endpoint, formData, onProgress) => {
  const email = getEmail();
  formData.append('email', email);
  
  const response = await axios.post(`${API_BASE}/tools/${endpoint}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
  return response.data;
};

export const imageToPdf = async (images, config, onProgress) => {
  const formData = new FormData();
  images.forEach(img => formData.append('images', img));
  formData.append('pageSize', config.pageSize || 'a4');
  formData.append('orientation', config.orientation || 'portrait');
  formData.append('margin', config.margin || '10');
  formData.append('compress', config.compress ? 'true' : 'false');
  return postMultipart('image-to-pdf', formData, onProgress);
};

export const mergePdfs = async (files, onProgress) => {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  return postMultipart('pdf-merge', formData, onProgress);
};

export const splitPdf = async (file, config, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('splitType', config.splitType || 'custom');
  formData.append('pageRange', config.pageRange || '');
  return postMultipart('split', formData, onProgress);
};

export const pdfToWord = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return postMultipart('pdf-to-word', formData, onProgress);
};

export const wordToPdf = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return postMultipart('word-to-pdf', formData, onProgress);
};

export const pdfToImages = async (file, config, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', config.format || 'PNG');
  formData.append('resolution', config.resolution || 'medium');
  return postMultipart('pdf-to-images', formData, onProgress);
};

export const compressPdf = async (file, config, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('level', config.level || 'balanced');
  return postMultipart('compress', formData, onProgress);
};

export const protectPdf = async (file, config, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userPassword', config.userPassword);
  formData.append('ownerPassword', config.ownerPassword || config.userPassword);
  return postMultipart('protect', formData, onProgress);
};

export const unlockPdf = async (file, config, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', config.password);
  return postMultipart('unlock', formData, onProgress);
};

export const addWatermark = async (file, config, watermarkImageFile, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('watermarkText', config.watermarkText || '');
  if (watermarkImageFile) {
    formData.append('watermarkImage', watermarkImageFile);
  }
  formData.append('opacity', config.opacity || '0.3');
  formData.append('rotation', config.rotation || '45');
  formData.append('position', config.position || 'center');
  formData.append('fontSize', config.fontSize || '48');
  formData.append('colorHex', config.colorHex || '#D3D3D3');
  return postMultipart('watermark', formData, onProgress);
};

export const fillAndSign = async (file, signatureImgFile, config, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  if (signatureImgFile) {
    formData.append('signatureImage', signatureImgFile);
  }
  formData.append('typedSignature', config.typedSignature || '');
  formData.append('pageNum', config.pageNum || '1');
  formData.append('x', config.x || '100');
  formData.append('y', config.y || '100');
  formData.append('width', config.width || '150');
  formData.append('height', config.height || '60');
  formData.append('date', config.date || '');
  if (config.textFields) {
    formData.append('textFields', JSON.stringify(config.textFields));
  }
  return postMultipart('sign', formData, onProgress);
};

export const addPageNumbers = async (file, config, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('position', config.position || 'bottom-center');
  formData.append('fontName', config.fontName || 'helvetica');
  return postMultipart('page-numbering', formData, onProgress);
};

export const rotatePdfPages = async (file, config, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('angle', config.angle || '90');
  formData.append('pageRange', config.pageRange || 'all');
  return postMultipart('rotate', formData, onProgress);
};

export const removePdfPages = async (file, config, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pageRange', config.pageRange || '');
  return postMultipart('remove-pages', formData, onProgress);
};

export const performOcr = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return postMultipart('ocr', formData, onProgress);
};
