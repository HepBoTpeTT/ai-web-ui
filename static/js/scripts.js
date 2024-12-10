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

window.addEventListener('DOMContentLoaded', ()=>{
    var filesList = document.querySelector('.uploads-list');
    var filesSaved = [];

    function createAudio(file, parent){
        let fileLi = document.createElement('li');
            fileLi.textContent = file.name;
            fileLi.setAttribute('name', file.name);
        let fileImg = document.createElement('img');
            fileImg.classList.add('img-fluid');
            fileImg.src = '/static/images/default-audio-image.webp';

        fileLi.insertAdjacentElement('afterbegin', fileImg);
        parent.appendChild(fileLi);
        
    }

    let fileInput = document.querySelector('input[type="file"]');

    document.querySelector('.drop-audio button').addEventListener('click', ()=>{
        fileInput.click();
    });

    document.querySelector('.uploads-modal').addEventListener('click', (e)=>{
        filesList.innerHTML = '';
        e.target.classList.remove('active');
    })

    fileInput.addEventListener('change', ()=>{
        let files = fileInput.files;

        if (files.length === 0) {return};
        document.querySelector('.uploads-modal').classList.add('active');
        filesList.innerHTML = '';
        filesSaved = [];

        [...files].forEach(file => {
            if (/.wav/.exec(file.name)) {
                createAudio(file, filesList);
                filesSaved.push(file);
            }
        });
    });

    document.querySelector('button[name="analyse"]').addEventListener('click', function(e) {
        e.preventDefault();
        const files = filesSaved;
        document.querySelector('.uploads-modal').classList.remove('active');
        const DOMparser = new DOMParser();



        for (const file of files){
            const formData = new FormData();
                  formData.append('files', file);

            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    return response.text(); // Обрабатываем ответ в формате JSON
                }
                throw new Error('Ошибка при загрузке файлов');
            })
            .then(templateContent => {
                let main = document.querySelector('.other-audio');
                let doc = DOMparser.parseFromString(templateContent, 'text/html');
                document.querySelector('main').classList.add('audio');
                document.querySelector('header').classList.add('audio');
                

                new AudioPlayer(doc.querySelector('.audio-container'));
                main.appendChild(doc.querySelector('.audio-container'));
            })
            .catch(error => {
                console.error('Ошибка:', error);
            });
        }
    });
});
