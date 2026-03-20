import React from 'react';

export default React.memo(function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  onClick,
  ...rest
}) {
  return (
    <div
      onClick={onClick}
      className={[
        'glass-card',
        hover
          ? 'transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01] hover:border-primary/20 hover:bg-white/[0.04] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3),0_0_20px_rgba(0,212,255,0.05)]'
          : '',
        glow ? 'shadow-[0_0_30px_rgba(0,212,255,0.1)] border-primary/20' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
});
