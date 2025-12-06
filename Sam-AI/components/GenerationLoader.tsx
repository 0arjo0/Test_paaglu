
import React, { useState, useEffect } from 'react';
import { IconSparkles, IconSamLogo, IconShield, IconSearch, IconCheck, IconFileText } from './ui/Icons';

export const GenerationLoader: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: "Validating Safety & Compliance", icon: <IconShield className="w-5 h-5" />, duration: 1500 },
    { label: "Analyzing Product Details", icon: <IconSearch className="w-5 h-5" />, duration: 1000 },
    { label: "Drafting Optimized Copy", icon: <IconFileText className="w-5 h-5" />, duration: 2000 },
    { label: "Finalizing SEO & Formatting", icon: <IconSamLogo className="w-5 h-5" />, duration: 1000 },
  ];

  useEffect(() => {
    let stepIndex = 0;
    
    const nextStep = () => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setCurrentStep(stepIndex);
        // Randomize duration slightly to feel organic
        const duration = steps[stepIndex].duration + (Math.random() * 500);
        timeout = setTimeout(nextStep, duration);
      }
    };

    let timeout = setTimeout(nextStep, steps[0].duration);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="h-full min-h-[600px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 w-full max-w-sm">
        
        {/* Central Pulsing Icon */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center relative z-10 border border-slate-100">
               {/* Animated Icon Switching */}
               <div className="text-primary-600 animate-bounce">
                 {steps[currentStep].icon}
               </div>
            </div>
            {/* Ripples */}
            <div className="absolute inset-0 bg-primary-400/20 rounded-3xl animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 bg-indigo-400/20 rounded-3xl animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-8">
           <div 
             className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 transition-all duration-700 ease-out"
             style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
           ></div>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div 
                key={index} 
                className={`flex items-center gap-4 transition-all duration-500 ${
                  isActive ? 'scale-105 opacity-100 translate-x-2' : 
                  isCompleted ? 'opacity-50' : 'opacity-30'
                }`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300
                  ${isActive ? 'border-primary-500 text-primary-600 bg-primary-50' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white' : 'border-slate-200 text-slate-400'}
                `}>
                  {isCompleted ? <IconCheck size={14} className="text-white" /> : index + 1}
                </div>
                
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                    {step.label}
                  </p>
                  {isActive && (
                    <p className="text-[10px] text-primary-500 font-semibold uppercase tracking-wider animate-pulse">
                      Processing...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
