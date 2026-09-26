
import { useEffect, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Tickets from './components/Tickets'
import Document from './components/Document'
import AIAssistant from './components/AIAssistant'
import Teams from './components/Teams'
import Settings from './components/Settings'
import Login from './components/Login'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('token')
  )

  const [currentPage, setcurrentPage] = useState('Dashboard')

  const [dashboardData, setDashboardData] = useState({
    total_tickets: 0,
    open_tickets: 0,
    resolved_tickets: 0,
  })

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    const token = localStorage.getItem('token')

    fetch(`http://127.0.0.1:8000/dashboard?token=${token}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Authentication failed')
        }

        return response.json()
      })
      .then((data) => {
        setDashboardData(data)
      })
      .catch((error) => {
        console.error('Error fetching dashboard data:', error)

        localStorage.removeItem('token')
        setIsLoggedIn(false)
      })
  }, [currentPage, isLoggedIn])

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => setIsLoggedIn(true)}
      />
    )
  }

  const dashboardCards = [
    {
      title: 'Open Tickets',
      value: dashboardData.open_tickets,
      description: 'Currently Active',
    },
    {
      title: 'Resolved Tickets',
      value: dashboardData.resolved_tickets,
      description: 'Resolved Tickets',
    },
    {
      title: 'Total Tickets',
      value: dashboardData.total_tickets,
      description: 'All Support Tickets',
    },
  ]

  return (
    <div className="app">

      <Sidebar onPageChange={setcurrentPage} />

      <main className="main-content">

        {currentPage === 'Tickets' && <Tickets />}

        {currentPage === 'Document' && <Document />}

        {currentPage === 'AI Assistant' && <AIAssistant />}

        {currentPage === 'Teams' && <Teams />}

        {currentPage === 'Settings' && <Settings />}

        {currentPage === 'Dashboard' && (
          <>
            <div className="dashboard-header">
              <h1>Dashboard</h1>
              <p>Welcome to AI Support Platform</p>
            </div>

            <div className="dashboard-cards">

              {dashboardCards.map((card) => (
                <div
                  className="dashboard-card"
                  key={card.title}
                >
                  <p>{card.title}</p>

                  <h2>{card.value}</h2>

                  <small>{card.description}</small>
                </div>
              ))}

            </div>
          </>
        )}

      </main>

    </div>
  )
}

export default App
