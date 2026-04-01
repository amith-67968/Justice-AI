import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, BrainCircuit, User, Mic } from 'lucide-react';

import { postJson } from '../utils/api';

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello, I am JusticeAI. How can I assist you with your legal questions today?',
      relevantLaws: [],
      explanation: '',
      whyApplicable: '',
      nextSteps: [],
      sources: [],
    },
  ]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInputMessage((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleListen = (e) => {
    e.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
      return;
    }

    alert('Your browser does not support the Web Speech API');
  };

  const handleSend = async (e) => {
    e?.preventDefault();

    const prompt = inputMessage.trim();
    if (!prompt || isTyping) {
      return;
    }

    const userMessage = {
      id: createMessageId(),
      sender: 'user',
      text: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setError('');
    setIsTyping(true);

    try {
      const response = await postJson(
        '/chat',
        { user_query: prompt },
        'Unable to reach the legal assistant right now.'
      );

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          sender: 'ai',
          text: response.answer?.trim() || 'I could not generate an answer for that question.',
          relevantLaws: toArray(response.relevant_laws),
          explanation: response.explanation || '',
          whyApplicable: response.why_applicable || '',
          nextSteps: toArray(response.next_steps),
          sources: toArray(response.sources),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to reach the legal assistant right now.';

      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          sender: 'ai',
          text: 'I am having trouble reaching the legal assistant right now. Please try again in a moment.',
          relevantLaws: [],
          explanation: '',
          whyApplicable: '',
          nextSteps: ['Try sending the question again in a few seconds.'],
          sources: [],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 w-full h-full bg-white flex flex-col overflow-hidden z-20"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">JusticeAI Assistant</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-3 max-w-[80%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-200 text-slate-600'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User size={16} /> : <BrainCircuit size={16} />}
              </div>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {msg.sender === 'ai' && (
                  <div className="mt-4 space-y-3">
                    {msg.relevantLaws?.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Relevant Laws
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.relevantLaws.map((law, index) => (
                            <span
                              key={`${msg.id}-law-${index}`}
                              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                            >
                              {law}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.explanation && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Explanation
                        </p>
                        <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                          {msg.explanation}
                        </p>
                      </div>
                    )}

                    {msg.whyApplicable && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Why Applicable
                        </p>
                        <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                          {msg.whyApplicable}
                        </p>
                      </div>
                    )}

                    {msg.nextSteps?.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Next Steps
                        </p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {msg.nextSteps.map((step, index) => (
                            <li key={`${msg.id}-step-${index}`} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.sources?.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Sources
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.sources.map((source, index) => (
                            <span
                              key={`${msg.id}-source-${index}`}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-end gap-3 max-w-[80%]"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <BrainCircuit size={16} />
              </div>
              <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm flex items-center gap-1.5 h-[52px]">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 pb-8 md:pb-4 pt-4 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-3 max-w-4xl mx-auto w-full">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                if (error) {
                  setError('');
                }
              }}
              placeholder="Type your legal question here..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full pl-6 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
            <button
              type="button"
              onClick={toggleListen}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
                isListening
                  ? 'text-red-500 bg-red-50 hover:bg-red-100 animate-pulse'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Mic size={18} />
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full p-3.5 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
          >
            <Send size={18} className="translate-x-0.5 -translate-y-0.5" />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
