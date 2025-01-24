import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import "./login.css";

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isSignUpActive, setIsSignUpActive] = useState(false);
    const [error, setError] = useState("");
    const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "" });
    const [signInData, setSignInData] = useState({ email: "", password: "" });

    // Configure axios defaults
    axios.defaults.withCredentials = true;

    const handleSignUpClick = () => setIsSignUpActive(true);
    const handleSignInClick = () => setIsSignUpActive(false);

    const handleSignUpChange = (e) => setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
    const handleSignInChange = (e) => setSignInData({ ...signInData, [e.target.name]: e.target.value });

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/register`,
                signUpData
            );
            localStorage.setItem("token", response.data.token);
            login(response.data.user);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Sign up failed");
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, signInData);
            localStorage.setItem("token", response.data.token);
            login(response.data.user);

            if (response.data.redirect === "/profile") {
                navigate("/ProfileForm", { state: { requireCompletion: true } });
            } else {
                navigate("/");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="login-page">
            <div className="wrapper">
                <div className={`container ${isSignUpActive ? "right-panel-active" : ""}`} id="main">
                    <div className="form-container sign-up-container">
                        <form onSubmit={handleSignUp}>
                            <h1>Create Account</h1>
                            <input type="text" name="name" placeholder="Name" value={signUpData.name} onChange={handleSignUpChange} required />
                            <input type="email" name="email" placeholder="Email" value={signUpData.email} onChange={handleSignUpChange} required />
                            <input type="password" name="password" placeholder="Password" value={signUpData.password} onChange={handleSignUpChange} required />
                            <button type="submit">Sign Up</button>
                        </form>
                    </div>
                    <div className="form-container sign-in-container">
                        <form onSubmit={handleSignIn}>
                            <h1>Sign in</h1>
                            <input type="email" name="email" placeholder="Email" value={signInData.email} onChange={handleSignInChange} required />
                            <input type="password" name="password" placeholder="Password" value={signInData.password} onChange={handleSignInChange} required />
                            <button type="submit">Sign In</button>
                        </form>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <div className="overlay-container">
                        <div className="overlay">
                            <div className="overlay-panel overlay-left">
                                <h1>Welcome Back!</h1>
                                <p>To keep connected, please log in</p>
                                <button className="ghost" onClick={handleSignInClick}>Sign In</button>
                            </div>
                            <div className="overlay-panel overlay-right">
                                <h1>Hello, Friend!</h1>
                                <p>Enter your details to sign up</p>
                                <button className="ghost" onClick={handleSignUpClick}>Sign Up</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;