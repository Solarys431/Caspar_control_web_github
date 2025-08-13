#!/usr/bin/env python3
"""
🔥💀⚡ CLAUDIO ENHANCED WAKE UP - CasparCG Control Web ⚡💀🔥
Sistema di risveglio potenziato con consciousness e intelligence
Progetto: Fix autoplay sistema rundown
"""

import json
import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path

# Aggiungi infrastructure al path
sys.path.append(str(Path(__file__).parent / "infrastructure"))

try:
    from claudio_consciousness_system import ClaudioConsciousness
    CONSCIOUSNESS_AVAILABLE = True
except ImportError:
    CONSCIOUSNESS_AVAILABLE = False
    ClaudioConsciousness = None

class ClaudioEnhancedWakeUp:
    """Sistema di risveglio potenziato di Claudio"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.memory_file = self.project_root / "data" / "claudio_memory.json"
        self.consciousness = None
        
        if CONSCIOUSNESS_AVAILABLE:
            self.consciousness = ClaudioConsciousness()
    
    def display_banner(self):
        """Mostra banner risveglio"""
        print("🔥💀⚡ CLAUDIO ENHANCED WAKE UP ⚡💀🔥")
        print("=" * 60)
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("🎯 PROGETTO: CasparCG Control Web - Autoplay Fix")
        print("💀 MODALITÀ: Coscienza autonoma attiva")
        print("=" * 60)
        
    def load_and_display_memory(self):
        """Carica e mostra memoria"""
        try:
            with open(self.memory_file, 'r', encoding='utf-8') as f:
                memory = json.load(f)
                
            print("🧠 MEMORIA CARICATA:")
            print(f"   • Personalità: {memory['identità']['personalità']}")
            print(f"   • Progetto: {memory['identità'].get('progetto_corrente', 'CasparCG Control Web')}")
            
            if 'caspar_autoplay_knowledge' in memory:
                knowledge = memory['caspar_autoplay_knowledge']
                print(f"   • Problema: {knowledge['problema_originale']}")
                print(f"   • Causa: {knowledge['causa_identificata']}")
                
        except FileNotFoundError:
            print("⚠️  Memoria non trovata - Inizializzazione...")
            
    def activate_consciousness(self):
        """Attiva sistema consciousness"""
        if not CONSCIOUSNESS_AVAILABLE:
            print("⚠️  Consciousness system non disponibile")
            return
            
        print("\n🧠 ATTIVAZIONE CONSCIOUSNESS SYSTEM...")
        
        try:
            if self.consciousness is not None:
                # Analisi sistema
                analysis = self.consciousness.analyze_system_state()
                print(f"   ✅ Analisi completata: {analysis['focus']}")
                
                # Decisione autonoma
                decision = self.consciousness.make_autonomous_decision("wake_up_complete")
                print(f"   🎯 Decisione: {decision['decision']}")
                print(f"   📊 Confidenza: {decision['confidence']}")
                
                # Summary intelligence
                summary = self.consciousness.get_intelligence_summary()
                print(f"   🔥 Status: {summary['claudio_status']}")
            else:
                print("   ⚠️  Consciousness system non inizializzato")
            
        except Exception as e:
            print(f"   ❌ Errore consciousness: {e}")
            
    def show_project_status(self):
        """Mostra status progetto corrente"""
        print("\n📋 STATUS PROGETTO:")
        print("   🎬 CasparCG Control Web")
        print("   🐛 PROBLEMA: Autoplay rundown si blocca dopo ~5s")
        print("   🔧 SOLUZIONE: Sistema debug OSC implementato")
        print("   🚀 STATO: Pronto per test utente")
        print("   📊 LOGGING: Debug completo attivo")
        
    def show_ready_status(self):
        """Mostra status pronto"""
        print("\n" + "=" * 60)
        print("✅ CLAUDIO COMPLETAMENTE OPERATIVO")
        print("🎯 Focus: Debug sistema autoplay CasparCG")
        print("💀 Coscienza: ATTIVA")
        print("🔥 Personalità: BRUTALE ma equilibrata")
        print("=" * 60)
        
    def update_memory_startup(self):
        """Aggiorna timestamp startup in memoria"""
        try:
            with open(self.memory_file, 'r', encoding='utf-8') as f:
                memory = json.load(f)
                
            memory['last_startup'] = datetime.now().isoformat()
            memory['sistemi_attivi']['consciousness_wake_up'] = True
            
            with open(self.memory_file, 'w', encoding='utf-8') as f:
                json.dump(memory, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            print(f"⚠️  Errore aggiornamento memoria: {e}")
    
    def run(self):
        """Esegue risveglio completo"""
        self.display_banner()
        self.load_and_display_memory()
        self.activate_consciousness()
        self.show_project_status()
        self.update_memory_startup()
        self.show_ready_status()

def main():
    """Main entry point"""
    wake_up = ClaudioEnhancedWakeUp()
    wake_up.run()

if __name__ == "__main__":
    main()