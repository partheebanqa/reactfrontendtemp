import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiRequest } from "@/lib/queryClient";
import { API_METHODS } from "@/lib/constants";
import { 
  Play, 
  Plus, 
  Save, 
  Trash2, 
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Code,
  FileText
} from "lucide-react";
import RequestBuilder from "@/components/RequestBuilder";

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface TestAssertion {
  field: string;
  operator: string;
  expected: string;
}

const RequestBuilderPage: React.FC = () => {
  return (
    <RequestBuilder />
  );
};

export default RequestBuilderPage;
