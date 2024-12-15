from jinja2 import *
from pathlib import Path
from flask import *
import spaces
from audio_separation.clearvoice import ClearVoice
from emotion_recognition.prog import predict_emotion
import soundfile as sf
import webbrowser
app = Flask(__name__)
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
def fn_clearvoice_se(input_wav, sr):
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
    sf.write(input_wav, output_wav, fs)
    return input_wav
##

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
        files = request.files.getlist('files')

        file_path = str(path / 'audio-source' / files[0].filename)
        files[0].save(file_path)

        new_folder_path = path / audio_processed_path / files[0].filename[:-4]
        new_folder_path.mkdir(exist_ok=True)

        link_path = str(audio_processed_path / files[0].filename[:-4] / 'operator.wav').replace('\\', '/')

        print(
            '',
            f'Сохранённый файл: {new_folder_path / "operator.wav"}',
            f'Путь для ссылки {link_path}',
            '',
            sep="\n"
        )

        operator = fn_clearvoice_ss(file_path, new_folder_path)
        operator_denoised = fn_clearvoice_se(operator, "16000 Hz")
        emotion = predict_emotion(operator_denoised)
        
        if emotion == 'Positive' : return make_response()
        
        return render_template('audio-card.html', name = f'{files[0].filename} / operator', image = 'images/default-audio-image.webp',
                               audio_path = link_path, emotion = emotion)

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