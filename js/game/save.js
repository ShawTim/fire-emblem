// game/save.js — Save/Load system

var GameSave = {
  /**
   * Save game state to localStorage
   */
  save: function(game) {
    const data = {
      chapter: game.currentChapter + 1,
      roster: game.playerRoster.filter(u => u.hp > 0).map(u => u.serialize()),
    };
    localStorage.setItem('fe_save', JSON.stringify(data));
  },

  /**
   * Load game state from localStorage
   */
  load: function(game) {
    try {
      const raw = localStorage.getItem('fe_save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      game.currentChapter = Math.max(0, (data.chapter || 1) - 1);
      game.playerRoster = (data.roster || []).map(d => Unit.deserialize(d));
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Check if save exists
   */
  exists: function() {
    return !!localStorage.getItem('fe_save');
  }
};
