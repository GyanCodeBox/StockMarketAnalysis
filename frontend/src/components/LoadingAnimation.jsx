import React, { useState, useEffect } from 'react';

const investmentQuotes = [
    {
        quote: "The stock market is a device for transferring money from the impatient to the patient.",
        author: "Warren Buffett"
    },
    {
        quote: "In investing, what is comfortable is rarely profitable.",
        author: "Robert Arnott"
    },
    {
        quote: "The four most dangerous words in investing are: 'This time it's different.'",
        author: "Sir John Templeton"
    },
    {
        quote: "Risk comes from not knowing what you're doing.",
        author: "Warren Buffett"
    },
    {
        quote: "Price is what you pay. Value is what you get.",
        author: "Warren Buffett"
    },
    {
        quote: "The individual investor should act consistently as an investor and not as a speculator.",
        author: "Ben Graham"
    },
    {
        quote: "Know what you own, and know why you own it.",
        author: "Peter Lynch"
    },
    {
        quote: "The best time to plant a tree was 20 years ago. The second best time is now.",
        author: "Chinese Proverb"
    },
    {
        quote: "Compound interest is the eighth wonder of the world.",
        author: "Albert Einstein"
    },
    {
        quote: "An investment in knowledge pays the best interest.",
        author: "Benjamin Franklin"
    }
];

const financialTips = [
    "📊 Diversification reduces risk. Don't put all eggs in one basket.",
    "📈 Long-term investing beats short-term speculation.",
    "💰 Invest in what you understand.",
    "⏰ Time in the market beats timing the market.",
    "🎯 Set clear financial goals before investing.",
    "📚 Continuous learning is an investor's best asset.",
    "🔍 Research fundamentals before making decisions.",
    "💡 Emotional discipline is key to successful investing.",
    "📉 Market corrections are opportunities, not disasters.",
    "🏦 Emergency fund first, then investments."
];

const LoadingAnimation = ({ symbol }) => {
    // Start with random quotes and tips each time
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(
        Math.floor(Math.random() * investmentQuotes.length)
    );
    const [currentTipIndex, setCurrentTipIndex] = useState(
        Math.floor(Math.random() * financialTips.length)
    );
    const [progress, setProgress] = useState(0);

    // Rotate quotes every 5 seconds
    useEffect(() => {
        const quoteInterval = setInterval(() => {
            setCurrentQuoteIndex((prev) => (prev + 1) % investmentQuotes.length);
        }, 5000);

        return () => clearInterval(quoteInterval);
    }, []);

    // Rotate tips every 4 seconds
    useEffect(() => {
        const tipInterval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % financialTips.length);
        }, 4000);

        return () => clearInterval(tipInterval);
    }, []);

    // Simulated progress bar (aesthetic only)
    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev; // Cap at 95% until actual completion
                return prev + Math.random() * 3;
            });
        }, 500);

        return () => clearInterval(progressInterval);
    }, []);

    const currentQuote = investmentQuotes[currentQuoteIndex];
    const currentTip = financialTips[currentTipIndex];

    return (
        <div className="py-12 px-6">
            <div className="max-w-2xl w-full mx-auto space-y-8">
                {/* Animated Logo/Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl">📊</span>
                        </div>
                    </div>
                </div>

                {/* Main Status */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">
                        Analyzing {symbol}...
                    </h2>
                    <p className="text-slate-400">
                        Running technical & fundamental analysis
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Investment Quote Card */}
                <div
                    key={currentQuoteIndex}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl animate-fade-in-up"
                >
                    <div className="flex items-start space-x-4">
                        <div className="text-4xl text-indigo-400">"</div>
                        <div className="flex-1">
                            <p className="text-lg text-slate-200 italic leading-relaxed">
                                {currentQuote.quote}
                            </p>
                            <p className="mt-4 text-sm text-indigo-400 font-semibold">
                                — {currentQuote.author}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Financial Tip */}
                <div
                    key={currentTipIndex}
                    className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6 animate-fade-in-up"
                >
                    <div className="flex items-center space-x-3">
                        <div className="text-2xl">💡</div>
                        <p className="text-slate-300">
                            {currentTip}
                        </p>
                    </div>
                </div>

                {/* Analysis Steps (Optional) */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-slate-400">Fetching market data</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span className="text-slate-400">Calculating indicators</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-slate-400">Financial analysis</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <span className="text-slate-400">AI insights</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingAnimation;
