import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, Keyboard, AlertCircle } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('camera'); // 'camera' o 'manual'
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || mode !== 'camera') return;

    let scanner = null;
    try {
      scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // Extraer UUID si viene en formato URL o texto directo
          const cleanText = decodedText.trim();
          scanner.clear();
          onScanSuccess(cleanText);
          onClose();
        },
        (errorMessage) => {
          // Errores de lectura continua normales, se ignoran
        }
      );

      scannerRef.current = scanner;
    } catch (err) {
      console.error("Error iniciando escáner:", err);
      setError("No se pudo acceder a la cámara. Puedes ingresar el código manualmente.");
      setMode('manual');
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setError("Por favor ingresa un código válido.");
      return;
    }
    onScanSuccess(manualCode.trim());
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-subtle)'
        }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} color="var(--primary)" />
            <span>Escanear Gift Card</span>
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Selector de modo */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn ${mode === 'camera' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.5rem' }}
              onClick={() => { setError(''); setMode('camera'); }}
            >
              <Camera size={16} />
              <span>Cámara</span>
            </button>
            <button
              type="button"
              className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.5rem' }}
              onClick={() => { setError(''); setMode('manual'); }}
            >
              <Keyboard size={16} />
              <span>Ingreso Manual</span>
            </button>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {mode === 'camera' ? (
            <div>
              <div id="qr-reader-container" style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}></div>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                Apunta la cámara al código QR de la tarjeta del cliente
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label className="form-label">Código o UUID de la Tarjeta</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: e4b2d5a1-7c98-4c12-b912-..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-gold">Confirmar Código</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
