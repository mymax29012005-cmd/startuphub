import type { JwtPayload } from "./jwt";

export function canDeleteAsOwnerOrAdmin(user: JwtPayload, ownerId: string): boolean {
  return user.role === "admin" || user.userId === ownerId;
}

export function canEditAsOwnerOrAdmin(user: JwtPayload, ownerId: string): boolean {
  return user.role === "admin" || user.userId === ownerId;
}
