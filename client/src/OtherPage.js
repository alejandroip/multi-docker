import React from 'react';
import { Link } from 'react-router-dom';

export default () => {
    return (
        <div>
            ¡Soy otra página!
            <Link to="/">Volver al inicio</Link>
        </div>
    );
};