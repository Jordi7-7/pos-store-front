import React from 'react';
import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface WizardStepItem {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface WizardProgressBarProps {
  steps: WizardStepItem[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
}

export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full bg-card/80 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = isCompleted && !!onStepClick;

          return (
            <React.Fragment key={step.number}>
              <div
                onClick={() => isClickable && onStepClick?.(step.number)}
                className={`flex items-center gap-3.5 transition-all select-none ${
                  isClickable ? 'cursor-pointer group' : ''
                } ${!isCurrent && !isCompleted ? 'opacity-45 hover:opacity-60' : 'opacity-100'}`}
              >
                {/* Step Circle Indicator */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-95'
                      : isCurrent
                      ? 'bg-primary/15 text-primary border-2 border-primary/50 font-black ring-4 ring-primary/10 shadow-sm scale-100'
                      : 'bg-muted/60 text-neutral border border-border/70'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3] animate-in zoom-in-50 duration-200" />
                  ) : (
                    <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                  )}
                </div>

                {/* Text Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.2 rounded ${
                        isCurrent
                          ? 'bg-primary/15 text-primary'
                          : isCompleted
                          ? 'bg-primary/10 text-primary'
                          : 'text-neutral'
                      }`}
                    >
                      Paso {step.number}
                    </span>
                    {isCurrent && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                  </div>
                  <h4
                    className={`text-xs sm:text-[13px] font-bold truncate transition-colors ${
                      isCurrent
                        ? 'text-primary'
                        : isCompleted
                        ? 'text-secondary group-hover:text-primary'
                        : 'text-neutral'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="hidden sm:block text-[11px] text-neutral/80 truncate max-w-[180px]">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connecting line between steps */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block flex-1 h-[2px] mx-3 bg-border/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isCompleted ? 'bg-primary w-full' : 'bg-transparent w-0'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

