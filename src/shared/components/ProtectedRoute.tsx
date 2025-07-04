import { ReactNode } from "react";
import FeatureGate from "./FeatureGate";

interface ProtectedRouteProps {
  feature: string;
  roles?: string[];
  children: ReactNode;
}

export default function ProtectedRoute({ feature, roles, children }: ProtectedRouteProps) {
  return (
    <FeatureGate feature={feature} roles={roles} showUpgrade={true}>
      {children}
    </FeatureGate>
  );
}