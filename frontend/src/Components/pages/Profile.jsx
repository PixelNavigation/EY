import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = ({ requireCompletion }) => {
    const [profile, setProfile] = useState({
        image: '',
        name: '',
        email: '',
        phone: '',
        college: '',
        course: ''
    });
    const [isComplete, setIsComplete] = useState(false);

    axios.defaults.withCredentials = true;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`);
            setProfile(response.data);
            checkProfileComplete(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const checkProfileComplete = (profileData) => {
        const complete = Boolean(
            profileData.image &&
            profileData.phone &&
            profileData.college &&
            profileData.course
        );
        setIsComplete(complete);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prevProfile => ({ ...prevProfile, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/profile`, profile);
            const isProfileComplete = Boolean(
                profile.image &&
                profile.phone &&
                profile.college &&
                profile.course
            );
            setIsComplete(isProfileComplete);

            if (isProfileComplete && !requireCompletion) {
                navigate('/');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (requireCompletion && !isComplete) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        if (requireCompletion && !isComplete) {
            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    }, [requireCompletion, isComplete]);

    return (
        <div className="profile-container">
            <h2>Profile</h2>
            {requireCompletion && !isComplete && (
                <div className="alert alert-warning">
                    Please complete your profile before continuing
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Image URL:*</label>
                    <input
                        type="text"
                        name="image"
                        value={profile.image}
                        onChange={handleChange}
                        required={requireCompletion}
                    />
                </div>
                <div>
                    <label>Name:</label>
                    <input type="text" name="name" value={profile.name} onChange={handleChange} />
                </div>
                <div>
                    <label>Email:</label>
                    <input type="email" name="email" value={profile.email} onChange={handleChange} />
                </div>
                <div>
                    <label>Phone:</label>
                    <input
                        type="text"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        required={requireCompletion}
                    />
                </div>
                <div>
                    <label>College:</label>
                    <input
                        type="text"
                        name="college"
                        value={profile.college}
                        onChange={handleChange}
                        required={requireCompletion}
                    />
                </div>
                <div>
                    <label>Course:</label>
                    <input
                        type="text"
                        name="course"
                        value={profile.course}
                        onChange={handleChange}
                        required={requireCompletion}
                    />
                </div>
                <button type="submit">
                    {requireCompletion ? 'Complete Profile' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
};

export default Profile;