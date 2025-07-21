import React, { useState } from "react";
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
