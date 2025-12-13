function AIAnalysisDisplay({ analysis }) {
  if (!analysis) return null

  // Parse markdown-like formatting (simple implementation)
  const formatAnalysis = (text) => {
    const lines = text.split('\n')
    return lines.map((line, index) => {
      // Bold text (markdown **text**)
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Headers (markdown ## Header)
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={index} className="text-xl font-bold text-gray-900 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>
      }
      
      // Regular paragraphs
      if (line.trim()) {
        return (
          <p 
            key={index} 
            className="mb-3 text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        )
      }
      
      return <br key={index} />
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">AI Analysis</h2>
      </div>
      
      <div className="prose max-w-none">
        {formatAnalysis(analysis)}
      </div>
    </div>
  )
}

export default AIAnalysisDisplay


