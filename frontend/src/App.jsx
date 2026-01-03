import { useState, useEffect } from 'react'
import StockInput from './components/StockInput'
import StockInfo from './components/StockInfo'
import StockChart from './components/StockChart'
import AIAnalysisDisplay from './components/AIAnalysisDisplay'
import FundamentalAnalysis from './components/FundamentalAnalysis'
import DecisionIntelligence from './components/DecisionIntelligence'
import LoadingAnimation from './components/LoadingAnimation'
import TechnicalScoreCard from './components/TechnicalScoreCard'
import LazyAccordionSection from './components/LazyAccordionSection'
import ScrollNavigation from './components/ScrollNavigation'
import MarketStructureBanner from './components/MarketStructureBanner'
import { TIMEFRAME_DEFAULTS } from './components/ChartSettings'
import './index.css'

import { Routes, Route, Navigate } from 'react-router-dom';
import Terminal from './components/Terminal';
import PortfolioView from './components/Portfolio/PortfolioView';
import './index.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Terminal />} />
      <Route path="/analyze/:symbol" element={<Terminal />} />
      <Route path="/portfolio" element={<PortfolioView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
