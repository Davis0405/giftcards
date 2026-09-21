import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * NexoCard Reusable Button
 * @param {'primary'|'secondary'|'outline'|'danger'|'ghost'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {React.ReactNode} icon
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseClass = `btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`.trim();

  return (
    <button
      type={type}
      className={baseClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <Loader2 className="btn-spinner" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : (
        Icon && <Icon className="btn-icon" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      )}
      <span>{children}</span>
    </button>
  );
}
