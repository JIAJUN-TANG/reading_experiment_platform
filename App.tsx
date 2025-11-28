import React, { useState, useEffect } from 'react';
import { User, Material, UserRole } from './types';
import { MOCK_MATERIALS } from './services/mockDatabase';
import { logger } from './services/loggerService';
import { findUserById } from './services/localStorageService';
import Reader from './components/Reader';
import AdminDashboard from './components/AdminDashboard';
import ParticipantHome from './components/ParticipantHome';

// Login Component
const LoginScreen = ({ onLogin }: { onLogin: (userId: string) => void }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    
    // 使用数据库服务查找用户
    setTimeout(async () => {
      try {
        const user = await findUserById(selectedUserId);
        if (user) {
          // 这里可以添加密码验证逻辑
          onLogin(selectedUserId);
        } else {
          setError('用户不存在');
        }
      } catch (err) {
        setError('登录失败，请稍后重试');
        console.error('登录失败:', err);
      } finally {
        setIsLoggingIn(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-brand-500 p-8 text-center">
          <h1 className="text-3xl font-serif font-bold text-white mb-2">ReadLab AI</h1>
          <p className="text-brand-100">实验平台</p>
        </div>
        
        <div className="p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">账号</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  placeholder="请输入您的账号"
                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-3 px-4 bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-3 px-4 bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-2">演示环境，任何密码都可以登录</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-70 disabled:cursor-wait"
            >
              {isLoggingIn ? '验证中...' : '登录'}
            </button>
          </form>

          <div className="pt-4 border-t text-center">
             <p className="text-xs text-gray-400">
               Protected by ReadLab Secure Access. <br/>
               登录即表示您同意研究相关条款。
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<Material[]>(MOCK_MATERIALS);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);

  // Load logger initially
  useEffect(() => {
    console.log("App initialized");
  }, []);

  const handleLogin = async (userId: string) => {
    const user = await findUserById(userId);
    if (user) {
      setCurrentUser(user);
      logger.log(user, 'LOGIN', 'User logged in');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      logger.log(currentUser, 'LOGOUT', 'User logged out');
    }
    setCurrentUser(null);
    setActiveMaterial(null);
  };

  const openMaterial = (material: Material) => {
    setActiveMaterial(material);
  };

  const closeMaterial = () => {
    setActiveMaterial(null);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Reader Overlay
  if (activeMaterial) {
    return (
      <Reader 
        material={activeMaterial} 
        user={currentUser} 
        onClose={closeMaterial} 
      />
    );
  }

  // Main Dashboard Layout
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Navigation */}
      <nav className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-serif font-bold">R</div>
              <span className="text-xl font-serif font-bold text-brand-900 tracking-tight">ReadLab AI</span>
              {currentUser.role === UserRole.ADMIN && (
                 <span className="ml-2 px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wider rounded-full">Admin Console</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end hidden sm:flex">
                 <span className="text-sm font-semibold text-gray-800">{currentUser.name}</span>
                 <span className="text-xs text-gray-500">{currentUser.role === UserRole.ADMIN ? 'Administrator' : 'Participant'}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm text-gray-500 font-medium hover:text-red-600 transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {currentUser.role === UserRole.ADMIN ? (
          <AdminDashboard 
            users={MOCK_USERS} 
            materials={materials} 
            setMaterials={setMaterials} 
          />
        ) : (
          <ParticipantHome 
            user={currentUser} 
            materials={materials} 
            onOpenMaterial={openMaterial} 
          />
        )}
      </main>
    </div>
  );
};

export default App;