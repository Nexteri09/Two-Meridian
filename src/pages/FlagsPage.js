import { QuizPage } from './QuizPage.js';

export class FlagsPage extends QuizPage {
  constructor(app) {
    super(app, 'page-flags');
  }

  updateDisplayArea() {
    const area = this.container.querySelector('#quiz-display-area');
    if (!area) return;

    const flagUrl = `https://flagcdn.com/w320/${this.currentCountry.id.toLowerCase()}.png`;

    area.innerHTML = `
      <div class="flag-quiz-display">
        <img src="${flagUrl}" alt="Guessed country flag" class="flag-quiz-image glass">
      </div>
    `;
  }
}
