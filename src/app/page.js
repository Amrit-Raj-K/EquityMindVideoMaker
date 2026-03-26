'use client';

import React, { useState } from 'react';
import { Play, Loader2, Video, Search } from 'lucide-react';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async (customTopic) => {
    setLoading(true);
    setError('');
    setVideoUrl(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: customTopic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setVideoUrl(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px',
      background: 'linear-gradient(to bottom, #0f172a, #020617)'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '12px 24px',
          borderRadius: '50px',
          color: '#60a5fa',
          fontWeight: 'bold',
          marginBottom: '24px'
        }}>
          <Video size={20} style={{ marginRight: '8px' }} />
          AI Market Video Engine
        </div>
        
        <h1 style={{
          fontSize: '48px',
          fontWeight: '900',
          marginBottom: '20px',
          lineHeight: '1.1'
        }}>
          Zero-Touch Market Updates
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#94a3b8',
          marginBottom: '40px'
        }}>
          Automatically scrape the latest news and generate stunning, voiceover-enabled vertical videos in seconds.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          background: 'rgba(255,255,255,0.03)',
          padding: '40px',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <button 
            onClick={() => handleGenerate('Latest Financial Market News')}
            disabled={loading}
            style={{
              width: '100%',
              padding: '20px',
              fontSize: '20px',
              fontWeight: 'bold',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <Loader2 className="animate-spin" style={{ marginRight: '10px' }} /> : <Play style={{ marginRight: '10px' }} fill="currentColor" />}
            {loading ? 'Generating Magic... (This takes about 30s)' : '1-Click Gen: Latest Market News'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: '#64748b' }}>OR CUSTOM TOPIC</span>
            <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              flex: 1,
              position: 'relative'
            }}>
              <Search size={20} color="#64748b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="e.g., Apple Stock, AI Crypto, Federal Reserve"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 50px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '18px',
                  outline: 'none'
                }}
              />
            </div>
            <button 
              onClick={() => handleGenerate(topic)}
              disabled={loading || !topic}
              style={{
                padding: '0 30px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: (loading || !topic) ? 'not-allowed' : 'pointer',
                opacity: (loading || !topic) ? 0.5 : 1
              }}
            >
              Generate
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '16px',
            color: '#ef4444'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {videoUrl && (
          <div style={{
            marginTop: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#10b981', fontWeight: 'bold' }}>✓ Video Generated Successfully!</h3>
            <div style={{
              width: '300px',
              height: '533px',
              background: 'black',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '4px solid #1e293b'
            }}>
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
