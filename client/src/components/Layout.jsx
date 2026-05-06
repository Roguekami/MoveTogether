import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}
