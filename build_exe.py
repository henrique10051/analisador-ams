"""
Script para criar executavel Windows do Analisador AMS
Versao COM CONSOLE para debug
"""

import os
import sys
import subprocess
import shutil

def main():
    print("=" * 60)
    print("  CRIADOR DE EXECUTAVEL - ANALISADOR AMS")
    print("=" * 60)
    print()
    
    print("[1/5] Verificando estrutura...")
    arquivos = [
        'app.py', 'processador_dados.py', 'calculadora_sla.py', 'sistema_incidentes_oop.py',
        'supabase_client.py', 'repositorio_incidentes.py',
    ]
    for arquivo in arquivos:
        if not os.path.exists(arquivo):
            print(f"  ERRO: {arquivo} nao encontrado")
            return False
    print("  OK")
    
    print()
    print("[2/5] Instalando PyInstaller...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller", "--quiet"])
    print("  OK")
    
    print()
    print("[3/5] Limpando builds...")
    for folder in ['build', 'dist']:
        if os.path.exists(folder):
            shutil.rmtree(folder)
    print("  OK")
    
    print()
    print("[4/5] Criando executavel COM CONSOLE (para debug)...")
    
    sep = ';' if sys.platform == 'win32' else ':'
    
    cmd = [
        'pyinstaller',
        '--name=AnalisadorAMS',
        '--onefile',
        # '--noconsole',  # COMENTADO para ver erros!
        f'--add-data=abas{sep}abas',
        f'--add-data=.streamlit{sep}.streamlit',
        '--hidden-import=processador_dados',
        '--hidden-import=calculadora_sla',
        '--hidden-import=sistema_incidentes_oop',
        '--hidden-import=supabase_client',
        '--hidden-import=repositorio_incidentes',
        '--hidden-import=abas.geral',
        '--hidden-import=abas.sla',
        '--hidden-import=abas.tma',
        '--hidden-import=abas.categorias',
        '--hidden-import=abas.subcategorias',
        '--hidden-import=abas.macro_fechamento',
        '--hidden-import=abas.chat_ia',
        '--hidden-import=abas.dias_nao_uteis',
        '--hidden-import=abas.ui_helpers',
        '--hidden-import=streamlit',
        '--hidden-import=plotly',
        '--hidden-import=pandas',
        '--hidden-import=openpyxl',
        '--hidden-import=numpy',
        '--hidden-import=google.generativeai',
        '--hidden-import=supabase',
        '--hidden-import=dotenv',
        '--collect-all=streamlit',
        '--collect-all=plotly',
        '--collect-all=altair',
        '--collect-all=supabase',
        'app.py'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print("  ERRO")
        print(result.stderr[-500:])
        return False
    
    print("  OK")
    
    print()
    print("[5/5] Verificando...")
    
    exe_path = os.path.join('dist', 'AnalisadorAMS.exe')
    
    if os.path.exists(exe_path):
        size_mb = os.path.getsize(exe_path) / (1024 * 1024)
        print(f"  OK: AnalisadorAMS.exe ({size_mb:.1f} MB)")
    else:
        print("  ERRO: Executavel nao encontrado")
        return False
    
    # Criar batch file para executar
    with open('dist/EXECUTAR.bat', 'w') as f:
        f.write('@echo off\n')
        f.write('echo Iniciando Analisador AMS...\n')
        f.write('echo.\n')
        f.write('AnalisadorAMS.exe\n')
        f.write('echo.\n')
        f.write('echo Se houver erro acima, pressione qualquer tecla para fechar\n')
        f.write('pause\n')
    
    with open('dist/LEIA-ME.txt', 'w', encoding='utf-8') as f:
        f.write("""
ANALISADOR AMS - FORCEBEAT

IMPORTANTE - VERSAO DEBUG:
Esta versao abre uma janela de console para mostrar erros.

COMO USAR:
Opcao 1: Duplo clique em EXECUTAR.bat (recomendado)
Opcao 2: Duplo clique em AnalisadorAMS.exe

Se houver erro, a janela do console mostrara a mensagem.

PROBLEMAS COMUNS:
1. "ModuleNotFoundError" - Falta biblioteca
2. "FileNotFoundError" - Falta arquivo
3. Nada acontece - Aguarde 20 segundos

Aguarde 10-20 segundos para o navegador abrir!

Versao: 1.0.0 (DEBUG)
""")
    
    print()
    print("=" * 60)
    print("  EXECUTAVEL CRIADO (COM CONSOLE PARA DEBUG)")
    print("=" * 60)
    print()
    print("IMPORTANTE:")
    print("  Execute EXECUTAR.bat para ver erros")
    print("  Console ficara aberto mostrando status")
    print()
    
    return True

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nERRO: {e}")
        sys.exit(1)
