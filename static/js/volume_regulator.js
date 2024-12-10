class Range{
  constructor(parent, handler, {from = 0, to = 100, step = 1, defaultValue = null} = {})
  {
    //навешиваем все заданные значения
    this.from = from;
    this.to = to;
    this.step = step;
    this.handler = handler.bind(this);
    
    //готовим свойства для будущей записи
    this.value;
    this.persentValue;
    
    //определяем шаг в процентах
    this.persentStep = step * 100 / (this.to - this.from);
    
    //свойства в которых будем хранить dom узлы
    this._parent = parent;
    this._wrap;
    this._range;
    this._progressLine;
    this._offsetPointer;
    
    //создаем dom нашего range
    this._createHTML();
    //устанавливаем дефолтное знание
    this._setDefaultValue(defaultValue);
  }
  //считаем сколько шагов поместится в значение | нужно для того чтобы значения были кратны нашем шагу (любое некратное мы преобразовываем в ближайшее кратное)
   _countSteps(value)
  {
    return Math.round(value/this.persentStep);
  }
  //берем процентное значение об обычного значения
  _getPersentValue(value)
  {
    let fullPersentValue = ((value - this.from) * 100)/(this.to - this.from);
    let perstentStepsCount = this._countSteps(fullPersentValue);
    return perstentStepsCount * this.persentStep;
  }
  //устанавливаем дефалтное значение
  _setDefaultValue(defaultValue)
  {
    let persentDefaultValue;
    //если больше или меньше устанавливаем максимальное или минимальное процентное значение соответственно
    if(!defaultValue || defaultValue <= this.from ) persentDefaultValue = 50;
    else if(defaultValue >= this.to) persentDefaultValue = 100;
    //если в рамках тогда переводим дефалтное значение в процентную форму
    else persentDefaultValue = this._getPersentValue(defaultValue);
   
   //устанавливаем процентное значение
    this._setPersentValue(persentDefaultValue);
  }
  //тут создаем наш dom
  _createHTML()
  {
    this._wrap = document.createElement("div");
    this._wrap.className = "wrap";
    this._range = document.createElement("div");
    this._range.className = "range";
    this._progressLine = document.createElement("div");
    this._progressLine.className = "progress-line";
    this._offsetPointer = document.createElement("div");
    this._offsetPointer.className = "offset-pointer";
    
    this._progressLine.appendChild(this._offsetPointer);
    this._range.appendChild(this._progressLine);
    this._wrap.appendChild(this._range);
    this._parent.appendChild(this._wrap);
    //тут будем вешать обработчики событий
    this._setOnMoveHandler();
  }
  //тут устанавливаем обычное значение
  _setValue(value)
  {
    this.value = value;
    this.handler(this.value, this.persentValue);
  }
  //это используюем для внешней установки значения
  setValue(value)
  {
    //переводим наше значение в процентную форму
    this._setDefaultValue(value);
  }
  //устанавливаем процентное значение
  _setPersentValue(persentValue)
  {
    this.persentValue = persentValue;
    //переводим процент в обыкновенное значение
    let newValue = this.from + (this.persentValue * (this.to - this.from))/100;
    //тут отображаем наш progress-line
    this._setRangeOffset();
    //устанавливаем обычное значение
    this._setValue(newValue);
  }
  //отображаем progress-line
  _setRangeOffset()
  {
    this._progressLine.style.width = `${this.persentValue}%`;
  }
  //навешиваем нужные обработчики
  _setOnMoveHandler()
  {
    //движение начинается по событию mousedown на range
    function startMoving(e)
    {
      //берем координаты нашего range и получаем все прочие параметры
      const rangeCords = this._range.getBoundingClientRect();
      const rangeRight = rangeCords.right;
      const rangeLeft = rangeCords.left;
      const rangeWidth = rangeRight - rangeLeft;
      //обработчик mousemove по окну
      const Moving = function(e)
      {
        //смотрим какой x у нашего курсора
        const x = e.clientX;
        let _persentValue;
        //если x меньше или больше начала или конца нашего range тогда соответственно ставим минимальное или максимальное значение
        if(x <= rangeLeft) _persentValue = 0;
        else if(x >= rangeRight) _persentValue = 100;
        //в противном случае берем разницу x - rangeLeft и переводим ее в процент с учетом кратности шага
        else{
          let offsetValue = x - rangeLeft;
          let fullPersentValue = (offsetValue * 100)/rangeWidth;
          let persentStepsCount = this._countSteps(fullPersentValue);
          _persentValue = persentStepsCount * this.persentStep;
        }
        //устанавливаем процентное значение
        this._setPersentValue(_persentValue);
      }.bind(this);
      //вызываем функцию при клике (это нужно чтобы обработчик сработал даже если пользователь просто кликнет по range)
      Moving(e);
      //функция для подчистки всех наших обработчиков после того как пользователь закончит работу с ползунком
      function Cleaning()
      {
        window.removeEventListener("mousemove", Moving);
        window.removeEventListener("mouseup", Cleaning);
      }
      //навешиваем событие на движение мыши по окну 
      window.addEventListener("mousemove", Moving);
      //удаляем все события после того как кнопка мыши отжата
      window.addEventListener("mouseup", Cleaning);
    }
    //навешим события на клик по range
    this._range.addEventListener("mousedown", startMoving.bind(this))
  }
}

