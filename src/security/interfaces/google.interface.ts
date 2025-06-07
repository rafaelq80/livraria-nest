export interface GoogleProfile {
	id: string
	displayName: string
	name: {
		familyName: string
		givenName: string
	}
	emails: Array<{
		value: string
		verified: boolean
	}>
	photos: Array<{
		value: string
	}>
	provider: string
}

export interface Role {
	id: number
	nome: string
	descricao: string
	usuarios: unknown[]
	createdAt: Date
	updatedAt: Date
}

export interface UsuarioComRoles {
	id: number
	nome: string
	usuario: string
	email: string
	foto?: string
	googleId?: string
	roles: Role[]
}

export interface UsuarioGoogle {
	googleId: string
	email: string
	nome: string
	foto?: string
	usuario: string
}