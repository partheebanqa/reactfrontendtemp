import React from 'react';
import { MoreHorizontal, Pencil } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="p-8 bg-gray-100 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Welcome to your Dashboard</h1>
        <div className="flex items-center">
          <button className="mr-4 text-gray-600 hover:text-gray-900">
            <MoreHorizontal size={20} />
          </button>
          <button className="flex items-center bg-white border border-blue-500 text-blue-500 px-4 py-2 rounded-md text-sm hover:bg-blue-50 transition-colors">
            <Pencil size={16} className="mr-2" />
            Design Site
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-8 min-h-[400px]">
        {/* Dashboard content would go here */}
      </div>
    </div>
  );
};

export default Dashboard;