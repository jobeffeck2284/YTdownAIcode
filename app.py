from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import yt_dlp
import json

app = Flask(__name__)
CORS(app)

def format_duration(duration):
    minutes = duration // 60
    seconds = duration % 60
    return f"{minutes}:{seconds:02d}"

@app.route('/video-info', methods=['POST'])
def get_video_info():
    url = request.json.get('url')
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            formats = [{
                'format_id': f['format_id'],
                'ext': f['ext'],
                'resolution': f.get('resolution', 'N/A'),
                'filesize': f.get('filesize', 0),
                'format_note': f.get('format_note', '')
            } for f in info['formats'] if f.get('resolution') != 'audio only']
            
            return jsonify({
                'title': info['title'],
                'duration': format_duration(info['duration']),
                'views': info['view_count'],
                'thumbnail': info['thumbnail'],
                'formats': formats
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/download', methods=['POST'])
def download_video():
    url = request.json.get('url')
    format_id = request.json.get('format_id')
    
    def progress_hook(d):
        if d['status'] == 'downloading':
            progress = (d['downloaded_bytes'] / d['total_bytes']) * 100 if 'total_bytes' in d else 0
            return json.dumps({'progress': progress})
    
    ydl_opts = {
        'format': format_id,
        'progress_hooks': [progress_hook],
        'outtmpl': 'downloads/%(title)s.%(ext)s'
    }
    
    def generate():
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            yield json.dumps({'progress': 100})
        except Exception as e:
            yield json.dumps({'error': str(e)})
    
    return Response(generate(), mimetype='application/json')

if __name__ == '__main__':
    app.run(debug=True)