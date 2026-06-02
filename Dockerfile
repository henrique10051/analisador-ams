FROM python:3.11-slim

WORKDIR /app

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Porta do Streamlit
EXPOSE 8501

# Comando para iniciar
CMD ["streamlit", "run", "app.py", "--server.address=0.0.0.0", "--server.port=8501"]
