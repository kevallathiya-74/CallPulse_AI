import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Info } from 'lucide-react';
import React from 'react';
import { toUserFriendlyMessage } from '../utils/userFriendlyMessage';

const toastStyle = {
  background: 'rgba(3,8,18,0.95)',
  border: '1px solid rgba(0,212,255,0.15)',
  backdropFilter: 'blur(14px)',
  color: '#E8F4FD',
  fontFamily: 'Outfit, sans-serif',
  fontSize: '14px',
  borderRadius: '14px',
  padding: '12px 16px',
  maxWidth: '380px',
};

export function useToast() {
  const success = (message) =>
    toast.success(message, {
      style: toastStyle,
      duration: 4000,
      icon: React.createElement(CheckCircle2, { color: '#00E676', size: 20 }),
    });

  const error = (message) =>
    toast.error(toUserFriendlyMessage(message, { fallback: 'Something went wrong. Please try again.' }), {
      style: { ...toastStyle, borderColor: 'rgba(255,61,87,0.3)' },
      duration: 6000,
      icon: React.createElement(XCircle, { color: '#FF3D57', size: 20 }),
    });

  const warning = (message) =>
    toast(toUserFriendlyMessage(message, { fallback: 'Please review your input and try again.' }), {
      style: { ...toastStyle, borderColor: 'rgba(255,214,0,0.3)' },
      duration: 4000,
      icon: React.createElement(AlertTriangle, { color: '#FFD600', size: 20 }),
    });

  const info = (message) =>
    toast(message, {
      style: toastStyle,
      duration: 4000,
      icon: React.createElement(Info, { color: '#00D4FF', size: 20 }),
    });

  const loading = (message) =>
    toast.loading(message, {
      style: toastStyle,
      icon: React.createElement(Loader2, { color: '#00D4FF', size: 20, className: 'animate-spin' }),
    });

  const dismiss = (id) => toast.dismiss(id);

  return { success, error, warning, info, loading, dismiss };
}
