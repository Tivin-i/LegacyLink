import { Outlet, useMatch } from "react-router-dom";
import { TextureOverlay } from "./TextureOverlay";
import { AppLayout } from "./AppLayout";
import { ContextPanel } from "./ContextPanel";
import { useLayoutContext } from "../../context/LayoutContext";

export function ProtectedLayout() {
  const match = useMatch("/entries/:id");
  const entryId = match?.params.id;
  const { contextPanelActions } = useLayoutContext() ?? { contextPanelActions: null };

  const contextPanel =
    entryId != null && contextPanelActions ? (
      <ContextPanel
        onEdit={contextPanelActions.onEdit}
        onPrint={contextPanelActions.onPrint}
        relatedLinks={contextPanelActions.relatedLinks}
      />
    ) : null;

  return (
    <>
      <TextureOverlay />
      <AppLayout contextPanel={contextPanel}>
        <Outlet />
      </AppLayout>
    </>
  );
}
