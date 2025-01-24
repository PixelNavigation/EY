import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./profile.css";

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, { withCredentials: true });
            setProfile(response.data);
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError("Failed to load profile. Please try again later.");
        }
    };

    const handleEditClick = () => {
        navigate("/ProfileForm");
    };

    return (
        <div className="profile-container">
            {error ? (
                <p className="error-message">{error}</p>
            ) : (
                profile ? (
                    <div className="profile-card">
                        <img
                            src={profile.image ? `data:image/png;base64,${profile.image}` : "/default-avatar.png"}
                            alt="Profile"
                            className="profile-image"
                        />
                        <h2>{profile.name}</h2>
                        <p>Email: {profile.email}</p>
                        <p>Phone: {profile.phone || "Not provided"}</p>
                        <p>College: {profile.college || "Not provided"}</p>
                        <p>Course: {profile.course || "Not provided"}</p>
                        <button onClick={handleEditClick} className="edit-button">Edit Profile</button>
                    </div>
                ) : (
                    <p>Loading profile...</p>
                )
            )}
        </div>
    );
};

export default Profile;
