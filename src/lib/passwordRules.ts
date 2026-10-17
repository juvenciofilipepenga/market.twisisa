export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && EMAIL_RE.test(email);
}

export function isPasswordAcceptable(value: string): boolean {
  return value.length >= PASSWORD_MIN && value.length <= PASSWORD_MAX;
}

export function passwordScore(value: string): 0 | 1 | 2 | 3 {
  if (!value) return 0;
  if (value.length < PASSWORD_MIN) return 1;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length;
  return value.length >= 14 || (value.length >= 12 && variety >= 3) ? 3 : 2;
}
