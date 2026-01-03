
const API_BASE = 'http://localhost:5000';

// Helper to handle fetch with timeout to prevent hanging
const fetchWithTimeout = async (url: string, options: any = {}, timeout = 1000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

const getLocalBoard = (): { name: string; score: number }[] => {
  const data = localStorage.getItem('skybound_mock_leaderboard');
  return data ? JSON.parse(data) : [];
};

const saveLocalBoard = (board: { name: string; score: number }[]) => {
  localStorage.setItem('skybound_mock_leaderboard', JSON.stringify(board));
};

export const getLeaderboard = async () => {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/leaderboard`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    const board = getLocalBoard();
    const sorted = [...board].sort((a, b) => b.score - a.score);
    return sorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }
};

export const submitScore = async (name: string, score: number) => {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score })
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    let board = getLocalBoard();
    const existingIndex = board.findIndex(entry => entry.name === name);

    if (existingIndex !== -1) {
      if (score > board[existingIndex].score) {
        board[existingIndex].score = score;
      }
    } else {
      // Enforce 10 player limit
      if (board.length >= 10) {
        return { success: false, error: "MAX_PLAYERS" };
      }
      board.push({ name, score });
    }
    
    board.sort((a, b) => b.score - a.score);
    saveLocalBoard(board);
    return { success: true };
  }
};

export const getWinner = async () => {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/winner`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    const board = getLocalBoard();
    if (board.length === 0) return null;
    const sorted = [...board].sort((a, b) => b.score - a.score);
    return sorted[0];
  }
};

export const resetLeaderboard = async () => {
  try {
    await fetchWithTimeout(`${API_BASE}/reset`, { method: 'DELETE' });
  } catch (e) {
    // Robustly clear local data
    localStorage.removeItem('skybound_mock_leaderboard');
  }
};
