import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(3,8,18,0.95)',
          border: '1px solid rgba(0,212,255,0.15)',
          backdropFilter: 'blur(14px)',
          color: '#E8F4FD',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '14px',
          borderRadius: '14px',
          padding: '12px 16px',
          maxWidth: '380px',
        },
      }}
    />
  );
}
