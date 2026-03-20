import React from 'react';
import { motion } from 'framer-motion';

import Navbar from './Navbar';
import Footer from './Footer';
import ErrorBoundary from '../ui/ErrorBoundary';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const pageTransition = { duration: 0.4, ease: [0.23, 1, 0.32, 1] };

export default function PageWrapper({ children, hideFooter = false, className = '' }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={`min-h-screen bg-background ${className}`}
    >
      <Navbar />
      <ErrorBoundary>
        <main className="pt-16">
          {children}
        </main>
      </ErrorBoundary>
      {!hideFooter && <Footer />}
    </motion.div>
  );
}
