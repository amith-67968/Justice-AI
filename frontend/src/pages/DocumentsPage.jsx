import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Search, 
  Upload, 
  Filter, 
  FileText, 
  Image as ImageIcon, 
  Eye, 
  Download, 
  Trash2,
  FilePlus,
  MoreVertical
} from 'lucide-react';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');

  // Simple mock upload to make the UI feel alive during demo
  const handleMockUpload = () => {
    const newDoc = {
      id: Date.now(),
      name: `Legal_Brief_v${documents.length + 1}.pdf`,
      type: 'PDF',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      size: '2.4 MB'
    };
    setDocuments([newDoc, ...documents]);
  };

  const handleDelete = (id) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full min-h-screen bg-[#F8FAFC] relative pb-24"
    >
      {/* 1. Top Header Section */}
      <div className="w-full flex items-start justify-between pl-4 pr-6 sm:pr-8 pt-4 mb-8">
        <div className="flex items-start">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-500 hover:bg-white rounded-full transition-all border border-transparent shadow-sm hover:border-gray-200 hover:shadow mt-1"
          >
            <ChevronLeft size={24} />
          </motion.button>
          <div className="ml-4 text-left">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Documents</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage and access your legal files securely
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Content Wrapper */}
      <div className="w-full flex flex-col items-center px-6 sm:px-8 md:px-12">
        <div className="w-full max-w-6xl h-full flex flex-col">
          
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Filter */}
              <div className="relative flex-1 sm:flex-none">
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm font-medium cursor-pointer"
                >
                  <option value="All">All Files</option>
                  <option value="PDF">PDF</option>
                  <option value="Images">Images</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Filter size={16} className="text-gray-400" />
                </div>
              </div>

              {/* Upload Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMockUpload}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-5 rounded-xl transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 flex-1 sm:flex-none whitespace-nowrap"
              >
                <Upload size={18} />
                <span>Upload</span>
              </motion.button>
            </div>
          </div>

          {/* Document Grid / Empty State */}
          <div className="flex-1 w-full relative">
            <AnimatePresence mode="popLayout">
              {documents.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center py-40 px-4 w-full h-full"
                >
                  <span className="text-xl font-medium text-gray-400 select-none">Empty</span>
                </motion.div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {documents.map((doc) => (
                    <motion.div
                      key={doc.id}
                      variants={itemVariants}
                      layout
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                          {doc.type === 'PDF' ? <FileText size={24} /> : <ImageIcon size={24} />}
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-50">
                          <MoreVertical size={18} />
                        </button>
                      </div>

                      <h4 className="font-semibold text-gray-900 truncate mb-1" title={doc.name}>
                        {doc.name}
                      </h4>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-6 gap-3">
                        <span>{doc.date}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>{doc.size}</span>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-50 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <button className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-sm font-medium transition-colors">
                          <Eye size={16} /> View
                        </button>
                        <button className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors tooltip-trigger" title="Download">
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 border border-rose-100 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors tooltip-trigger" title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
