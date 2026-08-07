import { QuizPage } from './QuizPage.js';

export class CapitalsPage extends QuizPage {
  constructor(app) {
    super(app, 'page-capitals');
  }

  updateDisplayArea() {
    const area = this.container.querySelector('#quiz-display-area');
    if (!area) return;

    area.innerHTML = `
      <div class="capital-quiz-display">
        <span class="quiz-label-small">This is the capital of...</span>
        <h2 class="quiz-capital-name">${this.currentCountry.capital}</h2>
      </div>
    `;
    
    // Update instruction
    const instr = this.container.querySelector('#quiz-instruction');
    if (instr) instr.textContent = "Which country has this capital?";
  }
}
