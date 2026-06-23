export type EditorLocation = { id: string; label: string; line1: string; line2?: string | null }
export type EditorClient = { id: string; name: string; bcEmail?: string | null; c1Email?: string | null; locations: EditorLocation[] }
export type EditorProfile = { id: string; name: string; website?: string | null; remitEmail?: string | null; addr1?: string | null; city?: string | null; state?: string | null; zip?: string | null; isDefault: boolean }
export type EditorEmailConfig = { id: string; gmailUser?: string | null; senderName?: string | null }
