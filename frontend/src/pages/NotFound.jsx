import { motion } from 'framer-motion';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none"
        style={{ background: '#00D4FF' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none"
        style={{ background: '#7B2FFF' }} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="text-center relative z-10"
      >
        <p className="text-[8rem] font-syne font-bold gradient-text leading-none mb-4">404</p>
        <h1 className="heading-md text-text-primary mb-3">Page Not Found</h1>
        <p className="text-text-muted max-w-sm mx-auto mb-8">
          The page you are looking for does not exist or has been moved. Head back to the dashboard or landing page.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={() => navigate(-1)} variant="secondary" icon={<ArrowLeft size={16} />}>
            Go Back
          </Button>
          <Link to="/">
            <Button icon={<Home size={16} />}>Home</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
