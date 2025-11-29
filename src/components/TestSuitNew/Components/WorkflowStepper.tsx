import { Check } from 'lucide-react';



export type WorkflowStep = 'basic-info' | 'prerequisites' | 'select-apis' | 'generate-tests' | 'select-tests' | 'execute';


interface WorkflowStepperProps {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
}

const steps = [
  { id: 'basic-info' as WorkflowStep, label: 'Basic Info', number: 1 },
  { id: 'prerequisites' as WorkflowStep, label: 'Prerequisites', number: 2 },
  { id: 'select-apis' as WorkflowStep, label: 'Select APIs', number: 3 },
  { id: 'select-tests' as WorkflowStep, label: 'Select Tests', number: 4 },
  { id: 'execute' as WorkflowStep, label: 'Execute', number: 5 },
];

export function WorkflowStepper({ currentStep, completedSteps }: WorkflowStepperProps) {
  const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isUpcoming = getCurrentStepIndex() < index;

          return (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-200
                  ${isCompleted ? 'bg-green-600 text-white' : ''}
                  ${isCurrent ? 'bg-[#136fb0] text-white ring-4 ring-blue-200' : ''}
                  ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
                `}>
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <div className={`
                  mt-2 text-xs font-medium text-center
                  ${isCurrent ? '#136fb0' : ''}
                  ${isCompleted ? 'text-green-600' : ''}
                  ${isUpcoming ? 'text-gray-400' : ''}
                `}>
                  {step.label}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className={`
                  h-0.5 flex-1 mx-2 transition-all duration-200
                  ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
