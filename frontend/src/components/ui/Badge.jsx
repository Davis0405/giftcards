import React from 'react';

/**
 * NexoCard Reusable Badge / Chip
 * @param {'success'|'warning'|'danger'|'info'|'neutral'} variant
 * @param {boolean} dot - Renders a glowing pulsing status dot
 * @param {'sm'|'md'} size
 */
export default function Badge({
  children,
  variant = 'neutral',
  dot = false,
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`.trim()} {...props}>
      {dot && <span className="badge-dot" />}
      <span>{children}</span>
    </span>
  );
}
