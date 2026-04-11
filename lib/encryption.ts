import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32
const IV_LENGTH = 16

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || "default-secret-key-change-this!!"
  return crypto.scryptSync(secret, "bot-dashboard-salt", KEY_LENGTH)
}

export function encrypt(text: string): string {
  if (!text) return ""
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  const tag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ""
  try {
    const parts = encryptedText.split(":")
    if (parts.length !== 3) return ""
    const [ivHex, tagHex, encrypted] = parts

    const key = getKey()
    const iv = Buffer.from(ivHex, "hex")
    const tag = Buffer.from(tagHex, "hex")

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  } catch {
    return ""
  }
}

export function maskApiKey(encryptedKey: string | null): string | null {
  if (!encryptedKey) return null
  const decrypted = decrypt(encryptedKey)
  if (!decrypted) return null
  if (decrypted.length <= 4) return "****"
  return `****${decrypted.slice(-4)}`
}
