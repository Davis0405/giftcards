import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * NexoCard Reusable Search Input
 */
export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Buscar...',
  className = '',
  disabled = false,
  ...props
}) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`search-input-wrapper ${className}`.trim()}>
      <Search className="search-icon" size={17} />
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
      {value && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={handleClear}
          title="Limpiar búsqueda"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
