import React, { useState } from "react";
import RequestBuilder from "@/components/RequestBuilder";
import { ChartColumn } from "lucide-react";
import BreadCum from "@/components/BreadCum/Breadcum";

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

    <>
    <BreadCum
        title="Request Builder"
        subtitle="Get execution results of test suite and request chain"
        showCreateButton={false}
        buttonTitle="Run Execution"
        onClickCreateNew={() => console.log("Create execution")}
        icon={ChartColumn}
        iconBgClass="bg-blue-100"
        iconColor="#136fb0"
        iconSize={40}
      />
       
      <RequestBuilder />
     
      </>
    
  );
};

export default RequestBuilderPage;
