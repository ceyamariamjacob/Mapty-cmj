'use strict';


// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout{
    date=new Date();
    id=(Date.now()+'').slice(-10);

    constructor(distance,duration,coords){
        this.distance=distance;//km
        this.duration=duration;//min
        this.coords=coords;//[lat,lng]
        
    }
    _setDescription(){
        this.description=`${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }

}

class Running extends Workout{
    type='running';
    constructor(distance,duration,coords,cadence){
        super(distance,duration,coords);
        this.cadence=cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace(){
        //min / km;
        this.pace=Number(this.duration/this.distance).toFixed(1);
        return this.pace;
    }
}

class Cycling extends Workout{
    type='cycling';
    constructor(distance,duration,coords,elevationGain){
        super(distance,duration,coords);
        this.elevationGain=elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        //km/hr
        this.speed=Number(this.distance/(this.duration/60)).toFixed(1);
        return this.speed;
    }
}
const runn=new Running(10,45,[69,69],200);
console.log(runn);

class App{
    #map;
    #mapEvent;
    #workouts=[];
    constructor(){
        this._getPosition();

        //get data from localStorage
        this._getLocalStorage();
        
        inputType.addEventListener('change',this._toggleElevField);
        form.addEventListener('submit',this._newWorkout.bind(this));
        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));

    }
    _getPosition(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
                alert('nomap');
            });

        }
    }

    _loadMap(position){
        console.log(position);
        const {latitude}=position.coords;
        const {longitude}=position.coords;
        const coords=[latitude,longitude];
        // console.log(`https://www.google.com/maps/@${latitude},${longitude},15z?entry=ttu`);
        this.#map = L.map('map').setView(coords, 13);

        // L.tileLayer('https://tile.openstreetmap.org/hot/{z}/{x}/{y}.png', {
        //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        // }).addTo(this.#map);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.#map);

        // L.marker(coords).addTo(this.#map)
        // .bindPopup('A pretty CSS popup.<br> Easily customizable.')
        // .openPopup();

        this.#map.on('click',this._showForm.bind(this));

        this.#workouts.forEach(work=>{
            this._renderMarker(work);
        });
        
    }
    _showForm(mapE){
        this.#mapEvent=mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
  
    }
    _hideForm(){
        inputDistance.value=inputCadence.value=inputDuration.value=inputElevation.value="";
        form.style.display='none';
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display='grid';
        },1000);

    }
    _toggleElevField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');

    }
    _newWorkout(e){
        e.preventDefault();

        const allnumbers=(...inputs)=>inputs.every(input=>Number.isFinite(input));
        const allpositive=(...inputs)=>inputs.every(input=>input>0);




        const distance=+inputDistance.value;
        const duration=+inputDuration.value;
        const type=inputType.value;
        const {lat,lng}=this.#mapEvent.latlng;
        let workout;

        //running
        if(type=='running'){
            const cadence=+inputCadence.value;
            if(!allnumbers(distance,duration,cadence) || !allpositive(distance,duration,cadence)){
                return alert('Inputs should be positive numbers.');
            }

            workout=new Running(distance,duration,{lat,lng},cadence);
        }


        //cycling
        if(type=='cycling'){
            const elevationgain=+inputElevation.value;
            if(!allnumbers(distance,duration,elevationgain) || !allpositive(distance,duration)){
                return alert('Inputs should be positive numbers.');
            }

            workout=new Cycling(distance,duration,{lat,lng},elevationgain);
        }


        //update workouts array
        this.#workouts.push(workout);
        console.log(this.#workouts);

        //display marker
        this._renderMarker(workout);

        //render workout on list
        this._renderWorkouts(workout);

        //hide form +clear inputs
        this._hideForm();

        //set local storage to all workouts
        this._setLocalStorage();
    
        
    }

    _renderMarker(workout){
        //display marker
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth:250,
                minWidth:100,
                autoClose: false,
                closeOnClick: false,
                className:`${workout.type}-popup`
            }))
            .setPopupContent(`${workout.type=='running'?'🏃‍♂️': '🚴‍♀️'} ${workout.description}`)
            .openPopup();
    }

    _renderWorkouts(workout){
        const html=`<li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type=='running'?'🏃‍♂️': '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.type=='running'?workout.pace:workout.speed}</span>
            <span class="workout__unit">${workout.type=='running'?'min/km':'km/h'}</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${workout.type=='running'?'🦶🏼':'⛰'}</span>
            <span class="workout__value">${workout.type=='running'?workout.cadence:workout.elevationGain}</span>
            <span class="workout__unit">${workout.type=='running'?'spm':'m'}</span>
          </div>
        </li>`;

        form.insertAdjacentHTML('afterend',html);

    }

    _moveToPopup(e){
        if(!this.#map)return;
        const workoutelem=e.target.closest('.workout');
        
        if(!workoutelem)return;

        const workout=this.#workouts.find(
            work=>work.id===workoutelem.dataset.id
        );

        this.#map.setView(workout.coords,13,{
            animate:true,
            pan:{
                duration:1,
            },
        });

    }

    _setLocalStorage(){
        localStorage.setItem('workouts',JSON.stringify(this.#workouts));
    }

    _getLocalStorage(){
        const data=JSON.parse(localStorage.getItem('workouts'));
        console.log(data);

        if(!data)return;

        this.#workouts=data;

        this.#workouts.forEach(work=>{
            this._renderWorkouts(work);
        });
    }

    reset(){
        localStorage.removeItem('workouts');
        location.reload();
        
    }

}
const app=new App();
