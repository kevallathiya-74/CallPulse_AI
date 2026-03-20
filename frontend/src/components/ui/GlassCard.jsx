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
          ? 'transition-all duration-400 hover:-translate-y-1.5 hover:scale-[1.008] hover:border-primary/35 hover:bg-white/[0.05] hover:shadow-[0_22px_45px_rgba(0,0,0,0.32),0_0_26px_rgba(0,212,255,0.08)]'
          : '',
        glow ? 'shadow-[0_0_34px_rgba(0,212,255,0.16)] border-primary/35' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
});
