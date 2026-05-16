export function mapSignupError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("already exists") || normalized.includes("user already")) {
    return "This email already has an account. Sign in instead.";
  }

  if (
    normalized.includes("invalid email") ||
    normalized.includes("email address is invalid") ||
    normalized.includes("domain") ||
    normalized.includes("not allowed")
  ) {
    return "Use a valid work email address for your Relo account.";
  }

  if (
    normalized.includes("password") &&
    (normalized.includes("weak") || normalized.includes("short") || normalized.includes("least") || normalized.includes("characters"))
  ) {
    return "Create a stronger password with at least 8 characters.";
  }

  if (normalized.includes("provider") || normalized.includes("oauth") || normalized.includes("identity")) {
    return "That sign-in provider is not ready yet. Use email and password, or ask your admin to enable Google.";
  }

  return "Could not create this account. Check the details and try again.";
}

export function passwordValidationMessage(password: string) {
  if (!password) return "";
  if (password.length < 8) return "Use at least 8 characters.";
  return "";
}
