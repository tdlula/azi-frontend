import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AppProvider } from "@/contexts/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardMinimal from "@/pages/dashboard-minimal";
import SimpleChatFixed from "@/pages/simple-chat-fixed";
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
        <AppProvider>
          <ErrorBoundary>
            <Router>
              <Switch>
                <Route path="/" component={DashboardMinimal} />
                <Route path="/dashboard" component={DashboardMinimal} />
                <Route path="/chat" component={SimpleChatFixed} />
                <Route component={NotFound} />
              </Switch>
            </Router>
          </ErrorBoundary>
        </AppProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
