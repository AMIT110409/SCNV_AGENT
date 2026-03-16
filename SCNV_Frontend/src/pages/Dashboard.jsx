import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { MiniMap, Controls, Background, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import Sidebar from '../components/Sidebar';
import { STORAGE_KEYS, API_URL } from '../config/constants';
import { LayoutDashboard, Users, TrendingUp, ShieldCheck, Maximize2, X } from 'lucide-react';
import PlantNode from '../components/PlantNode';
import DCNode from '../components/DCNode';
import '../styles/chat.css'; 
import '../styles/sidebar.css';

function DashboardPage() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isCelonisEnabled, setIsCelonisEnabled] = useState(false); // Celonis Toggle State

  // Register custom node types
  const nodeTypes = useMemo(() => ({ plant: PlantNode, dc: DCNode }), []);

  const authData = {
    token: localStorage.getItem(STORAGE_KEYS.TOKEN),
    role: localStorage.getItem(STORAGE_KEYS.ROLE),
    email: localStorage.getItem(STORAGE_KEYS.EMAIL),
  };

  const handleLogout = () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    window.location.href = '/login';
  };

  const toggleCelonis = async () => {
    try {
      // Optioanlly make an API call to "/api/admin/celonis/toggle" to persist it globally
      setIsCelonisEnabled(!isCelonisEnabled);
    } catch(e) {
      console.error("Failed to toggle Celonis backend state.", e);
    }
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/network/map`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch network data');
        const data = await res.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (authData.token) {
      fetchMapData();
    } else {
      setLoading(false);
      setError("No authentication token found.");
    }
  }, [authData.token]);

  const stats = [
    { label: 'Active Agents', value: '3', icon: <Users size={20} />, color: '#4f46e5' },
    { label: 'Network Efficiency', value: '94%', icon: <TrendingUp size={20} />, color: '#10b981' },
    { label: 'Security Status', value: 'Secure', icon: <ShieldCheck size={20} />, color: '#3b82f6' },
  ];

  const mapContent = loading ? (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
      Loading live SAP Network Data from Supabase...
    </div>
  ) : error ? (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
      {error}
    </div>
  ) : (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
    >
      <Controls />
      <MiniMap />
      <Background variant="dots" gap={12} size={1} />
    </ReactFlow>
  );

  return (
    <div className="chat-page">
      <Sidebar 
        sessions={[]} 
        currentSessionId={null} 
        authData={authData} 
        onLogout={handleLogout}
        activePage="dashboard"
      />
      
      <main className="chat-main" style={{ padding: '2rem' }}>
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
              Supply Chain Dashboard
            </h1>
            <p style={{ color: 'var(--color-muted)' }}>
              Overview of your automated supply chain network visibility and agent activity.
            </p>
          </div>
          
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '1rem', 
            background: 'white', padding: '0.75rem 1.5rem', 
            borderRadius: '2rem', border: '1px solid var(--color-border)',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text)' }}>Celonis EMS</span>
              <span style={{ fontSize: '0.75rem', color: isCelonisEnabled ? '#10b981' : 'var(--color-muted)' }}>
                {isCelonisEnabled ? 'Active (Intercepting)' : 'Disabled'}
              </span>
            </div>
            
            <button 
              onClick={toggleCelonis}
              style={{
                width: '44px',
                height: '24px',
                background: isCelonisEnabled ? '#10b981' : '#e5e7eb',
                borderRadius: '12px',
                position: 'relative',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.3s ease'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                background: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                left: isCelonisEnabled ? '22px' : '2px',
                transition: 'left 0.3s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ 
              background: 'white', 
              padding: '1.5rem', 
              borderRadius: '1rem', 
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}>
              <div style={{ background: `${stat.color}10`, color: stat.color, padding: '0.75rem', borderRadius: '0.75rem' }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{stat.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        <section style={{ background: 'white', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Network Visibility Map</h2>
            <button 
              onClick={() => setIsMapModalOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem'
              }}
              title="Maximize Map"
            >
              <Maximize2 size={18} /> Maximize
            </button>
          </div>
          <div style={{ height: '500px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            {mapContent}
          </div>
        </section>

        {isMapModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 9999,
            display: 'flex', flexDirection: 'column', padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: 'white' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Network Visibility Map (Fullscreen)</h2>
              <button 
                onClick={() => setIsMapModalOpen(false)}
                style={{ background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={24} color="black" />
              </button>
            </div>
            <div style={{ flex: 1, background: 'white', borderRadius: '1rem', overflow: 'hidden' }}>
              {mapContent}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
