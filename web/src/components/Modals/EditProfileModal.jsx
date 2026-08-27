import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, User, Phone, MapPin, Check, Sparkles } from 'lucide-react';

export default function EditProfileModal() {
  const { closeModal, showToast } = useApp();
  const { currentUser, updateUserProfile } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [photoUrl, setPhotoUrl] = useState(currentUser?.photoUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('⚠️ Image size must be under 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('⚠️ Name cannot be empty', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        photoUrl: photoUrl || currentUser?.photoUrl
      });
      showToast('✅ Profile updated successfully!', 'success');
      closeModal();
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="modal-backdrop" 
        onClick={closeModal}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="modal-dialog"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={18} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                Edit Profile
              </h3>
            </div>
            <button
              onClick={closeModal}
              style={{
                background: 'var(--surface-alt)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            {/* Avatar Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={photoUrl || currentUser?.photoUrl || 'assets/images/tail_wagging_logo.png'}
                  alt={name}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--primary)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                  }}
                />
                <label
                  htmlFor="avatar-upload"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: 'var(--primary)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                    border: '2px solid var(--surface)'
                  }}
                  title="Change photo"
                >
                  <Camera size={15} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Click camera icon to upload new photo
              </span>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your Full Name"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1835-120307"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Address / City
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Street, Area, City"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={closeModal}
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="apple-btn-blue"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={isSaving}
              >
                {isSaving ? <span>Saving...</span> : (
                  <>
                    <Check size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
