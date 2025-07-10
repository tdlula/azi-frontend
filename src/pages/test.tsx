import React from "react";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold text-black mb-4">Test Page</h1>
      <p className="text-lg text-gray-600">
        If you can see this, React is working properly.
      </p>
      <div className="mt-8 p-4 bg-blue-100 rounded">
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}