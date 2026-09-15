// Team mode: groups participants and aggregates scores per team

export interface Team {
  id: string;
  name: string;
  emoji: string;
  score: number;
  memberIds: string[];
}

const TEAM_PRESETS = [
  { name: 'Vermelho', emoji: '🔴' },
  { name: 'Azul', emoji: '🔵' },
  { name: 'Verde', emoji: '🟢' },
  { name: 'Amarelo', emoji: '🟡' },
];

// sessionId → teams
const sessionTeams = new Map<string, Team[]>();

export const teamManager = {
  initTeams(sessionId: string, count = 4): Team[] {
    const teams: Team[] = TEAM_PRESETS.slice(0, count).map((t, i) => ({
      id: `team-${i}`,
      name: t.name,
      emoji: t.emoji,
      score: 0,
      memberIds: [],
    }));
    sessionTeams.set(sessionId, teams);
    return teams;
  },

  getTeams(sessionId: string): Team[] {
    return sessionTeams.get(sessionId) ?? [];
  },

  assignParticipant(sessionId: string, participantId: string): Team | null {
    const teams = sessionTeams.get(sessionId);
    if (!teams) return null;
    // auto-balance: assign to smallest team
    const target = teams.reduce((a, b) => (a.memberIds.length <= b.memberIds.length ? a : b));
    target.memberIds.push(participantId);
    return target;
  },

  addScore(sessionId: string, teamId: string, points: number) {
    const teams = sessionTeams.get(sessionId);
    const team = teams?.find(t => t.id === teamId);
    if (team) team.score += points;
  },

  getLeaderboard(sessionId: string): Team[] {
    return (sessionTeams.get(sessionId) ?? []).sort((a, b) => b.score - a.score);
  },

  clear(sessionId: string) {
    sessionTeams.delete(sessionId);
  },
};
