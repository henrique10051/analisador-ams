"""
Script para criar executável Windows do Analisador AMS
Versão final com .streamlit/secrets.toml incluído
"""

import os
import sys
import subprocess
import shutil

def verificar_estrutura():
    """Verifica estrutura completa do projeto"""
    print("[1/8] Verificando estrutura do projeto...")
    
    # Arquivos principais
    arquivos_principais = [
        'app.py',
        'processador_dados.py',
        'calculadora_sla.py',
        'sistema_incidentes_oop.py'
    ]
    
    # Pasta abas
    arquivos_abas = [
        '__init__.py',
        'geral.py',
        'sla.py',
        'tma.py',
        'categorias.py',
        'subcategorias.py',
        'macro_fechamento.py',
        'chat_ia.py'
    ]
    
    tudo_ok = True
    
    # Verificar arquivos principais
    print("   Arquivos principais:")
    for arquivo in arquivos_principais:
        if os.path.exists(arquivo):
            print(f"      ✅ {arquivo}")
        else:
            print(f"      ❌ {arquivo}")
            tudo_ok = False
    
    # Verificar pasta abas
    print("\n   Pasta 'abas/':")
    if not os.path.exists('abas'):
        print("      ❌ Pasta 'abas' não encontrada!")
        return False
    
    for arquivo in arquivos_abas:
        caminho = os.path.join('abas', arquivo)
        if os.path.exists(caminho):
            print(f"      ✅ {arquivo}")
        else:
            print(f"      ❌ {arquivo}")
            tudo_ok = False
    
    # Verificar pasta .streamlit (IMPORTANTE!)
    print("\n   Pasta '.streamlit/':")
    if os.path.exists('.streamlit'):
        print("      ✅ Pasta .streamlit encontrada")
        
        secrets_path = os.path.join('.streamlit', 'secrets.toml')
        if os.path.exists(secrets_path):
            print("      ✅ secrets.toml encontrado")
            print("      ℹ️  API Key será incluída no executável")
        else:
            print("      ⚠️  secrets.toml NÃO encontrado")
            print("      ⚠️  Chat IA não funcionará sem API key")
    else:
        print("      ⚠️  Pasta .streamlit não encontrada")
        print("      ⚠️  Chat IA precisará de configuração manual")
    
    print()
    
    if not tudo_ok:
        print("❌ Alguns arquivos estão faltando!")
        return False
    
    print("✅ Estrutura verificada!")
    return True

