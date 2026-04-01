import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UploadCloud, FileText, Loader2, AlertTriangle, Lightbulb, Scale } from 'lucide-react';

export default function AnalyzerPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragHover, setIsDragHover] = useState(false);
  const [status, setStatus] = useState('idle'); // idle -> loading -> results

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragHover(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyzeClick = () => {
    if (!file) return;
    setStatus('loading');
    setTimeout(() => {
      setStatus('results');
    }, 2500); // 2.5s spinner
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.5 }
    })
  };

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
          <p className="text-gray-500 text-sm mt-1">Upload documents to extract critical insights and evaluate strength.</p>
        </div>
      </div>

      {/* Main Block */}
      <div className="w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 flex-1 flex flex-col relative overflow-hidden">
        
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
                onDragOver={(e) => { e.preventDefault(); setIsDragHover(true); }}
                onDragLeave={() => setIsDragHover(false)}
                onDrop={handleDrop}
                className={`w-full max-w-2xl aspect-2/1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer
                  ${isDragHover ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100/60'}
                  ${file ? 'border-emerald-400 bg-emerald-50/30' : ''}`}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <input id="file-upload" type="file" className="hidden" onChange={(e) => {
                  if (e.target.files) setFile(e.target.files[0]);
                }} />
                
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
                    <p className="text-gray-500 text-sm mt-2">PDF, DOCX up to 50MB</p>
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
              <h3 className="text-xl font-semibold text-gray-900">Scanning Document...</h3>
              <p className="text-gray-500 mt-2">Cross-referencing legal precedents</p>
            </motion.div>
          )}

          {status === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 w-full"
            >
              <div className="mb-8 border-b border-gray-100 pb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Analysis Results</h3>
                  <p className="text-gray-500 mt-1 flex items-center gap-2">
                    <FileText size={16}/> {file?.name || 'Document.pdf'}
                  </p>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setFile(null); setStatus('idle'); }}
                  className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                >
                  Analyze New File
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Result Card 1 */}
                <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants} className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Scale size={100} /></div>
                  <h4 className="text-emerald-800 font-semibold mb-2">Case Strength</h4>
                  <p className="text-3xl font-bold text-emerald-600">Strong</p>
                  <p className="text-emerald-700/80 text-sm mt-4 leading-relaxed tracking-wide">
                    The provided documents establish clear liability and breach of standard clauses with high confidence.
                  </p>
                </motion.div>

                {/* Result Card 2 */}
                <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants} className="bg-amber-50 rounded-2xl p-6 border border-amber-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle size={100} /></div>
                  <h4 className="text-amber-800 font-semibold mb-2">Case Difficulty</h4>
                  <p className="text-3xl font-bold text-amber-600">Moderate</p>
                  <p className="text-amber-700/80 text-sm mt-4 leading-relaxed tracking-wide">
                    Multi-jurisdictional elements detected. May require 2-3 expert witnesses to establish comprehensive facts.
                  </p>
                </motion.div>

                {/* Result Card 3 */}
                <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants} className="bg-blue-50 rounded-2xl p-6 border border-blue-100 relative overflow-hidden md:col-span-1">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Lightbulb size={100} /></div>
                  <h4 className="text-blue-800 font-semibold mb-2">Key Insights</h4>
                  <ul className="text-blue-900/80 text-sm mt-4 space-y-2 font-medium">
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Prior precedent strongly favors plaintiff</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Section 4.2 contains ambiguous phrasing</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Statute of limitations expires in 14 days</li>
                  </ul>
                </motion.div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
