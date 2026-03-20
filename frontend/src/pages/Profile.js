import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Profile.css';

const initialState = {
  username: '',
  full_name: '',
  location: '',
  household_size: 1,
  transport_preference: 'mixed',
  diet_preference: 'mixed',
  bio: '',
};

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      username: user.username || '',
      full_name: user.full_name || '',
      location: user.location || '',
      household_size: user.household_size || 1,
      transport_preference: user.transport_preference || 'mixed',
      diet_preference: user.diet_preference || 'mixed',
      bio: user.bio || '',
    });
  }, [user]);

  const bioCount = useMemo(() => form.bio.length, [form.bio]);
  const completionPercent = useMemo(() => {
    const fields = [form.username, form.full_name, form.location, form.bio];
    const filled = fields.filter((value) => (value || '').trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        location: form.location.trim(),
        household_size: Number(form.household_size),
        transport_preference: form.transport_preference,
        diet_preference: form.diet_preference,
        bio: form.bio,
      };

      await updateProfile(payload);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div>
          <p className="profile-kicker">User Profile</p>
          <h1>Personalize your sustainability account</h1>
          <p>
            Keep your profile accurate so future planning and recommendations can align with your
            household and lifestyle.
          </p>
        </div>
        <div className="profile-progress-card">
          <span>Profile completion</span>
          <strong>{completionPercent}%</strong>
          <div className="profile-progress-bar" aria-hidden="true">
            <div style={{ width: `${completionPercent}%` }} />
          </div>
        </div>
      </section>

      <section className="profile-layout">
        <aside className="profile-side-card">
          <div className="profile-avatar" aria-hidden="true">
            {(form.full_name || form.username || 'U').charAt(0).toUpperCase()}
          </div>
          <h2>{form.full_name || form.username || 'User'}</h2>
          <p className="profile-subtext">@{form.username || 'username'}</p>
          <p className="profile-subtext">{form.location || 'Location not set yet'}</p>

          <div className="profile-side-metrics">
            <article>
              <span>Household</span>
              <strong>{form.household_size}</strong>
            </article>
            <article>
              <span>Transport</span>
              <strong>{form.transport_preference}</strong>
            </article>
            <article>
              <span>Diet</span>
              <strong>{form.diet_preference}</strong>
            </article>
          </div>
        </aside>

        <section className="profile-card">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert profile-alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(event) => handleChange('username', event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(event) => handleChange('full_name', event.target.value)}
                  placeholder="How should we address you?"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) => handleChange('location', event.target.value)}
                  placeholder="City, region, or country"
                />
              </div>
              <div className="form-group">
                <label>Household Size</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.household_size}
                  onChange={(event) => handleChange('household_size', event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Transport Preference</label>
                <select
                  value={form.transport_preference}
                  onChange={(event) => handleChange('transport_preference', event.target.value)}
                >
                  <option value="mixed">Mixed</option>
                  <option value="car">Car</option>
                  <option value="public-transport">Public Transport</option>
                  <option value="bike">Bike</option>
                  <option value="walk">Walk</option>
                </select>
              </div>

              <div className="form-group">
                <label>Diet Preference</label>
                <select
                  value={form.diet_preference}
                  onChange={(event) => handleChange('diet_preference', event.target.value)}
                >
                  <option value="mixed">Mixed</option>
                  <option value="non-vegetarian">Non-vegetarian</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                rows="6"
                maxLength="500"
                value={form.bio}
                onChange={(event) => handleChange('bio', event.target.value)}
                placeholder="Tell us what sustainability goals matter to you."
              />
              <p className="profile-char-count">{bioCount}/500</p>
            </div>

            <div className="profile-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </section>
      </section>
    </div>
  );
};
