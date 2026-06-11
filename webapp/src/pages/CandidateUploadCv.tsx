import React, { useState, useRef } from 'react';

// SVG Icons definition to match high-fidelity design without depending on external fonts
const Icons = {
  uploadFile: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  description: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-command shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  warning: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 shrink-0">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  visibility: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  checkCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  report: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  unchecked: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant shrink-0">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  checklist: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-command shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="9 9 9.01 9" />
    </svg>
  ),
  hub: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-command shrink-0">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <line x1="12" y1="8" x2="12" y2="9" />
      <line x1="7.6" y1="16.4" x2="9.9" y2="14.1" />
      <line x1="16.4" y1="16.4" x2="14.1" y2="14.1" />
    </svg>
  ),
  spinner: () => (
    <svg className="animate-spin h-4 w-4 text-teal-command" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
};

interface CvDocument {
  id: string;
  name: string;
  version: string;
  uploadedDate: string;
  parsingStatus: 'Ready' | 'Parsing Failed' | 'Parsing...';
  embedding: 'Indexed' | 'Pending' | 'Awaiting' | '—';
  lastUsed: string;
}

export const CandidateUploadCv: React.FC = () => {
  // Document History State
  const [documents, setDocuments] = useState<CvDocument[]>([
    {
      id: 'doc-1',
      name: 'Alex_Cameron_CV_2024.pdf',
      version: 'v1.2.4',
      uploadedDate: 'Oct 12, 2024',
      parsingStatus: 'Ready',
      embedding: 'Indexed',
      lastUsed: 'Senior UI/UX Engineer'
    },
    {
      id: 'doc-2',
      name: 'Cameron_Portfolio_Draft.docx',
      version: 'v1.0.0',
      uploadedDate: 'Nov 01, 2024',
      parsingStatus: 'Parsing Failed',
      embedding: '—',
      lastUsed: 'Not applied'
    }
  ]);

  // Drag and Drop Visual State
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger file selection dialog
  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  // Simulate file upload and parsing workflow
  const handleFileUpload = (fileName: string) => {
    const newDocId = `doc-${Date.now()}`;
    const newDoc: CvDocument = {
      id: newDocId,
      name: fileName,
      version: 'v1.0.0',
      uploadedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      parsingStatus: 'Parsing...',
      embedding: 'Awaiting',
      lastUsed: 'Not applied'
    };

    setDocuments(prevDocs => [newDoc, ...prevDocs]);

    // Stage 1: Text extraction after 2 seconds
    setTimeout(() => {
      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc.id === newDocId
            ? { ...doc, embedding: 'Pending' }
            : doc
        )
      );

      // Stage 2: Ready & Indexed after 4 seconds
      setTimeout(() => {
        setDocuments(prevDocs =>
          prevDocs.map(doc =>
            doc.id === newDocId
              ? { ...doc, parsingStatus: 'Ready', embedding: 'Indexed' }
              : doc
          )
        );
      }, 2000);
    }, 2000);
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  // Handle Drag Leave
  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
        handleFileUpload(file.name);
      } else {
        alert('Invalid file format. Please upload a PDF or DOCX file.');
      }
    }
  };

  // Handle Native File Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0].name);
    }
  };

  // Retry parsing for failed documents
  const handleRetryParse = (id: string) => {
    setDocuments(prevDocs =>
      prevDocs.map(doc =>
        doc.id === id
          ? { ...doc, parsingStatus: 'Parsing...', embedding: 'Awaiting' }
          : doc
      )
    );

    setTimeout(() => {
      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc.id === id
            ? { ...doc, parsingStatus: 'Ready', embedding: 'Indexed' }
            : doc
        )
      );
    }, 2500);
  };

  // Delete document
  const handleDeleteDoc = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        className="hidden" 
        accept=".pdf,.docx"
      />

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Center Content: Main upload functionality and history */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          <section>
            <h2 className="text-3xl font-semibold tracking-tight text-deep-charcoal">Upload CV - Candidate</h2>
            <p className="text-base text-slate-ink mt-2">Upload PDF or DOCX CV files and monitor parsing readiness.</p>
          </section>

          {/* Upload Card Dropzone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseFiles}
            className={`bg-white border-dashed border-2 rounded-lg p-8 flex flex-col items-center justify-center transition-all group cursor-pointer ${
              isDragActive 
                ? 'border-teal-command bg-teal-command/5 scale-[0.99]' 
                : 'border-border-warm hover:border-teal-command/50'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-teal-command mb-4 group-hover:scale-110 transition-transform">
              <Icons.uploadFile />
            </div>
            <h3 className="text-lg font-semibold text-deep-charcoal mb-1">Drag and drop your CV here</h3>
            <p className="text-xs text-on-surface-variant mb-6 text-center max-w-sm font-medium leading-relaxed">
              Support for PDF and DOCX files. Max file size: 10MB. Ensure your contact details and work history are clearly legible for best parsing results.
            </p>
            <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={handleBrowseFiles}
                className="bg-teal-command text-white px-8 py-2.5 rounded-lg font-semibold text-sm active:scale-95 hover:bg-primary transition-all"
              >
                Upload CV
              </button>
              <button 
                onClick={handleBrowseFiles}
                className="border border-border-warm text-deep-charcoal px-8 py-2.5 rounded-lg font-semibold text-sm hover:bg-surface-container-low transition-colors"
              >
                Browse Files
              </button>
            </div>
          </div>

          {/* CV Table */}
          <div className="bg-white border border-border-warm rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border-warm bg-surface-container-lowest flex justify-between items-center">
              <h3 className="text-sm font-bold text-deep-charcoal">Document History</h3>
              <span className="text-xs text-on-surface-variant font-medium">{documents.length} total documents</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-workflow-ivory text-on-surface-variant text-xs uppercase tracking-wider font-semibold border-b border-border-warm">
                    <th className="px-6 py-4">File Name</th>
                    <th className="px-6 py-4">Version</th>
                    <th className="px-6 py-4">Uploaded Date</th>
                    <th className="px-6 py-4">Parsing Status</th>
                    <th className="px-6 py-4">Embedding</th>
                    <th className="px-6 py-4">Last Used</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-deep-charcoal font-medium">
                  {documents.map((doc) => (
                    <tr 
                      key={doc.id}
                      className={`border-b border-border-warm hover:bg-teal-command/5 transition-colors group ${
                        doc.parsingStatus === 'Parsing Failed' ? 'bg-workflow-ivory/40' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {doc.parsingStatus === 'Parsing Failed' ? (
                            <Icons.warning />
                          ) : (
                            <Icons.description />
                          )}
                          <span className="font-semibold text-deep-charcoal">{doc.name}</span>
                        </div>
                      </td>

                      {/* Version */}
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-ink">{doc.version}</td>

                      {/* Uploaded Date */}
                      <td className="px-6 py-4 text-on-surface-variant">{doc.uploadedDate}</td>

                      {/* Parsing Status */}
                      <td className="px-6 py-4">
                        {doc.parsingStatus === 'Ready' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Ready
                          </span>
                        )}
                        {doc.parsingStatus === 'Parsing Failed' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200/50 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Parsing Failed
                          </span>
                        )}
                        {doc.parsingStatus === 'Parsing...' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50 text-[10px] font-bold">
                            <Icons.spinner /> Parsing...
                          </span>
                        )}
                      </td>

                      {/* Embedding */}
                      <td className="px-6 py-4">
                        {doc.embedding === 'Indexed' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200/50 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span> Indexed
                          </span>
                        )}
                        {doc.embedding === 'Pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50 text-[10px] font-bold">
                            <Icons.spinner /> Indexing...
                          </span>
                        )}
                        {doc.embedding === 'Awaiting' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200/50 text-[10px] font-bold">
                            Awaiting
                          </span>
                        )}
                        {doc.embedding === '—' && (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>

                      {/* Last Used */}
                      <td className="px-6 py-4">
                        {doc.lastUsed !== 'Not applied' ? (
                          <span className="text-teal-command underline cursor-pointer hover:text-primary">
                            {doc.lastUsed}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant">Not applied</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {doc.parsingStatus === 'Parsing Failed' ? (
                          <button 
                            onClick={() => handleRetryParse(doc.id)}
                            className="text-teal-command font-semibold text-xs hover:underline inline-flex items-center gap-1"
                          >
                            <Icons.refresh /> Retry
                          </button>
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:text-teal-command text-slate-ink" title="View Details">
                              <Icons.visibility />
                            </button>
                            <button 
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="p-1 hover:text-red-600 text-slate-ink" 
                              title="Delete CV"
                            >
                              <Icons.delete />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panels: Checklist and Timeline */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* CV Quality Checklist */}
          <div className="bg-white border border-border-warm rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-bold text-deep-charcoal mb-4 flex items-center gap-2 border-b border-border-warm pb-2">
              <Icons.checklist />
              <span>CV Quality Checklist</span>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Icons.checkCircle />
                <div>
                  <p className="text-xs font-bold text-deep-charcoal">Contact Information</p>
                  <p className="text-[11px] text-on-surface-variant font-semibold">Found email & phone number.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Icons.checkCircle />
                <div>
                  <p className="text-xs font-bold text-deep-charcoal">Work History</p>
                  <p className="text-[11px] text-on-surface-variant font-semibold">Timeline identified clearly.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Icons.report />
                <div>
                  <p className="text-xs font-bold text-deep-charcoal">Skills Extraction</p>
                  <p className="text-[11px] text-on-surface-variant font-semibold">Only 3 core skills detected. Consider adding a 'Skills' section.</p>
                </div>
              </li>
              <li className="flex items-start gap-3 opacity-55">
                <Icons.unchecked />
                <div>
                  <p className="text-xs font-bold text-deep-charcoal">Education Background</p>
                  <p className="text-[11px] text-on-surface-variant font-semibold">Not yet verified by parser.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Parsing Status Timeline */}
          <div className="bg-white border border-border-warm rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-bold text-deep-charcoal mb-6 flex items-center gap-2 border-b border-border-warm pb-2">
              <Icons.hub />
              <span>Parsing Status Timeline</span>
            </h3>
            <div className="relative pl-6 space-y-8 before:absolute before:left-[9px] before:top-1 before:bottom-1 before:w-[2px] before:bg-surface-container">
              <div className="relative">
                <div className="absolute -left-[23px] w-[14px] h-[14px] rounded-full bg-emerald-600 border-4 border-white"></div>
                <p className="text-xs font-bold text-deep-charcoal leading-none">Uploaded</p>
                <p className="text-[10px] text-on-surface-variant mt-1 font-semibold">Oct 12, 2024 • 14:20</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[23px] w-[14px] h-[14px] rounded-full bg-emerald-600 border-4 border-white"></div>
                <p className="text-xs font-bold text-deep-charcoal leading-none">Text Extracted</p>
                <p className="text-[10px] text-on-surface-variant mt-1 font-semibold">OCR Processing Complete</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[23px] w-[14px] h-[14px] rounded-full bg-amber-500 border-4 border-white"></div>
                <p className="text-xs font-bold text-deep-charcoal leading-none">Structured Data Ready</p>
                <p className="text-[10px] text-on-surface-variant mt-1 font-semibold">JSON Mapping in progress...</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[23px] w-[14px] h-[14px] rounded-full bg-stone-300 border-4 border-white"></div>
                <p className="text-xs font-bold text-on-surface-variant leading-none">Embeddings Indexed</p>
                <p className="text-[10px] text-on-surface-variant mt-1 font-semibold">Awaiting vector storage</p>
              </div>
            </div>
          </div>

          {/* Privacy & Data Retention */}
          <div className="bg-surface-container-low border border-border-warm rounded-lg p-4 flex gap-3">
            <span className="mt-0.5">
              <Icons.lock />
            </span>
            <div>
              <h4 className="text-xs font-bold text-deep-charcoal uppercase tracking-wider">Data Privacy</h4>
              <p className="text-[11px] text-on-surface-variant font-medium italic mt-1 leading-relaxed">
                Your CV documents are stored securely with AES-256 encryption. We retain CV history for 12 months following your last active application unless manually deleted.
              </p>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
};
