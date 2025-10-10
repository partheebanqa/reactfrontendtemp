export interface ApiTestCase {
  id: string;
  testSuiteId: string;
  requestId: string;
  name: string;
  description: string;
  category: number;
  order: number;
  method: string;
  url: string;
  bodyType: string;
  bodyFormData: any;
  bodyRawContent: string;
  authorizationType: string;
  authorization: any;
  headers: Array<{
    key: string;
    value: string;
    enabled: boolean;
  }>;
  params: Array<{
    key: string;
    value: string;
    enabled: boolean;
  }>;
  isSelected: boolean;
  expectedResponse: {
    status: number;
  };
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deletedAt: string;
  testcase_id:string;
  validation_type:string;
  severity:string;
  subCategory:string;

}

export interface TestCasesResponse {
  testCases: ApiTestCase[];
}
