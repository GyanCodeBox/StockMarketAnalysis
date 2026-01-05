export const GLOSSARY = {
    // Technical / Market Structure
    ACCUMULATION: {
        term: "Accumulation",
        definition: "Evidence of sustained absorption within a compressed price range. Indicates institutional interest.",
        disclaimer: "NOT a buy signal. Contextual structural marker."
    },
    DISTRIBUTION: {
        term: "Distribution",
        definition: "Evidence of supply dominance and institutional liquidation following a price advance.",
        disclaimer: "NOT a sell signal. Indicates structural exhaustion."
    },
    FAILED_BREAKOUT: {
        term: "Failed Breakout",
        definition: "A move outside a structural zone that fails to sustain, often trapping participants.",
        disclaimer: "Markers of liquidity traps, not directional guarantees."
    },
    REGIME: {
        term: "Technical Regime",
        definition: "The current structural bias determined by price-volume relationship and zones.",
        disclaimer: "Evaluates structure, not just trend direction."
    },

    // Fundamental
    FUNDAMENTAL_GRADE: {
        term: "Fundamental Grade",
        definition: "Overall assessment of business quality, growth, and capital efficiency.",
        disclaimer: "Description of business reality, not a price target."
    },
    CAPITAL_EFFICIENCY: {
        term: "Capital Efficiency",
        definition: "Effectiveness of generating operating profit from the firm's capital base (ROCE).",
        disclaimer: "Focuses on business operations, not market sentiment."
    },
    OTHER_INCOME: {
        term: "Other Income Distortion",
        definition: "Percentage of profit derived from non-core activities. High levels can mask operating weakness.",
        disclaimer: "Requires caution if exceeding 20% of net income."
    },

    // Decision Intelligence
    CONFLUENCE: {
        term: "Confluence",
        definition: "Alignment between technical structure and fundamental reality.",
        disclaimer: "Measures asymmetry and alignment, not conviction."
    },
    COMPOSITE_SCORE: {
        term: "Composite Score",
        definition: "Relative regime quality score combining Technical, Fundamental, and Stability metrics.",
        disclaimer: "A qualitative measure, NOT an expected return."
    },
    STABILITY: {
        term: "Regime Stability",
        definition: "Persistence and consistency of the current regime over time.",
        disclaimer: "Higher stability reduces noise but is not a safety guarantee."
    },
    RISK_CONSTRAINT: {
        term: "Risk Constraints",
        definition: "Identified dimensions of structural or business risk that may impact the regime.",
        disclaimer: "Monitoring items, not price predictions."
    },

    // Portfolio
    ATTENTION_FLAG: {
        term: "Attention Flags",
        definition: "System priority levels (Stable, Monitor, Review, Critical) for monitoring workflow.",
        disclaimer: "Guides focus, not action or urgency."
    }
};

export const ONBOARDING_CARDS = [
    {
        title: "Purpose & Methodology",
        content: "TERMINAL.AI analyzes Market Structure, Business Fundamentals, and Risk Alignment to provide deep contextual awareness for institutional decision support.",
        icon: "🔭",
        footer: "Focus on regime alignment, not price direction."
    },
    {
        title: "How to Read Output",
        content: "Look for 'Confluence'—where price structure matches business reality. Use 'Stability' and 'Composite Scores' to filter the market universe safely.",
        icon: "🎯",
        footer: "Identify asymmetry, avoid noise."
    },
    {
        title: "Cognitive Safety",
        content: "This platform is not a signal generator. It does not provide buy/sell recommendations, price targets, or predictive timing.",
        icon: "🛡️",
        footer: "Information informs judgment; it doesn't prescribe action."
    }
];
