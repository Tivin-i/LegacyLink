import type { CSSProperties } from "react";

/**
 * Shared layout and component styles for pages and components.
 * Keeps visual consistency and avoids duplication.
 */

export const layout: Record<string, CSSProperties> = {
  main: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "1.5rem 1rem",
  },
  mainCentered: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  section: {
    marginBottom: "2rem",
  },
};

export const links: Record<string, CSSProperties> = {
  back: {
    color: "#2563eb",
    textDecoration: "none",
    display: "inline-block",
    marginBottom: "1rem",
  },
  primary: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 500,
  },
  primaryWithMargin: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 500,
    marginTop: "0.5rem",
    display: "inline-block",
  },
};

export const typography: Record<string, CSSProperties> = {
  title: {
    margin: "0 0 1rem",
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  titleSmall: {
    margin: "0 0 0.25rem",
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  h2: {
    margin: "0 0 0.5rem",
    fontSize: "1.125rem",
    fontWeight: 600,
  },
  subtitle: {
    margin: "0 0 1.5rem",
    color: "#666",
    fontSize: "0.9375rem",
  },
  body: {
    margin: "0 0 0.75rem",
    color: "#555",
    fontSize: "0.9375rem",
  },
  meta: {
    margin: "0 0 1.5rem",
    color: "#666",
    fontSize: "0.9375rem",
  },
};

export const buttons: Record<string, CSSProperties> = {
  primary: {
    padding: "0.5rem 1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
  },
  primaryLarge: {
    padding: "0.75rem 1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  secondary: {
    padding: "0.5rem 0.75rem",
    background: "transparent",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9375rem",
  },
  outline: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid #2563eb",
    color: "#2563eb",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9375rem",
  },
  danger: {
    padding: "0.5rem 0.75rem",
    background: "transparent",
    color: "#b91c1c",
    border: "1px solid #b91c1c",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export const forms: Record<string, CSSProperties> = {
  input: {
    display: "block",
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    marginTop: "0.25rem",
  },
  inputLarge: {
    padding: "0.75rem 1rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  textarea: {
    display: "block",
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    marginTop: "0.25rem",
    resize: "vertical",
    minHeight: "4rem",
  },
  titleInput: {
    display: "block",
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    marginTop: "0.25rem",
  },
  field: {
    marginTop: "0.75rem",
  },
  fieldset: {
    marginBottom: "1.5rem",
    padding: "1rem",
    border: "1px solid #eee",
    borderRadius: "6px",
  },
  legend: {
    padding: "0 0.5rem",
    fontWeight: 600,
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "1.5rem",
  },
  formColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  formActionsRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  fileInputHidden: {
    position: "absolute",
    width: "0.1px",
    height: "0.1px",
    opacity: 0,
    overflow: "hidden",
    zIndex: -1,
  },
  labelBlock: {
    display: "block",
    marginBottom: "0.5rem",
  },
  cancel: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
  },
  submit: {
    padding: "0.5rem 1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
  },
};

export const messages: Record<string, CSSProperties> = {
  error: {
    margin: "0.75rem 0 0",
    color: "#b91c1c",
    fontSize: "0.875rem",
  },
  errorInline: {
    margin: 0,
    color: "#b91c1c",
    fontSize: "0.875rem",
  },
  success: {
    margin: "0.75rem 0 0",
    color: "#15803d",
    fontSize: "0.9375rem",
  },
  muted: {
    margin: 0,
    color: "#666",
    fontSize: "0.9375rem",
  },
};

export const card: CSSProperties = {
  width: "100%",
  maxWidth: "400px",
  padding: "2rem",
  background: "#fff",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};
