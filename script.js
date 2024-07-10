'use strict';
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputTemp = document.querySelector('.form__input--temp');
const inputClimb = document.querySelector('.form__input--climb');
const deletBtn = document.querySelector('.workout__btn');
class Workout {
  date = new Date();

  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // km
    this.duration = duration; // min
  }
  _setDescription() {
    this.type === 'running'
      ? (this.description = `Пробіжка ${new Intl.DateTimeFormat('ua-Ua').format(
          this.date
        )}`)
      : (this.description = `Велотренування ${new Intl.DateTimeFormat(
          'ua-Ua'
        ).format(this.date)}`);
  }
}
// ........................................................................
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, temp) {
    super(coords, distance, duration);
    this.temp = temp;
    this.calculatePace();
    this._setDescription();
  }
  calculatePace() {
    this.pace = this.duration / this.distance;
  }
}
// .....................................................................
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, climb) {
    super(coords, distance, duration);
    this.climb = climb;
    this.calculateSpeed();
    this._setDescription();
  }
  calculateSpeed() {
    this.speed = this.distance / this.duration / 60;
  }
}
// ....................................................................
class App {
  #map;
  #mapEvent;
  #workouts = [];
  #markers = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleClimbField);
    containerWorkouts.addEventListener('click', this._movetoWorkout.bind(this));
    document
      .querySelector('.workouts')
      .addEventListener('click', this._deletTraining.bind(this));

    this._getLocalStorage();
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Неможливо отримати місцезнаходження');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(workout => {
      this._displayWorkout(workout);
    });
  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputTemp.value =
      inputClimb.value =
        '';

    form.classList.add('hidden');
  }

  _toggleClimbField() {
    inputClimb.closest('.form__row').classList.toggle('form__row--hidden');
    inputTemp.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const areNumbers = (...numbers) =>
      numbers.every(num => Number.isFinite(num));

    const areNumPositive = (...numbers) => numbers.every(num => num > 0);

    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    if (type === 'running') {
      const temp = +inputTemp.value;

      if (
        !areNumbers(distance, duration, temp) ||
        !areNumPositive(distance, duration, temp)
      )
        return alert('ти шо вводиш?');

      workout = new Running([lat, lng], distance, duration, temp);
    }

    if (type === 'cycling') {
      const climb = +inputClimb.value;
      if (
        !areNumbers(distance, duration, climb) ||
        !areNumPositive(distance, duration)
      )
        return alert('ти шо вводиш?');

      workout = new Cycling([lat, lng], distance, duration, climb);
    }

    this.#workouts.push(workout);
    console.log(workout);

    this._displayWorkout(workout);

    this._displayWorkoutOnSidebar(workout);

    this._hideForm();

    this._saveLocalData();
  }

  _displayWorkout(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
    this.#markers.push({ id: workout.id, marker: marker });
  }

  _displayWorkoutOnSidebar(workout) {
    let html = `
     <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <button class="workout__btn">🗑️</button>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">хв</span>
          </div>    
     `;

    if (workout.type === 'running') {
      html += `
           <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.pace.toFixed(2)}</span>
            <span class="workout__unit">хв/км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">👟</span>
            <span class="workout__value">${workout.temp}</span>
            <span class="workout__unit">крок/хв</span>
          </div> 
      </li>
  `;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">📏</span>
            <span class="workout__value">${workout.speed.toFixed(2)}</span>
            <span class="workout__unit">км/год</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰️</span>
            <span class="workout__value">${workout.climb}</span>
            <span class="workout__unit">м</span>
          </div>
      </li>
  `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _movetoWorkout(e) {
    const workoutElement = e.target.closest('.workout');
    if (!workoutElement) return;

    const workout = this.#workouts.find(
      item => item.id === workoutElement.dataset.id
    );
    this.#map.setView(workout.coords, 16, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  // /////////////////////////////..................
  _handleWorkoutClick(e) {
    if (e.target.classList.contains('workout__btn')) {
      e.stopPropagation();
      this._deletTraining(e);
    } else {
      this._movetoWorkout(e);
    }
  }
  _removeMarker(id) {
    const markerData = this.#markers.find(markerObj => markerObj.id === id);
    if (markerData) {
      this.#map.removeLayer(markerData.marker);
      this.#markers = this.#markers.filter(markerObj => markerObj.id !== id);
    }
  }

  _deletTraining(e) {
    if (!e.target.classList.contains('workout__btn')) return;

    const workoutElement = e.target.closest('.workout');
    if (!workoutElement) return;

    const workoutId = workoutElement.dataset.id;

    this.#workouts = this.#workouts.filter(workout => workout.id !== workoutId);

    this._removeMarker(workoutId);

    this._saveLocalData();

    workoutElement.remove();
  }
  // ////////////////////////////...................
  _saveLocalData() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(workout => {
      this._displayWorkoutOnSidebar(workout);
    });
  }
}
// ........................................................
const app = new App();
