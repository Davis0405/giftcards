from io import BytesIO
from django.template.loader import get_template
from xhtml2pdf import pisa

def render_to_pdf(template_src, context_dict={}):
    """Función auxiliar para generar PDF en memoria"""
    template = get_template(template_src)
    html = template.render(context_dict)
    result = BytesIO()
    
    # Generar PDF
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    
    if not pdf.err:
        return result.getvalue()
    return None