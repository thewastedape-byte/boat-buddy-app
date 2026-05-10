'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number | null>(null)
  const readerRef = useRef<any>(null)
  const [status, setStatus] = useState('Starting camera...')
  const [error, setError] = useState('')
  const [torchOn, setTorchOn] = useState(false)
  const [engine, setEngine] = useState<'native' | 'zxing' | 'none'>('none')
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const scannedRef = useRef(false)

  const stopCamera = useCallback(() => {
    scannedRef.current = true
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (readerRef.current) {
      try { readerRef.current.reset() } catch {}
    }
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    streamRef.current = null
    trackRef.current = null
  }, [])

  useEffect(() => {
    scannedRef.current = false
    startScanning()
    return () => { stopCamera() }
  }, [])

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      })
      streamRef.current = stream
      trackRef.current = stream.getVideoTracks()[0]

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Try native BarcodeDetector first (Chrome Android/Desktop)
      if ('BarcodeDetector' in window) {
        setEngine('native')
        setStatus('Point camera at barcode')
        runNativeLoop()
      } else {
        // Fall back to ZXing (iOS Safari, Firefox, all others)
        setEngine('zxing')
        setStatus('Point camera at barcode')
        runZXingLoop()
      }
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera in your browser settings.')
      } else if (e.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Camera unavailable. Use a Bluetooth scanner or type the barcode manually.')
      }
    }
  }

  const runNativeLoop = async () => {
    if (scannedRef.current || !videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.readyState >= 2) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e', 'data_matrix', 'pdf417', 'aztec', 'itf']
          })
          const barcodes = await detector.detect(canvas)
          if (barcodes.length > 0 && !scannedRef.current) {
            stopCamera()
            onScan(barcodes[0].rawValue)
            return
          }
        } catch {}
      }
    }
    animRef.current = requestAnimationFrame(runNativeLoop)
  }

  const runZXingLoop = async () => {
    try {
      // Dynamically import ZXing only when needed (keeps bundle size down)
      const { BrowserMultiFormatReader, NotFoundException } = await import('@zxing/library')
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      if (!videoRef.current || scannedRef.current) return

      reader.decodeFromVideoElement(videoRef.current, (result, err) => {
        if (scannedRef.current) return
        if (result) {
          stopCamera()
          onScan(result.getText())
        }
        // NotFoundException is normal (no barcode in frame) — ignore it
      })
    } catch (e) {
      setError('Scanner failed to initialize. Try refreshing the page.')
    }
  }

  const toggleTorch = async () => {
    if (!trackRef.current) return
    try {
      const newState = !torchOn
      await trackRef.current.applyConstraints({ advanced: [{ torch: newState } as any] })
      setTorchOn(newState)
    } catch {
      // Torch not supported on this device — silently ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(20,8,2,0.97)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <div>
          <p className="text-sm font-bold" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>📷 Scan Barcode</p>
          <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
            {engine === 'native' ? 'Chrome / Android' : engine === 'zxing' ? 'Universal (iOS / Safari / Firefox)' : 'Starting...'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleTorch}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: torchOn ? '#C68B3A' : 'rgba(198,139,58,0.15)', color: torchOn ? '#3D1C02' : '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif' }}>
            🔦
          </button>
          <button onClick={() => { stopCamera(); onClose() }}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(139,26,26,0.3)', color: '#F5F0E8', border: '1px solid rgba(139,26,26,0.5)', fontFamily: 'Georgia, serif' }}>
            ✕ Close
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Targeting overlay */}
        {!error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Dark vignette */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 70%)'
            }} />
            {/* Target box */}
            <div className="relative z-10" style={{ width: '72vw', maxWidth: '320px', height: '160px' }}>
              {[
                'top-0 left-0 border-t-4 border-l-4',
                'top-0 right-0 border-t-4 border-r-4',
                'bottom-0 left-0 border-b-4 border-l-4',
                'bottom-0 right-0 border-b-4 border-r-4',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: '#C68B3A', borderRadius: '2px' }} />
              ))}
              {/* Scan line */}
              <div className="absolute left-2 right-2" style={{
                top: '50%', height: '2px',
                background: 'linear-gradient(90deg, transparent, #C68B3A, transparent)',
                animation: 'pulse 1.2s ease-in-out infinite',
              }} />
            </div>
            {/* Status text */}
            <p className="absolute bottom-6 left-0 right-0 text-center text-sm"
              style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Georgia, serif', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              {status}
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{ background: 'rgba(0,0,0,0.85)' }}>
            <p className="text-4xl mb-4">📵</p>
            <p className="text-sm mb-3" style={{ color: '#e87070', fontFamily: 'Georgia, serif' }}>{error}</p>
            <p className="text-xs" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>
              Bluetooth/USB scanners work without camera. Or type the barcode number manually in the search box.
            </p>
          </div>
        )}
      </div>

      {/* Manual entry fallback */}
      <div className="flex-shrink-0 px-4 py-3"
        style={{ background: 'rgba(20,8,2,0.97)', borderTop: '1px solid rgba(198,139,58,0.2)' }}>
        <ManualEntry onScan={(code) => { stopCamera(); onScan(code) }} />
      </div>
    </div>
  )
}

function ManualEntry({ onScan }: { onScan: (code: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <div className="flex gap-2 items-center">
      <input
        className="input-field flex-1 text-sm"
        placeholder="Or type barcode / part # manually"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && val.trim()) onScan(val.trim()) }}
        style={{ padding: '8px 12px' }}
      />
      <button
        onClick={() => { if (val.trim()) onScan(val.trim()) }}
        disabled={!val.trim()}
        style={{
          background: val.trim() ? '#C68B3A' : 'rgba(198,139,58,0.2)',
          color: val.trim() ? '#3D1C02' : 'rgba(198,139,58,0.4)',
          border: '1px solid rgba(198,139,58,0.3)',
          borderRadius: '8px', padding: '8px 14px', fontFamily: 'Georgia, serif', fontSize: '13px', fontWeight: 'bold',
        }}>
        ➤
      </button>
    </div>
  )
}
