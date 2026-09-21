FROM python:3.13-slim

# Evitar que Python escriba archivos .pyc y forzar salida stdout/stderr sin buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Cambiar repositorios de Debian a HTTPS para pasar por el firewall corporativo
RUN if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
        sed -i 's|http://|https://|g' /etc/apt/sources.list.d/debian.sources; \
    fi && \
    if [ -f /etc/apt/sources.list ]; then \
        sed -i 's|http://|https://|g' /etc/apt/sources.list; \
    fi

# Instalar dependencias del sistema necesarias para PostgreSQL y generación de PDFs (cairo/pango/pillow)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    python3-dev \
    libpq-dev \
    gcc \
    libcairo2 \
    libcairo2-dev \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    shared-mime-info \
    fonts-dejavu-core \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python asegurando HTTPS y hosts de confianza
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        --trusted-host pypi.org \
        --trusted-host files.pythonhosted.org \
        --trusted-host pypi.python.org \
        -r requirements.txt

# Copiar el código del proyecto
COPY . /app/

# Exponer el puerto por defecto de Django
EXPOSE 8000

# Comando de ejecución por defecto
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
