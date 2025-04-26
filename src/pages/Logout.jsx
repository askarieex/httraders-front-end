// Example: handleLogout Function (React + React Router)

import { useNavigate } from 'react-router-dom';

function Logout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1) Remove token from local storage (or session)
    localStorage.removeItem('token');
    
    // 2) Optionally clear other sensitive data
    // localStorage.removeItem('otherSensitiveInfo');

    // 3) Redirect user to login
    navigate('/login');
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}

export default Logout;
