import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * NexoCard Reusable Metric / KPI Card
 * @param {string} title
 * @param {string|number} value
 * @param {string} trend
 * @param {boolean} trendUp
 * @param {string} subtitle
 * @param {React.ReactNode} icon
 * @param {'blue'|'cyan'|'emerald'|'amber'|'purple'} color
 */
export default function StatCard({
  title,
  value,
  trend,
  trendUp = true,
  subtitle,
  icon: Icon,
  color = 'blue',
  className = '',
  onClick,
  ...props
}) {
  return (
    <div
      className={`stat-card stat-card-${color} ${onClick ? 'stat-card-clickable' : ''} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className={`stat-icon-wrapper stat-icon-${color}`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-card-value tabular-nums">{value}</div>
        
        {(trend || subtitle) && (
          <div className="stat-card-footer">
            {trend && (
              <span className={`stat-trend ${trendUp ? 'trend-positive' : 'trend-negative'}`}>
                {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>{trend}</span>
              </span>
            )}
            {subtitle && <span className="stat-subtitle">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
