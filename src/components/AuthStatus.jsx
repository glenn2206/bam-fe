import { useAuth } from '../contexts/AuthContext';

/**
 * Auth Status Component
 * Shows authentication status for debugging
 */
const AuthStatus = () => {
  const { user, token } = useAuth();

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-xs z-50">
      <div className="font-bold text-gray-700 mb-2 flex items-center gap-2">
        🔐 Auth Status
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {user ? 'LOGGED IN' : 'NOT LOGGED IN'}
        </span>
      </div>
      
      <div className="space-y-1 text-gray-600">
        <div className="flex items-start gap-2">
          <span className="font-semibold min-w-[60px]">User:</span>
          <span className="break-all">
            {user ? (
              <span className="text-green-600">
                {user.name || user.no_hp || 'Unknown'}
              </span>
            ) : (
              <span className="text-red-600">None</span>
            )}
          </span>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="font-semibold min-w-[60px]">User ID:</span>
          <span className="break-all">
            {user?.id ? (
              <span className="text-green-600">{user.id}</span>
            ) : (
              <span className="text-red-600">None</span>
            )}
          </span>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="font-semibold min-w-[60px]">Token:</span>
          <span className="break-all">
            {token ? (
              <span className="text-green-600 font-mono text-[10px]">
                {token.substring(0, 20)}...
              </span>
            ) : (
              <span className="text-red-600">None</span>
            )}
          </span>
        </div>
      </div>
      
      <button
        onClick={() => {
          console.log('=== AUTH DEBUG INFO ===');
          console.log('User:', user);
          console.log('Token:', token);
          console.log('LocalStorage token:', localStorage.getItem('bam_token'));
          console.log('LocalStorage user:', localStorage.getItem('bam_user'));
          console.log('======================');
        }}
        className="mt-2 w-full bg-blue-500 text-white py-1 rounded text-[10px] font-bold hover:bg-blue-600"
      >
        Log to Console
      </button>
    </div>
  );
};

export default AuthStatus;
