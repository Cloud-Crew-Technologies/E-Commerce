export default function StatCard({ title, value, icon, color, trend, isWarning }) {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
  };

  const trendColorClasses = {
    green: "text-green-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    red: "text-red-600",
  };

  return (
    <div className="bg-white rounded-lg material-elevation-2 p-6 card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-grey-600">{title}</p>
          <p className="text-2xl font-bold text-grey-900">{value}</p>
          <p className={`text-sm mt-1 flex items-center ${
            isWarning ? trendColorClasses.red : trendColorClasses[color]
          }`}>
            <span className="material-icons text-xs mr-1">
              {isWarning ? "warning" : "trending_up"}
            </span>
            {trend}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <span className="material-icons">{icon}</span>
        </div>
      </div>
    </div>
  );
}