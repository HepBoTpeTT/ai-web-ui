from jinja2 import *
from pathlib import Path
from flask import *
import spaces
from audio_separation.clearvoice import ClearVoice
from emotion_recognition.prog import predict_emotion
import soundfile as sf
import webbrowser
from pydub import AudioSegment
import os
from json import loads

app = Flask(__name__)
app.config['SERVER_NAME'] = 'localhost:5000'


path = Path('static')
audio_processed_path = Path('audio_processed')



## Audio spearation func

@spaces.GPU
def fn_clearvoice_ss(input_wav, folder_name):
    myClearVoice = ClearVoice(task='speech_separation', model_names=['MossFormer2_SS_16K'])
    output_wav_dict = myClearVoice(input_path=input_wav, online_write=False)
    if isinstance(output_wav_dict, dict):
        key = next(iter(output_wav_dict))
        output_wav_list = output_wav_dict[key]
    else:
        output_wav_list = output_wav_dict
    
    output_wav_s2 = output_wav_list[1]

    operator_file_path = str(folder_name / 'operator.wav')
    sf.write(operator_file_path, output_wav_s2, 16000)
    return operator_file_path
##


## Audio enhancement func
@spaces.GPU
def fn_clearvoice_se(input_wav, sr, sep_flag, file_name = None):
    if sr == "16000 Hz":
        myClearVoice = ClearVoice(task='speech_enhancement', model_names=['FRCRN_SE_16K'])
        fs = 16000
    else:
        myClearVoice = ClearVoice(task='speech_enhancement', model_names=['MossFormer2_SE_48K'])
        fs = 48000
    output_wav_dict = myClearVoice(input_path=input_wav, online_write=False)
    if isinstance(output_wav_dict, dict):
        key = next(iter(output_wav_dict))
        output_wav = output_wav_dict[key]
    else:
        output_wav = output_wav_dict

    if sep_flag: writing_path = input_wav
    else: writing_path = str(path / audio_processed_path / file_name[:-4] / 'operator.wav')

    sf.write(writing_path, output_wav, fs)
    return writing_path
##

def generate_response(files, seps):
    with app.app_context():
        result_list = []
        for file in files:
            print('----------------------')
            file_path = str(path / 'audio-source' / f'{file.filename[:-4]}_16k.wav')
            print('', file_path, '', sep='\n')

            new_folder_path = path / audio_processed_path / file.filename[:-4]
            new_folder_path.mkdir(exist_ok=True)
            link_path = str(audio_processed_path / file.filename[:-4] / 'operator.wav').replace('\\', '/')


            if seps[file.filename]:
                operator = fn_clearvoice_ss(file_path, new_folder_path)
                operator_denoised = fn_clearvoice_se(input_wav=operator, sr="16000 Hz", sep_flag=seps[file.filename])
                emotion = predict_emotion(operator_denoised)
                
            else:
                file_denoised = fn_clearvoice_se(file_path, "16000 Hz", seps[file.filename], file.filename)
                emotion = predict_emotion(file_denoised)

            os.remove(file_path)

            if emotion == 'Positive': continue

            audio_path = url_for('static', filename=link_path)
            image = url_for('static', filename='images/default-audio-image.webp')

            result_list.append(render_template('audio-card.html', name = f'{file.filename} / operator', image = image,
                                audio_path = audio_path, emotion = emotion))
            
        return result_list

def save_file_in_good_format(file):
    try:
        temp_file_path = Path('temp', file.filename)
        audio = AudioSegment.from_file(str(temp_file_path))
        audio = audio.set_frame_rate(16000)

        # Сохраняем файл в формате WAV
        output_file_path = str(path / 'audio-source' / f"{file.filename[:-4]}_16k.wav")
        audio.export(output_file_path, format='wav')

        # Удаляем временный файл
        os.remove(temp_file_path)

        print(f'Файл сохранён: {output_file_path}')
        return output_file_path

    except Exception as e:
        print(f'Ошибка при обработке файла {file.filename}: {e}')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    files = request.files.getlist('files')
    separation_flags = loads(request.form.get('sepsFlags'))

    print(separation_flags, type(separation_flags))

    # Предварительное сохранение файлов
    tuple(map(lambda file: file.save(Path('temp', file.filename)), files))

    # Пересохранение файлов в нужный формат
    tuple(map(lambda item: save_file_in_good_format(item), files))

    return jsonify({'audios' : generate_response(files, separation_flags)})

@app.route('/update_single', methods=['POST'])
def update_single():
    data = request.get_json()
    print(data)
    audio_path = data.get('audio_path', '')
    emotion = predict_emotion(audio_path)
    return jsonify({'emotion' : emotion})

if __name__ == "__main__":
    webbrowser.open_new_tab('http://127.0.0.1:5000/')
    app.run(debug=False)
