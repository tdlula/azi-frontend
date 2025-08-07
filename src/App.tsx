import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardMinimal from "@/pages/dashboard-minimal";
import SimpleChatFixed from "@/pages/simple-chat-fixed";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="azi-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            <ErrorBoundary>
              <Router>
                <Switch>
                  <Route path="/login" component={LoginPage} />
                  <Route path="/">
                    <ProtectedRoute>
                      <DashboardMinimal />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard">
                    <ProtectedRoute>
                      <DashboardMinimal />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard-minimal">
                    <ProtectedRoute>
                      <DashboardMinimal />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/chat">
                    <ProtectedRoute>
                      <SimpleChatFixed />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/settings">
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route component={NotFound} />
                </Switch>
              </Router>
            </ErrorBoundary>
          </AppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
