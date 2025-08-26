import { useAuth } from "@/hooks/use-auth";

export default function Header({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <header className="bg-white material-elevation-1 h-16 flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-medium text-grey-800">{title}</h2>
        {subtitle && <p className="text-sm text-grey-600">{subtitle}</p>}
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-grey-100 transition-colors">
          <span className="material-icons text-grey-600">notifications</span>
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="material-icons text-white text-sm">person</span>
          </div>
          <span className="text-sm font-medium text-grey-700">
            {user?.username || "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}