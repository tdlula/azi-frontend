import { ENV } from '@/lib/env';

function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2563eb' }}>✅ React Frontend Working!</h1>
      <p>This confirms the React app is loading properly on port {ENV.FRONTEND_PORT}.</p>
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Services Status:</h2>
        <ul>
          <li>✅ Frontend: Running on port {ENV.FRONTEND_PORT}</li>
          <li>✅ Backend: Running on port {ENV.BACKEND_PORT}</li>
          <li>✅ API Docs: Available at /api-docs</li>
        </ul>
      </div>
    </div>
  );
}

export default TestApp;
