# ASSETS Folder - CasparCG HTTP Media Server

Cartella principale per tutti gli asset serviti via HTTP al server CasparCG.

## Struttura Organizzata
```
assets/
├── templates/    # Template HTML CasparCG
├── media/        # Media files generici
├── images/       # Immagini PNG/JPG/SVG/GIF
├── video/        # Video MP4/MOV/AVI/MKV
├── audio/        # Audio WAV/MP3/FLAC/AAC
├── graphics/     # Assets grafici e overlay
└── logos/        # Loghi e branding
```

## URL Base HTTP
- Base: `http://100.64.211.9:5000/assets/`
- Esempio: `http://100.64.211.9:5000/assets/images/logo.png`

## Utilizzo CasparCG
```amcp
PLAY 1-1 "http://100.64.211.9:5000/assets/video/intro.mp4"
CG 1-1 ADD 10 "http://100.64.211.9:5000/assets/templates/lower-third.html"
```

Questo sistema segue le best practices dei sistemi broadcast professionali come SPX Graphics Controller.