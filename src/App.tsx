import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import ReservasPage from "./pages/ReservasPage";
import MateriaisPage from "./pages/MateriaisPage";
import ImportarPage from "./pages/ImportarPage";
import ImportarPDFPage from "./pages/ImportarPDFPage";
import AnalisesPage from "./pages/AnalisesPage";
import DivergenciasPage from "./pages/DivergenciasPage";
import EmpreiteirasPage from "./pages/EmpreiteirasPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/reservas" element={<ProtectedRoute><ReservasPage /></ProtectedRoute>} />
          <Route path="/materiais" element={<ProtectedRoute><MateriaisPage /></ProtectedRoute>} />
          <Route path="/importar" element={<ProtectedRoute><ImportarPage /></ProtectedRoute>} />
          <Route path="/analises" element={<ProtectedRoute><AnalisesPage /></ProtectedRoute>} />
          <Route path="/divergencias" element={<ProtectedRoute><DivergenciasPage /></ProtectedRoute>} />
          <Route path="/empreiteiras" element={<ProtectedRoute><EmpreiteirasPage /></ProtectedRoute>} />
          <Route path="/importar-pdf" element={<ProtectedRoute><ImportarPDFPage /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
