import BreadCum from "@/components/BreadCum/Breadcum";
import DataManagement from "@/components/DataManement/DataManagement";
import { Database } from "lucide-react";



const DataManagementPage = () => {
    return(
        <>
        <BreadCum
        title="Data Management"
        subtitle="Manage environments, variables, and test datasets"
        showCreateButton={false}
        buttonTitle="Run Execution"
        onClickCreateNew={() => console.log("Create execution")}
        icon={Database}
        iconBgClass="bg-orange-100"
        iconColor="#f97316"
        iconSize={40}
      />
        <DataManagement />
        </>
    )
}
export default DataManagementPage;