import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { UserProvider } from './UserProvider.jsx';
import Dashboard from './dashboard/Dashboard.jsx';
import SignIn from './sign-in/SignIn.jsx';
import SignUp from './sign-up/SignUp.jsx';
import Update from './Update.jsx';
import About from './About.jsx';
import Translate from './Translate.jsx';
import Database from './Database.jsx';
import Process from './Process.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import reportWebVitals from './reportWebVitals.jsx';
import PreviewFilePage from './dashboard/components/PreviewFilePage.jsx';
import KnowledgeGraph from './KnowledgeGraph.jsx';
import Profile from './dashboard/components/Profile.jsx';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {/* 首页路由 */}
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 登录注册路由 */}
        <Route
          path="/sign-in"
          element={isAuthenticated ? <Navigate to="/" /> : <SignIn />}
        />
        <Route
          path="/sign-up"
          element={isAuthenticated ? <Navigate to="/" /> : <SignUp />}
        />

        {/* 受保护的其他路由 */}
        <Route
          path="/Update"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Update />
            </ProtectedRoute>
          }
        />
        <Route
          path="/About"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <About />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Translate"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Translate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Process"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Process />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Database"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Database />
            </ProtectedRoute>
          }
        />
        <Route
          path="/KnowledgeGraph"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <KnowledgeGraph />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Profile"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* 404 页面 */}
        <Route path="*" element={<Navigate to="/sign-in" />} />

        <Route path="/preview/:uuid" element={<PreviewFilePage />} />
      </Routes>
    </Router>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </UserProvider>
  </React.StrictMode>
);

reportWebVitals();
