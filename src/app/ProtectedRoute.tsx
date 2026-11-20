import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../types";

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <div className="w-10 h-10 rounded-full border-3 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );
}

/**
 * Require authentication guard
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Customer Role Guard
 */
export function CustomerGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading, firebaseUser } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (profile && profile.role !== "customer") return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Worker Role Guard (Checks active vs pendingApproval status)
 */
export function WorkerGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading, firebaseUser, isPendingApproval } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (profile && profile.role !== "worker") return <Navigate to="/" replace />;
  if (isPendingApproval) return <Navigate to="/worker/onboarding" replace />;
  return <>{children}</>;
}

/**
 * Local & Regional Manager Guard
 */
export function ManagerGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading, firebaseUser, isManager } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (profile && !isManager && profile.role !== "admin" && profile.role !== "superAdmin") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

/**
 * Admin & SuperAdmin Guard
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading, firebaseUser } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * PickPal Control Guard (Manager & Admin Portal)
 */
export function ControlGuard({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin, isManager, loading, firebaseUser } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!firebaseUser) return <Navigate to="/control/login" replace />;
  if (profile?.role === "customer") return <Navigate to="/customer" replace />;
  if (profile?.role === "worker") return <Navigate to="/worker" replace />;
  if (!isAdmin && !isManager) return <Navigate to="/control/login" replace />;
  return <>{children}</>;
}

/**
 * Legacy Backwards-Compatible ProtectedRoute Wrapper
 */
export function ProtectedRoute({ role, children }: { role: UserRole; children: React.ReactNode }) {
  if (role === "customer") return <CustomerGuard>{children}</CustomerGuard>;
  if (role === "worker") return <WorkerGuard>{children}</WorkerGuard>;
  if (role === "localManager" || role === "regionalManager" || role === "manager") {
    return <ManagerGuard>{children}</ManagerGuard>;
  }
  if (role === "admin" || role === "superAdmin") return <AdminGuard>{children}</AdminGuard>;
  return <AuthGuard>{children}</AuthGuard>;
}

/**
 * Automatic Role Redirector
 */
export function RoleRedirect() {
  const { profile, isAdmin, isManager, loading, firebaseUser } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!firebaseUser || !profile) return <Navigate to="/login" replace />;
  if (isAdmin || isManager) return <Navigate to="/control" replace />;
  if (profile.role === "worker") {
    if (profile.status === "pendingApproval") return <Navigate to="/worker/onboarding" replace />;
    return <Navigate to="/worker" replace />;
  }
  return <Navigate to="/customer" replace />;
}
