import React from 'react';

/**
 * NexoCard Reusable Card Container
 */
export function Card({
  children,
  hoverable = false,
  className = '',
  style,
  onClick,
  ...props
}) {
  const cardClass = `card ${hoverable ? 'card-hoverable' : ''} ${className}`.trim();
  return (
    <div className={cardClass} style={style} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon: Icon,
  className = ''
}) {
  return (
    <div className={`card-header ${className}`.trim()}>
      <div className="card-header-text">
        {Icon && (
          <div className="card-header-icon">
            <Icon size={18} />
          </div>
        )}
        <div>
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '', style }) {
  return (
    <div className={`card-body ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', style }) {
  return (
    <div className={`card-footer ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export default Card;
