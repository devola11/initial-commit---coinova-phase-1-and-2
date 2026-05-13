import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }

  render() {
    if (this.state.hasError) {
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
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#F6465D20',
              border: '2px solid #F6465D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              marginBottom: 24,
            }}
          >
            !
          </div>
          <h2
            style={{
              color: '#fff',
              fontSize: 24,
              fontWeight: 700,
              margin: '0 0 12px 0',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: '#8A919E',
              marginBottom: 24,
              maxWidth: 400,
            }}
          >
            We encountered an unexpected error. Please refresh the page or
            contact support if the problem persists.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: '#0052FF',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            Refresh Page
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/'
            }}
            style={{
              background: 'transparent',
              color: '#8A919E',
              border: 'none',
              fontSize: 14,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Go to Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
