import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export type ShellOutletContext = {
  setShellImmersive: (immersive: boolean) => void;
};

export function useShellImmersion(immersive: boolean) {
  const context = useOutletContext<ShellOutletContext | undefined>();

  useEffect(() => {
    context?.setShellImmersive(immersive);

    return () => context?.setShellImmersive(false);
  }, [context?.setShellImmersive, immersive]);
}
