// Authentication config for route protection and redirection
export const AUTH_CONFIG = {
  // Routes that require authentication
  protectedRoutes: [
    '/dashboard',
    '/profile',
    '/settings',
  ],
  
  // Routes that are public (login, signup, etc.)
  publicRoutes: [
    '/',
    '/login',
    '/signup',
    '/auth/callback',
    '/reset-password',
  ],
  
  // Default redirect paths
  redirects: {
    // Where to redirect after successful login
    afterLogin: '/dashboard',
    
    // Where to redirect after successful signup 
    afterSignup: '/dashboard',
    
    // Where to redirect after logout
    afterLogout: '/login',
    
    // Where to redirect when user is not authenticated
    whenUnauthenticated: '/login',
    
    // Where to redirect when user is already authenticated 
    // (trying to access login/signup pages)
    whenAuthenticated: '/dashboard',
  },
} 