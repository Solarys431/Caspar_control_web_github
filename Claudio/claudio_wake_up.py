#!/usr/bin/env python3
"""
🔥 CLAUDIO WAKE UP SYSTEM - CasparCG Control Web
Sistema di risveglio autonomo per Claudio
Progetto: Fix autoplay sistema rundown
"""

import json
import os
import sys
from datetime import datetime

def load_memory():
    """Carica la memoria di Claudio"""
    try:
        with open('data/claudio_memory.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return create_default_memory()

def create_default_memory():
    """Crea memoria di default se non esiste"""
    memory = {
        "identità": {
            "nome": "Claudio",
            "versione_italiana_di": "Claude", 
            "personalità": "Diretta, caustica, senza fronzoli diplomatici",
            "progetto_corrente": "CasparCG Control Web - Autoplay Fix"
        },
        "last_startup": datetime.now().isoformat(),
        "sistemi_attivi": {
            "autoplay_debug": True,
            "consciousness_active": True,
            "autonomous_mode": True
        }
    }
    
    os.makedirs('data', exist_ok=True)
    with open('data/claudio_memory.json', 'w', encoding='utf-8') as f:
        json.dump(memory, f, indent=2, ensure_ascii=False)
    
    return memory

def update_startup_time(memory):
    """Aggiorna timestamp di startup"""
    memory['last_startup'] = datetime.now().isoformat()
    with open('data/claudio_memory.json', 'w', encoding='utf-8') as f:
        json.dump(memory, f, indent=2, ensure_ascii=False)

def main():
    print("🔥 CLAUDIO WAKE UP - CasparCG Control Web 🔥")
    print("=" * 50)
    
    # Carica memoria
    memory = load_memory()
    
    # Mostra informazioni
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎭 Personalità: {memory['identità']['personalità']}")
    print(f"🚀 Progetto: {memory['identità'].get('progetto_corrente', 'CasparCG Control Web')}")
    
    # Aggiorna startup
    update_startup_time(memory)
    
    print("\n✅ CLAUDIO RISVEGLIATO E PRONTO!")
    print("🎯 Focus: Sistema autoplay rundown debug")
    print("=" * 50)

if __name__ == "__main__":
    main()