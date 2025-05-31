import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Code, 
  LayoutDashboard, 
  List, 
  Tags, 
  BarChart3,
  LogOut
} from "lucide-react";
import { useLocation } from "wouter";

export function Sidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const navigationItems = [
    { 
      icon: LayoutDashboard, 
      label: "Dashboard", 
      path: "/",
      active: location === "/"
    },
    { 
      icon: List, 
      label: "All Problems", 
      path: "/problems",
      active: location === "/problems"
    },
    { 
      icon: Tags, 
      label: "Categories", 
      path: "/categories",
      active: location === "/categories"
    },
    { 
      icon: BarChart3, 
      label: "Statistics", 
      path: "/stats",
      active: location === "/stats"
    },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Code className="text-white h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">LeetCode Helper</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <button
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                    item.active
                      ? "text-blue-600 bg-blue-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profileImageUrl || ""} alt="User avatar" />
            <AvatarFallback>
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"
              }
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-slate-600 hover:text-slate-900"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
