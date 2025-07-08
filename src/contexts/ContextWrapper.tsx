import { FeatureGateProvider } from "./FeatureGateContext";
import { RequestProvider } from "./RequestContext";
import { SchemaProvider } from "./SchemaContext";
import { WorkspaceProvider } from "./WorkspaceContext";

export const ContextWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <WorkspaceProvider>
    <SchemaProvider>
      <FeatureGateProvider>
        <RequestProvider>{children}</RequestProvider>
      </FeatureGateProvider>
    </SchemaProvider>
    </WorkspaceProvider>
  );
};
