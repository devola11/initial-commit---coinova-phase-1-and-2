function RequirementItem({ met, text }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 0',
        fontSize: 13,
        color: met ? '#05B169' : '#8A919E',
        transition: 'color 0.2s',
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: met ? '#05B169' : '#1E2025',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 10,
          color: 'white',
          fontWeight: 700,
        }}
      >
        {met ? '\u2713' : ''}
      </span>
      {text}
    </div>
  )
}

export default function PasswordStrength({ validation }) {
  if (!validation) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 12, color: '#8A919E' }}>Password strength</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: validation.strengthColor,
            textTransform: 'capitalize',
          }}
        >
          {validation.strength}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: '#1E2025',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: validation.strengthPercent + '%',
            background: validation.strengthColor,
            transition: 'all 0.3s ease',
          }}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 12,
          background: '#0A0B0D',
          borderRadius: 8,
          border: '1px solid #1E2025',
        }}
      >
        <div style={{ fontSize: 12, color: '#8A919E', marginBottom: 8 }}>
          Password must contain:
        </div>
        <RequirementItem met={validation.checks.minLength} text="At least 8 characters" />
        <RequirementItem met={validation.checks.hasUppercase} text="One uppercase letter (A-Z)" />
        <RequirementItem met={validation.checks.hasLowercase} text="One lowercase letter (a-z)" />
        <RequirementItem met={validation.checks.hasNumber} text="One number (0-9)" />
        <RequirementItem met={validation.checks.hasSpecial} text="One special character (!@#$%)" />
      </div>
    </div>
  )
}
