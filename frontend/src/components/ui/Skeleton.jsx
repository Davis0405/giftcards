import React from 'react';

/**
 * NexoCard Shimmer Skeleton Loader
 */
export default function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
  count = 1,
  style = {}
}) {
  const elements = Array.from({ length: count });

  if (count === 1) {
    return (
      <div
        className={`skeleton ${className}`.trim()}
        style={{ width, height, borderRadius, ...style }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width }}>
      {elements.map((_, index) => (
        <div
          key={index}
          className={`skeleton ${className}`.trim()}
          style={{ width: '100%', height, borderRadius, ...style }}
        />
      ))}
    </div>
  );
}
