
export class SportsDataClient {
  static getLocalData(key: string) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  static setLocalData(key: string, data: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Erro ao salvar no localStorage", e);
    }
  }

  static async fetch(url: string, init?: RequestInit) {
    try {
      const res = await fetch(url, init);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await res.json();
        }
        return await res.text();
      }
    } catch (e) {
      console.error("Fetch error for " + url, e);
    }
    return null;
  }

  static async fetchTeamData(teamId: number) {
    const [lastData, nextData] = await Promise.all([
      this.fetch(`https://api.sofascore.com/api/v1/team/${teamId}/events/last/0`),
      this.fetch(`https://api.sofascore.com/api/v1/team/${teamId}/events/next/0`),
    ]);
    return { lastData: lastData || {}, nextData: nextData || {} };
  }

  static async fetchEventDetails(eventId: string | number) {
    return this.fetch(`https://api.sofascore.com/api/v1/event/${eventId}`);
  }

  static async fetchTournamentSeasons(tournamentId: number | string) {
    return this.fetch(`https://api.sofascore.com/api/v1/unique-tournament/${tournamentId}/seasons`);
  }

  static async fetchSeasonEvents(tournamentId: number | string, seasonId: number | string) {
    return this.fetch(`https://api.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/events`);
  }

  static async fetchCupTrees(tournamentId: number | string, seasonId: number | string) {
    return this.fetch(`https://api.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/cuptrees`);
  }

  static async fetchTournamentRounds(tournamentId: number | string, seasonId: number | string) {
    return this.fetch(`https://api.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/rounds`);
  }

  static async fetchRoundEvents(tournamentId: number | string, seasonId: number | string, round: number) {
    return this.fetch(`https://api.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/events/round/${round}`);
  }

  static async fetchStandings(tournamentId: number | string, seasonId: number | string) {
    return this.fetch(`https://api.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/standings/total`);
  }

  static async fetchUfcData(startStr: string, endStr: string) {
    const headersJson = { "User-Agent": "Mozilla/5.0" };
    const headersHtml = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };

    const [scoreboardData, rankingsData, ufcEventsHtml, ufcRankingsHtml] = await Promise.all([
      this.fetch(`https://site.web.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${startStr}-${endStr}`, { headers: headersJson }),
      this.fetch("https://site.web.api.espn.com/apis/site/v2/sports/mma/ufc/rankings", { headers: headersJson }),
      this.fetch("https://www.ufc.com.br/events", { headers: headersHtml }),
      this.fetch("https://www.ufc.com.br/rankings", { headers: headersHtml }),
    ]);

    return { 
      scoreboardData: scoreboardData || {}, 
      rankingsData: rankingsData || {}, 
      ufcEventsHtml: ufcEventsHtml || "", 
      ufcRankingsHtml: ufcRankingsHtml || "" 
    };
  }
}
