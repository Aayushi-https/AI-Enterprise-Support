const menuItems =[
  'Dashboard',
  'Tickets',
  'Document',
  'AI Assistant',
  'Teams',
  'Settings',
]
function Sidebar({ onPageChange}){
  return(
    <aside className="sidebar">
      <div className ="sidebar-header">
        <h2>AI Support</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) =>(
          <p key={item} onClick={() => onPageChange(item)}>{item}</p>
        ))}
      </nav>
    </aside>
  )
}
export default Sidebar