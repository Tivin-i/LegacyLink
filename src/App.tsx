import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { VaultProvider, useVault } from "./context/VaultContext";
import { UnlockPage } from "./pages/UnlockPage";
import { EntryListPage } from "./pages/EntryListPage";
import { EntryDetailPage } from "./pages/EntryDetailPage";
import { NewEntryPage } from "./pages/NewEntryPage";
import { ExportImportPage } from "./pages/ExportImportPage";

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
        path="/entries"
        element={
          <ProtectedRoute>
            <EntryListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entries/new"
        element={
          <ProtectedRoute>
            <NewEntryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entries/:id"
        element={
          <ProtectedRoute>
            <EntryDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/export-import"
        element={
          <ProtectedRoute>
            <ExportImportPage />
          </ProtectedRoute>
        }
      />
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
