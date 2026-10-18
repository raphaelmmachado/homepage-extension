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
      const defaultHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
      };

      const res = await fetch(url, {
        ...init,
        headers: {
          ...defaultHeaders,
          ...(init?.headers || {}),
        },
      });

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

  // --- ESPN Soccer Endpoints ---
  static async fetchEspnStandings(league = "bra.1") {
    return this.fetch(`https://site.web.api.espn.com/apis/v2/sports/soccer/${league}/standings`);
  }

  static async fetchEspnTeamSchedule(teamId: number | string, league = "bra.1", fixture = false) {
    const fixtureParam = fixture ? "?fixture=true" : "";
    return this.fetch(`https://site.web.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}/schedule${fixtureParam}`);
  }

  static async fetchEspnScoreboard(league = "bra.1") {
    return this.fetch(`https://site.web.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`);
  }

  static async fetchEspnTeam(teamId: number | string, league = "bra.1") {
    return this.fetch(`https://site.web.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}`);
  }

  // --- UFC Endpoints ---
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
