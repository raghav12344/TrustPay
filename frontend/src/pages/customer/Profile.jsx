import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getDeviceIdentifier } from '../../utils/device';
import { User, Mail, Phone, ShieldCheck, Smartphone, Moon, Sun } from 'lucide-react';

export const Profile = () => {
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const deviceIdentifier = getDeviceIdentifier();

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Profile & Security</h1>
        <p style={{ fontSize: '14px', marginTop: '4px' }}>
          Manage your account credentials, security preferences, and registered device telemetry.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* User Card */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
            Account Holder Details
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> Full Name
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.name || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} /> Email Address
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.email || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} /> Phone Number
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.phone || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} /> Account Role
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: role === 'ADMIN' ? 'var(--color-danger)' : 'var(--primary)' }}>
                {role || 'CUSTOMER'}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Device Telemetry */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            Device Fingerprint & Security
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            TrustPay automatically registers and verifies this browser client during login to defend against session hijacking and credential stuffing.
          </p>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={20} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Active Client Identifier
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {deviceIdentifier}
                  </div>
                </div>
              </div>

              <span className="badge badge-approved">
                <ShieldCheck size={12} />
                <span>REGISTERED</span>
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Browser Client: {navigator.userAgent.slice(0, 75)}...
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            Appearance & Preferences
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Interface Theme
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Currently using {theme === 'dark' ? 'Dark' : 'Light'} Mode
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={toggleTheme}
              style={{ gap: '8px' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
