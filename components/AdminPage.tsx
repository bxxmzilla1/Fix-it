import React, { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, Clock, RefreshCw, ArrowLeft, Calendar } from 'lucide-react';
import { Button } from './Button';
import { isAdmin, getAllUsers, getRevenue, getPurchaseHistory, subscribeToPurchases, User, Purchase, RevenueStats } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';

interface AdminPageProps {
  onClose: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<RevenueStats>({ total_revenue: 0, total_purchases: 0, total_tokens_sold: 0 });
  const [weeklyRevenue, setWeeklyRevenue] = useState<RevenueStats>({ total_revenue: 0, total_purchases: 0, total_tokens_sold: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState<RevenueStats>({ total_revenue: 0, total_purchases: 0, total_tokens_sold: 0 });
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  useEffect(() => {
    if (!isUserAdmin) return;

    // Subscribe to real-time purchase updates
    const unsubscribe = subscribeToPurchases((newPurchase) => {
      setPurchases(prev => [newPurchase, ...prev]);
      refreshRevenue();
    }, new Date());

    return () => {
      unsubscribe();
    };
  }, [isUserAdmin]);

  const checkAdminAndLoadData = async () => {
    setLoading(true);
    const adminStatus = await isAdmin();
    setIsUserAdmin(adminStatus);

    if (adminStatus) {
      await loadAllData();
    }
    setLoading(false);
  };

  const loadAllData = async () => {
    await Promise.all([
      loadUsers(),
      loadRevenue(),
      loadPurchases(),
    ]);
  };

  const loadUsers = async () => {
    const userList = await getAllUsers();
    setUsers(userList);
  };

  const loadRevenue = async () => {
    const now = new Date();
    
    // Daily (today)
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const daily = await getRevenue(startOfDay, now);
    setDailyRevenue(daily);

    // Weekly (last 7 days)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const weekly = await getRevenue(startOfWeek, now);
    setWeeklyRevenue(weekly);

    // Monthly (last 30 days)
    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);
    const monthly = await getRevenue(startOfMonth, now);
    setMonthlyRevenue(monthly);
  };

  const loadPurchases = async () => {
    const todayPurchases = await getPurchaseHistory(new Date());
    setPurchases(todayPurchases);
  };

  const refreshRevenue = async () => {
    setRefreshing(true);
    await loadRevenue();
    setRefreshing(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-6">You don't have permission to access the admin panel.</p>
            <Button onClick={onClose} fullWidth>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={onClose}
                icon={<ArrowLeft size={18} />}
              >
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-slate-500 text-sm mt-1">Real-time analytics and user management</p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={handleRefresh}
              icon={<RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />}
              disabled={refreshing}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Revenue Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Daily Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar size={24} className="text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Today</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-3xl font-bold text-slate-800">${dailyRevenue.total_revenue.toFixed(2)}</p>
                <p className="text-sm text-slate-500">Revenue</p>
              </div>
              <div className="flex items-center space-x-4 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-lg font-semibold text-slate-700">{dailyRevenue.total_purchases}</p>
                  <p className="text-xs text-slate-500">Purchases</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-700">{dailyRevenue.total_tokens_sold.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Tokens Sold</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Last 7 Days</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-3xl font-bold text-slate-800">${weeklyRevenue.total_revenue.toFixed(2)}</p>
                <p className="text-sm text-slate-500">Revenue</p>
              </div>
              <div className="flex items-center space-x-4 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-lg font-semibold text-slate-700">{weeklyRevenue.total_purchases}</p>
                  <p className="text-xs text-slate-500">Purchases</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-700">{weeklyRevenue.total_tokens_sold.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Tokens Sold</p>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign size={24} className="text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Last 30 Days</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-3xl font-bold text-slate-800">${monthlyRevenue.total_revenue.toFixed(2)}</p>
                <p className="text-sm text-slate-500">Revenue</p>
              </div>
              <div className="flex items-center space-x-4 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-lg font-semibold text-slate-700">{monthlyRevenue.total_purchases}</p>
                  <p className="text-xs text-slate-500">Purchases</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-700">{monthlyRevenue.total_tokens_sold.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Tokens Sold</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Users List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users size={24} className="text-blue-600" />
              <h2 className="text-xl font-bold text-slate-800">Registered Users</h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {users.length}
              </span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No users found</p>
              ) : (
                users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{u.email}</p>
                      <p className="text-xs text-slate-500">ID: {u.id.substring(0, 8)}...</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-blue-600">{u.tokens || 0}</p>
                      <p className="text-xs text-slate-500">tokens</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Purchase History */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Clock size={24} className="text-green-600" />
              <h2 className="text-xl font-bold text-slate-800">Today's Purchases</h2>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                {purchases.length}
              </span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {purchases.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No purchases today</p>
              ) : (
                purchases.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border-l-4 border-green-500"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-800">{p.package_name}</p>
                      <p className="font-bold text-green-600">${p.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-slate-600">
                        {p.total_tokens} tokens ({p.tokens_amount} + {p.bonus_tokens} bonus)
                      </p>
                      <p className="text-slate-500">
                        {new Date(p.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

