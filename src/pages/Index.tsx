import { lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Login from '@/components/auth/Login';
import { LoadingFallback } from '@/components/ui/spinner';

const AppShell = lazy(() => import('@/components/home/AppShell'));

const Index = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  if (loading) return <LoadingFallback className="min-h-dvh bg-background" />;
  if (!user) return <Login />;
  return <Suspense fallback={<LoadingFallback className="min-h-dvh bg-background" />}>
    <AppShell user={user} isAdmin={isAdmin} signOut={signOut} />
  </Suspense>;
};
export default Index;
