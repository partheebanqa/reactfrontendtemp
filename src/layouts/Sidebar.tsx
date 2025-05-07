// // import React, { useState } from 'react';
// // import { History, FolderTree, Database } from 'lucide-react';
// // import DataRepoModal from '../components/DataRepoModal';

// // interface SidebarProps {
// //   onCollectionsClick: () => void;
// // }

// // const Sidebar: React.FC<SidebarProps> = ({ onCollectionsClick }) => {
// //   const [isDataRepoOpen, setIsDataRepoOpen] = useState(false);

// //   return (
// //     <>
// //       <aside className="w-16 bg-white text-gray-800 flex flex-col border-r">
// //         <div className="flex-1 overflow-auto">
// //           <div className="p-2">
// //             <button
// //               className="flex flex-col items-center justify-center w-full p-2 rounded cursor-pointer"
// //               onClick={onCollectionsClick}
// //               title="Collections"
// //             >
// //               <FolderTree size={20} />
// //               <span className="text-xs mt-1">Collections</span>
// //             </button>
// //             <button
// //               className="flex flex-col items-center justify-center w-full p-2 rounded cursor-pointer"
// //               title="History"
// //             >
// //               <History size={20} />
// //               <span className="text-xs mt-1">History</span>
// //             </button>
// //             <button
// //               className="flex flex-col items-center justify-center w-full p-2 rounded cursor-pointer"
// //               onClick={() => setIsDataRepoOpen(true)}
// //               title="Data Repo"
// //             >
// //               <Database size={20} />
// //               <span className="text-xs mt-1">Data Repo</span>
// //             </button>
// //           </div>
// //         </div>
// //       </aside>

// //       <DataRepoModal 
// //         isOpen={isDataRepoOpen} 
// //         onClose={() => setIsDataRepoOpen(false)} 
// //       />
// //     </>
// //   );
// // };



// import React, { useState } from 'react';
// import {
//   FaHome, FaMoneyCheckAlt, FaChartLine, FaCogs, FaRocket, FaBolt, FaBoxOpen,
//   FaMobileAlt, FaEnvelope, FaUserFriends, FaBullhorn, FaChevronLeft, FaChevronRight, FaFlask
// } from 'react-icons/fa';
// import { Link, useLocation } from 'react-router-dom';

// const menuItems = [
//   { label: 'Dashboard', icon: <FaHome />, path: '/dashboard' },
//   { label: 'API Test', icon: <FaFlask />, path: '/apitest' },
//   { label: 'Getting Paid', icon: <FaMoneyCheckAlt />, path: '/apitest'  },
//   { label: 'Sales', icon: <FaBoxOpen />, path: '/apitest'  },
//   { label: 'Apps', icon: <FaRocket />, path: '/apitest'  },
//   { label: 'Site & Mobile App', icon: <FaMobileAlt/>, path: '/apitest' },
//   { label: 'Inbox', icon: <FaEnvelope />, path: '/apitest'  },
//   { label: 'Customers & Leads', icon: <FaUserFriends />, path: '/apitest'  },
//   { label: 'Marketing', icon: <FaBullhorn />, path: '/apitest'  },
//   { label: 'Analytics', icon: <FaChartLine />, path: '/apitest'  },
//   { label: 'Automations', icon: <FaBolt />, path: '/apitest'  },
//   { label: 'Settings', icon: <FaCogs />, path: '/apitest'  },
// ];

// const Sidebar: React.FC = () => {
//   const [collapsed, setCollapsed] = useState(true);
//   const location = useLocation();

//   return (
//     <div
//       className={`relative bg-gray-900 text-white transition-all duration-300 ease-in-out ${
//         collapsed ? 'w-16' : 'w-64'
//       }`}
//     >
//       {/* Toggle Button */}
//       <button
//         onClick={() => setCollapsed(!collapsed)}
//         className="absolute -right-3 top-4 z-10 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center shadow"
//       >
//         {collapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
//       </button>

//       {/* Navigation */}
//       <nav className="flex flex-col space-y-1">
//         {menuItems.map(({ label, icon, path }) => (
//           <Link 
//               to={path}
//               key={label}
//               className={`flex items-center gap-3 px-4 py-2 transition-all duration-500 ease-in-out hover:bg-gray-700 ${
//                 location.pathname === path ? 'bg-gray-800' : ''
//               }`}
//             >
//               <span className="text-lg p-2">{icon}</span>
//               <span
//                 className={`whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out ${
//                   collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
//                 }`}
//               >
//                 {label}
//               </span>
//             </Link>
//         ))}
//       </nav>
//     </div>
//   );
// };

// export default Sidebar;


