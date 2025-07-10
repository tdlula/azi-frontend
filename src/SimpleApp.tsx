import React from 'react';

function SimpleApp() {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#1a2332', marginBottom: '20px' }}>
        Azi Analytics Platform
      </h1>
      <p style={{ color: '#4a5568', marginBottom: '20px' }}>
        React application is loading successfully!
      </p>
      <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ color: '#2d3748', marginBottom: '10px' }}>System Status</h2>
        <ul style={{ color: '#4a5568', margin: 0 }}>
          <li>✅ React is working</li>
          <li>✅ TypeScript is working</li>
          <li>✅ Vite is serving files</li>
          <li>✅ Frontend is accessible</li>
        </ul>
      </div>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/api-docs'}
          style={{ 
            background: '#4299e1', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          API Documentation
        </button>
        <button 
          onClick={() => console.log('Button clicked!')}
          style={{ 
            background: '#48bb78', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer'
          }}
        >
          Test Console
        </button>
      </div>
    </div>
  );
}

export default SimpleApp;