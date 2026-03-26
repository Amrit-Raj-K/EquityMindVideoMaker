'use client';

import React, { useState, useEffect } from 'react';
import { Play, Loader2, Video, Search, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState('');

  // Save API key to local storage for convenience
  useEffect(() => {
    const saved = localStorage.getItem('GEMINI_API_KEY');
    if (saved) setApiKey(saved);
  }, []);

  const handleGenerate = async (customTopic) => {
    setLoading(true);
    setError('');
    setVideoUrl(null);
    localStorage.setItem('GEMINI_API_KEY', apiKey);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: customTopic,
          apiKey: apiKey // Users can provide key from UI
        }),
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
      background: 'linear-gradient(to bottom, #0f172a, #020617)',
      color: 'white'
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
          AI-Powered Market Wraps
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#94a3b8',
          marginBottom: '40px'
        }}>
          Zero-touch video generation with automated news scraping and AI voiceovers.
        </p>

        {/* Gemini API Key Box (Optional) */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Optional: Google Gemini API Key</span>
            <HelpCircle size={14} color="#64748b" title="Get a free key from Google AI Studio. Enhances news curation and sentiment analysis." />
          </div>
          <input 
            type="password" 
            placeholder="Paste your Gemini API key here (Optional)"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 15px',
              background: '#000',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              outline: 'none',
              fontSize: '13px'
            }}
          />
        </div>

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
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)'
            }}
          >
            {loading ? <Loader2 className="animate-spin" style={{ marginRight: '10px' }} /> : <Play style={{ marginRight: '10px' }} fill="currentColor" />}
            {loading ? 'Generating 60s+ Video...' : '1-Click Gen: Latest Market News'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: '#64748b', fontSize: '12px' }}>OR CHOOSE A TOPIC</span>
            <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={20} color="#64748b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="e.g., Apple Stock, AI Crypto"
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
            <h3 style={{ marginBottom: '20px', color: '#10b981', fontWeight: 'bold' }}>✓ Video Ready</h3>
            <div style={{
              width: '300px',
              height: '533px',
              background: 'black',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 1)',
              border: '4px solid #1e293b'
            }}>
              <video src={videoUrl} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
