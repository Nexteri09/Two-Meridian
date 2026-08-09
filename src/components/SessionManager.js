import { supabase } from '../lib/supabase.js';

export class SessionManager {
  constructor(app) {
    this.app = app;
    this.currentSessionId = null;
  }

  get user() {
    return this.app.authManager ? this.app.authManager.user : null;
  }

  async startSession(mode) {
    if (!this.user) return null; // Only log if logged in

    const { data, error } = await supabase
      .from('game_sessions')
      .insert([{ user_id: this.user.id, mode: mode }])
      .select('id')
      .single();

    if (error) {
      console.error('Failed to start session on server', error);
      return null;
    }
    
    this.currentSessionId = data.id;
    return this.currentSessionId;
  }

  logGuess(countryIso, isCorrect) {
    if (!this.currentSessionId) return;
    
    // Asynchronous "fire and forget" to avoid blocking the main game thread
    supabase
      .from('guesses')
      .insert([{ 
        session_id: this.currentSessionId, 
        country_iso: countryIso, 
        is_correct: isCorrect 
      }])
      .then(({ error }) => {
        if (error) console.error('Failed to log guess to server:', error);
      });
  }

  async completeSession(finalScore) {
    if (!this.currentSessionId) return;

    const { error } = await supabase
      .from('game_sessions')
      .update({ 
        status: 'completed', 
        end_time: new Date().toISOString(),
        final_score: finalScore
      })
      .eq('id', this.currentSessionId);

    if (error) {
      console.error('Failed to complete session:', error);
    }
    
    this.currentSessionId = null;
  }

  async abandonSession() {
    if (!this.currentSessionId) return;

    const { error } = await supabase
      .from('game_sessions')
      .update({ status: 'abandoned' })
      .eq('id', this.currentSessionId);
      
    if (error) console.error('Failed to abandon session:', error);
    this.currentSessionId = null;
  }
}
