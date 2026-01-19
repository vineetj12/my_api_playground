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
        </div>
      ) : (
        <>
          {/* Basic Info */}
          <div className="profile-header">
            <h3>{profile.name}</h3>
            <p className="email">{profile.email}</p>
          </div>

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