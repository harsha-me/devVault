import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Sparkles, Image, CheckCircle, RotateCw, Plus, Trash2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

function ToolWorkspaceModal({ tool, onClose, onCompletion }) {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  
  // Signature Drawing State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [sigMode, setSigMode] = useState('draw'); // draw, type, upload
  const [typedSig, setTypedSig] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState('');

  // Tool Parameters Configurations
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState(10);
  const [compress, setCompress] = useState(false);
  const [splitType, setSplitType] = useState('range');
  const [pageRange, setPageRange] = useState('');
  const [format, setFormat] = useState('PNG');
  const [resolution, setResolution] = useState('medium');
  const [compressLevel, setCompressLevel] = useState('balanced');
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [password, setPassword] = useState('');
  
  // Watermark parameters
  const [watermarkType, setWatermarkType] = useState('text'); // text, image
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkImgFile, setWatermarkImgFile] = useState(null);
  const [watermarkImgPreview, setWatermarkImgPreview] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkRotation, setWatermarkRotation] = useState(45);
  const [watermarkPosition, setWatermarkPosition] = useState('center');
  const [watermarkFontSize, setWatermarkFontSize] = useState(48);
  const [watermarkColor, setWatermarkColor] = useState('#D3D3D3');

  // Sign parameters
  const [signPageNum, setSignPageNum] = useState(1);
  const [signX, setSignX] = useState(100);
  const [signY, setSignY] = useState(100);
  const [signW, setSignW] = useState(150);
  const [signH, setSignH] = useState(60);
  const [signDate, setSignDate] = useState(new Date().toISOString().split('T')[0]);
  const [includeDate, setIncludeDate] = useState(true);
  const [textFields, setTextFields] = useState([]);
  const [newFieldText, setNewFieldText] = useState('');
  const [newFieldX, setNewFieldX] = useState(100);
  const [newFieldY, setNewFieldY] = useState(150);

  // Page numbers parameters
  const [pageNumPos, setPageNumPos] = useState('bottom-center');
  const [pageNumFont, setPageNumFont] = useState('helvetica');

  // Rotation parameters
  const [rotateAngle, setRotateAngle] = useState(90);

  // File Upload Handlers
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxSize = 20 * 1024 * 1024; // 20MB limit
    const invalid = selectedFiles.some(f => f.size > maxSize);
    if (invalid) {
      toast.error('File size exceeds the 20MB limit.');
      return;
    }
    
    // Check if multi file is allowed
    const isMulti = ['Images to PDF', 'Merge PDFs'].includes(tool.name);
    if (isMulti) {
      setFiles(prev => [...prev, ...selectedFiles]);
    } else {
      setFiles(selectedFiles.slice(0, 1));
    }
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const maxSize = 20 * 1024 * 1024;
    const invalid = droppedFiles.some(f => f.size > maxSize);
    if (invalid) {
      toast.error('File size exceeds the 20MB limit.');
      return;
    }
    
    const isMulti = ['Images to PDF', 'Merge PDFs'].includes(tool.name);
    if (isMulti) {
      setFiles(prev => [...prev, ...droppedFiles]);
    } else {
      setFiles(droppedFiles.slice(0, 1));
    }
  };

  // Canvas Signature Methods
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.strokeStyle = '#0000FF'; // Blue ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // OCR Send to Notes
  const handleSaveToNotes = async () => {
    if (!ocrText) return;
    try {
      const email = localStorage.getItem('email');
      const response = await axios.post(`${API_BASE}/addNote`, {
        title: `OCR Text: ${files[0]?.name || 'Extracted Document'}`,
        content: ocrText,
        email: email,
        tags: ['ocr', 'extracted'],
        pinned: false
      });
      if (response.status === 200 || response.status === 201) {
        toast.success('Successfully added to notes!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to save notes.');
    }
  };

  // Watermark Image handler
  const handleWatermarkImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWatermarkImgFile(file);
      setWatermarkImgPreview(URL.createObjectURL(file));
    }
  };

  // Signature Image handler
  const handleSigImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  // Add Annotation Field
  const addTextField = () => {
    if (!newFieldText.trim()) return;
    setTextFields(prev => [...prev, {
      text: newFieldText,
      x: parseFloat(newFieldX),
      y: parseFloat(newFieldY)
    }]);
    setNewFieldText('');
  };

  const removeTextField = (idx) => {
    setTextFields(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit Operation
  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one file.');
      return;
    }

    if (tool.name === 'Protect PDF' && userPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    
    const email = localStorage.getItem('email');
    const formData = new FormData();
    formData.append('email', email);

    let endpoint = '';

    try {
      if (tool.name === 'Images to PDF') {
        endpoint = 'image-to-pdf';
        files.forEach(img => formData.append('images', img));
        formData.append('pageSize', pageSize);
        formData.append('orientation', orientation);
        formData.append('margin', margin);
        formData.append('compress', compress ? 'true' : 'false');
      } 
      else if (tool.name === 'Merge PDFs') {
        endpoint = 'pdf-merge';
        files.forEach(f => formData.append('files', f));
      } 
      else if (tool.name === 'Split PDF') {
        endpoint = 'split';
        formData.append('file', files[0]);
        formData.append('splitType', splitType);
        formData.append('pageRange', pageRange);
      } 
      else if (tool.name === 'PDF to Word') {
        endpoint = 'pdf-to-word';
        formData.append('file', files[0]);
      } 
      else if (tool.name === 'Word to PDF') {
        endpoint = 'word-to-pdf';
        formData.append('file', files[0]);
      } 
      else if (tool.name === 'PDF to Images') {
        endpoint = 'pdf-to-images';
        formData.append('file', files[0]);
        formData.append('format', format);
        formData.append('resolution', resolution);
      } 
      else if (tool.name === 'Compress PDF') {
        endpoint = 'compress';
        formData.append('file', files[0]);
        formData.append('level', compressLevel);
      } 
      else if (tool.name === 'Protect PDF') {
        endpoint = 'protect';
        formData.append('file', files[0]);
        formData.append('userPassword', userPassword);
        formData.append('ownerPassword', confirmPassword);
      } 
      else if (tool.name === 'Unlock PDF') {
        endpoint = 'unlock';
        formData.append('file', files[0]);
        formData.append('password', password);
      } 
      else if (tool.name === 'Add Watermark') {
        endpoint = 'watermark';
        formData.append('file', files[0]);
        if (watermarkType === 'text') {
          formData.append('watermarkText', watermarkText);
        } else if (watermarkImgFile) {
          formData.append('watermarkImage', watermarkImgFile);
        }
        formData.append('opacity', watermarkOpacity);
        formData.append('rotation', watermarkRotation);
        formData.append('position', watermarkPosition);
        formData.append('fontSize', watermarkFontSize);
        formData.append('colorHex', watermarkColor);
      } 
      else if (tool.name === 'Fill & Sign PDF') {
        endpoint = 'sign';
        formData.append('file', files[0]);
        formData.append('pageNum', signPageNum);
        formData.append('x', signX);
        formData.append('y', signY);
        formData.append('width', signW);
        formData.append('height', signH);
        
        if (includeDate) {
          formData.append('date', signDate);
        }

        if (sigMode === 'draw') {
          // Get signature bytes from canvas
          const canvas = canvasRef.current;
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          formData.append('signatureImage', blob, 'signature.png');
        } else if (sigMode === 'upload' && signatureFile) {
          formData.append('signatureImage', signatureFile);
        } else if (sigMode === 'type' && typedSig) {
          formData.append('typedSignature', typedSig);
        }

        if (textFields.length > 0) {
          formData.append('textFields', JSON.stringify(textFields));
        }
      } 
      else if (tool.name === 'Page Numbering') {
        endpoint = 'page-numbering';
        formData.append('file', files[0]);
        formData.append('position', pageNumPos);
        formData.append('fontName', pageNumFont);
      } 
      else if (tool.name === 'Rotate PDF Pages') {
        endpoint = 'rotate';
        formData.append('file', files[0]);
        formData.append('angle', rotateAngle);
        formData.append('pageRange', pageRange || 'all');
      } 
      else if (tool.name === 'Remove Pages') {
        endpoint = 'remove-pages';
        formData.append('file', files[0]);
        formData.append('pageRange', pageRange);
      } 
      else if (tool.name === 'OCR (Premium)') {
        endpoint = 'ocr';
        formData.append('file', files[0]);
      }

      setProgress(40);
      const res = await axios.post(`${API_BASE}/tools/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = 40 + Math.round((e.loaded * 40) / e.total);
            setProgress(pct);
          }
        }
      });
      
      setProgress(100);
      toast.success(`${tool.name} completed successfully!`);
      
      if (tool.name === 'OCR (Premium)') {
        setOcrText(res.data.text);
      }
      
      if (onCompletion) {
        onCompletion(res.data);
      }
      
      if (tool.name !== 'OCR (Premium)') {
        setTimeout(onClose, 800);
      }
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data || e.message || 'Operation failed';
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,37,32,0.5)', backdropFilter: 'blur(8px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'dvFadeIn 0.25s ease'
    }}>
      <div className="dv-card dv-scale-in" style={{
        width: '90%', maxWidth: '800px', maxHeight: '90vh', background: 'var(--stone-50)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--stone-200)', background: 'var(--cream)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>{tool.icon}</span>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--stone-900)', margin: 0 }}>{tool.name}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--stone-400)', margin: 0 }}>{tool.description}</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-400)',
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s'
          }} className="hover:bg-stone-200">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem' }}>
          
          {/* File Upload Zone */}
          {files.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                border: '2px dashed var(--stone-300)', borderRadius: 16, background: 'var(--cream)',
                padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
              }}
              className="hover:border-accent hover:bg-stone-50"
              onClick={() => document.getElementById('file-upload-input').click()}
            >
              <input
                id="file-upload-input"
                type="file"
                multiple={['Images to PDF', 'Merge PDFs'].includes(tool.name)}
                accept={tool.accept}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-light)',
                color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Upload size={24} />
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--stone-700)', margin: '0 0 4px 0' }}>
                Drag & drop file here or click to browse
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--stone-400)', margin: 0 }}>
                Supports {tool.accept || 'any'} files up to 20MB.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Selected Files List */}
              <div>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--stone-400)', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  Uploaded Files ({files.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {files.map((file, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                      padding: '10px 14px', borderRadius: 10, background: 'var(--cream)',
                      border: '1px solid var(--stone-200)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <FileText size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--stone-950)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--stone-400)', flexShrink: 0 }}>
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <button onClick={() => removeFile(idx)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)',
                        padding: 4, borderRadius: 6
                      }} className="hover:bg-red-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                {['Images to PDF', 'Merge PDFs'].includes(tool.name) && (
                  <button onClick={() => document.getElementById('file-upload-input').click()} style={{
                    marginTop: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px',
                    color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer'
                  }}>
                    <Plus size={14} /> Add more files
                    <input
                      id="file-upload-input"
                      type="file"
                      multiple
                      accept={tool.accept}
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </button>
                )}
              </div>

              {/* Tool Parameters Interface */}
              <div style={{ borderTop: '1px solid var(--stone-200)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--stone-400)', letterSpacing: '0.04em', marginBottom: '12px' }}>
                  Tool Settings
                </h3>
                
                {/* 1. Images to PDF Options */}
                {tool.name === 'Images to PDF' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Page Size</label>
                      <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="dv-select">
                        <option value="a4">A4</option>
                        <option value="letter">Letter</option>
                        <option value="legal">Legal</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Orientation</label>
                      <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className="dv-select">
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Margin (mm)</label>
                      <input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} className="dv-input" style={{ padding: '9px 12px' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '1.2rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--stone-700)' }}>
                        <input type="checkbox" checked={compress} onChange={(e) => setCompress(e.target.checked)} style={{ width: 16, height: 16 }} />
                        Compress images (reduce size)
                      </label>
                    </div>
                  </div>
                )}

                {/* 3. Split PDF Options */}
                {tool.name === 'Split PDF' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Split Strategy</label>
                      <select value={splitType} onChange={(e) => setSplitType(e.target.value)} className="dv-select">
                        <option value="every">Save every page as separate PDF</option>
                        <option value="odd">Extract odd pages only</option>
                        <option value="even">Extract even pages only</option>
                        <option value="custom">Extract custom range of pages</option>
                      </select>
                    </div>
                    {splitType === 'custom' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Page Range (e.g. 1-3, 5, 8-10)</label>
                        <input type="text" value={pageRange} onChange={(e) => setPageRange(e.target.value)} placeholder="e.g. 1-3, 5" className="dv-input" />
                      </div>
                    )}
                  </div>
                )}

                {/* 6. PDF to Images Options */}
                {tool.name === 'PDF to Images' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Format</label>
                      <select value={format} onChange={(e) => setFormat(e.target.value)} className="dv-select">
                        <option value="PNG">PNG</option>
                        <option value="JPEG">JPEG</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Resolution</label>
                      <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="dv-select">
                        <option value="low">Low (72 DPI - fast)</option>
                        <option value="medium">Medium (150 DPI - default)</option>
                        <option value="high">High (300 DPI - sharp)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 7. Compress PDF Options */}
                {tool.name === 'Compress PDF' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Compression Level</label>
                    <select value={compressLevel} onChange={(e) => setCompressLevel(e.target.value)} className="dv-select">
                      <option value="low">Low (Keep quality, modest reduction)</option>
                      <option value="balanced">Balanced (Recommended)</option>
                      <option value="high">High (Maximum size reduction, lower quality)</option>
                    </select>
                  </div>
                )}

                {/* 8. Protect PDF Options */}
                {tool.name === 'Protect PDF' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Password</label>
                      <input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} className="dv-input" placeholder="••••••••" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Confirm Password</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="dv-input" placeholder="••••••••" />
                    </div>
                  </div>
                )}

                {/* 9. Unlock PDF Options */}
                {tool.name === 'Unlock PDF' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Password to decrypt</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="dv-input" placeholder="••••••••" />
                  </div>
                )}

                {/* 10. Add Watermark Options */}
                {tool.name === 'Add Watermark' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setWatermarkType('text')} style={{ flex: 1, padding: '8px', border: watermarkType === 'text' ? '2px solid var(--accent)' : '1px solid var(--stone-200)', background: watermarkType === 'text' ? 'var(--accent-light)' : 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--stone-700)' }}>
                        Text Watermark
                      </button>
                      <button onClick={() => setWatermarkType('image')} style={{ flex: 1, padding: '8px', border: watermarkType === 'image' ? '2px solid var(--accent)' : '1px solid var(--stone-200)', background: watermarkType === 'image' ? 'var(--accent-light)' : 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--stone-700)' }}>
                        Image Watermark
                      </button>
                    </div>

                    {watermarkType === 'text' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Watermark Text</label>
                          <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} className="dv-input" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Font Size</label>
                          <input type="number" value={watermarkFontSize} onChange={(e) => setWatermarkFontSize(e.target.value)} className="dv-input" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Color</label>
                          <input type="color" value={watermarkColor} onChange={(e) => setWatermarkColor(e.target.value)} style={{ width: '100%', height: '42px', border: '1px solid var(--stone-200)', borderRadius: 8, cursor: 'pointer', padding: 0 }} />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Watermark Image</label>
                        <input type="file" accept="image/*" onChange={handleWatermarkImageChange} style={{ display: 'none' }} id="wm-img-input" />
                        <button type="button" onClick={() => document.getElementById('wm-img-input').click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', border: '1px solid var(--stone-200)', borderRadius: 10, background: 'var(--cream)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                          <Image size={16} /> Choose Image
                        </button>
                        {watermarkImgPreview && (
                          <img src={watermarkImgPreview} alt="watermark preview" style={{ height: 50, marginTop: 8, borderRadius: 6, border: '1px solid var(--stone-200)' }} />
                        )}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Opacity: {watermarkOpacity}</label>
                        <input type="range" min="0.1" max="1.0" step="0.05" value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Rotation: {watermarkRotation}°</label>
                        <input type="range" min="-180" max="180" step="5" value={watermarkRotation} onChange={(e) => setWatermarkRotation(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Position</label>
                        <select value={watermarkPosition} onChange={(e) => setWatermarkPosition(e.target.value)} className="dv-select">
                          <option value="center">Center</option>
                          <option value="top-left">Top Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="bottom-right">Bottom Right</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. Fill & Sign Options */}
                {tool.name === 'Fill & Sign PDF' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setSigMode('draw')} style={{ flex: 1, padding: '8px', border: sigMode === 'draw' ? '2px solid var(--accent)' : '1px solid var(--stone-200)', background: sigMode === 'draw' ? 'var(--accent-light)' : 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--stone-700)' }}>
                        Draw Signature
                      </button>
                      <button onClick={() => setSigMode('type')} style={{ flex: 1, padding: '8px', border: sigMode === 'type' ? '2px solid var(--accent)' : '1px solid var(--stone-200)', background: sigMode === 'type' ? 'var(--accent-light)' : 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--stone-700)' }}>
                        Type Signature
                      </button>
                      <button onClick={() => setSigMode('upload')} style={{ flex: 1, padding: '8px', border: sigMode === 'upload' ? '2px solid var(--accent)' : '1px solid var(--stone-200)', background: sigMode === 'upload' ? 'var(--accent-light)' : 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--stone-700)' }}>
                        Upload Image
                      </button>
                    </div>

                    {/* Signature Input Panel */}
                    {sigMode === 'draw' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Draw in box below:</label>
                        <div style={{ border: '1px solid var(--stone-200)', borderRadius: 10, background: '#fff', position: 'relative' }}>
                          <canvas
                            ref={canvasRef}
                            width={400}
                            height={120}
                            style={{ display: 'block', cursor: 'crosshair', width: '100%' }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                          />
                          <button type="button" onClick={clearCanvas} style={{ position: 'absolute', bottom: 8, right: 8, fontSize: '0.75rem', padding: '4px 8px', border: '1px solid var(--stone-200)', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
                            Clear
                          </button>
                        </div>
                      </div>
                    )}

                    {sigMode === 'type' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Type Signature</label>
                        <input type="text" value={typedSig} onChange={(e) => setTypedSig(e.target.value)} placeholder="Your Name" className="dv-input" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.2rem' }} />
                      </div>
                    )}

                    {sigMode === 'upload' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Upload Image</label>
                        <input type="file" accept="image/*" onChange={handleSigImageChange} style={{ display: 'none' }} id="sig-img-input" />
                        <button type="button" onClick={() => document.getElementById('sig-img-input').click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', border: '1px solid var(--stone-200)', borderRadius: 10, background: 'var(--cream)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                          <Image size={16} /> Choose Image
                        </button>
                        {signaturePreview && (
                          <img src={signaturePreview} alt="signature preview" style={{ height: 50, marginTop: 8, borderRadius: 6, border: '1px solid var(--stone-200)' }} />
                        )}
                      </div>
                    )}

                    {/* Coordinates & Placement */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', borderTop: '1px solid var(--stone-200)', paddingTop: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Page Number</label>
                        <input type="number" min="1" value={signPageNum} onChange={(e) => setSignPageNum(parseInt(e.target.value))} className="dv-input" style={{ padding: '8px 12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>X Coordinate</label>
                        <input type="number" value={signX} onChange={(e) => setSignX(parseFloat(e.target.value))} className="dv-input" style={{ padding: '8px 12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Y Coordinate</label>
                        <input type="number" value={signY} onChange={(e) => setSignY(parseFloat(e.target.value))} className="dv-input" style={{ padding: '8px 12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Width</label>
                        <input type="number" value={signW} onChange={(e) => setSignW(parseFloat(e.target.value))} className="dv-input" style={{ padding: '8px 12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Height</label>
                        <input type="number" value={signH} onChange={(e) => setSignH(parseFloat(e.target.value))} className="dv-input" style={{ padding: '8px 12px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--stone-700)' }}>
                      <input type="checkbox" checked={includeDate} onChange={(e) => setIncludeDate(e.target.checked)} style={{ width: 16, height: 16 }} />
                      Include Date Stamp:
                      <input type="date" value={signDate} onChange={(e) => setSignDate(e.target.value)} disabled={!includeDate} className="dv-input" style={{ width: 'auto', display: 'inline-block', padding: '4px 8px', fontSize: '0.8rem' }} />
                    </div>

                    {/* Additional text annotations */}
                    <div style={{ borderTop: '1px solid var(--stone-200)', paddingTop: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Add Text Fields / Annotations:</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <input type="text" value={newFieldText} onChange={(e) => setNewFieldText(e.target.value)} placeholder="Text value" className="dv-input" style={{ flex: 2, padding: '8px 12px' }} />
                        <input type="number" value={newFieldX} onChange={(e) => setNewFieldX(e.target.value)} placeholder="X" className="dv-input" style={{ flex: 0.5, padding: '8px 12px' }} />
                        <input type="number" value={newFieldY} onChange={(e) => setNewFieldY(e.target.value)} placeholder="Y" className="dv-input" style={{ flex: 0.5, padding: '8px 12px' }} />
                        <button type="button" onClick={addTextField} style={{ padding: '8px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                          Add
                        </button>
                      </div>
                      
                      {textFields.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {textFields.map((field, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'var(--cream)', borderRadius: 6, border: '1px solid var(--stone-200)', fontSize: '0.75rem' }}>
                              <span style={{ flex: 1, fontWeight: 600 }}>"{field.text}" at ({field.x}, {field.y})</span>
                              <button type="button" onClick={() => removeTextField(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 12. Page Numbering Options */}
                {tool.name === 'Page Numbering' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Position</label>
                      <select value={pageNumPos} onChange={(e) => setPageNumPos(e.target.value)} className="dv-select">
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Font Family</label>
                      <select value={pageNumFont} onChange={(e) => setPageNumFont(e.target.value)} className="dv-select">
                        <option value="helvetica">Helvetica</option>
                        <option value="times">Times Roman</option>
                        <option value="courier">Courier</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 13. Rotate Pages Options */}
                {tool.name === 'Rotate PDF Pages' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Rotation Angle</label>
                      <select value={rotateAngle} onChange={(e) => setRotateAngle(parseInt(e.target.value))} className="dv-select">
                        <option value={90}>90° Clockwise</option>
                        <option value={180}>180° Flip</option>
                        <option value={270}>270° Counter-Clockwise</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Page Range (leave empty for all pages)</label>
                      <input type="text" value={pageRange} onChange={(e) => setPageRange(e.target.value)} placeholder="e.g. 1, 3-5 (or leave empty)" className="dv-input" />
                    </div>
                  </div>
                )}

                {/* 14. Remove Pages Options */}
                {tool.name === 'Remove Pages' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>Pages to Delete (1-based index range)</label>
                    <input type="text" value={pageRange} onChange={(e) => setPageRange(e.target.value)} placeholder="e.g. 2, 4-6" className="dv-input" />
                  </div>
                )}

                {/* 15. OCR Premium View */}
                {tool.name === 'OCR (Premium)' && ocrText && (
                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--stone-200)', paddingTop: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--stone-500)' }}>Extracted Text Result</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(ocrText); toast.success('Copied to clipboard!'); }} style={{ padding: '6px 12px', border: '1px solid var(--stone-200)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                          Copy Text
                        </button>
                        <button type="button" onClick={handleSaveToNotes} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: 'none', borderRadius: 8, background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                          <Sparkles size={13} /> Save as note
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={ocrText}
                      readOnly
                      style={{
                        width: '100%', height: '180px', padding: '12px', border: '1px solid var(--stone-200)',
                        borderRadius: 10, background: '#fff', color: 'var(--stone-900)', fontFamily: 'monospace',
                        fontSize: '0.85rem', outline: 'none', resize: 'vertical'
                      }}
                    />
                  </div>
                )}

              </div>

              {/* Progress and Execute triggers */}
              {isProcessing && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyItems: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', marginBottom: '4px' }}>
                    <span>Processing document...</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--stone-200)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem', borderTop: '1px solid var(--stone-200)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  style={{
                    padding: '11px 22px', border: '1px solid var(--stone-200)', borderRadius: 12,
                    background: '#fff', color: 'var(--stone-700)', fontWeight: 600, fontSize: '0.875rem',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  className="hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  style={{
                    padding: '11px 22px', border: 'none', borderRadius: 12,
                    background: 'var(--stone-900)', color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  className="hover:bg-stone-950"
                >
                  {isProcessing ? 'Processing...' : 'Run Operation'}
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ToolWorkspaceModal;
