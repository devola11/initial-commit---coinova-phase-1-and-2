import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0B0D',
        color: '#fff',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 800,
          color: '#0052FF',
          lineHeight: 1,
          marginBottom: 16,
        }}
      >
        404
      </div>
      <h2
        style={{
          color: '#fff',
          fontSize: 24,
          fontWeight: 700,
          margin: '0 0 12px 0',
        }}
      >
        Page not found
      </h2>
      <p
        style={{
          color: '#8A919E',
          marginBottom: 32,
          maxWidth: 400,
          lineHeight: 1.6,
        }}
      >
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        style={{
          background: '#0052FF',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: 10,
          padding: '12px 28px',
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        Go to Home
      </Link>
    </div>
  )
}
