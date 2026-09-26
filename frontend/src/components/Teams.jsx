import { useEffect, useState } from 'react'
import './Teams.css'

function Teams() {
const [teams, setTeams] = useState([])

const [name, setName] = useState('')
const [description, setDescription] = useState('')
const [members, setMembers] = useState(0)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/teams')
      .then((response) => response.json())
      .then((data) => {
        setTeams(data.teams)
      })
      .catch((error) => {
        console.error('Error fetching teams:', error)
      })
  }, [])

  const handleAddTeam = async () => {
  if (!name.trim() || !description.trim()) {
    alert('Please fill in all fields')
    return
  }

  try {
    const response = await fetch('http://127.0.0.1:8000/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        description: description,
        members: members,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create team')
    }

    const data = await response.json()

    setTeams((prev) => [...prev, data.team])

    setName('')
    setDescription('')
    setMembers(0)

  } catch (error) {
    console.error(error)
    alert('Unable to create team')
  }
}

  return (
    <div className="teams-page">
      <h1>Teams</h1>
      <p>Manage support teams and their responsibilities.</p>
      
      <div className="add-team-card">
  <h2>Add Team</h2>

  <input
    type="text"
    placeholder="Team name"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />

  <textarea
    placeholder="Team description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />

  <input
    type="number"
    placeholder="Number of members"
    value={members}
    onChange={(e) => setMembers(Number(e.target.value))}
  />

  <button onClick={handleAddTeam}>Add Team</button>
</div>

      <div className="teams-list">
        {teams.map((team) => (
          <div className="team-card" key={team.id}>
            <h2>{team.name}</h2>
            <p>{team.description}</p>
            <strong>{team.members} Members</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Teams