import React from 'react';

interface SlotMachineIconProps {
  size?: number | string;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const SlotMachineIcon = ({ size = 24, color = "currentColor", style = {}, className = "" }: SlotMachineIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
  >
    {/* Corpo da máquina */}
    <rect x="3" y="3" width="14" height="18" rx="2" ry="2" />
    
    {/* Tela central */}
    <rect x="6" y="7" width="8" height="5" />
    
    {/* Slot de moeda / saída */}
    <line x1="8" y1="16" x2="12" y2="16" />
    
    {/* Alavanca */}
    <line x1="17" y1="12" x2="19" y2="12" />
    <line x1="19" y1="12" x2="19" y2="7" />
    
    {/* Puxador da alavanca */}
    <circle cx="19" cy="5" r="2" fill={color} />
  </svg>
);
