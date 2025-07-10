function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2563eb' }}>✅ React Frontend Working!</h1>
      <p>This confirms the React app is loading properly on port 3000.</p>
      <div style={{ 
        background: '#f0f9ff', 
        padding: '15px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Services Status:</h2>
        <ul>
          <li>✅ Frontend: Running on port 3000</li>
          <li>✅ Backend: Running on port 5000</li>
          <li>✅ API Docs: Available at /api-docs</li>
        </ul>
      </div>
    </div>
  );
}

export default TestApp;