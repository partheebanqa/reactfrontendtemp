import React from 'react';
import { Check } from 'lucide-react';

export type WorkflowStep =
  | 'basic-info'
  | 'prerequisites'
  | 'select-apis'
  | 'generate-tests'
  | 'select-tests'
  | 'execute';

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

export function WorkflowStepper({
  currentStep,
  completedSteps,
}: WorkflowStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className='w-full py-2 px-2 sm:px-0'>
      <div className='flex items-center w-full'>
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <React.Fragment key={step.id}>
              {/* STEP DOT + LABEL */}
              <div className='flex flex-col items-center'>
                <div
                  className={[
                    'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm',
                    isCompleted && 'bg-green-600 text-white',
                    isCurrent &&
                      'bg-[#136fb0] text-white shadow-[0_0_0_3px_#bfdbfe]',
                    !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isCompleted ? <Check className='w-5 h-5' /> : step.number}
                </div>

                <div
                  className={[
                    'mt-1.5 text-[10px] sm:text-xs font-medium text-center leading-tight break-words max-w-[48px] sm:max-w-none',
                    isCurrent && 'text-[#136fb0]',
                    isCompleted && 'text-green-600',
                    isUpcoming && !isCompleted && !isCurrent && 'text-gray-400',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {step.label}
                </div>
              </div>

              {/* CONNECTOR LINE (between steps) */}
              {index < steps.length - 1 && (
                <div className='flex-1 flex items-start pt-4 mx-1 sm:mx-2'>
                  <div
                    className={[
                      'h-0.5 w-full transition-all duration-200',
                      index < currentIndex ? 'bg-green-600' : 'bg-gray-200',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
