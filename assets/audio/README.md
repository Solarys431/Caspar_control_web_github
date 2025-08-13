# Audio Folder

Cartella per audio WAV, MP3, FLAC, AAC serviti via HTTP per CasparCG.

## Formati supportati  
- WAV, MP3, FLAC, AAC, OGG, WMA

## Utilizzo
- Accessibili via: `http://100.64.211.9:5000/audio/nome_audio.wav`
- Audio solitamente su layer 10 in CasparCG

## Comandi CasparCG
```amcp
PLAY 1-10 "http://100.64.211.9:5000/audio/jingle.wav"
PLAY 1-10 "http://100.64.211.9:5000/audio/background_music.mp3" LOOP
```