// Mock base44 client to prevent network 404 errors after migrating to custom backend
export const base44 = {
  auth: {
    loginViaEmailPassword: async () => { throw new Error("Use custom backend auth"); },
    me: async () => { return null; },
    logout: async () => {},
  },
  app: {
    getPublicSettings: async () => ({})
  }
};