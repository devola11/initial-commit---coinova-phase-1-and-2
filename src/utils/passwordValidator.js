export function validatePassword(password) {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const passedCount = Object.values(checks).filter(Boolean).length

  let strength = 'weak'
  let strengthColor = '#F6465D'
  let strengthPercent = 20

  if (passedCount === 5) {
    strength = 'very strong'
    strengthColor = '#05B169'
    strengthPercent = 100
  } else if (passedCount === 4) {
    strength = 'strong'
    strengthColor = '#22C55E'
    strengthPercent = 80
  } else if (passedCount === 3) {
    strength = 'medium'
    strengthColor = '#F59E0B'
    strengthPercent = 60
  } else if (passedCount === 2) {
    strength = 'weak'
    strengthColor = '#FB923C'
    strengthPercent = 40
  }

  return {
    checks,
    strength,
    strengthColor,
    strengthPercent,
    isValid: passedCount === 5,
  }
}
