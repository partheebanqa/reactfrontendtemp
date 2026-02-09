import { JsonTreeView } from "../JsonTreeView";

export default function JsonTreeViewExample() {
  const sampleData = {
    folders: [
      {
        id: "44c3f586-196e-43b2-b26c-91ba41621cfe",
        collectionId: "5b522b64-c280-4fa6-b48d-ae6f8ad1a231",
        name: "CICD",
        createdAt: "2025-10-14T11:14:28.356011Z",
        updatedAt: "2025-10-14T11:14:28.356011Z",
        requests: [
          {
            id: "8f0d2fdb-00e5-4897-9ca1-2ae9c82d1aef",
            collectionId: "5b522b64-c280-4fa6-b48d-ae6f8ad1a231",
            folderId: "44c3f586-196e-43b2-b26c-91ba41621cfe",
            name: "CICDTestSuiteExecution_status",
            description: "",
            method: "GET",
            url: "https://apibackenddev.onrender.com",
            bodyType: "raw",
            bodyFormData: null,
            bodyRawContent: "",
            authorization: [],
            authorizationType: "none",
          },
        ],
      },
    ],
  };

  return (
    <div className="h-screen p-6">
      <JsonTreeView data={sampleData} />
    </div>
  );
}
