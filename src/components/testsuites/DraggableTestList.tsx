import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Grip, Trash2, Layers, Activity, ShieldAlert } from 'lucide-react';
import { TestCase } from '../../shared/types/testSuitesTypes';

interface DraggableTestListProps {
  tests: TestCase[];
  onRemove: (id: string) => void;
  onReorder: (reorderedTests: TestCase[]) => void;
}

const DraggableTestList: React.FC<DraggableTestListProps> = ({
  tests,
  onRemove,
  onReorder,
}) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(tests);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onReorder(items);
  };
  
  // Function to get category icon
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'functional':
        return <Layers className="h-4 w-4 text-blue-500" />;
      case 'performance':
        return <Activity className="h-4 w-4 text-purple-500" />;
      case 'security':
        return <ShieldAlert className="h-4 w-4 text-orange-500" />;
      default:
        return <Layers className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="test-list">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2 max-h-[400px] overflow-y-auto"
          >
            {tests.map((test, index) => (
              <Draggable key={test.id} draggableId={test.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center">
                      <div {...provided.dragHandleProps} className="mr-3 cursor-grab">
                        <Grip className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex items-center">
                        {getCategoryIcon(test.category)}
                        <div className="ml-2">
                          <h4 className="font-medium text-gray-900">{test.name}</h4>
                          <p className="text-xs text-gray-500">{test.description}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(test.id)}
                      className="ml-2 p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                      title="Remove from test suite"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableTestList;