import { motion } from 'framer-motion';

interface CentralityLoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

export default function CentralityLoadingIndicator({ 
  isVisible, 
  message = "🔄 Menghitung centrality..." 
}: CentralityLoadingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center space-x-3"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
      />
      <span className="text-sm font-medium text-gray-700">{message}</span>
    </motion.div>
  );
}