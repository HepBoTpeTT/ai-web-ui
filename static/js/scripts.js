class AudioPlayer{
    constructor(audio_obj){
        this.audioDuration;
        this.audioControls = audio_obj.querySelector('.audio-controls');
        this.playPauseButton = audio_obj.querySelector('button[name="playPause"]');
        this.audioFile = audio_obj.querySelector('audio');
        this.playSvg = audio_obj.querySelector('svg[name="playSVG"]');
        this.pauseSvg = audio_obj.querySelector('svg[name="pauseSVG"]');
        this.audioListeningProgressBar = audio_obj.querySelector('.audio-listening-progress');

        this.audioFile.addEventListener('loadedmetadata', ()=>{
            this.audioDuration = this.audioFile.duration;
            this.progresStep = 100 / this.audioDuration;
        });
        this.audioFile.load();

        this.audioFile.addEventListener('timeupdate', (e)=> {
            this.audioListeningProgressBar.style = `width: ${e.target.currentTime / this.audioDuration * 100}%`;

            if (e.target.currentTime === this.audioDuration) {
                this.audioListeningProgressBar.style = `width: 0%`;
                this.pause();
            }
        });
        this.PlayPause();
    }

    PlayPause(){
        this.audioControls.addEventListener('click', ()=>{
            if (this.playPauseButton.className === 'play'){
                this.pause();
                this.audioFile.pause();
            }
            else{
                this.play();
                this.audioFile.play();
            }
        })
    }


    play(){
        this.playPauseButton.classList = 'play';
        this.pauseSvg.style.display = 'block';
        this.playSvg.style.display = 'none';
    }
    pause(){
        this.playPauseButton.classList = 'pause';
        this.pauseSvg.style.display = 'none';
        this.playSvg.style.display = 'block';
    }
}

// 
// 
// 
// 
var localFiles = [];
var totalFiles = [];

function createAudio(file, parent){
    let fileLi = document.createElement('li');
        fileLi.textContent = file.name;
        fileLi.setAttribute('name', file.name);
    let fileImg = document.createElement('img');
        fileImg.classList.add('img-fluid');
        fileImg.src = '/static/images/default-audio-image.webp';

    let delButton = document.createElement('button');
        delButton.classList.add('uploads-delete-button');
        delButton.innerHTML = `<svg viewBox="0 0 25 25" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns">
                                    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage">
                                        <g id="Icon-Set-Filled" sketch:type="MSLayerGroup" transform="translate(-469.000000, -1041.000000)" fill="#000000">
                                            <path d="M487.148,1053.48 L492.813,1047.82 C494.376,1046.26 494.376,1043.72 492.813,1042.16 C491.248,1040.59 488.712,1040.59 487.148,1042.16 L481.484,1047.82 L475.82,1042.16 C474.257,1040.59 471.721,1040.59 470.156,1042.16 C468.593,1043.72 468.593,1046.26 470.156,1047.82 L475.82,1053.48 L470.156,1059.15 C468.593,1060.71 468.593,1063.25 470.156,1064.81 C471.721,1066.38 474.257,1066.38 475.82,1064.81 L481.484,1059.15 L487.148,1064.81 C488.712,1066.38 491.248,1066.38 492.813,1064.81 C494.376,1063.25 494.376,1060.71 492.813,1059.15 L487.148,1053.48" id="cross" sketch:type="MSShapeGroup">

                                            </path>
                                        </g>
                                    </g>
                                </svg>`;

    let needsSeparating = document.createElement('input');
        needsSeparating.type="checkbox";

    delButton.addEventListener('click', ()=>{
        localFiles = removeFileByName(localFiles, file.name);
        parent.removeChild(fileLi);
    });

    fileLi.insertAdjacentElement('afterbegin', fileImg);
    fileLi.insertAdjacentElement('beforeend', needsSeparating);
    fileLi.insertAdjacentElement('beforeend', delButton);
    parent.appendChild(fileLi);
    
}

function removeFileByName(fileArray, fileName) {
    return fileArray.filter(file => file.name !== fileName);
}

function emptyInputAlert(fileInput){
    alert('Выберите хотя бы один файл');
    fileInput.click();
}

// 
// 
// 
// 

window.addEventListener('DOMContentLoaded', ()=>{
    var filesList = document.querySelector('.uploads-list');
    var fileInput = document.querySelector('input[type="file"]');

    document.querySelector('.drop-audio button').addEventListener('click', ()=>{
        fileInput.click();
    });

    document.querySelector('.uploads-modal').addEventListener('click', (e) => e.target.className === 'uploads-modal active' ? hideModal() : false);
    document.addEventListener('keyup', (e) => e.key === 'Escape' ? hideModal() : false);

    function hideModal(){
        filesList.innerHTML = '';
        fileInput.value = '';
        document.querySelector('.uploads-modal').classList.remove('active');
        localFiles = [];
    }


    fileInput.addEventListener('change', ()=>{
        const files = fileInput.files;
        [...files].forEach(newFile => {
            const localFileExists = localFiles.find(file => file.name === newFile.name);
            const totalFileExist = totalFiles.find(file => file.name === newFile.name);

            if (/.wav/.exec(newFile.name) && !localFileExists && !totalFileExist) {
                localFiles.push(newFile);
                createAudio(newFile, filesList);
            }
        });

        if (localFiles.length === 0) { emptyInputAlert(fileInput); return };

        document.querySelector('.uploads-modal').classList.add('active');
        fileInput.value = '';
    });

    document.querySelector('button[name="analyse"]').addEventListener('click', () => {
        if (localFiles.length === 0) { emptyInputAlert(fileInput); return };

        let separatingFlags = {};

        [...document.querySelectorAll('.uploads-modal li')].forEach(li =>{
            separatingFlags[li.getAttribute('name')] = li.querySelector('input[type="checkbox"]').checked
        })

        filesList.innerHTML = '';
        document.querySelector('.uploads-modal').classList.remove('active');
        const DOMparser = new DOMParser();

        totalFiles = [...totalFiles, ...localFiles];

        document.querySelector('.loading-mask').style.display = 'block';

        
        const formData = new FormData();
        localFiles.map(item => {
            formData.append('files', item)
        })
        formData.append('sepsFlags', JSON.stringify(separatingFlags))

        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (response.ok) {
                return response.json(); // Обрабатываем ответ в формате JSON
            }
            throw new Error('Ошибка при загрузке файлов');
        })
        .then(data => {
            document.querySelector('.loading-mask').style = '';
            hideModal();
            if (data.audios === '') {return};
            for(var templateContent of data.audios){
                let main = document.querySelector('.other-audio');
                let doc = DOMparser.parseFromString(templateContent, 'text/html');
                document.querySelector('main').classList.add('audio');
                document.querySelector('header').classList.add('audio');
                

                new AudioPlayer(doc.querySelector('.audio-container'));
                main.appendChild(doc.querySelector('.audio-container'));
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
        });
    });
});
