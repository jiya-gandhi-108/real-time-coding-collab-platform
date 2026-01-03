// src/pages/SignupPage.js
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../authContext';
import '../styles/auth.css';

export default function SignupPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', {
        name,
        email,
        password,
      });
      login(res.data.token, res.data.user);
      navigate('/home');
    } catch (error) {
      setErr(error.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header-title">Create Account</div>
        <div className="login-header-subtitle">
          Sign up to start collaborating on code
        </div>

        {err && <div className="login-error">{err}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Name */}
          <div className="login-field-group">
            <label className="login-label">Name</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                {/* user icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2-8 4.5V21h16v-2.5C20 16 16.42 14 12 14z"
                  />
                </svg>
              </span>
              <input
                className="login-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
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
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
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
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Primary button */}
          <button type="submit" className="login-primary-btn">
            Sign Up
          </button>
          <br></br>
        </form>

        <div className="login-bottom-text">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
