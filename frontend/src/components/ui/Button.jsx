import React from 'react';

const variantClasses = {
  primary:
    'bg-gradient-to-r from-primary to-secondary text-[#021325] border border-cyan-200/40 hover:shadow-[0_0_28px_rgba(0,212,255,0.45)] hover:scale-[1.03]',
  secondary:
    'bg-transparent border border-primary/45 text-primary hover:border-primary hover:bg-primary/12 hover:text-cyan-100 hover:scale-[1.02]',
  accent:
    'bg-gradient-to-r from-accent to-[#ffb703] text-[#231100] border border-orange-200/40 hover:shadow-[0_0_25px_rgba(255,122,26,0.45)] hover:scale-[1.03]',
  ghost:
    'bg-white/5 border border-white/15 text-text-primary hover:bg-white/10 hover:border-white/25 hover:scale-[1.02]',
  danger:
    'bg-gradient-to-r from-error to-[#ff7a1a] text-white border-0 hover:scale-[1.02]',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default React.memo(function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'btn-shine relative inline-flex items-center justify-center gap-2 font-semibold rounded-[50px] transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
});
