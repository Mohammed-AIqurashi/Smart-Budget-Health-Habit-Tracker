const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'from-primary-500 to-primary-600',
  trend,
  trendDirection,
}) => {
  return (
    <div className="card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative group flex flex-col justify-between">
      {/* Accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentColor}`} />

      <div>
        {/* Header: Title + Icon */}
        <div className="flex items-center justify-between gap-2 mb-3 pt-0.5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
            {title}
          </p>
          {Icon && (
            <div
              className={`p-2 rounded-xl bg-gradient-to-br ${accentColor} shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200`}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Value: Full width row, no icon collision */}
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight mb-1">
          {value}
        </p>
      </div>

      {/* Footer: Subtitle / Trend */}
      <div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
        {trend && (
          <p
            className={`text-xs font-semibold mt-2 flex items-center gap-1 ${
              trendDirection === 'up'
                ? 'text-success-600 dark:text-success-400'
                : trendDirection === 'down'
                ? 'text-danger-600 dark:text-danger-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span>{trendDirection === 'up' ? '▲' : trendDirection === 'down' ? '▼' : '•'}</span>
            <span>{trend}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;