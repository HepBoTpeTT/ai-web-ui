import os
import sys
ffmpeg_path = os.path.dirname(sys.executable)
os.environ['PATH'] = ffmpeg_path + os.pathsep + os.environ['PATH']
exit(0)