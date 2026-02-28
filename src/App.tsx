import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { VaultProvider, useVault } from "./context/VaultContext";
import { LayoutProvider } from "./context/LayoutContext";
import { UnlockPage } from "./pages/UnlockPage";
import { EntryListPage } from "./pages/EntryListPage";
import { EntryDetailPage } from "./pages/EntryDetailPage";
import { NewEntryPage } from "./pages/NewEntryPage";
import { ExportImportPage } from "./pages/ExportImportPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { SuccessorGuidePage } from "./pages/SuccessorGuidePage";
import { HistoryPage } from "./pages/HistoryPage";
import { KeysPage } from "./pages/KeysPage";
import { PrintViewPage } from "./pages/PrintViewPage";
import { ProtectedLayout } from "./components/layout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isUnlocked } = useVault();
  if (!isUnlocked) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<UnlockPage />} />
      <Route
        element={
          <ProtectedRoute>
            <LayoutProvider>
              <ProtectedLayout />
            </LayoutProvider>
          </ProtectedRoute>
        }
      >
        <Route path="entries" element={<EntryListPage />} />
        <Route path="entries/new" element={<NewEntryPage />} />
        <Route path="entries/:id" element={<EntryDetailPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="successor-guide" element={<SuccessorGuidePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="keys" element={<KeysPage />} />
        <Route path="print" element={<PrintViewPage />} />
        <Route path="export-import" element={<ExportImportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <VaultProvider>
      <AppRoutes />
    </VaultProvider>
  );
}
