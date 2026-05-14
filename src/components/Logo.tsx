export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const imgSize = size === 'lg' ? '120px' : size === 'sm' ? '48px' : '72px'

  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-new.jpg"
        alt="Boat Buddy by WastedApe"
        style={{ width: imgSize, height: imgSize, objectFit: 'cover', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.7)', boxShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
      />
      {size !== 'sm' && (
        <div>
          <div className="font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', fontSize: size === 'lg' ? '1.8rem' : '1.2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            Boat Buddy
          </div>
          <div style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
            by WastedApe
          </div>
        </div>
      )}
    </div>
  )
}
