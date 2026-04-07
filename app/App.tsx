import { useEffect } from "react";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/Auth";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import Approvals from "./pages/Approvals";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const AUTH_ACTIVITY_KEY = "lastActivityAt";

const App = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isAuthInitialized = useAuthStore((state) => state.isAuthInitialized);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const markActive = () => {
      localStorage.setItem(AUTH_ACTIVITY_KEY, Date.now().toString());
    };

    const checkIdleTimeout = () => {
      const lastActivityRaw = localStorage.getItem(AUTH_ACTIVITY_KEY);
      const lastActivity = lastActivityRaw ? Number(lastActivityRaw) : 0;

      if (!lastActivity) {
        markActive();
        return;
      }

      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        logout();
      }
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    markActive();
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, markActive),
    );
    const intervalId = window.setInterval(checkIdleTimeout, 60 * 1000);

    return () => {
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, markActive),
      );
      window.clearInterval(intervalId);
    };
  }, [token, logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* <Toaster /> */}
        <Sonner />
        {!isAuthInitialized ? (
          <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-400" />
              <p className="text-sm text-slate-300">
                Loading your workspace...
              </p>
            </div>
          </div>
        ) : (
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
