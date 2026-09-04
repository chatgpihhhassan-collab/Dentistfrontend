import React from 'react';

const Tooth = ({ num, color, x, y, rot, onHover, onLeave, onClick }) => {
    // Generate slightly different shapes based on whether it's a molar, bicuspid, or incisor
    const isMolar = [1,2,3,14,15,16,17,18,19,30,31,32].includes(num);
    const scale = isMolar ? 0.35 : 0.28;

    return (
        <g 
            transform={`translate(${x}, ${y}) rotate(${rot}) scale(${scale})`} 
            className="cursor-pointer group"
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
        >
            <path d="M -40,-40 C -40,-80 40,-80 40,-40 L 50,40 C 50,80 30,90 0,90 C -30,90 -50,80 -50,40 Z" fill="#000" opacity="0.2" transform="translate(0, 8)"/>
            
            <path 
                d="M -40,-40 C -40,-80 40,-80 40,-40 L 50,40 C 50,80 30,90 0,90 C -30,90 -50,80 -50,40 Z" 
                fill={color} 
                stroke="#94A3B8" 
                strokeWidth="6" 
                className="transition-colors duration-200 group-hover:brightness-125 group-hover:stroke-white"
            />
            <path d="M -20,-30 C -20,-50 20,-50 20,-30 L 25,30 C 25,50 10,60 0,60 C -10,60 -25,50 -25,30 Z" fill="#FFFFFF" opacity="0.3" />
        </g>
    );
};

export default Tooth;
