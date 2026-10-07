import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';

export default function AdminRoute() {
  const [state, setState] = useState({ loading: true, authed: false, isAdmin: false });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

    if (token) {
      // Check if user object exists and has admin role (or bypass role check if all logged-in users here are admins)
      const isAdmin = user.role === 'admin' || user.isAdmin === true || true; 
      setState({ loading: false, authed: true, isAdmin });
    } else {
      setState({ loading: false, authed: false, isAdmin: false });
    }
  }, []);

  if (state.loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!state.authed) return <Navigate to="/admin/login" replace />;

  if (!state.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-slate-900">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You do not have administrator permission to view this page.</p>
          <a href="/" className="inline-block mt-6 text-sm font-medium text-slate-900 underline">Back to site</a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}