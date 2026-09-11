import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Plus, 
  Radio, 
  Battery, 
  Wifi, 
  Volume2, 
  MapPin, 
  ShieldCheck, 
  Settings, 
  Trash2, 
  CheckCircle2, 
  Activity, 
  QrCode, 
  Bluetooth, 
  Compass, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyDevicesModal() {
  const { 
    devices, 
    pets, 
    addDevice, 
    updateDevice, 
    removeDevice, 
    triggerRingDevice, 
    ringingDeviceId, 
    closeModal, 
    setActiveTab, 
    showToast 
  } = useApp();

  // Mode: 'list', 'pair', 'settings', 'siren'
  const [viewMode, setViewMode] = useState('list');
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Pairing Wizard State
  const [pairType, setPairType] = useState('gps_collar');
  const [pairName, setPairName] = useState('');
  const [pairPetId, setPairPetId] = useState(pets[0]?.id || '');
  const [isScanning, setIsScanning] = useState(false);
  const [scanFound, setScanFound] = useState(false);
  const [sirenCountdown, setSirenCountdown] = useState(8);

  // Siren countdown timer
  useEffect(() => {
    let timer;
    if (viewMode === 'siren' && sirenCountdown > 0) {
      timer = setInterval(() => {
        setSirenCountdown(prev => {
          if (prev <= 1) {
            setViewMode('list');
            return 8;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [viewMode, sirenCountdown]);

  const handleStartPairing = () => {
    setViewMode('pair');
    setIsScanning(true);
    setScanFound(false);
    setPairName(pairType === 'gps_collar' ? 'Maya GPS Collar Gen 2' : pairType === 'ble_beacon' ? 'Maya BLE Tag' : pairType === 'activity_tracker' ? 'Maya Vital Band' : 'Maya Smart QR Tag');
    setTimeout(() => {
      setIsScanning(false);
      setScanFound(true);
    }, 2200);
  };

  const handleConfirmPair = (e) => {
    e.preventDefault();
    const assignedPet = pets.find(p => p.id === pairPetId);
    const newDevice = {
      name: pairName.trim() || 'Smart Pet Tracker',
      deviceType: pairType,
      modelNumber: pairType === 'gps_collar' ? 'PetMaya ProTrack Gen 2' : pairType === 'ble_beacon' ? 'PetMaya BLE Beacon Gen 1' : pairType === 'activity_tracker' ? 'PetMaya FitPulse Tag' : 'PetMaya SafeID QR',
      serialNumber: `PM-${pairType === 'gps_collar' ? 'TRK' : pairType === 'ble_beacon' ? 'BLE' : pairType === 'activity_tracker' ? 'ACT' : 'TAG'}-${Math.floor(1000 + Math.random() * 9000)}`,
      petId: pairPetId || null,
      petName: assignedPet?.name || 'Unassigned',
      batteryLevel: 100,
      isOnline: true,
      signalStrength: 4,
      trackingMode: 'Real-Time (10s)',
      isSafeZone: true,
      firmwareVersion: 'v2.4.1',
      lastSync: 'Just now'
    };
    addDevice(newDevice);
    setViewMode('list');
  };

  const handleTriggerSiren = (device) => {
    triggerRingDevice(device);
    setSelectedDevice(device);
    setSirenCountdown(8);
    setViewMode('siren');
  };

  const handleGoToRadar = (petId) => {
    closeModal();
    setActiveTab('tracker');
    showToast('🛰️ Switched to Live GPS Radar View', 'success');
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'ble_beacon':
        return <Bluetooth size={18} color="#3B82F6" />;
      case 'activity_tracker':
        return <Activity size={18} color="#EC4899" />;
      case 'qr_tag':
        return <QrCode size={18} color="#F59E0B" />;
      case 'gps_collar':
      default:
        return <Radio size={18} color="var(--primary)" />;
    }
  };

  const getDeviceTypeName = (type) => {
    switch (type) {
      case 'ble_beacon': return 'Bluetooth Proximity Tag';
      case 'activity_tracker': return 'Health & Activity Monitor';
      case 'qr_tag': return 'Smart QR Identity Collar';
      case 'gps_collar': default: return 'Satellite GPS Smart Collar';
    }
  };

  const onlineCount = devices.filter(d => d.isOnline).length;
  const avgBattery = devices.length > 0
    ? Math.round(devices.reduce((acc, d) => acc + (d.batteryLevel || 100), 0) / devices.length)
    : 100;

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
      >
        {/* Modal Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                {viewMode === 'pair' ? 'Pair New Hardware' : viewMode === 'settings' ? 'Tracker Settings' : viewMode === 'siren' ? 'Collar Chime Beacon' : 'My Devices & Trackers'}
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {viewMode === 'pair' ? 'Select tracker hardware & sync telemetry' : viewMode === 'settings' ? 'Configure tracking mode and pet assignment' : 'Manage PetMaya smart collars, Bluetooth tags, and radar sensors.'}
            </p>
          </div>
          <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        {/* ═══ VIEW 1: HARDWARE LIST ═══ */}
        {viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Top Telemetry Bento */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Paired Trackers</span>
                <strong style={{ fontSize: '18px', display: 'block', marginTop: '4px', color: 'var(--text-main)' }}>{devices.length}</strong>
              </div>
              <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Safe Perimeter</span>
                <strong style={{ fontSize: '18px', display: 'block', marginTop: '4px', color: 'var(--primary)' }}>100% OK</strong>
              </div>
              <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Avg Battery</span>
                <strong style={{ fontSize: '18px', display: 'block', marginTop: '4px', color: avgBattery > 50 ? 'var(--primary)' : '#F59E0B' }}>{avgBattery}%</strong>
              </div>
            </div>

            {/* Devices List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {devices.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: '18px' }}>
                  <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Radio size={26} />
                  </div>
                  <h4 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px' }}>No Trackers Paired Yet</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 18px', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Pair a PetMaya GPS collar, Bluetooth beacon tag, or smart activity band to monitor your pet in real time.
                  </p>
                  <button className="apple-btn-blue" onClick={handleStartPairing}>
                    <Plus size={16} />
                    <span>Pair Your First Tracker</span>
                  </button>
                </div>
              ) : (
                devices.map(device => {
                  const assignedPet = pets.find(p => p.id === device.petId);
                  const isRinging = ringingDeviceId === device.id;

                  return (
                    <div 
                      key={device.id} 
                      style={{ 
                        background: 'var(--surface-alt)', 
                        borderRadius: '16px', 
                        padding: '16px', 
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {getDeviceIcon(device.deviceType)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>{device.name}</strong>
                              <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                                ● ONLINE
                              </span>
                            </div>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                              {device.serialNumber} • {getDeviceTypeName(device.deviceType)}
                            </span>
                          </div>
                        </div>

                        <button 
                          className="icon-btn" 
                          title="Tracker Settings"
                          onClick={() => { setSelectedDevice(device); setViewMode('settings'); }}
                        >
                          <Settings size={16} />
                        </button>
                      </div>

                      {/* Pet Assignment Strip */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        background: 'var(--surface-solid)', 
                        padding: '8px 12px', 
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Worn by:</span>
                          {assignedPet ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <img src={assignedPet.photo} alt={assignedPet.name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                              <strong style={{ color: 'var(--primary)' }}>{assignedPet.name}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({assignedPet.breed})</span>
                            </div>
                          ) : (
                            <span style={{ color: '#F59E0B', fontWeight: 600 }}>Unassigned</span>
                          )}
                        </div>

                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                          onClick={() => { setSelectedDevice(device); setViewMode('settings'); }}
                        >
                          Change
                        </button>
                      </div>

                      {/* Telemetry Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                          <Battery size={13} />
                          <span>{device.batteryLevel || 88}% Bat</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                          <Wifi size={13} />
                          <span>{device.signalStrength || 4}/4 Signal</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--surface-solid)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>
                          <span>{device.trackingMode || 'Real-Time'}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          • {device.lastSync || '2m ago'}
                        </span>
                      </div>

                      {/* Action CTA Buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                        <button 
                          className="apple-btn-blue" 
                          style={{ padding: '10px', fontSize: '13px' }}
                          onClick={() => handleGoToRadar(device.petId)}
                        >
                          <Compass size={15} />
                          <span>Live Radar</span>
                        </button>
                        <button 
                          className="btn-ghost" 
                          style={{ 
                            padding: '10px', 
                            fontSize: '13px', 
                            color: isRinging ? '#EF4444' : 'var(--text-main)',
                            borderColor: isRinging ? '#EF4444' : 'var(--border)'
                          }}
                          onClick={() => handleTriggerSiren(device)}
                        >
                          <Volume2 size={15} />
                          <span>{isRinging ? 'Ringing...' : 'Chime / Siren'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pair New Button */}
            {devices.length > 0 && (
              <button 
                className="apple-btn-blue" 
                style={{ width: '100%', padding: '12px', marginTop: '6px' }}
                onClick={handleStartPairing}
              >
                <Plus size={16} />
                <span>Pair Another Tracker</span>
              </button>
            )}
          </div>
        )}

        {/* ═══ VIEW 2: PAIRING WIZARD ═══ */}
        {viewMode === 'pair' && (
          <div>
            {isScanning ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 20px' }}>
                  <motion.div 
                    animate={{ scale: [1, 2.2], opacity: [0.8, 0] }} 
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--primary)' }} 
                  />
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <Radio size={36} />
                  </div>
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px' }}>Searching for Nearby Trackers...</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Make sure your PetMaya collar or beacon is powered on and within Bluetooth range.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmPair} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'rgba(16,185,129,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
                  <CheckCircle2 size={18} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Hardware detected! Configure pairing details below.</span>
                </div>

                <div>
                  <label className="label-mini">Hardware Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    {[
                      { type: 'gps_collar', label: 'GPS Smart Collar', icon: Radio },
                      { type: 'ble_beacon', label: 'BLE Proximity Tag', icon: Bluetooth },
                      { type: 'activity_tracker', label: 'Health Activity Tag', icon: Activity },
                      { type: 'qr_tag', label: 'Smart QR Collar Tag', icon: QrCode },
                    ].map(cat => (
                      <button
                        key={cat.type}
                        type="button"
                        onClick={() => {
                          setPairType(cat.type);
                          setPairName(cat.type === 'gps_collar' ? 'Maya GPS Collar Gen 2' : cat.type === 'ble_beacon' ? 'Maya BLE Tag' : cat.type === 'activity_tracker' ? 'Maya Vital Band' : 'Maya Smart QR Tag');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: pairType === cat.type ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: pairType === cat.type ? 'rgba(16,185,129,0.1)' : 'var(--surface-alt)',
                          color: pairType === cat.type ? 'var(--primary)' : 'var(--text-main)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '12.5px',
                          fontWeight: 600
                        }}
                      >
                        <cat.icon size={16} />
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-mini">Tracker Label</label>
                  <input 
                    type="text" 
                    className="input-clean" 
                    value={pairName} 
                    onChange={e => setPairName(e.target.value)} 
                    placeholder="e.g. Max's Adventure Collar"
                    required
                  />
                </div>

                <div>
                  <label className="label-mini">Assign to Pet</label>
                  <select 
                    className="input-clean" 
                    value={pairPetId} 
                    onChange={e => setPairPetId(e.target.value)}
                  >
                    {pets.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.breed || p.species})</option>
                    ))}
                    <option value="">Leave Unassigned (Assign Later)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setViewMode('list')}>
                    Cancel
                  </button>
                  <button type="submit" className="apple-btn-blue" style={{ flex: 2 }}>
                    <Plus size={16} />
                    <span>Complete Pairing</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ═══ VIEW 3: ACOUSTIC SIREN MODAL ═══ */}
        {viewMode === 'siren' && selectedDevice && (
          <div style={{ padding: '30px 20px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 20px' }}>
              <motion.div 
                animate={{ scale: [1, 1.8], opacity: [0.8, 0] }} 
                transition={{ repeat: Infinity, duration: 1.0, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #EF4444' }} 
              />
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                <Volume2 size={40} />
              </div>
            </div>

            <h4 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>
              Beeping {selectedDevice.name}...
            </h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '0 0 20px', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
              Emitting 85dB acoustic chime to locate your pet nearby. Active for {sirenCountdown}s.
            </p>

            <button 
              className="apple-btn-blue" 
              style={{ background: '#EF4444', borderColor: '#EF4444', padding: '12px 28px' }}
              onClick={() => setViewMode('list')}
            >
              <span>Stop Collar Siren</span>
            </button>
          </div>
        )}

        {/* ═══ VIEW 4: DEVICE SETTINGS ═══ */}
        {viewMode === 'settings' && selectedDevice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label-mini">Device Label</label>
              <input 
                type="text" 
                className="input-clean" 
                defaultValue={selectedDevice.name}
                id="edit-device-name"
              />
            </div>

            <div>
              <label className="label-mini">Assigned Pet</label>
              <select 
                className="input-clean" 
                defaultValue={selectedDevice.petId || ''}
                id="edit-device-pet"
              >
                {pets.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.breed || p.species})</option>
                ))}
                <option value="">Unassigned</option>
              </select>
            </div>

            <div>
              <label className="label-mini">Telemetry Update Interval</label>
              <select 
                className="input-clean" 
                defaultValue={selectedDevice.trackingMode || 'Real-Time (10s)'}
                id="edit-device-mode"
              >
                <option value="Real-Time (10s)">Real-Time (10s refresh • Precision Tracking)</option>
                <option value="Balanced (5m)">Balanced (5m refresh • Recommended)</option>
                <option value="Battery Saver (30m)">Battery Saver (30m refresh • Multi-week life)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                onClick={() => {
                  removeDevice(selectedDevice.id);
                  setViewMode('list');
                }}
              >
                <Trash2 size={16} />
                <span>Unpair Tracker</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-ghost" onClick={() => setViewMode('list')}>
                  Back
                </button>
                <button 
                  type="button" 
                  className="apple-btn-blue"
                  onClick={() => {
                    const nameInput = document.getElementById('edit-device-name');
                    const petInput = document.getElementById('edit-device-pet');
                    const modeInput = document.getElementById('edit-device-mode');
                    const assignedPet = pets.find(p => p.id === petInput?.value);
                    updateDevice({
                      ...selectedDevice,
                      name: nameInput?.value || selectedDevice.name,
                      petId: petInput?.value || null,
                      petName: assignedPet?.name || 'Unassigned',
                      trackingMode: modeInput?.value || selectedDevice.trackingMode
                    });
                    setViewMode('list');
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
