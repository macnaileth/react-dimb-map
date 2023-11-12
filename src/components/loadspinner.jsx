import React from 'react';
import './loadspinner.css';
     
function LoadSpinner({ display = 'Lade Kartendarstellung' }) { 
    return (<div className="load-container">
                <div className="load-spinner"></div>
                <div className="load-display">{ display }</div>
            </div>);
};

export default LoadSpinner;
