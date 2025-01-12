import React from 'react';
import './Redeem.css';

function App() {
    const rewards = [
        { id: 1, name: '1-Month Premium Access', points: 'X' },
        { id: 2, name: 'Reward 2', points: 'X' },
        { id: 3, name: 'Reward 3', points: 'X' },
        { id: 4, name: 'Reward 4', points: 'X' },
        { id: 5, name: 'Reward 5', points: 'X' },
        { id: 6, name: 'Reward 6', points: 'X' },
    ];

    return (
        <div className="Redeem">
            <section className="redeem-rewards">
                <h1>REDEEM REWARDS</h1>
                <div className="available-points">
                    <span>Available Points</span>
                    <div className="points-box">X</div>
                </div>
                <div className="rewards-list">
                    {rewards.map(reward => (
                        <div key={reward.id} className="reward-item">
                            <div className="image-placeholder"></div>
                            <div className="reward-info">
                                <span>{reward.name}</span>
                                <span>${reward.points}</span>
                                <button>Redeem</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <aside>
                <div className="redemption-history">
                    <h2>Redemption History</h2>
                    <p>History details...</p>
                </div>
                <div className="earn-more-points">
                    <h2>Earn More Points</h2>
                    <p>Ways to earn points...</p>
                </div>
            </aside>
        </div>
    );
}

export default App;
