import pdfkit
from django.template.loader import get_template

def render_to_pdf(template_src, context_dict={}):
    """
    Genera un PDF usando pdfkit (wkhtmltopdf).
    Retorna el contenido del PDF en bytes si es exitoso, o None si falla.
    """
    
    # 1. Configuración de la ruta al ejecutable (Vital en Windows)
    # Verifica que esta ruta sea correcta en tu PC:
    path_wkhtmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
    
    try:
        config = pdfkit.configuration(wkhtmltopdf=path_wkhtmltopdf)
        
        # 2. Renderizamos el HTML a string primero
        template = get_template(template_src)
        html_string = template.render(context_dict)
        
        # 3. Opciones de configuración del PDF
        options = {
            'page-size': 'A5',        # Tamaño tipo media carta
            'margin-top': '0.0in',
            'margin-right': '0.0in',
            'margin-bottom': '0.0in',
            'margin-left': '0.0in',
            'encoding': "UTF-8",
            'no-outline': None,
            'enable-local-file-access': None  # Permite cargar imágenes/QR locales
        }
        
        # 4. Generamos el PDF en memoria (False hace que retorne bytes)
        pdf = pdfkit.from_string(html_string, False, configuration=config, options=options)
        return pdf
        
    except Exception as e:
        print(f"Error generando PDF: {e}")
        return None