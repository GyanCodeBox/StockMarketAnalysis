import React, { useState, useEffect } from 'react';

const ScrollNavigation = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Show/Hide "Back to Top" based on scroll position
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
                setIsMenuOpen(false); // Close menu if back at top
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToId = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setIsMenuOpen(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    const scrollToBottom = () => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3 pointer-events-none">
            {/* Navigation Menu */}
            <div className={`flex flex-col gap-2 transition-all duration-300 pointer-events-auto ${isMenuOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90 pointer-events-none'
                }`}>
                <button
                    onClick={() => scrollToId('technical-section')}
                    className="bg-slate-900/80 backdrop-blur-md border border-slate-700 text-indigo-400 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl transition-all hover:scale-105"
                >
                    Technical Charts
                </button>
                <button
                    onClick={() => scrollToId('fundamental-section')}
                    className="bg-slate-900/80 backdrop-blur-md border border-slate-700 text-emerald-400 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl transition-all hover:scale-105"
                >
                    Fundamentals
                </button>
                <button
                    onClick={() => scrollToId('ai-section')}
                    className="bg-slate-900/80 backdrop-blur-md border border-slate-700 text-amber-400 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl transition-all hover:scale-105"
                >
                    AI Analytics
                </button>
                <button
                    onClick={scrollToBottom}
                    className="bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-400 hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl transition-all hover:scale-105"
                >
                    Go to Bottom
                </button>
            </div>

            {/* Main Toggle Buttons */}
            <div className="flex gap-3 pointer-events-auto">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all shadow-2xl ${isMenuOpen
                            ? 'bg-indigo-600 border-indigo-500 text-white rotate-90'
                            : 'bg-slate-900/90 backdrop-blur-xl border-slate-700 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-400'
                        }`}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>

                <button
                    onClick={scrollToTop}
                    className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group"
                >
                    <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ScrollNavigation;
