import torch
import soundfile as sf
import gradio as gr
import spaces
from clearvoice import ClearVoice
import os

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
    sf.write('enhanced.wav', output_wav, fs)
    return 'enhanced.wav'

@spaces.GPU
def fn_clearvoice_ss(input_wav):
    myClearVoice = ClearVoice(task='speech_separation', model_names=['MossFormer2_SS_16K'])
    output_wav_dict = myClearVoice(input_path=input_wav, online_write=False)
    if isinstance(output_wav_dict, dict):
        key = next(iter(output_wav_dict))
        output_wav_list = output_wav_dict[key]
        output_wav_s1 = output_wav_list[0]
        output_wav_s2 = output_wav_list[1]
    else:
        output_wav_list = output_wav_dict
        output_wav_s1 = output_wav_list[0]
        output_wav_s2 = output_wav_list[1]
    sf.write('separated_s1.wav', output_wav_s1, 16000)
    sf.write('separated_s2.wav', output_wav_s2, 16000)
    return "separated_s1.wav", "separated_s2.wav"

def find_mp4_files(directory):
    mp4_files = []
    
    # Walk through the directory and its subdirectories
    for root, dirs, files in os.walk(directory):
        for file in files:
            # Check if the file ends with .mp4
            if file.endswith(".mp4") and file[:3] == 'est':
                mp4_files.append(os.path.join(root, file))
    
    return mp4_files
    

@spaces.GPU()
def fn_clearvoice_tse(input_video):
    myClearVoice = ClearVoice(task='target_speaker_extraction', model_names=['AV_MossFormer2_TSE_16K'])
    #output_wav_dict = 
    print(f'input_video: {input_video}')
    myClearVoice(input_path=input_video, online_write=True, output_path='path_to_output_videos_tse')

    output_list = find_mp4_files(f'path_to_output_videos_tse/AV_MossFormer2_TSE_16K/{os.path.basename(input_video).split(".")[0]}/')
    
    return output_list

demo = gr.Blocks()

se_demo = gr.Interface(
    fn=fn_clearvoice_se,
    inputs = [
        gr.Audio(label="Input Audio", type="filepath"),
        gr.Dropdown(
            ["16000 Hz", "48000 Hz"], value="16000 Hz", multiselect=False, info="Choose a sampling rate for your output."
        ),
    ],
    outputs = [
        gr.Audio(label="Output Audio", type="filepath"),
    ],
    title = "<a href='https://github.com/modelscope/ClearerVoice-Studio/tree/main/clearvoice' target='_blank'>ClearVoice<a/>: Speech Enhancement",
    description = ("ClearVoice ([Github Repo](https://github.com/modelscope/ClearerVoice-Studio/tree/main/clearvoice)) is AI-powered and extracts clear speech from background noise for enhanced speech quality. It supports both 16 kHz and 48 kHz audio outputs. "
                   "To try it, simply upload your audio, or click one of the examples. "),
    article = ("<p style='text-align: center'><a href='https://arxiv.org/abs/2206.07293' target='_blank'>FRCRN: Boosting Feature Representation Using Frequency Recurrence for Monaural Speech Enhancement</a> </p>"
              "<p style='text-align: center'><a href='https://arxiv.org/abs/2312.11825' target='_blank'>MossFormer2: Combining Transformer and RNN-Free Recurrent Network for Enhanced Time-Domain Monaural Speech Separation</a> </p>"),
    examples = [
        ["examples/mandarin_speech_16kHz.wav", "16000 Hz"],
        ["examples/english_speech_48kHz.wav", "48000 Hz"],
    ],
    cache_examples = True,
)

ss_demo = gr.Interface(
    fn=fn_clearvoice_ss,
    inputs = [
        gr.Audio(label="Input Audio", type="filepath"),
    ],
    outputs = [
        gr.Audio(label="Output Audio", type="filepath"),
        gr.Audio(label="Output Audio", type="filepath"),
    ],
    title = "<a href='https://github.com/modelscope/ClearerVoice-Studio/tree/main/clearvoice' target='_blank'>ClearVoice<a/>: Speech Separation",
    description = ("ClearVoice ([Github Repo](https://github.com/modelscope/ClearerVoice-Studio/tree/main/clearvoice)) is powered by AI and separates individual speech from mixed audio. It supports 16 kHz and two output streams. "
                    "To try it, simply upload your audio, or click one of the examples. "),
    article = ("<p style='text-align: center'><a href='https://arxiv.org/abs/2302.11824' target='_blank'>MossFormer: Pushing the Performance Limit of Monaural Speech Separation using Gated Single-Head Transformer with Convolution-Augmented Joint Self-Attentions</a> </p>"
              "<p style='text-align: center'><a href='https://arxiv.org/abs/2312.11825' target='_blank'>MossFormer2: Combining Transformer and RNN-Free Recurrent Network for Enhanced Time-Domain Monaural Speech Separation</a> </p>"),
    examples = [
        ['examples/female_female_speech.wav'],
        ['examples/female_male_speech.wav'],
    ],
    cache_examples = True,
)

tse_demo = gr.Interface(
    fn=fn_clearvoice_tse,
    inputs = [
        gr.Video(label="Input Video"),
    ],
    outputs = [
        gr.Gallery(label="Output Video List")
    ],
    title = "<a href='https://github.com/modelscope/ClearerVoice-Studio/tree/main/clearvoice' target='_blank'>ClearVoice<a/>: Audio-Visual Speaker Extraction",
    description = ("ClearVoice ([Github Repo](https://github.com/modelscope/ClearerVoice-Studio/tree/main/clearvoice)) is AI-powered and extracts each speaker's voice from a multi-speaker video using facial recognition. "
                    "To try it, simply upload your video, or click one of the examples. "),
    # article = ("<p style='text-align: center'><a href='https://arxiv.org/abs/2302.11824' target='_blank'>MossFormer: Pushing the Performance Limit of Monaural Speech Separation using Gated Single-Head Transformer with Convolution-Augmented Joint Self-Attentions</a> | <a href='https://github.com/alibabasglab/MossFormer' target='_blank'>Github Repo</a></p>"
    #           "<p style='text-align: center'><a href='https://arxiv.org/abs/2312.11825' target='_blank'>MossFormer2: Combining Transformer and RNN-Free Recurrent Network for Enhanced Time-Domain Monaural Speech Separation</a> | <a href='https://github.com/alibabasglab/MossFormer2' target='_blank'>Github Repo</a></p>"),
    examples = [
        ['examples/001.mp4'],
        ['examples/002.mp4'],
    ],
    cache_examples = True,
)

with demo:
    gr.TabbedInterface([se_demo, ss_demo, tse_demo], ["Task 1: Speech Enhancement", "Task 2: Speech Separation", "Task 3: Audio-Visual Speaker Extraction"])

demo.launch()