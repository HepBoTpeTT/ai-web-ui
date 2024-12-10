from jinja2 import *
from pathlib import Path
from flask import *
from prog import start_analyse
import webbrowser
app = Flask(__name__)
path = Path('static')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
        files = request.files.getlist('files')

        file_path = str(Path('static', 'audio-source', files[0].filename))
        files[0].save(file_path)
        emotion = start_analyse(file_path)
        return render_template('audio-card.html', name = files[0].filename, image = 'images/default-audio-image.webp',
                               audio_path = f'audio-source/{files[0].filename}', emotion = emotion)

@app.route('/update_single', methods=['POST'])
def update_single():
    data = request.get_json()
    print(data)
    audio_path = data.get('audio_path', '')
    emotion = start_analyse(audio_path)
    return jsonify({'emotion' : emotion})

if __name__ == "__main__":
    webbrowser.open_new_tab('http://127.0.0.1:5000/')
    app.run(debug=False)