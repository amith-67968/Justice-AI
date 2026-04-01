import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, 
  FileSearch, 
  Cloud, 
  User, 
  LogOut, 
  Settings,
  MoreVertical,
  ChevronRight
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, buttonText, delay, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ scale: 1.03 }}
      className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center h-full"
    >
      <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-6">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-8 flex-grow leading-relaxed max-w-[250px]">
        {description}
      </p>
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 outline-none"
      >
        {buttonText}
      </motion.button>
    </motion.div>
  );
};

const CaseItem = ({ title, status, date }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'strong': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'weak': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, backgroundColor: '#f8fafc' }}
      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm transition-colors cursor-pointer group"
    >
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h4>
        <p className="text-xs text-gray-500 mt-1">{date}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusColor(status)}`}>
          {status}
        </span>
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <MoreVertical size={16} />
        </button>
      </div>
    </motion.div>
  );
};

const ProfileButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 left-8 z-50">
      <div className="relative">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 left-0 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-48 overflow-hidden"
            >
              <button className="flex items-center w-full gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                <Settings size={16} />
                <span>Account Settings</span>
              </button>
              <button className="flex items-center w-full gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left">
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white p-3 rounded-full shadow-md border border-gray-200 text-gray-600 hover:text-blue-600 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 group relative"
        >
          <User size={24} />
          {/* Tooltip */}
          <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Profile
          </span>
        </motion.button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();

  const features = [
    {
      title: "AI Legal Assistant",
      description: "Ask complex legal questions in simple language and get instant, accurate answers.",
      icon: BrainCircuit,
      buttonText: "Start Chat",
      path: "/chat"
    },
    {
      title: "Case Analyzer",
      description: "Upload case documents to analyze strengths, weaknesses, and precedents.",
      icon: FileSearch,
      buttonText: "Analyze Case",
      path: "/analyze"
    },
    {
      title: "Document Storage",
      description: "Manage your legal files, contracts, and case history securely in the cloud.",
      icon: Cloud,
      buttonText: "View Documents",
      path: "/documents"
    }
  ];

  const recentCases = [
    { id: 1, title: "Smith v. TechCorp - Breach of Contract", status: "Strong", date: "Oct 24, 2024" },
    { id: 2, title: "Estate Planning - Johnson Family", status: "Moderate", date: "Oct 21, 2024" },
    { id: 3, title: "IP Infringement - Default Widget", status: "Weak", date: "Oct 15, 2024" },
  ];

  /* Route page exit animations are naturally caught by wrapping elements if present,
     but we also apply an initial opacity config here for entering. */
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl w-full flex flex-col items-center relative z-10 my-auto"
    >
      <ProfileButton />
      
      {/* Top Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <BrainCircuit size={18} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            JusticeAI
          </h1>
        </div>
        <p className="text-sm font-medium text-blue-600 tracking-widest uppercase mb-10">
          AI-powered legal assistance
        </p>
        
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Welcome back
        </h2>
        <p className="text-lg text-slate-500">
          What would you like to do today?
        </p>
      </motion.div>

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-20 max-w-[1100px]">
        {features.map((feature, index) => (
          <FeatureCard 
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            buttonText={feature.buttonText}
            delay={0.1 * (index + 1)}
            onClick={() => navigate(feature.path)}
          />
        ))}
      </div>

      {/* Recent Cases Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="w-full max-w-3xl pb-10"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Cases
          </h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors">
            View all <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="space-y-3">
          {recentCases.map((caseItem) => (
            <CaseItem 
              key={caseItem.id}
              title={caseItem.title}
              status={caseItem.status}
              date={caseItem.date}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
