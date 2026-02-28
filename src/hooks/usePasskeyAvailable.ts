import { useState, useEffect } from "react";
import { isPasskeySupported, isPasskeyConfigured } from "../auth/passkey";

/**
 * Returns true when passkeys are supported and a passkey is already configured.
 */
export function usePasskeyAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (isPasskeySupported()) {
      isPasskeyConfigured().then((ok) => {
        if (!cancelled) setAvailable(ok);
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return available;
}
