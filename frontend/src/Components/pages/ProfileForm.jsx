import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./profileForm.css";

const ProfileForm = () => {
    const [profile, setProfile] = useState({
        image: null,
        name: "",
        email: "",
        phone: "",
        college: "",
        course: "",
        careerAmbition: "Software Developer",
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`);
            const data = response.data || {};
            setProfile((prev) => ({
                ...prev,
                image: data.image ?? null,
                name: data.name ?? "",
                email: data.email ?? "",
                phone: data.phone ?? "",
                college: data.college ?? "",
                course: data.course ?? "",
                careerAmbition: data.careerAmbition ?? "Software Developer",
            }));
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setProfile((prev) => ({ ...prev, image: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("image", profile.image);
        formData.append("name", profile.name);
        formData.append("email", profile.email);
        formData.append("phone", profile.phone);
        formData.append("college", profile.college);
        formData.append("course", profile.course);
        formData.append("careerAmbition", profile.careerAmbition);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/profile`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            navigate("/");
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    return (
        <div className="profile-form-container">
            <h2>Edit Profile</h2>
            <form onSubmit={handleSubmit} className="profile-form">
                <div>
                    <label>Image:*</label>
                    <input type="file" name="image" onChange={handleFileChange} required={!profile.image} />
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
                    <input type="text" name="phone" value={profile.phone} onChange={handleChange} required />
                </div>
                <div>
                    <label>College:</label>
                    <input type="text" name="college" value={profile.college} onChange={handleChange} required />
                </div>
                <div>
                    <label>Course:</label>
                    <input type="text" name="course" value={profile.course} onChange={handleChange} required />
                </div>
                <div>
                    <label>Career Ambition:</label>
                    <select
                        name="careerAmbition"
                        value={profile.careerAmbition}
                        onChange={handleChange}
                        required
                    >
                        <option value="Software Developer">Software Developer</option>
                    </select>
                </div>
                <button type="submit">Save Changes</button>
            </form>
        </div>
    );
};

export default ProfileForm;