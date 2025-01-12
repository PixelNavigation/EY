import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
    return (
        <div className="dashboard">
            <main className="main">
                <h1>Welcome back, User!</h1>
                <p>Ready to continue your learning journey?</p>
                <div className="cards">
                    <div className="card">
                        <h3>Take Diagnostic Test</h3>
                        <p>Assess your current skill level</p>
                        <button>Start Test</button>
                    </div>
                    <div className="card">
                        <h3>View Learning Path</h3>
                        <p>Explore your personalized curriculum</p>
                        <button>View Path</button>
                    </div>
                    <div className="card">
                        <h3>Mock Interview</h3>
                        <p>Practice interview skills with A.I.</p>
                        <button>Practice Interview</button>
                    </div>
                </div>

                <section className="trending">
                    <h2>Trending skills and courses</h2>
                    <div className="carousel">
                        <button className="carousel-arrow">◀</button>
                        <div className="carousel-content">
                            {/* Add images or placeholders here */}
                            <div className="carousel-item"></div>
                            <div className="carousel-item"></div>
                            <div className="carousel-item"></div>
                        </div>
                        <button className="carousel-arrow">▶</button>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <div className="footer-logo">Logo</div>
                <nav className="footer-links">
                    <a href="#link1">Link one</a>
                    <a href="#link2">Link two</a>
                    <a href="#link3">Link three</a>
                    <a href="#link4">Link four</a>
                </nav>
                <div className="footer-social">
                    <p>Reach us at:</p>
                    <a href="#instagram">Instagram</a>
                    <a href="#facebook">Facebook</a>
                    <a href="#twitter">Twitter</a>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;
