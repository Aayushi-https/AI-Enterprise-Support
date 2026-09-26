import { useState } from 'react'
import './AIAssistant.css'

function AIAssistant() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)

  const handleAsk = async () => {
    if (!question.trim()) {
      alert('Please enter a question')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/ask?query=${encodeURIComponent(question)}`
      )

      const data = await response.json()

      setAnswer(data.answer)
      setSources(data.sources)
    } catch (error) {
      setAnswer('Unable to connect to the AI service.')
      setSources([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-page">

      {/* Header */}
      <div className="ai-header">
        <div>
          <h1 className="ai-title">
            AI Assistant
          </h1>

          <p className="ai-subtitle">
            Ask questions and get AI-powered support from your documents
          </p>
        </div>
      </div>

      {/* Question Input */}
      <div className="ai-search-card">

        <div className="ai-input-wrapper">

          <input
            type="text"
            placeholder="Ask a question about your documents..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAsk()
              }
            }}
            className="ai-input"
          />

          <button
            onClick={handleAsk}
            disabled={loading}
            className="ai-ask-button"
          >
            {loading ? 'Thinking...' : 'Ask AI'}
          </button>

        </div>

      </div>

      {/* AI Answer */}
      {answer && (
        <div className="ai-answer-section">

          <h2 className="ai-section-title">
            AI Answer
          </h2>

          <div className="ai-answer-card">

            <p className="ai-answer-text">
              {answer}
            </p>

          </div>

        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="ai-sources-section">

          <div className="ai-sources-header">

            <h2 className="ai-section-title">
              Sources
            </h2>

            <span className="ai-source-count">
              {sources.length} sources
            </span>

          </div>

          <div className="ai-sources-list">

            {sources.map((source, index) => (
              <div
                className="ai-source-card"
                key={index}
              >

                <div className="ai-source-top">

                  <div className="ai-source-title">

                    <span className="ai-document-icon">
                      📄
                    </span>

                    <span>
                      Document Source {index + 1}
                    </span>

                  </div>

                  <span className="ai-relevance">
                    {source.similarity.toFixed(2)} relevance
                  </span>

                </div>

                <p className="ai-source-text">
                  {source.text}
                </p>

              </div>
            ))}

          </div>

        </div>
      )}

    </div>
  )
}

export default AIAssistant