const range1 = document.querySelector(".volume-regulator-container");
const muted = '<path d="M7 17.75H5C2.58 17.75 1.25 16.42 1.25 14V9.99999C1.25 7.57999 2.58 6.24999 5 6.24999H6.43C6.66 6.24999 6.89 6.17999 7.09 6.05999L10.01 4.22999C11.47 3.31999 12.89 3.14999 14.01 3.76999C15.13 4.38999 15.74 5.67999 15.74 7.40999V8.36999C15.74 8.77999 15.4 9.11999 14.99 9.11999C14.58 9.11999 14.24 8.77999 14.24 8.36999V7.40999C14.24 6.26999 13.89 5.41999 13.28 5.08999C12.67 4.74999 11.77 4.89999 10.8 5.50999L7.88 7.32999C7.45 7.60999 6.94 7.74999 6.43 7.74999H5C3.42 7.74999 2.75 8.41999 2.75 9.99999V14C2.75 15.58 3.42 16.25 5 16.25H7C7.41 16.25 7.75 16.59 7.75 17C7.75 17.41 7.41 17.75 7 17.75Z"></path><path d="M12.55 20.59C11.76 20.59 10.89 20.31 10.02 19.76C9.66997 19.54 9.55997 19.08 9.77997 18.73C9.99997 18.38 10.46 18.27 10.81 18.49C11.78 19.09 12.68 19.25 13.29 18.91C13.9 18.57 14.25 17.72 14.25 16.59V12.95C14.25 12.54 14.59 12.2 15 12.2C15.41 12.2 15.75 12.54 15.75 12.95V16.59C15.75 18.31 15.13 19.61 14.02 20.23C13.57 20.47 13.07 20.59 12.55 20.59Z"></path><path d="M18 16.75C17.84 16.75 17.69 16.7 17.55 16.6C17.22 16.35 17.15 15.88 17.4 15.55C18.66 13.87 18.93 11.64 18.12 9.71C17.96 9.33 18.14 8.89 18.52 8.73C18.9 8.57 19.34 8.75 19.5 9.13C20.52 11.55 20.17 14.36 18.6 16.46C18.45 16.65 18.23 16.75 18 16.75Z"></path><path d="M19.83 19.25C19.67 19.25 19.52 19.2 19.38 19.1C19.05 18.85 18.98 18.38 19.23 18.05C21.37 15.2 21.84 11.38 20.46 8.09C20.3 7.71 20.48 7.27 20.86 7.11C21.25 6.95 21.68 7.13 21.84 7.51C23.43 11.29 22.89 15.67 20.43 18.95C20.29 19.15 20.06 19.25 19.83 19.25Z"></path><path d="M1.99994 22.75C1.80994 22.75 1.61994 22.68 1.46994 22.53C1.17994 22.24 1.17994 21.76 1.46994 21.47L21.4699 1.47C21.7599 1.18 22.2399 1.18 22.5299 1.47C22.8199 1.76 22.8199 2.24 22.5299 2.53L2.52994 22.53C2.37994 22.68 2.18994 22.75 1.99994 22.75Z" style="fill: #E44444"></path>';
const unmuted = '<path d="M12.55 20.59C11.76 20.59 10.89 20.31 10.02 19.76L7.1 17.93C6.9 17.81 6.67 17.74 6.44 17.74H5C2.58 17.74 1.25 16.41 1.25 13.99V9.99C1.25 7.57 2.58 6.24 5 6.24H6.43C6.66 6.24 6.89 6.17 7.09 6.05L10.01 4.22C11.47 3.31 12.89 3.14 14.01 3.76C15.13 4.38 15.74 5.67 15.74 7.4V16.57C15.74 18.29 15.12 19.59 14.01 20.21C13.57 20.47 13.07 20.59 12.55 20.59ZM5 7.75C3.42 7.75 2.75 8.42 2.75 10V14C2.75 15.58 3.42 16.25 5 16.25H6.43C6.95 16.25 7.45 16.39 7.89 16.67L10.81 18.5C11.77 19.1 12.68 19.26 13.29 18.92C13.9 18.58 14.25 17.73 14.25 16.6V7.41C14.25 6.27 13.9 5.42 13.29 5.09C12.68 4.75 11.77 4.9 10.81 5.51L7.88 7.33C7.45 7.61 6.94 7.75 6.43 7.75H5Z"></path><path d="M18 16.75C17.84 16.75 17.69 16.7 17.55 16.6C17.22 16.35 17.15 15.88 17.4 15.55C18.97 13.46 18.97 10.54 17.4 8.45C17.15 8.12 17.22 7.65 17.55 7.4C17.88 7.15 18.35 7.22 18.6 7.55C20.56 10.17 20.56 13.83 18.6 16.45C18.45 16.65 18.23 16.75 18 16.75Z" fill="#292D32"></path><path d="M19.83 19.25C19.67 19.25 19.52 19.2 19.38 19.1C19.05 18.85 18.98 18.38 19.23 18.05C21.9 14.49 21.9 9.51 19.23 5.95C18.98 5.62 19.05 5.15 19.38 4.9C19.71 4.65 20.18 4.72 20.43 5.05C23.5 9.14 23.5 14.86 20.43 18.95C20.29 19.15 20.06 19.25 19.83 19.25Z" fill="#292D32"></path>';
var saved_value;
let volume_icon = document.querySelector(".volume-regulator-container").querySelector('svg')
let _range = new Range(range1, (value, persentValue) => {
  if(persentValue == 0){
    volume_icon.innerHTML = muted
  }
  else{
    volume_icon.innerHTML = unmuted;
    saved_value = persentValue;
  }
  document.querySelector('#audioPlayer').volume = persentValue / 100;
  
})
volume_icon.addEventListener('click', function(){
  if(volume_icon.innerHTML == unmuted){
    _range._setPersentValue(0);
    document.querySelector('#audioPlayer').volume = 0;
    volume_icon.innerHTML = muted;
  }
  else{
    _range._setDefaultValue(saved_value);
    document.querySelector('#audioPlayer').volume = saved_value / 100;
    volume_icon.innerHTML = unmuted;
  }
})
