# Logos Folder

Loghi aziendali e branding serviti via HTTP per CasparCG.

## Contenuto tipico
- Loghi aziendali
- Brand elements  
- Watermarks
- Channel logos

## Utilizzo
- Accessibili via: `http://100.64.211.9:5000/assets/logos/nome_logo.png`

## Comandi CasparCG
```amcp
PLAY 1-8 "http://100.64.211.9:5000/assets/logos/company_logo.png"
MIXER 1-8 ANCHOR 1 0
MIXER 1-8 SCALE 0.3

# In template
CG 1-1 ADD 10 "lower-third" 1 "{\"f2\":\"http://100.64.211.9:5000/assets/logos/logo.png\"}"
```