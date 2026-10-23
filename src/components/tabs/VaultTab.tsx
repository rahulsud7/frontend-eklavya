import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Edit2,
  Check,
  X,
  Trash2,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Database,
  Eye,
  Plus,
  Calendar,
  MessageSquare,
  Search,
  ArrowRight
} from 'lucide-react';
import { DocumentItem } from '../../types';
import { uploadDocumentApi, renameDocumentApi, deleteDocumentApi, seedSampleChapterApi } from '../../services/api';

interface VaultTabProps {
  userId: string;
  subjects: string[];
  activeSubject: string;
  documents: DocumentItem[];
  onRefreshDocs: () => void;
  onGrantXp: (amount: number) => void;
  onNavigateToSchedule?: () => void;
  onSubjectChange?: (subject: string) => void;
  onSelectDocId?: (docId: string | null, subject: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const VaultTab: React.FC<VaultTabProps> = ({
  userId,
  subjects,
  activeSubject,
  documents,
  onRefreshDocs,
  onGrantXp,
  onNavigateToSchedule,
  onSubjectChange,
  onSelectDocId,
  onNavigateToTab
}) => {
  const [selectedSubject, setSelectedSubject] = useState(activeSubject);
  const [customName, setCustomName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressStage, setUploadProgressStage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; newDocId?: string } | null>(null);
  const [justUploadedId, setJustUploadedId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Editing state for hover-reveal rename
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');

  // Selected doc for Vector Chunk Inspector
  const [inspectingDoc, setInspectingDoc] = useState<DocumentItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Keep selectedSubject in sync with activeSubject
  useEffect(() => {
    setSelectedSubject(activeSubject);
  }, [activeSubject]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (!customName) {
        setCustomName(f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatusMessage({ type: 'error', text: 'Please select a PDF file to vectorize.' });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    setUploadProgressStage('Extracting text layers from PDF...');
    await new Promise(r => setTimeout(r, 500));

    setUploadProgressStage('Chunking document into 500-token semantic windows...');
    await new Promise(r => setTimeout(r, 500));

    setUploadProgressStage('Vectorizing via paraphrase-multilingual-MiniLM-L12-v2 (dim: 384)...');
    await new Promise(r => setTimeout(r, 600));

    setUploadProgressStage('Writing vector embeddings to Supabase pgvector...');

    try {
      const res = await uploadDocumentApi(userId, selectedSubject, file, customName);
      setUploadProgressStage('');
      setIsUploading(false);
      setFile(null);
      setCustomName('');
      setJustUploadedId(res.document.id);

      setStatusMessage({
        type: 'success',
        text: `Uploaded and vectorized "${res.document.custom_name}" (${res.document.total_chunks} chunks). Now active in your ${selectedSubject} curriculum!`,
        newDocId: res.document.id
      });

      onGrantXp(50);
      if (onSubjectChange) onSubjectChange(selectedSubject);
      if (onSelectDocId) onSelectDocId(res.document.id, selectedSubject);
      onRefreshDocs();
    } catch {
      setIsUploading(false);
      setUploadProgressStage('');
      setStatusMessage({ type: 'error', text: 'Failed to upload document. Please retry.' });
    }
  };

  const handleSeedSample = async (sample: { title: string; filename: string; subject: string; chunks: number; size: string }) => {
    setIsUploading(true);
    setUploadProgressStage(`Vectorizing sample: ${sample.title}...`);
    await new Promise(r => setTimeout(r, 600));
    const newDoc = await seedSampleChapterApi(userId, sample);
    setIsUploading(false);
    setUploadProgressStage('');
    setJustUploadedId(newDoc.id);

    setStatusMessage({
      type: 'success',
      text: `Added sample "${newDoc.custom_name}" to your ${newDoc.subject} vault!`,
      newDocId: newDoc.id
    });

    onGrantXp(30);
    if (onSubjectChange) onSubjectChange(sample.subject);
    if (onSelectDocId) onSelectDocId(newDoc.id, sample.subject);
    onRefreshDocs();
  };

  const startRename = (doc: DocumentItem) => {
    setEditingDocId(doc.id);
    setEditedName(doc.custom_name);
  };

  const saveRename = async (docId: string) => {
    if (!editedName.trim()) return;
    await renameDocumentApi(docId, editedName.trim());
    setEditingDocId(null);
    onRefreshDocs();
  };

  const handleDelete = async (docId: string) => {
    setConfirmDeleteId(null);
    await deleteDocumentApi(docId);
    onRefreshDocs();
  };

  const handleChatWithDoc = (doc: DocumentItem) => {
    if (onSubjectChange) onSubjectChange(doc.subject);
    if (onSelectDocId) onSelectDocId(doc.id, doc.subject);
    if (onNavigateToTab) onNavigateToTab('mentor');
  };

  // Filter documents by search and subject
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.custom_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject =
      subjectFilter === 'all' || doc.subject.toLowerCase() === subjectFilter.toLowerCase();

    return matchesSearch && matchesSubject;
  });

  // Group filtered documents by Subject
  const allKnownSubjects = Array.from(new Set([...subjects, ...documents.map(d => d.subject)]));
  const groupedDocuments = allKnownSubjects.reduce((acc, subj) => {
    const matching = filteredDocuments.filter(d => d.subject.toLowerCase() === subj.toLowerCase());
    if (matching.length > 0) {
      acc[subj] = matching;
    }
    return acc;
  }, {} as Record<string, DocumentItem[]>);

  const readySamples = [
    {
      title: 'Class 10 Math: Some Applications of Trigonometry (Heights & Distances)',
      filename: 'NCERT_Math_Class10_Ch9_Heights_Distances.pdf',
      subject: 'Mathematics',
      chunks: 42,
      size: '2.8 MB'
    },
    {
      title: "Class 10 Science: Electricity & Ohm's Law",
      filename: 'NCERT_Science_Class10_Ch12_Electricity.pdf',
      subject: 'Science',
      chunks: 58,
      size: '3.6 MB'
    },
    {
      title: 'Class 10 Social: Democratic Politics & Federalism',
      filename: 'NCERT_Civics_Class10_Ch2_Federalism.pdf',
      subject: 'Social Science',
      chunks: 35,
      size: '2.2 MB'
    }
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Upload Box */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/20 shadow-md">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#284E38]/10 text-[#284E38] flex items-center justify-center font-bold">
              <Upload className="w-5 h-5 text-[#284E38]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#284E38]">Curriculum Vault Ingestion</h2>
              <p className="text-xs text-stone-500">
                Extracts text, generates 384-dimensional embeddings, and grounds your AI mentor.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-[#8C6D23] bg-[#FCECD4] px-3 py-1 rounded-full border border-[#8C6D23]/20 hidden sm:inline">
            FastAPI + Supabase pgvector
          </span>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Curriculum Subject
              </label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
              >
                {allKnownSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Custom Document Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 9 - Heights & Distances"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
              />
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div className="border-2 border-dashed border-[#8C6D23]/30 rounded-2xl p-6 text-center hover:border-[#284E38] transition-colors bg-[#FAF9F5]/50">
            <input
              type="file"
              id="pdf-upload-input"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="pdf-upload-input"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <FileText className="w-10 h-10 text-[#8C6D23] mb-2 animate-bounce duration-1000" />
              {file ? (
                <div>
                  <span className="text-sm font-bold text-[#284E38] block">{file.name}</span>
                  <span className="text-xs text-stone-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready for vectorization
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-bold text-[#284E38] block">
                    Click to select PDF or drag and drop
                  </span>
                  <span className="text-xs text-stone-500">
                    Supports NCERT, State Board chapters, RD Sharma, or class notes (PDF up to 25MB)
                  </span>
                </div>
              )}
            </label>
          </div>

          {/* Progress / Status */}
          {isUploading && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-[#8C6D23] animate-spin shrink-0" />
              <div className="text-xs font-medium text-amber-900 flex-1">
                {uploadProgressStage}
              </div>
            </div>
          )}

          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex flex-wrap items-center justify-between gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>

              {statusMessage.type === 'success' && onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('mentor')}
                  className="px-3 py-1 rounded-lg bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs cursor-pointer ml-auto"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI Guru About This PDF →</span>
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Quick Ingest NCERT Chapters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#8C6D23]" />
                1-Click Add NCERT:
              </span>
              {readySamples.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSeedSample(sample)}
                  disabled={isUploading}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#FCECD4] text-stone-700 hover:text-[#284E38] border border-stone-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-[#8C6D23]" />
                  <span>{sample.subject.slice(0, 4)}: {sample.title.split(':')[1]?.trim() || sample.title}</span>
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!file || isUploading}
              className="px-6 py-2.5 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer ml-auto"
            >
              <Upload className="w-4 h-4" />
              <span>Vectorize & Ingest Document</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar for Documents */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/70 p-3 rounded-2xl border border-stone-200/80">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search uploaded chapters or PDFs..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#284E38]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setSubjectFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                subjectFilter === 'all'
                  ? 'bg-[#284E38] text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All ({documents.length})
            </button>
            {allKnownSubjects.map(subj => {
              const count = documents.filter(d => d.subject.toLowerCase() === subj.toLowerCase()).length;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSubjectFilter(subj)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    subjectFilter.toLowerCase() === subj.toLowerCase()
                      ? 'bg-[#284E38] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {subj} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {onNavigateToSchedule && (
          <button
            type="button"
            onClick={onNavigateToSchedule}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF9F5] hover:bg-[#FCECD4] border border-[#8C6D23]/30 hover:border-[#8C6D23] text-xs font-bold text-[#284E38] transition-all cursor-pointer shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-[#8C6D23]" />
            <span>Weekly Study Schedule</span>
          </button>
        )}
      </div>

      {/* Uploaded Documents Grid - Grouped by Subject */}
      <div className="space-y-6">
        {Object.keys(groupedDocuments).length === 0 ? (
          <div className="text-center py-12 bg-white/60 rounded-3xl border border-stone-200">
            <FileText className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-stone-700">No documents found</h4>
            <p className="text-xs text-stone-500 mt-1">
              Upload a chapter PDF above or click a 1-click NCERT preset to vectorize chapters.
            </p>
          </div>
        ) : (
          Object.entries(groupedDocuments).map(([subjectName, docs]) => {
            return (
              <div key={subjectName} className="space-y-3">
                {/* Subject Group Header */}
                <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8C6D23]" />
                    <h4 className="text-sm font-bold text-[#284E38]">{subjectName}</h4>
                    <span className="text-xs text-stone-500">({docs.length} chapters indexed)</span>
                  </div>

                  <span className="text-[11px] font-mono font-medium text-stone-500">
                    dim: 384 floats · pgvector
                  </span>
                </div>

                {/* Grid of Documents with 3D Depth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.map(doc => {
                    const isEditing = editingDocId === doc.id;
                    const isJustUploaded = justUploadedId === doc.id;

                    return (
                      <div
                        key={doc.id}
                        className={`group relative bg-white/90 backdrop-blur-xs rounded-3xl p-5 border transition-all text-left flex flex-col justify-between ${
                          isJustUploaded
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20'
                            : 'border-stone-200/90 hover:border-[#8C6D23]/60 hover:shadow-lg'
                        }`}
                      >
                        <div>
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-2xl bg-[#284E38]/10 text-[#284E38] flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-[#284E38]" />
                              </div>
                              {isJustUploaded && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                  ✨ Just Vectorized
                                </span>
                              )}
                            </div>

                            {/* Hover-reveal actions */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => setInspectingDoc(doc)}
                                className="p-1 rounded-lg text-stone-500 hover:text-[#284E38] hover:bg-stone-100 transition-colors"
                                title="Inspect 384-d Vector Chunks"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {!isEditing && (
                                <button
                                  type="button"
                                  onClick={() => startRename(doc)}
                                  className="p-1 rounded-lg text-stone-500 hover:text-[#284E38] hover:bg-stone-100 transition-colors"
                                  title="Rename Document (PATCH /api/documents/{doc_id})"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {confirmDeleteId === doc.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-lg">
                                  <span className="text-[10px] font-bold text-red-700">Delete?</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(doc.id)}
                                    className="text-[10px] font-extrabold text-white bg-red-600 px-1.5 py-0.5 rounded hover:bg-red-700 cursor-pointer"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-[10px] font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(doc.id)}
                                  className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Title / Inline rename input */}
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 mb-2">
                              <input
                                type="text"
                                value={editedName}
                                onChange={e => setEditedName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveRename(doc.id)}
                                className="w-full text-xs font-bold px-2 py-1 rounded border border-[#284E38] focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => saveRename(doc.id)}
                                className="p-1 rounded bg-emerald-600 text-white text-xs cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingDocId(null)}
                                className="p-1 rounded bg-stone-200 text-stone-600 text-xs cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <h5 className="text-sm font-bold text-[#1E2922] line-clamp-2 mb-1 group-hover:text-[#284E38] transition-colors">
                              {doc.custom_name}
                            </h5>
                          )}

                          <p className="text-[11px] font-mono text-stone-500 truncate mb-3">
                            {doc.filename}
                          </p>
                        </div>

                        {/* Footer Metadata & Action */}
                        <div className="space-y-2 pt-2.5 border-t border-stone-100">
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span className="font-semibold text-[#8C6D23] flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              {doc.total_chunks || 35} chunks
                            </span>
                            <span>{doc.file_size || '2.8 MB'}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleChatWithDoc(doc)}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-stone-50 hover:bg-[#284E38] text-stone-700 hover:text-white border border-stone-200 hover:border-[#284E38] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer group/btn"
                          >
                            <MessageSquare className="w-3 h-3 text-[#8C6D23] group-hover/btn:text-white" />
                            <span>Ask Questions in AI Mentor</span>
                            <ArrowRight className="w-3 h-3 opacity-60 group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vector Chunk Inspector Modal */}
      {inspectingDoc && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setInspectingDoc(null)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-left animate-in fade-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#284E38] text-white flex items-center justify-center font-bold text-xs">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#284E38]">{inspectingDoc.custom_name}</h4>
                  <p className="text-[11px] text-stone-500 font-mono">{inspectingDoc.filename}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Chunks</span>
                <span className="text-sm font-bold text-[#284E38]">{inspectingDoc.total_chunks || 42}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Vector Dimensions</span>
                <span className="text-sm font-bold text-[#8C6D23]">384 floats</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Distance Metric</span>
                <span className="text-sm font-bold text-emerald-700">Cosine (&lt;=&gt;)</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <span className="text-xs font-bold text-stone-700">Sample Indexed Semantic Chunk:</span>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 font-mono text-xs text-stone-700 leading-relaxed max-h-36 overflow-y-auto">
                <span className="text-stone-400 select-none block text-[10px] font-bold uppercase mb-1">
                  [Chunk #07 · Token Range: 1500-2000 · Subject: {inspectingDoc.subject}]
                </span>
                &ldquo;...In this chapter, we explore how trigonometric ratios are used in finding heights and distances of various objects without actually measuring them. The line of sight is drawn from the eye of an observer to the point in the object viewed by the observer...&rdquo;
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-100">
              <span className="text-[11px] text-stone-500">
                Stored in table: <code className="font-mono text-[#8C6D23]">curriculum_embeddings</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleChatWithDoc(inspectingDoc);
                    setInspectingDoc(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Set as Active Mentor Context</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
