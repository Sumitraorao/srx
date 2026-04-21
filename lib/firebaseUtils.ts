export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null, auth: any): never {
  if (error.code === 'permission-denied' || (error.message && error.message.includes('insufficient permissions'))) {
    const errorInfo: FirestoreErrorInfo = {
      error: error.message || 'Missing or insufficient permissions',
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid || 'unauthenticated',
        email: auth.currentUser?.email || 'none',
        emailVerified: auth.currentUser?.emailVerified || false,
        isAnonymous: auth.currentUser?.isAnonymous || false,
        providerInfo: auth.currentUser?.providerData.map((pd: any) => ({
          providerId: pd.providerId,
          displayName: pd.displayName || 'none',
          email: pd.email || 'none',
        })) || [],
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
}
