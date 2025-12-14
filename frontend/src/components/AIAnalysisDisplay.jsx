function AIAnalysisDisplay({ analysis }) {
  if (!analysis) return null

  // Parse markdown-like formatting (simple implementation)
  const formatAnalysis = (text) => {
    const lines = text.split('\n')
    return lines.map((line, index) => {
      // Bold text (markdown **text**)
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

      // Headers (markdown #, ##, ###)
      const headerMatch = line.match(/^(#{1,3})\s+(.+)$/)
      if (headerMatch) {
        const level = headerMatch[1].length
        return (
          <h3
            key={index}
            className={`font-bold text-indigo-400 mt-6 mb-3 border-b border-indigo-500/20 pb-2 inline-block ${level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg'
              }`}
          >
            {headerMatch[2]}
          </h3>
        )
      }

      // Existing bold/header check replacement (removed old strict star check in favor of regex above)

      // Regular paragraphs
      if (line.trim()) {
        return (
          <p
            key={index}
            className="mb-3 text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        )
      }

      return <br key={index} />
    })
  }

  return (

    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl p-8 backdrop-blur-sm relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10"></div>

      <div className="flex items-center mb-6 border-b border-slate-800 pb-4">
        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mr-4 ring-1 ring-indigo-500/20">
          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">AI Market Intelligence</h2>
          <p className="text-slate-400 text-sm">Powered by LLM Agents</p>
        </div>
      </div>

      <div className="prose prose-invert prose-indigo max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-lg">
        {formatAnalysis(analysis)}
      </div>
    </div>
  )
}

export default AIAnalysisDisplay


