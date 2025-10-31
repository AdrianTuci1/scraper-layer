import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './components/providers/AppProviders.tsx';
import { Toaster } from './components/ui/sonner.tsx';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import './index.css';

// Pages
import SignInPage from './pages/SignInPage.tsx';
import SignUpPage from './pages/SignUpPage.tsx';
import DashboardLayout from './pages/DashboardLayout.tsx';
import HomeLandingPage from './pages/landing/page.tsx';

// Dashboard Pages
import WorkflowsPage from './pages/dashboard/workflows/page.tsx';
import HomePage from './pages/dashboard/home/page.tsx';
import BillingPage from './pages/dashboard/billing/page.tsx';
import CredentialsPage from './pages/dashboard/credentials/page.tsx';

// Workflow Pages
import EditorPage from './pages/workflow/_components/Editor.tsx';
import ExecutionsPage from './pages/workflow/runs/[workflowId]/page.tsx';
import ExecutionViewerPage from './pages/workflow/runs/[workflowId]/[executionId]/page.tsx';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function App() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/sign-in"
      appearance={{
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90 text-sm !shadow-none',
        },
      }}
    >
      <AppProviders>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomeLandingPage />} />
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />

            {/* Protected dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard/home" replace />} />
              <Route path="home" element={<HomePage />} />
              <Route path="workflows" element={<WorkflowsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="credentials" element={<CredentialsPage />} />
              <Route path="workflow/editor/:workflowId" element={<EditorPage />} />
              <Route
                path="workflow/runs/:workflowId"
                element={<ExecutionsPage />}
              />
              <Route
                path="workflow/runs/:workflowId/:executionId"
                element={<ExecutionViewerPage />}
              />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors />
      </AppProviders>
    </ClerkProvider>
  );
}

export default App;
