import React from 'react';
import TideVisualization from './TideVisualization';

function TideCard() {
    return (
        <div className="card" style={{ width: '100%', height: '700px' }}>
            <h1>Tide Information</h1>
            <h1>Tide Information</h1>
            <h1>Tide Information</h1>
            <h1>Tide Information</h1>
            <div className="card-content" style={{ width: '100%', height: '100%' }}>
                <TideVisualization />
            </div>
        </div>
    );
}

export default TideCard;
