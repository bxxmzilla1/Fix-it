import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../services/adminService';
import { Button } from './Button';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        // All authenticated users have admin access
        setIsUserAdmin(true);
        navigate('/admin', { replace: true });
      }
      setCheckingAdmin(false);
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Admin Access Required</h1>
            <p className="text-slate-600">You must be signed in to access the admin panel.</p>
          </div>
          <div className="space-y-3">
            <Button
              fullWidth
              onClick={() => navigate('/')}
              icon={<LogIn size={18} />}
            >
              Sign In to Continue
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/')}
              icon={<ArrowLeft size={18} />}
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
            <p className="text-slate-600 mb-4">
              You don't have permission to access the admin panel.
            </p>
            <p className="text-sm text-slate-500">
              Signed in as: <span className="font-semibold">{user.email}</span>
            </p>
          </div>
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/')}
            icon={<ArrowLeft size={18} />}
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return null; // Will redirect if admin
};

