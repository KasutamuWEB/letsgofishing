import React from 'react';

function Header(){
    return (
        <div className='header-container'>
            <h1>Let's Go Fishing!</h1>
            <div className='header-nav'>
                <ul>
                    <li>Fish</li>
                    <li>Piers</li>
                    <li>About</li>
                </ul>
            </div>
        </div>
    );
}

export default Header;