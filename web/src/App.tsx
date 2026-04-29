import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AppShell } from "./components/AppShell";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ApostilasPage } from "./pages/ApostilasPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { MapasMentaisPage } from "./pages/MapasMentaisPage";
import { QuestoesPage } from "./pages/QuestoesPage";
import { AdminImportPage } from "./pages/AdminImportPage";
import { PoliticasPage } from "./pages/PoliticasPage";
import { AdminApostilasPage } from "./pages/AdminApostilasPage";
import { AdminFlashcardsPage } from "./pages/AdminFlashcardsPage";
import { AdminMapasMentaisPage } from "./pages/AdminMapasMentaisPage";
import { MinhaAssinaturaPage } from "./pages/MinhaAssinaturaPage";
import { BlogListPage } from "./pages/BlogListPage";
import { BlogPostPage } from "./pages/BlogPostPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/politicas" element={<PoliticasPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="questoes" element={<QuestoesPage />} />
          <Route path="apostilas" element={<ApostilasPage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="mapas-mentais" element={<MapasMentaisPage />} />
          <Route path="minha-assinatura" element={<MinhaAssinaturaPage />} />

          <Route element={<AdminRoute />}>
            <Route path="admin/importacao" element={<AdminImportPage />} />
            <Route path="admin/apostilas" element={<AdminApostilasPage />} />
            <Route path="admin/flashcards" element={<AdminFlashcardsPage />} />
            <Route path="admin/mapas-mentais" element={<AdminMapasMentaisPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
