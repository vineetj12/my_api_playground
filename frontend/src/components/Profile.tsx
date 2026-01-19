import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/api';
import type { Profile as ProfileType } from '../types/api';

const Profile = () => {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data: ProfileType = await apiRequest('/profile');
        setProfile(data);
        setEditedProfile(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch profile';
        setError(message);
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEditClick = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedProfile) return;
    
    try {
      setLoading(true);
      const response = await fetch('https://my-api-playground-lzxf.onrender.com/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(editedProfile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to save profile`);
      }

      const data = await response.json();
      setProfile(data);
      setEditedProfile(data);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setError(message);
      console.error('Error saving profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const updateField = (field: keyof ProfileType, value: string | string[]) => {
    if (editedProfile) {
      setEditedProfile({ ...editedProfile, [field]: value });
    }
  };

  const updateSkills = (skillsString: string) => {
    const skills = skillsString.split(',').map(s => s.trim()).filter(s => s);
    updateField('skills', skills);
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!profile) {
    return <div className="error">No profile data available</div>;
  }

  return (
    <section className="card">
      <div className="section-header">
        <h2 style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
          Profile
        </h2>
        {!isEditing ? (
          <button className="edit-btn" onClick={handleEditClick}>
            {isAuthenticated ? 'Edit Profile' : 'Sign in to Edit'}
          </button>
        ) : (
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave}>Save</button>
            <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
          </div>
        )}
      </div>

      {isEditing && editedProfile ? (
        <div className="profile-edit-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={editedProfile.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="edit-input"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={editedProfile.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="edit-input"
            />
          </div>
          <div className="form-group">
            <label>Skills (comma-separated)</label>
            <input
              type="text"
              value={editedProfile.skills.join(', ')}
              onChange={(e) => updateSkills(e.target.value)}
              className="edit-input"
            />
          </div>
          <div className="form-group">
            <label>GitHub</label>
            <input
              type="url"
              value={editedProfile.links.github}
              onChange={(e) => setEditedProfile(prev => prev ? {
                ...prev,
                links: { ...prev.links, github: e.target.value }
              } : null)}
              className="edit-input"
            />
          </div>
          <div className="form-group">
            <label>LinkedIn</label>
            <input
              type="url"
              value={editedProfile.links.linkedin}
              onChange={(e) => setEditedProfile(prev => prev ? {
                ...prev,
                links: { ...prev.links, linkedin: e.target.value }
              } : null)}
              className="edit-input"
            />
          </div>
          <div className="form-group">
            <label>Portfolio</label>
            <input
              type="url"
              value={editedProfile.links.portfolio}
              onChange={(e) => setEditedProfile(prev => prev ? {
                ...prev,
                links: { ...prev.links, portfolio: e.target.value }
              } : null)}
              className="edit-input"
            />
          </div>
        </div>
      ) : (
        <>
          {/* Basic Info */}
          <div className="profile-header">
            <h3>{profile.name}</h3>
            <p className="email">{profile.email}</p>
          </div>

          {/* Links */}
          {profile.links && (
            <div className="profile-section" style={{
              display: 'flex',
              gap: '15px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginTop: '10px'
            }}>
              {profile.links.github && (
                <a 
                  href={profile.links.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Visit GitHub"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 12px',
                    backgroundColor: '#333',
                    color: 'white',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              )}
              {profile.links.linkedin && (
                <a 
                  href={profile.links.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Visit LinkedIn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 12px',
                    backgroundColor: '#0077B5',
                    color: 'white',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.731-2.004 1.438-.103.248-.129.595-.129.943v5.424h-3.554s.05-8.736 0-9.646h3.554v1.364c.429-.659 1.191-1.575 2.898-1.575 2.117 0 3.704 1.385 3.704 4.362v5.495zM5.337 9.433c-1.144 0-1.915-.762-1.915-1.715 0-.953.77-1.715 1.914-1.715.944 0 1.915.762 1.915 1.715 0 .953-.771 1.715-1.914 1.715zm1.577 11.019H3.72V9.787h3.194v10.665zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                  </svg>
                  LinkedIn
                </a>
              )}
              {profile.links.portfolio && (
                <a 
                  href={profile.links.portfolio} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Visit Portfolio"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 12px',
                    backgroundColor: '#FF6B6B',
                    color: 'white',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <path d="M12 1v6m0 6v6"></path>
                    <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24"></path>
                    <path d="M1 12h6m6 0h6"></path>
                    <path d="M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
                  </svg>
                  Portfolio
                </a>
              )}
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="profile-section">
              <h4>Skills</h4>
              <div className="skills-list">
                {profile.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {typeof skill === 'string' ? skill : skill.name || 'Unknown'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {profile.education && profile.education.length > 0 && (
            <div className="profile-section">
              <h4>Education</h4>
              {profile.education.map((edu, index) => (
                <div key={index} className="education-item">
                  <strong>{edu.degree} {edu.field ? `in ${edu.field}` : ''}</strong>
                  <p>{edu.institution}</p>
                  <span className="date">{edu.startDate} - {edu.endDate}</span>
                </div>
              ))}
            </div>
          )}

          {/* Work Experience */}
          {profile.workExperience && profile.workExperience.length > 0 && (
            <div className="profile-section">
              <h4>Work Experience</h4>
              {profile.workExperience.map((exp, index) => (
                <div key={index} className="experience-item">
                  <strong>{exp.position}</strong>
                  <p>{exp.company}</p>
                  <span className="date">{exp.startDate} - {exp.endDate}</span>
                  {exp.description && <p className="description">{exp.description}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default Profile;