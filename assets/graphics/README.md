# Graphics Folder

Cartella per assets grafici e elementi template serviti via HTTP per CasparCG.

## Contenuto tipico
- Assets per template HTML
- Icone, elementi UI
- Background patterns
- Overlay graphics

## Utilizzo
- Accessibili via: `http://100.64.211.9:5000/graphics/nome_asset.svg`
- Utilizzati principalmente da template HTML

## Template Integration
```html
<img src="http://100.64.211.9:5000/graphics/overlay.png" />
```

## Comandi CasparCG
```amcp
PLAY 1-1 "http://100.64.211.9:5000/graphics/overlay.svg"
```