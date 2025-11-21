import React from 'react';
import { PlayerRole } from '../types';

interface IconProps {
    className?: string;
}

const GoalkeeperIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><title>Arquero</title><path d="M12 1.25a.75.75 0 0 1 .75.75v3.51a8.232 8.232 0 0 1 7.23 7.632.75.75 0 0 1-.749.858H4.769a.75.75 0 0 1-.75-.858 8.232 8.232 0 0 1 7.23-7.632V2a.75.75 0 0 1 .75-.75Zm0 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-2.667-.154a.75.75 0 0 0 .524 1.365 4.75 4.75 0 0 1 4.286 0 .75.75 0 1 0 .524-1.365 6.25 6.25 0 0 0-5.334 0ZM19.5 15.5a.75.75 0 0 0-.75.75 7.5 7.5 0 0 1-13.5 0 .75.75 0 0 0-1.5 0 9 9 0 0 0 16.5 0 .75.75 0 0 0-.75-.75Z" /></svg>
);

const DefenderIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><title>Defensa</title><path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071 1.052A32.942 32.942 0 0 1 11.25 6.75a8.25 8.25 0 0 1-2.924 6.28A.75.75 0 0 0 9 13.5v.135a32.936 32.936 0 0 1 3-2.618V3.338a.75.75 0 0 0-1.037-1.052ZM12 21.75a2.25 2.25 0 0 1-2.245-2.423 35.29 35.29 0 0 1 .356-4.545.75.75 0 0 0-.413-.815 6.75 6.75 0 0 1-5.633-6.52.75.75 0 0 0-1.49-.175 8.25 8.25 0 0 0 7.422 7.962A36.794 36.794 0 0 0 12 21.75Zm2.245-2.423a2.25 2.25 0 0 0-2.245 2.423 36.792 36.792 0 0 0 1.884-3.355.75.75 0 0 0-.413-.815 6.75 6.75 0 0 1-5.633-6.52.75.75 0 0 0-1.49-.175 8.25 8.25 0 0 0 7.422 7.962 35.29 35.29 0 0 1 .356 4.545Z" clipRule="evenodd" /></svg>
);

const MidfielderIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><title>Mediocampo</title><path fillRule="evenodd" d="M4.5 12a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1-.75-.75Zm0-4.5a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1-.75-.75Zm0 9a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
);

const ForwardIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><title>Delantero</title><path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
);

export const RoleIcon: React.FC<{ role: PlayerRole; className?: string }> = ({ role, className }) => {
    switch (role) {
        case PlayerRole.ARQUERO:
            return <GoalkeeperIcon className={className} />;
        case PlayerRole.DEFENSA:
            return <DefenderIcon className={className} />;
        case PlayerRole.MEDIOCAMPO:
            return <MidfielderIcon className={className} />;
        case PlayerRole.DELANTERO:
            return <ForwardIcon className={className} />;
        default:
            return null;
    }
};
