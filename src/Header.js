import React from 'react';

function Header(){
    return (
        <div className='header-container'>
            <div className="header-title">letsgofishingsd.com</div>
            <div className="header-nav">
                <ul>
                    <li><a href="#">Fish</a></li>
                    <li><a href="#">Piers</a></li>
                    <li><a href="#">About</a></li>
                </ul>
            </div>
        </div>
    );
}

export default Header;