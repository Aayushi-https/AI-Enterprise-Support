import { useState } from 'react'
import './Login.css'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password')
      return
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.detail || 'Login failed')
        return
      }

      localStorage.setItem('token', data.token)

      // Tell App.jsx that login was successful
      onLogin()

    } catch (error) {
      console.error('Login error:', error)
      alert('Unable to connect to the server')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to AI Support</p>
        </div>

        <div className="login-form">

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>
            Login
          </button>

        </div>

      </div>
    </div>
  )
}

export default Login
