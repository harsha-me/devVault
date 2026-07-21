import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ToolWorkspaceModal from '../components/ToolWorkspaceModal';
import * as docService from '../services/documentService';
import { Search, SlidersHorizontal, Download, Trash2, Calendar, FileType, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const TOOLS_LIST = [
  { name: 'Images to PDF', description: 'Convert multiple photos or scans into a single PDF document.', icon: '🖼️', accept: 'image/*', color: 'var(--peach)' },
  { name: 'Merge PDFs', description: 'Combine multiple PDF files into one in any order you choose.', icon: '📑', accept: 'application/pdf', color: 'var(--lavender)' },
  { name: 'Split PDF', description: 'Extract specific pages, odd/even ranges, or save all pages separately.', icon: '✂️', accept: 'application/pdf', color: 'var(--pale-blue)' },
  { name: 'PDF to Word', description: 'Convert PDF files into editable Microsoft Word (.docx) documents.', icon: '📝', accept: 'application/pdf', color: 'var(--sage)' },
  { name: 'Word to PDF', description: 'Generate clean PDF files from Microsoft Word documents (.docx/.doc).', icon: '📘', accept: '.doc,.docx', color: 'var(--cream)' },
  { name: 'PDF to Images', description: 'Export individual PDF pages as high-resolution PNG or JPEG images.', icon: '🖼️', accept: 'application/pdf', color: 'var(--peach)' },
  { name: 'Compress PDF', description: 'Optimize and compress image contents to shrink document file size.', icon: '📉', accept: 'application/pdf', color: 'var(--lavender)' },
  { name: 'Protect PDF', description: 'Secure your files with standard AES user and owner passwords.', icon: '🔒', accept: 'application/pdf', color: 'var(--pale-blue)' },
  { name: 'Unlock PDF', description: 'Remove password security restrictions from protected PDF files.', icon: '🔓', accept: 'application/pdf', color: 'var(--sage)' },
  { name: 'Add Watermark', description: 'Insert custom text or image watermarks with transparency & rotation.', icon: '✍️', accept: 'application/pdf', color: 'var(--cream)' },
  { name: 'Fill & Sign PDF', description: 'Sign, draw vectors, date, and annotate documents natively.', icon: '🖊️', accept: 'application/pdf', color: 'var(--peach)' },
  { name: 'Page Numbering', description: 'Inject page numbers at Top/Bottom Left, Center, or Right corners.', icon: '🔢', accept: 'application/pdf', color: 'var(--lavender)' },
  { name: 'Rotate PDF Pages', description: 'Rotate custom ranges or all pages by 90, 180, or 270 degrees.', icon: '📐', accept: 'application/pdf', color: 'var(--pale-blue)' },
  { name: 'Remove Pages', description: 'Strip out unwanted pages from a PDF document to trim length.', icon: '🗑️', accept: 'application/pdf', color: 'var(--sage)' },
  { name: 'OCR (Premium)', description: 'Recognize and extract text from images or PDF documents using Gemini.', icon: '📷', accept: 'application/pdf,image/*', color: 'var(--cream)' },
];

function DocumentToolkit() {
  const [stats, setStats] = useState({
    totalConversions: 0,
    storageUsed: 0,
    convertedToday: 0,
    mostUsedTool: 'None',
    favoriteTool: 'None'
  });
  const [history, setHistory] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest, asc = oldest
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard stats & conversion log
  const loadStatsAndHistory = async () => {
    setIsLoading(true);
    try {
      const statsData = await docService.getStats();
      setStats(statsData);
      
      const historyData = await docService.getHistory();
      setHistory(historyData);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load toolkit metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatsAndHistory();
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteHistory = async (id) => {
    try {
      await docService.deleteHistory(id);
      toast.success('History log deleted.');
      loadStatsAndHistory();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete history.');
    }
  };

  const handleDownload = (item) => {
    if (item.status === 'FAILED') {
      toast.error('Cannot download a failed operation.');
      return;
    }
    docService.downloadFile(item.id, item.outputFileName);
  };

  // Filter & Sort History items
  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.operation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.inputFileName && item.inputFileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.outputFileName && item.outputFileName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const idA = a.id;
    const idB = b.id;
    return sortOrder === 'desc' ? idB - idA : idA - idB;
  });

  return (
    <div className="dv-page">
      <Sidebar />
      
      <main className="dv-main">
        <div className="dv-content">
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }} className="dv-fade-up">
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.06em' }}>DevVault Suite</span>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--stone-900)', marginTop: '4px', marginBottom: '4px' }}>
                📄 Document Toolkit
              </h1>
              <p style={{ color: 'var(--stone-400)', fontSize: '0.9rem', margin: 0 }}>
                Clean, server-secure document and PDF editing utilities built into your vault.
              </p>
            </div>
            
            <button onClick={loadStatsAndHistory} style={{
              background: 'var(--cream)', border: '1px solid var(--stone-200)', borderRadius: 10,
              padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 700, color: 'var(--stone-700)', transition: 'all 0.15s'
            }} className="hover:bg-stone-100">
              <RefreshCw size={14} /> Refresh Logs
            </button>
          </div>

          {/* Stats Ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }} className="dv-fade-up dv-stagger">
            
            <div className="dv-stat dv-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                🏆
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--stone-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Conversions</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1.2 }}>{stats.totalConversions}</div>
              </div>
            </div>

            <div className="dv-stat dv-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                📅
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--stone-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Converted Today</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1.2 }}>{stats.convertedToday}</div>
              </div>
            </div>

            <div className="dv-stat dv-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--warning-light)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                💾
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--stone-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Storage Used</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1.2 }}>{formatBytes(stats.storageUsed)}</div>
              </div>
            </div>

            <div className="dv-stat dv-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                🌟
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--stone-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Favorite Tool</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }} title={stats.favoriteTool}>
                  {stats.favoriteTool}
                </div>
              </div>
            </div>
          </div>

          {/* Tools Grid Section */}
          <div style={{ marginBottom: '3rem' }} className="dv-fade-up">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--stone-900)', marginBottom: '1rem', borderBottom: '1px solid var(--stone-200)', paddingBottom: '0.5rem' }}>
              Select Document Utility
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {TOOLS_LIST.map((tool, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveTool(tool)}
                  className="dv-card dv-card-hover"
                  style={{
                    padding: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    gap: '8px', borderLeft: `5px solid ${tool.color}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{tool.icon}</span>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--stone-900)', margin: 0 }}>
                      {tool.name}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--stone-500)', margin: 0, lineHeight: 1.4 }}>
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* History Panel */}
          <div className="dv-card dv-fade-up" style={{ padding: '1.5rem', background: 'var(--cream)', border: '1px solid var(--stone-200)' }}>
            
            {/* History Header & Search/Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--stone-900)', margin: 0 }}>
                  Conversion History Logs
                </h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-400)' }}>
                  Total records: {filteredHistory.length}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by operation or file name..."
                    className="dv-input"
                    style={{ paddingLeft: '2.5rem', fontSize: '0.85rem', padding: '10px 14px 10px 2.5rem' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-400)' }} />
                </div>
                
                {/* Status Dropdown */}
                <div style={{ minWidth: '130px' }}>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="dv-select" style={{ fontSize: '0.85rem', padding: '10px 34px 10px 14px' }}>
                    <option value="ALL">All Status</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>

                {/* Sort Button */}
                <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} style={{
                  background: 'none', border: '1px solid var(--stone-200)', borderRadius: 10,
                  padding: '10px 14px', fontSize: '0.85rem', color: 'var(--stone-700)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600
                }} className="hover:bg-stone-100">
                  <SlidersHorizontal size={14} /> Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </button>
              </div>
            </div>

            {/* History Table Container */}
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--stone-200)', background: '#fff' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--stone-400)' }}>
                  <div style={{ fontSize: '1.5rem', animation: 'dvPulse 1.5s infinite', fontWeight: 700 }}>🌿 Loading History Logs...</div>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📁</div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--stone-700)', margin: 0 }}>
                    {searchQuery || statusFilter !== 'ALL' ? 'No matching logs found.' : 'No document operations processed yet.'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--stone-400)', margin: '4px 0 0 0' }}>
                    Choose one of the utilities above to run your first task.
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--stone-200)', color: 'var(--stone-500)', fontWeight: 800 }}>
                      <th style={{ padding: '12px 16px' }}>Date / Time</th>
                      <th style={{ padding: '12px 16px' }}>Operation</th>
                      <th style={{ padding: '12px 16px' }}>Input Document</th>
                      <th style={{ padding: '12px 16px' }}>Output Document</th>
                      <th style={{ padding: '12px 16px' }}>Size</th>
                      <th style={{ padding: '12px 16px' }}>Proc. Time</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < filteredHistory.length - 1 ? '1px solid var(--stone-100)' : 'none', color: 'var(--stone-700)' }} className="hover:bg-stone-50">
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600 }}>{item.date}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--stone-400)' }}>{item.time?.substring(0, 5)}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--stone-900)' }}>
                          {item.operation}
                        </td>
                        <td style={{ padding: '12px 16px', maxBidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.inputFileName}>
                          {item.inputFileName || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', maxBidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.outputFileName}>
                          {item.outputFileName || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {item.fileSize > 0 ? formatBytes(item.fileSize) : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--stone-500)' }}>
                          {item.processingTimeMs}ms
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            padding: '3px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                            background: item.status === 'SUCCESS' ? 'var(--success-light)' : 'var(--danger-light)',
                            color: item.status === 'SUCCESS' ? 'var(--success)' : 'var(--danger)',
                          }}>
                            {item.status === 'SUCCESS' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            {item.status === 'SUCCESS' && (
                              <button onClick={() => handleDownload(item)} style={{
                                background: 'none', border: '1px solid var(--stone-200)', borderRadius: 6,
                                padding: 6, cursor: 'pointer', color: 'var(--accent)'
                              }} className="hover:bg-stone-100" title="Download Document">
                                <Download size={13} />
                              </button>
                            )}
                            <button onClick={() => handleDeleteHistory(item.id)} style={{
                              background: 'none', border: '1px solid var(--stone-200)', borderRadius: 6,
                              padding: 6, cursor: 'pointer', color: 'var(--danger)'
                            }} className="hover:bg-red-50" title="Delete Log Record">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Modal Toolkit Workspace */}
      {activeTool && (
        <ToolWorkspaceModal
          tool={activeTool}
          onClose={() => setActiveTool(null)}
          onCompletion={() => {
            loadStatsAndHistory();
          }}
        />
      )}
    </div>
  );
}

export default DocumentToolkit;
