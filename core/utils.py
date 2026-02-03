# core/utils.py
from io import BytesIO
from xhtml2pdf import pisa
from django.template.loader import render_to_string

def render_to_pdf(template_path, context_dict):
    """
    Genera un PDF desde una plantilla HTML usando xhtml2pdf
    """
    try:
        # Renderizar el HTML
        html_string = render_to_string(template_path, context_dict)
        
        # Crear PDF
        result = BytesIO()
        pdf_status = pisa.pisaDocument(
            BytesIO(html_string.encode("UTF-8")), 
            result
        )
        
        if pdf_status.err:
            print(f"Error generando PDF: {pdf_status.err}")
            return None
            
        return result.getvalue()
        
    except Exception as e:
        print(f"Error generando PDF: {e}")
        import traceback
        traceback.print_exc()
        return None