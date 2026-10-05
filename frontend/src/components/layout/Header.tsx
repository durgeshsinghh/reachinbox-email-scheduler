import { useAuth } from '../../context/AuthContext';
import { Mail, LogOut } from 'lucide-react';
import SlackConnect from '../slack/SlackConnect';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Outbox</span>
          </div>
          <div className="flex items-center space-x-4">
            <SlackConnect />
            {user && (
              <div className="flex items-center space-x-3">
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-500">
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
