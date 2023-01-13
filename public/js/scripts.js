class Poll {
  constructor() {
    if (Poll.LAST_VOTES.length > 0) {
      this.results.classList.remove('-hidden');
      this.pollContent.classList.add('-hidden');
    }

    this.getTopics(Poll.LAST_VOTES.length > 0);

    this.suggestionListeners();
    this.submitButtonListener();
    this.deleteSuggestionListener();
    this.voteAgainListener();
  }

  static get URL() {
    return new URL(window.location.href).origin;
  }

  static get TOPICS_URL() {
    return Poll.URL + '/topics';
  }

  static get UPDATE_URL() {
    return Poll.TOPICS_URL + '/update';
  }

  static get ADD_URL() {
    return Poll.TOPICS_URL + '/add';
  }

  static get USER() {
    const cookies = `; ${document.cookie}`; 
    const parts = cookies.split(`; token=`);
    return parts.length === 2 && parts.pop().split(';').shift();
  }

  static get LAST_VOTES() {
    let lastVotes = window.localStorage.getItem('last-votes');
    return lastVotes = lastVotes ? JSON.parse(lastVotes) : [];
  }

  get pollContent() {
    return document.getElementById('poll-content');
  }

  get topics() {
    return document.getElementById('topics');
  }

  get suggestions() {
    return document.getElementById('suggestions');
  }
  
  get suggestionsTitle() {
    return document.getElementById('suggestions-title');
  }

  get suggestionBlocks() {
    return document.querySelectorAll('.add-suggestion__block');
  }

  get addSuggestion() {
    return document.getElementById('add-suggestion');
  }

  get removeSuggestion() {
    return document.querySelectorAll('.remove-suggestion');
  }

  get deleteSuggestion() {
    return document.querySelectorAll('button[id*="delete-suggestion-"]');
  }

  get submitButton() {
    return document.getElementById('submit-button');
  }

  get votes() {
    return document.querySelectorAll('input[type="checkbox"]:checked');
  }

  get newSuggestions() {
    return document.querySelectorAll('input[name*="suggestion-"]');
  }

  get results() {
    return document.getElementById('results');
  }

  get graph() {
    return document.getElementById('graph');
  }

  get voteAgain() {
    return document.getElementById('vote-again-button');
  }

  async getTopics(showResults) {
    await fetch(Poll.TOPICS_URL)
      .then((response) => response.json())
      .then((result) => showResults ? this.insertResults(result) : this.insertTopics(result))
      .catch((error) => new Error(error));
  }

  insertTopics(result) {
    result.map((data) => {
      const topics = data.topics;
      const suggestions = data.suggestions;

      this.buildTopics(topics, this.topics);
      if (suggestions.length) {
        this.suggestionsTitle.classList.remove('-hidden');
        this.suggestions.parentElement.classList.remove('-hidden');
        this.buildSuggestions(suggestions);
      }
    });
  }

  buildSuggestions(suggestions) {
    suggestions.forEach((s) => {
      this.suggestions.insertAdjacentHTML('beforeend', `
        <li>
          <input type="checkbox" name="${s._id}" value="${s.topic}" title="${s.topic}" ${s.creator === Poll.USER ? 'checked' : null}>
          <label for="${s._id}">${s.topic}</label>
          ${s.creator === Poll.USER ? `
            <div class="delete-suggestion__wrapper">
              <button type="button" id="delete-suggestion-${s._id}">
                <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M7 21q-.825 0-1.412-.587Q5 19.825 5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413Q17.825 21 17 21ZM17 6H7v13h10ZM9 17h2V8H9Zm4 0h2V8h-2ZM7 6v13Z"/></svg>
                <span>Remove your suggestion</span>
              </button>
            </div>
          ` : ''}
        </li>
      `);
    });
    this.deleteSuggestionListener();
  }

  buildTopics(topics, parent) {
    topics.forEach((t) => {
      parent.insertAdjacentHTML('beforeend', `
        <li>
          <input type="checkbox" name="${t._id}" value="${t.topic}" title="${t.topic}" ${Poll.LAST_VOTES.includes(t._id) ? 'checked' : null}>
          <label for="${t._id}">${t.topic}</label>
        </li>
      `);
    });
  }

  addSuggestionListener() {
    this.addSuggestion.addEventListener('click', () => {
      if (this.suggestionBlocks.length === 1 && this.suggestionBlocks[0].classList.contains('-hidden')) {
        this.suggestionBlocks[0].classList.remove('-hidden');
      } else {
        this.cloneSuggestionInput();
      }
    });
  }

  removeSuggestionListener() {
    this.removeSuggestion.forEach((button) => {
      button.addEventListener('click', (event) => {
        const parent = event.target.closest('.add-suggestion__block');

        if (this.suggestionBlocks.length === 1) {
          const input = this.suggestionBlocks[0].querySelector('input[type="text"]');
          input.value = '';
          this.suggestionBlocks[0].classList.add('-hidden');
        } else {
          parent.remove();
        }
      });
    });
  }

  suggestionListeners() {
    this.addSuggestionListener();
    this.removeSuggestionListener();
  }

  deleteSuggestionListener() {
    this.deleteSuggestion.forEach((button) => {
      button.addEventListener('click', (event) => {
        const suggestionId = event.target.closest('button').id.split('delete-suggestion-')[1];
        this.deleteSavedSuggestion(suggestionId);
      });
    });
  }

  async deleteSavedSuggestion(suggestionId) {
    if (confirm('Are you sure you want to delete this suggestion?')) {
      await fetch(Poll.TOPICS_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: suggestionId })
      })
      .then((response) => response.json())
      .then((result) => {
        const suggestion = document.querySelector(`#suggestions input[name="${suggestionId}"]`).closest('li');
        suggestion.remove();

        const suggestionsAmount = this.suggestions.querySelectorAll('li').length;
        if (suggestionsAmount === 0) {
          this.suggestionsTitle.classList.add('-hidden');
          this.suggestions.parentElement.classList.add('-hidden');
        }
      })
      .catch((error) => new Error(error));
    };
  }

  cloneSuggestionInput() {
    const lastElement = this.suggestionBlocks[this.suggestionBlocks.length - 1];
    const clone = lastElement.cloneNode(true);
    const cloneIndex = Number(clone.dataset.index);
    const cloneInputName = clone.querySelector('input').name;
    
    clone.dataset.index = cloneIndex + 1;
    clone.querySelector('input').name = cloneInputName.split('-')[0] + '-' + (cloneIndex + 1);
    clone.querySelector('input').value = ''; 

    lastElement.parentElement.insertBefore(clone, this.addSuggestion.parentElement);
    this.removeSuggestionListener();
  }

  submitButtonListener() {
    this.submitButton.addEventListener('click', () => this.sendData());
  }

  async sendData() {
    const votes = [...this.votes].map((topic) => topic.name);
    const newSuggestions = [...this.newSuggestions]
                             .filter((suggestion) => suggestion.value && suggestion.value.trim() !== '')
                             .map((suggestion) => String(suggestion.value));

    if (votes.length || newSuggestions.length) {
      if (votes.length) {
        await this.sendVotes(votes);
        window.localStorage.setItem('last-votes', JSON.stringify([...votes]));
      }
      if (newSuggestions.length) {
        await this.sendSuggestions(newSuggestions);
      }
      await this.getTopics(true);
    } else {
      alert('Please select a topic.');
    }
  }

  async sendVotes(votes) {
    await fetch(Poll.UPDATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(votes)
    })
    .then((response) => response.json())
    .then((result) => console.log(result))
    .catch((error) => new Error(error));
  }

  async sendSuggestions(suggestions) {
    await fetch(Poll.ADD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(suggestions)
    })
      .then((response) => response.json())
      .then((result) => console.log(result))
      .catch((error) => new Error(error));
  }

  insertResults(results) {
    this.insertGraph(results);
    this.results.classList.remove('-hidden');
    this.pollContent.classList.add('-hidden');
  }

  insertGraph(results) {
    const graphData = [];
   
    results.map((data) => {
      data.topics.map((t) => graphData.push({ id: t._id, topic: t.topic, votes: t.votes }));
      if (data.suggestions.length) {
        data.suggestions.map((s) => graphData.push({ creator: s.creator, topic: s.topic, votes: s.votes }));
      }
    });
    
    Chart.defaults.font.size = 18;
    new Chart(this.graph.getContext('2d'), {
      type: 'bar',
      data: {
        labels: [...graphData].map((data) => data.topic),
        datasets: [{
          axis: 'y',
          data: [...graphData].map((data) => data.votes),
          backgroundColor: [...graphData].map(() => this.getRandomColor())
        }],
      },
      options: {
        indexAxis: 'y',
        elements: {
          bar: {
            borderWidth: 2,
          }
        },
        responsive: true,
        plugins: {
          legend: {
            position: 'none',
          },
        },
        scales: {
          x: {
            ticks: {
              stepSize: 1
            }
          },
          y: {
            ticks: {
              font: [...graphData].map((data) => ({ weight: ((data.id && Poll.LAST_VOTES.includes(data.id)) || data.creator && Poll.USER == data.creator) ? 'bold' : 'normal' }))
            }
          }
        }
      }
    });
  }

  voteAgainListener() {
    this.voteAgain.addEventListener('click', () => {
      this.results.classList.add('-hidden');
      this.pollContent.classList.remove('-hidden');
      this.getTopics(false);
    });
  }

  getRandomColor() {
    const symbols = '0123456789ABCDEF'.split('');
    let color = '#';
    
    for (let i = 0; i < 6; i++ ) {
      color += symbols[Math.floor(Math.random() * 16)];
    }
    
    return color;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Poll();
});