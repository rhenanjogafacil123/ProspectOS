from youtube_transcript_api import YouTubeTranscriptApi
import json

video_id = 'hNYKdsTg3do'
try:
    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
    print('Available transcripts:')
    for t in transcript_list:
        print(t.language, t.language_code, t.is_generated)
    
    transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['pt', 'pt-BR', 'en'])
    full_text = '\n'.join([f"{item['start']:.1f}s: {item['text']}" for item in transcript])
    with open('transcript_hNYKdsTg3do.txt', 'w', encoding='utf-8') as f:
        f.write(full_text)
    print(f'Saved transcript! Length: {len(full_text)} chars, {len(transcript)} segments')
except Exception as e:
    print('Error:', e)
