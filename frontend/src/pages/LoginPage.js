import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../authContext';
import '../styles/auth.css';
import { socket } from "../socket";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
  setShowPassword((prev) => !prev);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
        remember,
      });
      login(res.data.token, res.data.user);

socket.auth = { token: res.data.token };
socket.connect();

navigate('/home');

    } catch (error) {
      setErr(error.response?.data?.message || 'Login failed');
    }
  };
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header-title">Welcome Back</div>
        <div className="login-header-subtitle">
          Sign in to continue to your account
        </div>

        {err && <div className="login-error">{err}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field-group">
            <label className="login-label">Email Address</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 
                    2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.01L12 13l8-6.99V6L12 14 4 6z"
                  />
                </svg>
              </span>
              <input
                className="login-input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="login-field-group">
            <label className="login-label">Password</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 
                    2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 
                    8V6a3 3 0 0 1 6 0v3H9z"
                  />
                </svg>
              </span>
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
  type="button"
  className="login-input-addon-btn"
  onClick={toggleShowPassword}
>
  {showPassword ? (
    /* eye-off icon */
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2.1 3.51 3.5 2.1l18.4 18.39-1.41 1.41-2.54-2.54C16.5 20.26 14.34 21 12 21 5 21 1 14 1 14a17.1 17.1 0 0 1 4.01-4.88L2.1 3.51zM12 7a7 7 0 0 1 7 7c0 .79-.13 1.55-.38 2.25L8.75 6.38A6.97 6.97 0 0 1 12 7z"
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 
        12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 .001 6.001A3 3 
        0 0 0 12 9z"
      />
    </svg>
  )}
</button>

            </div>
          </div>
          <button type="submit" className="login-primary-btn">
            Log In
          </button>
          <br></br>
        </form>

        <div className="login-bottom-text">
          Don&apos;t have an account?{' '}
          <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
