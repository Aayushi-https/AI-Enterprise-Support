import { useEffect, useState } from 'react'
import './Settings.css'

function Settings() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(true)

  useEffect(() => {
  fetch('http://127.0.0.1:8000/settings')
    .then((response) => response.json())
    .then((data) => {
      const settings = data.settings

      setName(settings.name)
      setEmail(settings.email)
      setNotifications(settings.notifications)
      setAiEnabled(settings.ai_enabled)
    })
    .catch((error) => {
      console.error('Error fetching settings:', error)
    })
}, [])

const handleSaveSettings = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        email: email,
        notifications: notifications,
        ai_enabled: aiEnabled,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save settings')
    }

    alert('Settings saved successfully')
  } catch (error) {
    console.error(error)
    alert('Unable to save settings')
  }
}

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account and application preferences.</p>
      </div>

      <div className="settings-card">
        <h2>Profile</h2>

        <label>Name</label>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="settings-card">
        <h2>Preferences</h2>
        
        <div className="setting-row">
          <div>
            <strong>Notifications</strong>
            <p>Receive support and ticket notifications.</p>
          </div>

          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
        </div>

        <div className="setting-row">
          <div>
            <strong>AI Assistant</strong>
            <p>Enable AI-powered support features.</p>
          </div>

          <input
            type="checkbox"
            checked={aiEnabled}
            onChange={(e) => setAiEnabled(e.target.checked)}
          />
          
        </div>
        <button
  className="save-settings-button"
  onClick={handleSaveSettings}
>
  Save Settings
</button>
      </div>
    </div>
  )
}

export default Settings