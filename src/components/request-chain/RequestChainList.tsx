import { Filter, Play, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";

const RequestChainList: React.FC = () => {
    return (
       <div className="py-6 px-4">
        <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Request Chain</h1>
            <Link
            to="/request-chain/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
            <Plus className="h-4 w-4 mr-2" />
            Create Request Chain
            </Link>
        </div>
         <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search request chain..."
            //   value={searchTerm}
            //   onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
            //   value={selectedFilter}
            //   onChange={(e) => setSelectedFilter(e.target.value)}
              className="block border border-gray-300 rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Play className="h-4 w-4 mr-2" />
            Run All Request Chains
          </button>
        </div>
      </div>
        </div>


    )
};

export default RequestChainList;