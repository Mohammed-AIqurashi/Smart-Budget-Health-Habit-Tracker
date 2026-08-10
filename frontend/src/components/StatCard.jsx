const StatCard = ({ title, value, subtitle, icon: Icon, iconColor = 'bg-primary-100 text-primary-600', trend, trendDirection }) => {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trendDirection === 'up' ? 'text-success-600 dark:text-success-400' : trendDirection === 'down' ? 'text-danger-600 dark:text-danger-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;