import random
from locust import HttpUser, task, between

class ClienteFiel(HttpUser):
    """
    Simula un usuario que YA tiene cuenta.
    Se loguea al principio y luego bombardea el sistema viendo su saldo.
    """
    wait_time = between(1, 3) # Espera entre 1 y 3 segundos entre clics
    token = None

    def on_start(self):
        """Se ejecuta una vez cuando el usuario virtual 'nace'"""
        # 1. Nos logueamos para obtener el Token
        # Asegúrate de tener este usuario creado en tu BD o cámbialo por uno real
        response = self.client.post("/api/login/", json={
            "username": "steed.galvez", 
            "password": "Perezoso2000" # <--- PON LA CONTRASEÑA REAL AQUÍ
        })
        
        if response.status_code == 200:
            self.token = response.json().get("token")
            # Inyectamos el token en todas las peticiones futuras
            self.client.headers.update({'Authorization': f'Token {self.token}'})
        else:
            print("⚠️ Error login usuario standard")

    @task(3) 
    def ver_saldo(self):
        if self.token:
            # CORRECCIÓN: Usar "mi-tarjeta" (singular) tal como está en tu urls.py
            self.client.get("/api/mi-tarjeta/")

    @task(1) # Peso 1: Revisa historial menos frecuente
    def ver_historial(self):
        if self.token:
            self.client.get("/api/mi-tarjeta/historial/")

class NuevoUsuario(HttpUser):
    """
    Simula gente nueva registrándose.
    Esto prueba la carga de escritura en la base de datos.
    """
    wait_time = between(2, 5)

    @task
    def registrarse(self):
        # Generamos un usuario aleatorio para no chocar
        aleatorio = random.randint(1000, 999999)
        username = f"user_test_{aleatorio}"
        email = f"test_{aleatorio}@prueba.com"
        
        self.client.post("/api/register/", json={
            "username": username,
            "email": email,
            "password": "password123",
            "first_name": "Test",
            "last_name": "Load"
        })