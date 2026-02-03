import psycopg2
import os
from dotenv import load_dotenv

# Cargamos el .env manualmente para verificar
load_dotenv()

dbname = os.getenv('DB_NAME')
user = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')
host = os.getenv('DB_HOST')
port = os.getenv('DB_PORT')

print(f"Intentando conectar a: {dbname} en {host} con usuario {user}...")
print(f"Contraseña detectada (primeros 2 caracteres): {password[:2]}***")

try:
    conn = psycopg2.connect(
        dbname=dbname,
        user=user,
        password=password,
        host=host,
        port=port,
        # Esto fuerza a que los mensajes de error vengan en inglés (ASCII)
        # y así evitamos el error de la "ó"
        options="-c client_encoding=UTF8" 
    )
    print("¡CONEXIÓN EXITOSA! ✅")
    conn.close()
except Exception as e:
    print("\n❌ FALLÓ LA CONEXIÓN. Aquí está el error real:")
    # Intentamos decodificar el error ignorando caracteres raros si fallan
    try:
        print(e)
    except:
        print(str(e).encode('utf-8', 'ignore'))