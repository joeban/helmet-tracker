'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect to static verification page
    window.location.href = '/index.html';
  }, []);

  return (
    <div style={{padding: '20px', textAlign: 'center'}}>
      <h1>HelmetScore</h1>
      <p>Redirecting to helmet database...</p>
      <p>If not redirected, please refresh the page</p>
    </div>
  );
}