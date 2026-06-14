import type { ReactNode } from "react";

type PortalIconButtonProps = {
  children: ReactNode;
};

export const PortalIconButton = ({ children }: PortalIconButtonProps) => {
  return (
    <div className="bg-muted/60 flex h-10 w-10 items-center justify-center rounded-full">
      {children}
    </div>
  );
};
