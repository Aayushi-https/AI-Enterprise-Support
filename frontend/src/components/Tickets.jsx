import { useEffect, useState } from 'react'
import './Tickets.css'

function Tickets() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [analyzingTicketId, setAnalyzingTicketId] = useState(null)

  // Get tickets from PostgreSQL
  useEffect(() => {
    fetch('http://127.0.0.1:8000/tickets')
      .then((response) => response.json())
      .then((data) => {
        setTickets(data.tickets)
      })
      .catch((error) => {
        console.error('Error fetching tickets:', error)
      })
  }, [])

  // Create Ticket
  const handleCreateTicket = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in all fields')
      return
    }

    const newTicket = {
      title,
      description,
      priority,
      status: 'Open',
    }

    setLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTicket),
      })

      if (!response.ok) {
        throw new Error('Failed to create ticket')
      }

      const data = await response.json()

      setTickets((prev) => [...prev, data.ticket])

      setTitle('')
      setDescription('')
      setPriority('Medium')
    } catch (error) {
      console.error(error)
      alert('Unable to create ticket')
    } finally {
      setLoading(false)
    }
  }

  // Update Ticket Status
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/tickets/${ticketId}/status?status=${encodeURIComponent(
          newStatus
        )}`,
        {
          method: 'PUT',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update ticket status')
      }

      const data = await response.json()

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: data.ticket.status }
            : ticket
        )
      )
    } catch (error) {
      console.error(error)
      alert('Unable to update ticket status')
    }
  }

  // Analyze Ticket with AI
  const handleAnalyzeTicket = async (ticket) => {
    setAnalyzingTicketId(ticket.id)
    setAnalysis(null)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/tickets/analyze',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ticket),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to analyze ticket')
      }

      const data = await response.json()

      setAnalysis(data.analysis)
    } catch (error) {
      console.error(error)
      alert('Unable to analyze ticket')
    } finally {
      setAnalyzingTicketId(null)
    }
  }

  return (
    <div className="tickets-page">

      {/* Header */}
      <div className="tickets-header">
        <h1 className="tickets-title">
          Tickets
        </h1>

        <p className="tickets-subtitle">
          Manage and track support tickets
        </p>
      </div>


      {/* Create Ticket */}
      <div className="create-ticket-card">

        <h2 className="section-title">
          Create Ticket
        </h2>

        <input
          type="text"
          placeholder="Ticket title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="ticket-input"
        />

        <textarea
          placeholder="Describe the issue..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="ticket-textarea"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="ticket-input"
        >
          <option value="Low">
            Low
          </option>

          <option value="Medium">
            Medium
          </option>

          <option value="High">
            High
          </option>

          <option value="Critical">
            Critical
          </option>
        </select>

        <button
          onClick={handleCreateTicket}
          disabled={loading}
          className="create-ticket-button"
        >
          {loading ? 'Creating...' : 'Create Ticket'}
        </button>

      </div>


      {/* Support Tickets */}
      <div>

        <h2 className="section-title">
          Support Tickets
        </h2>

        {tickets.length === 0 ? (

          <div className="empty-state">
            No tickets created yet.
          </div>

        ) : (

          <div className="ticket-list">

            {tickets.map((ticket, index) => (

              <div
                key={ticket.id || index}
                className="ticket-card"
              >

                {/* Ticket Header */}
                <div className="ticket-header">

                  <h3 className="ticket-title">
                    {ticket.title}
                  </h3>

                  <span className="ticket-status">
                    {ticket.status}
                  </span>

                </div>


                {/* Description */}
                <p className="ticket-description">
                  {ticket.description}
                </p>


                {/* Ticket Information */}
                <div className="ticket-footer">

                  <span>
                    Priority:{' '}
                    <strong>
                      {ticket.priority}
                    </strong>
                  </span>

                  {ticket.id && (
                    <span>
                      Ticket #{ticket.id}
                    </span>
                  )}

                </div>


                {/* Status Update */}
                <div className="status-section">

                  <label className="status-label">
                    Update Status
                  </label>

                  <select
                    value={ticket.status}
                    onChange={(e) =>
                      handleStatusChange(
                        ticket.id,
                        e.target.value
                      )
                    }
                    className="status-select"
                  >

                    <option value="Open">
                      Open
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="Resolved">
                      Resolved
                    </option>

                  </select>

                </div>


                {/* AI Button */}
                <button
                  onClick={() => handleAnalyzeTicket(ticket)}
                  disabled={analyzingTicketId === ticket.id}
                  className="ai-button"
                >
                  {analyzingTicketId === ticket.id
                    ? 'Analyzing...'
                    : '🤖 Analyze with AI'}
                </button>

              </div>

            ))}

          </div>

        )}

      </div>


      {/* AI Analysis */}
      {analysis && (

        <div className="analysis-card">

          <h2 className="section-title">
            🤖 AI Analysis
          </h2>


          <div className="analysis-item">

            <strong>
              Summary
            </strong>

            <p>
              {analysis.summary}
            </p>

          </div>


          <div className="analysis-item">

            <strong>
              Category
            </strong>

            <p>
              {analysis.category}
            </p>

          </div>


          <div className="analysis-item">

            <strong>
              Priority
            </strong>

            <p>
              {analysis.priority}
            </p>

          </div>


          <div className="analysis-item">

            <strong>
              Assigned Team
            </strong>

            <p>
              {analysis.team}
            </p>

          </div>


          <div className="analysis-item">

            <strong>
              Suggested Response
            </strong>

            <div className="response-box">
              {analysis.suggested_response}
            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default Tickets