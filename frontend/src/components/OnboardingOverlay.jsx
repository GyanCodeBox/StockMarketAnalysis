import React, { useState, useEffect } from 'react';
import { ONBOARDING_CARDS } from '../constants/glossary';
import { X, ChevronRight, ChevronLeft, ShieldAlert, Rocket, Target } from 'lucide-react';

const OnboardingOverlay = ({ forceShow = false, onClose = () => { } }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding_v1');
        if (!hasSeenOnboarding || forceShow) {
            setIsVisible(true);
        }
    }, [forceShow]);

    const handleDismiss = () => {
        localStorage.setItem('hasSeenOnboarding_v1', 'true');
        setIsVisible(false);
        onClose();
    };

    const nextStep = () => {
        if (currentStep < ONBOARDING_CARDS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleDismiss();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (!isVisible) return null;

    const card = ONBOARDING_CARDS[currentStep];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-zoom-in">
                {/* Background Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500"></div>

                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 font-black text-xs">
                            AI
                        </div>
                        <span className="text-sm font-black text-white tracking-widest uppercase">System Briefing</span>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-4xl shadow-inner border border-white/5">
                            {card.icon}
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white tracking-tight">{card.title}</h2>
                            <p className="text-slate-400 leading-relaxed font-medium">
                                {card.content}
                            </p>
                        </div>

                        <div className="w-full p-4 bg-slate-950/50 border border-white/5 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                {card.footer}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer / Nav */}
                <div className="p-6 bg-slate-950/50 flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {ONBOARDING_CARDS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-700'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {currentStep > 0 && (
                            <button
                                onClick={prevStep}
                                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <ChevronLeft size={16} /> Back
                            </button>
                        )}
                        <button
                            onClick={nextStep}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            {currentStep === ONBOARDING_CARDS.length - 1 ? 'Start Analysis' : 'Next Step'}
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingOverlay;
