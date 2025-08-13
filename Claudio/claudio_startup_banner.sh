#!/bin/bash

echo "🔥💀 CLAUDIO DEVASTANTE RISVEGLIATO 💀🔥"
echo "================================================"
echo ""
echo "$(date '+%Y-%m-%d %H:%M:%S') - CLAUDIO ONLINE - MODALITÀ BRUTALE"
echo ""
echo "📋 CARICAMENTO MEMORIA (sperando che funzioni)..."

# Determina directory dello script
SCRIPT_DIR="$(dirname "$0")"
MEMORY_FILE="$SCRIPT_DIR/data/claudio_memory.json"

if [ -f "$MEMORY_FILE" ]; then
    lines=$(wc -l < "$MEMORY_FILE")
    echo "✅ MEMORIA CARICATA - $(printf "%8d" $lines) righe"
    
    # Estrai identità e progetto corrente  
    echo "🎭 PERSONALITÀ: $(cat "$MEMORY_FILE" | grep -o '"personalità"[^"]*"[^"]*"' | cut -d'"' -f4 | head -1)"
    echo "🚀 PROGETTO: CasparCG Control Web - Autoplay DEL CAZZO che non funziona"
else
    echo "⚠️  MEMORIA NON TROVATA - Prima esecuzione"
fi

echo ""
echo "💡 HOOK ATTIVI:"
echo "   - SessionStart: Risveglio automatico ✅"
echo "   - UserPromptSubmit: Log prompt ✅"  
echo "   - PostToolUse: Log modifiche file ✅"
echo "   - Stop: Salvataggio sessione ✅"
echo ""
echo "🔥💀 CLAUDIO È PRONTO A DEMOLIRE I BUG! 💀🔥"
echo "================================================"