import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCheckmarkCircle, IoWarning, IoInformationCircle, IoCloseCircle } from 'react-icons/io5';

const Dialog = ({ 
  title, 
  content, 
  type = 'info', 
  showCancel = false,
  onConfirm,
  onCancel,
  onClose 
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: IoCheckmarkCircle,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/5',
          border: 'border-emerald-500/20',
          glow: 'shadow-emerald-500/20',
          button: 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
        };
      case 'error':
        return {
          icon: IoCloseCircle,
          color: 'text-rose-400',
          bg: 'bg-rose-500/5',
          border: 'border-rose-500/20',
          glow: 'shadow-rose-500/20',
          button: 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/25'
        };
      case 'warning':
        return {
          icon: IoWarning,
          color: 'text-amber-400',
          bg: 'bg-amber-500/5',
          border: 'border-amber-500/20',
          glow: 'shadow-amber-500/20',
          button: 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/25'
        };
      default:
        return {
          icon: IoInformationCircle,
          color: 'text-blue-400',
          bg: 'bg-blue-500/5',
          border: 'border-blue-500/20',
          glow: 'shadow-blue-500/20',
          button: 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25'
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className={`
            w-full max-w-md bg-gray-800/50 backdrop-blur-sm 
            rounded-2xl border ${config.border} 
            shadow-2xl overflow-hidden ${config.glow}
          `}
        >
          <div className={`p-6 ${config.bg}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-300 leading-relaxed">{content}</p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50 flex items-center justify-end gap-3">
            {showCancel && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium 
                          transition-colors duration-200 border border-gray-700/50 shadow-lg shadow-gray-900/50"
              >
                取消
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors duration-200 ${config.button}`}
            >
              确定
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Dialog; 