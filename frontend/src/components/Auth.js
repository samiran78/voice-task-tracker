import React, { useState } from 'react';
import api from '../services/api';
import './Auth.css';

const Auth = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { name, email, password } = formData;

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                const res = await api.login({ email, password });
                if (res.success) {
                    onLogin(res.data);
                }
            } else {
                const res = await api.register({ name, email, password });
                if (res.success) {
                    onLogin(res.data);
                }
            }
        } catch (err) {
            setError(
                err.response && err.response.data && err.response.data.message
                    ? err.response.data.message
                    : 'An error occurred'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel">
                <h2>{isLogin ? 'Welcome Back!' : 'Create an Account'}</h2>
                <p className="auth-subtitle">
                    {isLogin ? 'Login to manage your voice tasks' : 'Sign up to get started'}
                </p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={onSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={onChange}
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>

                <p className="auth-switch">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Sign up here' : 'Login here'}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Auth;
