import { useEffect, useState } from "react"
function Document(){
  const [file,setFile]=useState(null)
  const [documents, setDocuments] =useState([])

  useEffect(()=> {
    fetch('http://127.0.0.1:8000/documents')
    .then((response)=> response.json())
    .then((data)=>{
     setDocuments(data.documents)
    })
  }, [])

  const handleUpload = async () => {
  if (!file) {
    alert('Please select a file first')
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('http://127.0.0.1:8000/documents/upload', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()

  alert(data.detail || data.message)

  setDocuments((perv) =>[
    ...perv,
    {
      id:Date.now(),
      name:data.filename,
    }
  ])
}
return(
  <div>
    <h1>Document</h1>
    <p>Upload and manage company document</p>
  <button onClick={handleUpload}>Upload Document</button>

  <input 
  type='file'
  accept=".pdf,.docx"
  onChange={(e) =>setFile(e.target.files?.[0]|| null)}
  />
  <p>Documents: {documents.length}</p>
  {documents.map((document) => (
  <p key={document.id}>{document.name}</p>
))}
  {file && <p>Selected: {file.name}</p>}
  </div>
)
}
export default Document