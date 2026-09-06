import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    "relative inline-flex items-center justify-center gap-2 overflow-hidden px-6 py-3 font-bold tracking-wide rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 ease-out transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none disabled:hover:translate-y-0 select-none whitespace-nowrap";

  const primaryStyles =
    "bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white shadow-sky-500/25 hover:shadow-sky-500/40 focus:ring-sky-400";
  const secondaryStyles =
    "bg-slate-700 hover:bg-slate-600 text-slate-100 shadow-slate-900/50 focus:ring-slate-400 border border-slate-600";

  const styles = variant === 'primary' ? primaryStyles : secondaryStyles;

  return (
    <button className={`${baseStyles} ${styles} ${className}`} {...props}>
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};