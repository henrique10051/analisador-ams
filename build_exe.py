"""
Script para criar executavel Windows do Analisador AMS
Versao sem emojis para compatibilidade com Windows
"""

import os
import sys
import subprocess
import shutil

def verificar_estrutura():
    """Verifica estrutura do projeto"""
    print("[1/6] Verificando estrutura...")
    
    arquivos = ['app.py', 'processador_dados.py', 'calculadora_sla.py', 'sistema_incidentes_oop.py']
    
    for arquivo in arquivos:
        if os.path.exists(arquivo):
            print(f"  OK: {arquivo}")
        else:
            print(f"  ERRO: {arquivo} nao encontrado")
            return False
    
    if not os.path.exists('abas'):
        print("  ERRO: Pasta abas nao encontrada")
        return False
    
    print("  OK: Estrutura verificada")
    return True

def main():
    print("=" * 60)
    print("  CRIADOR DE EXECUTAVEL - ANALISADOR AMS")
    print("=" * 60)
    print()
    
    if not verificar_estrutura():
        return False
    
    print()
    print("[2/6] Instalando PyInstaller...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller", "--quiet"])
    print("  OK")
    
    print()
    print("[3/6] Limpando builds anteriores...")
    for folder in ['build', 'dist', '__pycache__']:
        if os.path.exists(folder):
            shutil.rmtree(folder)
    print("  OK")
    
    print()
    print("[4/6] Criando executavel (3-5 minutos)...")
    
    sep = ';' if sys.platform == 'win32' else ':'
    
    cmd = [
        'pyinstaller',
        '--name=AnalisadorAMS',
        '--onefile',
        '--noconsole',
        f'--add-data=abas{sep}abas',
        f'--add-data=.streamlit{sep}.streamlit',
        '--hidden-import=processador_dados',
        '--hidden-import=calculadora_sla',
        '--hidden-import=sistema_incidentes_oop',
        '--hidden-import=abas.geral',
        '--hidden-import=abas.sla',
        '--hidden-import=abas.tma',
        '--hidden-import=abas.categorias',
        '--hidden-import=abas.subcategorias',
        '--hidden-import=abas.macro_fechamento',
        '--hidden-import=abas.chat_ia',
        '--hidden-import=streamlit',
        '--hidden-import=plotly',
        '--hidden-import=pandas',
        '--hidden-import=openpyxl',
        '--hidden-import=numpy',
        '--hidden-import=google.generativeai',
        '--collect-all=streamlit',
        '--collect-all=plotly',
        'app.py'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print("  ERRO ao criar executavel")
        print(result.stderr[-500:])
        return False
    
    print("  OK")
    
    print()
    print("[5/6] Verificando resultado...")
    
    exe_path = os.path.join('dist', 'AnalisadorAMS.exe')
    
    if os.path.exists(exe_path):
        size_mb = os.path.getsize(exe_path) / (1024 * 1024)
        print(f"  OK: AnalisadorAMS.exe ({size_mb:.1f} MB)")
    else:
        print("  ERRO: Executavel nao encontrado")
        return False
    
    print()
    print("[6/6] Criando documentacao...")
    
    with open('dist/LEIA-ME.txt', 'w', encoding='utf-8') as f:
        f.write("""
ANALISADOR AMS - FORCEBEAT

COMO USAR:
1. Duplo clique em AnalisadorAMS.exe
2. Aguarde 10-20 segundos
3. Navegador abre automaticamente
4. Upload da planilha ServiceNow

CHAT IA: API key ja incluida
REQUISITOS: Windows 7/8/10/11 (64-bit)

Versao: 1.0.0
""")
    
    print("  OK")
    print()
    print("=" * 60)
    print("  EXECUTAVEL CRIADO COM SUCESSO!")
    print("=" * 60)
    
    return True

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nERRO: {e}")
        sys.exit(1)
