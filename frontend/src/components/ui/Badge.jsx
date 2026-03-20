import React from 'react';

const variants = {
  primary: 'bg-primary/15 text-primary border-primary/30',
  secondary: 'bg-secondary/15 text-secondary border-secondary/30',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  error: 'bg-error/15 text-error border-error/30',
  muted: 'bg-white/5 text-text-muted border-white/10',
  accent: 'bg-accent/15 text-accent border-accent/30',
};

export default React.memo(function Badge({ children, variant = 'primary', className = '', dot = false }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant] || variants.muted,
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={[
            'w-1.5 h-1.5 rounded-full inline-block pulse-dot',
            variant === 'success' ? 'bg-success' :
            variant === 'error' ? 'bg-error' :
            variant === 'warning' ? 'bg-warning' : 'bg-primary',
          ].join(' ')}
        />
      )}
      {children}
    </span>
  );
});
