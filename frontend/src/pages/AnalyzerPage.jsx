import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  UploadCloud,
  FileText,
  Loader2,
  AlertTriangle,
  Lightbulb,
  Scale,
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const ACCEPTED_FILES = '.pdf,.png,.jpg,.jpeg,.bmp,.tiff,.tif,.webp,.txt';

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

async function getErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }
  } catch {
    // Ignore response parsing errors and use the fallback message.
  }

  return fallbackMessage;
}

export default function AnalyzerPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragHover, setIsDragHover] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragHover(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setStatus('idle');
    setError('');
    setResult(null);
  };

  const handleAnalyzeClick = async () => {
    if (!file) return;

    setStatus('loading');
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(await getErrorMessage(uploadResponse, 'Document upload failed.'));
      }

      const uploadData = await uploadResponse.json();

      const analyzeResponse = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          structured_data: uploadData.structured_data,
          documents: uploadData.documents,
          raw_text: uploadData.extracted_text,
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error(await getErrorMessage(analyzeResponse, 'Case analysis failed.'));
      }

      const analysisData = await analyzeResponse.json();
      setResult({ upload: uploadData, analysis: analysisData });
      setStatus('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze the document right now.');
      setStatus('idle');
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.15, duration: 0.5 },
    }),
  };

  const analysis = result?.analysis;
  const structuredData = result?.upload?.structured_data;
  const documentAnalysis = toArray(analysis?.document_analysis);
  const strongPoints = toArray(analysis?.strong_points);
  const weakPoints = toArray(analysis?.weak_points);
  const nextSteps = toArray(analysis?.next_steps);
  const primaryEvidence = documentAnalysis[0]?.evidence_strength || structuredData?.evidence_strength || 'Moderate';
  const primaryEvidenceReason =
    documentAnalysis[0]?.reason ||
    structuredData?.reason ||
    'Evidence scoring is available after the document is processed.';

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-5xl h-full min-h-[85vh] flex flex-col items-center pt-8 pb-16"
    >
      {/* Header */}
      <div className="w-full flex items-center mb-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          className="p-2 text-slate-500 hover:bg-white rounded-full transition-all border border-transparent shadow-sm hover:border-gray-200 hover:shadow"
        >
          <ChevronLeft size={24} />
        </motion.button>
        <div className="ml-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Case Analyzer</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload a legal document to score case strength, case difficulty, and document evidence.
          </p>
        </div>
      </div>

      {/* Main Block */}
      <div className="w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 flex-1 flex flex-col relative overflow-hidden">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              className="flex flex-col items-center justify-center flex-1 h-full max-h-[500px]"
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragHover(true);
                }}
                onDragLeave={() => setIsDragHover(false)}
                onDrop={handleDrop}
                className={`w-full max-w-2xl aspect-[2/1] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer
                  ${isDragHover ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100/60'}
                  ${file ? 'border-emerald-400 bg-emerald-50/30' : ''}`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept={ACCEPTED_FILES}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFile(e.target.files[0]);
                      setError('');
                    }
                  }}
                />
                
                {file ? (
                  <div className="text-center animate-fade-in">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                      <FileText size={32} />
                    </div>
                    <p className="font-semibold text-gray-900 text-lg">{file.name}</p>
                    <p className="text-emerald-600 font-medium text-sm mt-1">Ready for analysis</p>
                  </div>
                ) : (
                  <div className="text-center pointer-events-none">
                    <UploadCloud size={48} className="text-gray-400 mx-auto mb-4" strokeWidth={1.5} />
                    <p className="text-lg font-medium text-gray-700">Drag and drop file here</p>
                    <p className="text-gray-500 text-sm mt-2">PDF, TXT, or image files up to 50MB</p>
                  </div>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={!file}
                onClick={handleAnalyzeClick}
                className={`mt-10 px-10 py-4 rounded-xl font-semibold text-white transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 
                  ${file ? 'bg-slate-900 hover:bg-slate-800 hover:shadow-lg focus:ring-slate-900' : 'bg-gray-300 cursor-not-allowed opacity-70'}`}
              >
                Start Legal Analysis
              </motion.button>
            </motion.div>
          )}

          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center justify-center flex-1 h-[400px]"
            >
              <Loader2 size={48} className="text-blue-600 animate-spin mb-6" />
              <h3 className="text-xl font-semibold text-gray-900">Processing document...</h3>
              <p className="text-gray-500 mt-2">Uploading, extracting facts, and scoring the case.</p>
            </motion.div>
          )}

          {status === 'results' && analysis && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 w-full"
            >
              <div className="mb-8 border-b border-gray-100 pb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Analysis Results</h3>
                  <p className="text-gray-500 mt-1 flex items-center gap-2">
                    <FileText size={16} /> {file?.name || 'Document'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Case Type: {structuredData?.case_type || 'Others'}
                  </span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Confidence: {analysis.confidence_score ?? 0}%
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={resetAnalysis}
                  className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                >
                  Analyze New File
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                
                <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants} className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Scale size={100} /></div>
                  <h4 className="text-emerald-800 font-semibold mb-2">Case Strength</h4>
                  <p className="text-3xl font-bold text-emerald-600">{analysis.case_strength}</p>
                  <p className="text-emerald-700/80 text-sm mt-4 leading-relaxed tracking-wide">
                    {analysis.summary}
                  </p>
                </motion.div>

                <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants} className="bg-amber-50 rounded-2xl p-6 border border-amber-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle size={100} /></div>
                  <h4 className="text-amber-800 font-semibold mb-2">Case Difficulty</h4>
                  <p className="text-3xl font-bold text-amber-600">{analysis.case_difficulty}</p>
                  <p className="text-amber-700/80 text-sm mt-4 leading-relaxed tracking-wide">
                    Difficulty is based on the extracted facts, missing evidence, and overall case complexity.
                  </p>
                </motion.div>

                {/* Result Card 3 */}
                <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants} className="bg-blue-50 rounded-2xl p-6 border border-blue-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Lightbulb size={100} /></div>
                  <h4 className="text-blue-800 font-semibold mb-2">Primary Evidence</h4>
                  <p className="text-3xl font-bold text-blue-600">{primaryEvidence}</p>
                  <p className="text-blue-900/80 text-sm mt-4 leading-relaxed tracking-wide">
                    {primaryEvidenceReason}
                    {/*
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Prior precedent strongly favors plaintiff</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Section 4.2 contains ambiguous phrasing</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Statute of limitations expires in 14 days</li>
                    */}
                  </p>
                </motion.div>

              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h4 className="text-gray-900 font-semibold mb-3">Strong Points</h4>
                  <ul className="space-y-3 text-sm text-gray-700">
                    {strongPoints.length > 0 ? (
                      strongPoints.map((point, index) => (
                        <li key={`strong-${index}`} className="flex items-start gap-3">
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">No strong points were returned for this case.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h4 className="text-gray-900 font-semibold mb-3">Weak Points</h4>
                  <ul className="space-y-3 text-sm text-gray-700">
                    {weakPoints.length > 0 ? (
                      weakPoints.map((point, index) => (
                        <li key={`weak-${index}`} className="flex items-start gap-3">
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">No major weak points were returned for this case.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h4 className="text-gray-900 font-semibold mb-3">Next Steps</h4>
                  <ul className="space-y-3 text-sm text-gray-700">
                    {nextSteps.length > 0 ? (
                      nextSteps.map((step, index) => (
                        <li key={`step-${index}`} className="flex items-start gap-3">
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">No next steps were returned for this case.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h4 className="text-gray-900 font-semibold mb-3">Document Analysis</h4>
                  <ul className="space-y-4 text-sm text-gray-700">
                    {documentAnalysis.length > 0 ? (
                      documentAnalysis.map((document, index) => (
                        <li key={`document-${index}`} className="rounded-xl border border-gray-200 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-gray-900">{document.document_type || `Document ${index + 1}`}</p>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {document.evidence_strength || 'Moderate'}
                            </span>
                          </div>
                          <p className="mt-2 text-gray-600">
                            {document.reason || 'No detailed reasoning was returned for this document.'}
                          </p>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">No document-level evidence breakdown was returned.</li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