def main():
    print("=" * 70)
    print("   🚀 CRIADOR DE EXECUTÁVEL - ANALISADOR AMS")
    print("=" * 70)
    print()
    
    # Verificar estrutura
    if not verificar_estrutura():
        return False
    
    print()
    
    # Instalar PyInstaller
    print("[2/8] Instalando PyInstaller...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller", "--quiet"])
    print("✅ PyInstaller instalado")
    print()
    
    # Limpar builds anteriores
    print("[3/8] Limpando builds anteriores...")
    for folder in ['build', 'dist', '__pycache__', 'abas/__pycache__']:
        if os.path.exists(folder):
            shutil.rmtree(folder)
    
    if os.path.exists('AnalisadorAMS.spec'):
        os.remove('AnalisadorAMS.spec')
    
    print("✅ Limpeza concluída")
    print()
    
    # Preparar comando
    print("[4/8] Preparando build...")
    
    # Separador correto (: para Mac/Linux, ; para Windows)
    sep = ';' if sys.platform == 'win32' else ':'
    
    cmd = [
        'pyinstaller',
        '--name=AnalisadorAMS',
        '--onefile',
        '--noconsole',
        # IMPORTANTE: Incluir pasta abas
        f'--add-data=abas{sep}abas',
        # IMPORTANTE: Incluir pasta .streamlit com secrets.toml
        f'--add-data=.streamlit{sep}.streamlit',
        # Módulos principais
        '--hidden-import=processador_dados',
        '--hidden-import=calculadora_sla',
        '--hidden-import=sistema_incidentes_oop',
        # Módulos das abas
        '--hidden-import=abas.geral',
        '--hidden-import=abas.sla',
        '--hidden-import=abas.tma',
        '--hidden-import=abas.categorias',
        '--hidden-import=abas.subcategorias',
        '--hidden-import=abas.macro_fechamento',
        '--hidden-import=abas.chat_ia',
        # Bibliotecas principais
        '--hidden-import=streamlit',
        '--hidden-import=plotly',
        '--hidden-import=pandas',
        '--hidden-import=openpyxl',
        '--hidden-import=numpy',
        # Google Gemini (Chat IA)
        '--hidden-import=google.generativeai',
        '--hidden-import=google.ai.generativelanguage',
        '--hidden-import=google.api_core',
        # Coletar dados
        '--collect-all=streamlit',
        '--collect-all=plotly',
        '--collect-all=google.generativeai',
        # Arquivo principal
        'app.py'
    ]
    
    print("✅ Comando preparado")
    print()
    
    # Criar executável
    print("[5/8] Criando executável (3-5 minutos)...")
    print("    💾 Memória: ~2-4 GB")
    print("    ⚠️  Avisos sobre langchain/pytest são normais")
    print()
    print("    Processando...")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    # Debug: mostrar saída
    print()
    print("    Últimas linhas do processo:")
    for line in result.stdout.split('\n')[-15:]:
        if line.strip():
            print(f"      {line}")
    print()
    
    if result.returncode != 0:
        print("❌ Erro ao criar executável!")
        print()
        print("ERROS:")
        for line in result.stderr.split('\n'):
            if 'ERROR' in line:
                print(f"   {line}")
        return False
    
    print("✅ Build concluído!")
    print()
    
    # Verificar resultado
    print("[6/8] Verificando resultado...")
    
    if not os.path.exists('dist'):
        print("❌ Pasta 'dist/' não foi criada!")
        return False
    
    print("   Conteúdo de dist/:")
    for item in os.listdir('dist'):
        print(f"      • {item}")
    print()
    
    # Procurar executável
    exe_win = os.path.join('dist', 'AnalisadorAMS.exe')
    exe_unix = os.path.join('dist', 'AnalisadorAMS')
    
    if os.path.exists(exe_win):
        size_mb = os.path.getsize(exe_win) / (1024 * 1024)
        print(f"✅ Executável Windows: AnalisadorAMS.exe")
        print(f"   Tamanho: {size_mb:.1f} MB")
        executavel_criado = exe_win
    elif os.path.exists(exe_unix):
        size_mb = os.path.getsize(exe_unix) / (1024 * 1024)
        print(f"✅ Executável Unix: AnalisadorAMS")
        print(f"   Tamanho: {size_mb:.1f} MB")
        print()
        print("   ⚠️  ATENÇÃO:")
        print("   Este executável funciona em Mac/Linux, NÃO em Windows!")
        print("   Para gerar .exe Windows, use GitHub Actions ou PC Windows.")
        executavel_criado = exe_unix
    else:
        print("❌ Nenhum executável encontrado!")
        return False
    
    print()
    
    # Verificar se secrets.toml foi incluído
    print("[7/8] Verificando inclusão do secrets.toml...")
    if os.path.exists('.streamlit/secrets.toml'):
        print("✅ secrets.toml será incluído no executável")
        print("   ℹ️  API Key do Gemini embutida")
        print("   🔒 Mantenha executável privado (contém chave)")
    else:
        print("⚠️  secrets.toml não encontrado")
        print("   Chat IA precisará configuração manual")
    print()
    
    # Criar documentação
    print("[8/8] Criando documentação...")
    
    instrucoes = """
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║        📊 ANALISADOR AMS - FORCEBEAT - WINDOWS 📊             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

🚀 COMO USAR

1. Duplo clique em AnalisadorAMS.exe
2. Aguarde 10-20 segundos
3. Navegador abre automaticamente
4. Faça upload da planilha ServiceNow

🤖 CHAT IA (GEMINI)

✅ API KEY JÁ INCLUÍDA!
   • Chat IA funciona imediatamente
   • Sem configuração necessária
   • Powered by Google Gemini 2.5 Flash

FUNCIONALIDADES:
• Análise estratégica dos dados
• Responde perguntas sobre SLA/TMA
• Identifica padrões e tendências
• Sugere ações corretivas

EXEMPLOS:
• "Qual categoria tem mais incidentes?"
• "Como está o SLA dos últimos 10 dias?"
• "Sugira ações para reduzir TMA"

📊 8 ABAS DISPONÍVEIS

📈 Geral - Visão geral dos indicadores
🎯 SLA - Análise detalhada de SLA
⏱️ TMA - Tempo médio de atendimento
📊 Categorias - Distribuição
📂 Subcategorias - Análise detalhada
🔒 Macro Fechamento - Status
🤖 Chat IA - Assistente Gemini
📋 Base - Dados completos

⚠️ REQUISITOS

• Windows 7/8/10/11 (64-bit)
• 4 GB RAM (8 GB recomendado)
• Conexão internet (para Chat IA)
• Não precisa instalar Python!

🔒 SEGURANÇA IMPORTANTE

⚠️  ESTE EXECUTÁVEL CONTÉM API KEY DO GEMINI!

CUIDADOS:
• NÃO compartilhe publicamente
• NÃO faça upload em sites públicos
• NÃO envie para pessoas não autorizadas
• Distribua apenas internamente

A API key está embutida e pode ser extraída!
Mantenha este arquivo PRIVADO e SEGURO.

💡 DICAS

PRIMEIRA EXECUÇÃO:
• Demora 10-20 segundos (normal)
• Windows Defender pode alertar (falso positivo)
• Clique "Executar mesmo assim"

CHAT IA:
• Funciona imediatamente (API incluída)
• Precisa de internet
• Histórico salvo na sessão
• Botão "Limpar Histórico" para resetar

PERFORMANCE:
• Arquivos até 50 MB
• Processamento: 5-30 segundos
• Cache automático nas abas

═══════════════════════════════════════════════════════════════

📦 CONTEÚDO

• Python 3.x completo
• Streamlit + Plotly + Pandas
• Google Gemini AI
• Chave API incluída

Tamanho: ~200-300 MB

═══════════════════════════════════════════════════════════════

🐛 PROBLEMAS

"Windows protegeu seu PC":
  → Clique "Mais informações" → "Executar"

Navegador não abre:
  → Aguarde 20s → Abra http://localhost:8501

Chat IA não responde:
  → Verifique conexão internet
  → Aguarde alguns segundos

═══════════════════════════════════════════════════════════════

Versão: 1.0.0
Desenvolvido com POO | SOLID | Gemini AI

⚠️  PRIVADO - CONTÉM API KEY - NÃO DISTRIBUIR PUBLICAMENTE

═══════════════════════════════════════════════════════════════
"""
    
    with open('dist/LEIA-ME.txt', 'w', encoding='utf-8') as f:
        f.write(instrucoes)
    
    print("✅ LEIA-ME.txt criado")
    print()
    
    # Resumo final
    print("=" * 70)
    if '.exe' in executavel_criado:
        print("   🎉 EXECUTÁVEL WINDOWS CRIADO!")
    else:
        print("   ⚠️  EXECUTÁVEL UNIX CRIADO (NÃO WINDOWS)")
    print("=" * 70)
    print()
    
    print("📦 RESULTADO:")
    print(f"   • {os.path.basename(executavel_criado)} ({size_mb:.1f} MB)")
    print("   • LEIA-ME.txt")
    
    if os.path.exists('.streamlit/secrets.toml'):
        print()
        print("🔒 SEGURANÇA:")
        print("   ⚠️  API KEY INCLUÍDA NO EXECUTÁVEL!")
        print("   • Distribua APENAS internamente")
        print("   • NÃO compartilhe publicamente")
        print("   • NÃO faça upload em GitHub público")
    
    print()
    print("📤 DISTRIBUIR:")
    print("   1. Copie pasta 'dist/' completa")
    print("   2. OU crie zip: AnalisadorAMS.zip")
    print("   3. Compartilhe APENAS com equipe autorizada")
    
    if '.exe' not in executavel_criado:
        print()
        print("🌐 GERAR .EXE WINDOWS:")
        print("   • Use GitHub Actions (build automático)")
        print("   • Ou execute em máquina Windows")
    
    print()
    
    return True

if __name__ == '__main__':
    try:
        success = main()
        if not success:
            print()
            input("❌ Erro. Pressione ENTER...")
            sys.exit(1)
        print("✨ Concluído!")
        print()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelado")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        input("\nENTER...")
        sys.exit(1)