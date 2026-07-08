import { Player, Match, MyTeam, Opponent, PlayerRole, AttendanceStatus } from '../types.ts';

export const getWhatsAppShareText = (
    match: Match, 
    players: Player[], 
    myTeam: MyTeam | null, 
    opponents: Opponent[]
): string => {
    const appUrl = 'https://primer-proyecto-a9290.web.app/';
    const opponent = opponents.find(o => o.id === match.opponentId);
    const oppName = opponent?.name || 'Rival';
    const isStaff = (p: Player | undefined) => p?.role === PlayerRole.DT || p?.role === PlayerRole.AYUDANTE;
    const confirmedCount = match.playerStatuses.filter(p => {
        const pl = players.find(x => x.id === p.playerId);
        return p.attendanceStatus === AttendanceStatus.CONFIRMED && !isStaff(pl) && pl?.isActive !== false;
    }).length;
    const myTeamScore = match.playerStatuses.reduce((total, ps) => total + (ps.goalsPlay || 0) + (ps.goalsPenalty || 0) + (ps.goalsHeader || 0) + (ps.goalsSetPiece || 0) + (ps.goals || 0), 0);

    let shareText = '';

    if (match.status === 'FINALIZADO') {
        shareText = `*⚽ RESULTADO FINAL: vs ${oppName}*\n`;
        shareText += `🗓️ ${match.date}\n`;
        shareText += `🏟️ ${match.location}\n`;
        shareText += `--------------------------------\n`;
        shareText += `🔥 *${myTeam?.name || 'PLAYERS LD'}* ${myTeamScore} - ${match.opponentScore || 0} *${oppName}*\n`;
        shareText += `--------------------------------\n\n`;

        const goalScorers = match.playerStatuses
            .filter(ps => ps.attendanceStatus === AttendanceStatus.CONFIRMED)
            .map(ps => {
                const p = players.find(x => x.id === ps.playerId);
                const total = (ps.goalsPlay || 0) + (ps.goalsPenalty || 0) + (ps.goalsHeader || 0) + (ps.goalsSetPiece || 0) + (ps.goals || 0);
                return total > 0 ? { nickname: p?.nickname, total } : null;
            })
            .filter(Boolean);

        if (goalScorers.length > 0) {
            shareText += `⚽ *GOLEADORES:*\n`;
            goalScorers.forEach((g, idx) => shareText += `${idx + 1}. ${g?.nickname}: ${g?.total}\n`);
            shareText += `\n`;
        }

        if (match.ratings && Object.keys(match.ratings).length > 0) {
            const playerRatings: Record<number, { sum: number, count: number }> = {};
            Object.values(match.ratings).forEach(raterVotes => {
                Object.entries(raterVotes).forEach(([pid, val]) => {
                    const id = Number(pid);
                    if (!playerRatings[id]) playerRatings[id] = { sum: 0, count: 0 };
                    playerRatings[id].sum += val;
                    playerRatings[id].count += 1;
                });
            });
            
            const ranking = Object.entries(playerRatings)
                .map(([id, data]) => ({ id: Number(id), avg: data.sum / data.count }))
                .sort((a, b) => b.avg - a.avg);
            
            if (ranking.length > 0) {
                const mvp = players.find(p => p.id === ranking[0].id);
                shareText += `⭐ *LA FIGURA:* ${mvp?.nickname} (${ranking[0].avg.toFixed(1)} ★)\n\n`;
            }
        }
        shareText += `🗣️ _¡Gran partido equipo!_\n\n`;
    } else {
        const getNumberedNames = (s: AttendanceStatus) => {
            const filtered = match.playerStatuses
                .filter(p => {
                    const pl = players.find(x => x.id === p.playerId);
                    return p.attendanceStatus === s && !isStaff(pl) && pl?.isActive !== false;
                })
                .map(p => players.find(pl => pl.id === p.playerId)?.nickname);
            if (filtered.length === 0) return '-';
            return filtered.map((name, i) => `${i + 1}. ${name}`).join('\n');
        };

        const getStatusLabel = (s?: AttendanceStatus) => {
            if (s === AttendanceStatus.CONFIRMED) return 'Va ✅';
            if (s === AttendanceStatus.DOUBTFUL) return 'Duda ❓';
            if (s === AttendanceStatus.ABSENT) return 'No va ❌';
            return 'Pendiente ⏳';
        };

        const dt = players.find(p => p.role === PlayerRole.DT);
        const ayudante = players.find(p => p.role === PlayerRole.AYUDANTE);
        const dtStatus = match.playerStatuses.find(ps => ps.playerId === dt?.id)?.attendanceStatus;
        const ayuStatus = match.playerStatuses.find(ps => ps.playerId === ayudante?.id)?.attendanceStatus;

        shareText = `*⚽ CONVOCATORIA: vs ${oppName}*\n`;
        shareText += `🗓️ ${match.date}\n`;
        shareText += `🏟️ ${match.location} ${match.courtNumber ? `(Cancha ${match.courtNumber})` : ''}\n`;
        shareText += `📍 ${match.address}\n`;
        shareText += `--------------------------------\n`;
        
        if (dt) shareText += `*DT:* ${dt.nickname} (${getStatusLabel(dtStatus)})\n`;
        if (ayudante) shareText += `*AYUDANTE:* ${ayudante.nickname} (${getStatusLabel(ayuStatus)})\n`;
        
        shareText += `--------------------------------\n`;
        shareText += `🕒 *HORARIOS:*\n`;
        shareText += `• Vestuario: ${match.warmUpTime || '--:--'} hs\n`;
        shareText += `• Calentamiento: ${match.coachTalkTime || '--:--'} hs\n`;
        shareText += `• *PITAZO INICIAL: ${match.time} hs*\n`;
        shareText += `--------------------------------\n\n`;
        
        shareText += `✅ *CONFIRMADOS (${confirmedCount}):*\n`;
        shareText += `${getNumberedNames(AttendanceStatus.CONFIRMED)}\n\n`;
        
        const doubtCount = match.playerStatuses.filter(ps => {
            const pl = players.find(x => x.id === ps.playerId);
            return ps.attendanceStatus === AttendanceStatus.DOUBTFUL && pl?.isActive !== false;
        }).length;
        shareText += `❓ *EN DUDA (${doubtCount}):*\n`;
        shareText += `${getNumberedNames(AttendanceStatus.DOUBTFUL)}\n\n`;
        
        const absentCount = match.playerStatuses.filter(ps => {
            const pl = players.find(x => x.id === ps.playerId);
            return ps.attendanceStatus === AttendanceStatus.ABSENT && !isStaff(pl) && pl?.isActive !== false;
        }).length;
        shareText += `❌ *AUSENTES (${absentCount}):*\n`;
        shareText += `${getNumberedNames(AttendanceStatus.ABSENT)}\n\n`;

        const staffIds = players.filter(p => p.role === PlayerRole.DT || p.role === PlayerRole.AYUDANTE).map(p => p.id);
        const reactedIds = match.playerStatuses
            .filter(ps => ps.attendanceStatus === AttendanceStatus.CONFIRMED || 
                          ps.attendanceStatus === AttendanceStatus.DOUBTFUL || 
                          ps.attendanceStatus === AttendanceStatus.ABSENT)
            .map(ps => ps.playerId);
        
        const pendingPlayers = players.filter(p => !reactedIds.includes(p.id) && !staffIds.includes(p.id) && p.isActive !== false);
        
        if (pendingPlayers.length > 0) {
            shareText += `⏳ *PENDIENTES (${pendingPlayers.length}):*\n`;
            pendingPlayers.forEach((p, i) => shareText += `${i + 1}. ${p.nickname}\n`);
            shareText += `\n`;
        }
    }

    shareText += `📱 *Usa la app, entrá al link:* \n${appUrl}`;
    return shareText;
};
