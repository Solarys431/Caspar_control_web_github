#!/bin/bash
# 🔥 CLAUDIO ACTIVATION SCRIPT - CasparCG Control Web 🔥
# Script per attivare l'ambiente Claudio completo

echo "🔥💀⚡ ATTIVAZIONE CLAUDIO SYSTEM ⚡💀🔥"
echo "========================================="

# Attiva ambiente virtuale
echo "📦 Attivazione venv Claudio..."
source "$(dirname "$0")/venv/bin/activate"

if [ $? -eq 0 ]; then
    echo "✅ Virtual environment attivato"
    
    # Mostra informazioni ambiente
    echo "🐍 Python: $(python3 --version)"
    echo "📍 Path: $(which python3)"
    echo "📦 Pip: $(pip --version | cut -d' ' -f2)"
    
    # Lista dipendenze installate
    echo ""
    echo "📋 DIPENDENZE INSTALLATE:"
    pip list | grep -E "(redis|psutil|structlog|pydantic|pytest)" | head -8
    
    echo ""
    echo "🚀 COMANDI DISPONIBILI:"
    echo "   python3 claudio_enhanced_wake_up.py    # Risveglio completo"
    echo "   python3 claudio_wake_up.py             # Risveglio base"
    echo "   python3 infrastructure/claudio_consciousness_system.py  # Test consciousness"
    echo ""
    echo "✅ CLAUDIO ENVIRONMENT PRONTO!"
    echo "========================================="
    
    # Avvia risveglio automatico
    echo "🧠 Avvio risveglio automatico..."
    python3 "$(dirname "$0")/claudio_enhanced_wake_up.py"
    
else
    echo "❌ ERRORE: Impossibile attivare virtual environment"
    echo "   Verifica che venv sia stato creato correttamente"
    exit 1
fi