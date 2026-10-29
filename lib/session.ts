import { getServerSession as getAuthSession, type DemoSession } from './auth';
import type { TokenPayload } from './jwt';

export type ServerSessionPayload = TokenPayload & DemoSession;

export async function getServerSession(): Promise<ServerSessionPayload | null> {
  return await getAuthSession();
}
