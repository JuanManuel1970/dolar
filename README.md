📊 Dólar Tracker AR

Aplicación web en React que consume la API de Bluelytics
 para mostrar en tiempo real las cotizaciones del dólar en Argentina.
Incluye tarjetas de precios actuales y un gráfico histórico interactivo hecho con Recharts
.

🚀 Funcionalidades

🔹 Visualización en tiempo real de:

Dólar Blue

Dólar Oficial

📅 Histórico seleccionable (7, 30, 60 o 90 días).

📈 Gráfico dinámico con compra, venta y promedio.

🖱️ Tooltip interactivo en el gráfico.

🎨 Diseño con gradientes y tarjetas temáticas para cada tipo de dólar.

📋 Botón para copiar la cotización actual al portapapeles.

🛠️ Tecnologías utilizadas

React

Recharts

Bluelytics API

CSS con gradientes y estilos personalizados

📦 Instalación

Cloná este repositorio:

git clone https://github.com/JuanManuel1970/dolar-tracker-ar.git
cd dolar-tracker-ar


Instalá las dependencias:

npm install


Ejecutá la app en modo desarrollo:

npm run dev


Abrí en tu navegador:

http://localhost:5173

🌐 API utilizada

Últimos valores
https://api.bluelytics.com.ar/v2/latest

Evolución histórica
https://api.bluelytics.com.ar/v2/evolution.json

📸 Capturas
Cotizaciones y gráfico histórico

📌 Próximas mejoras

Agregar soporte para MEP y CCL.

Exportar cotizaciones a CSV/Excel.

Alertas cuando el dólar supere un umbral definido.

👨‍💻 Autor

Hecho por Juanma 🚀
Fuente de datos: api.bluelytics.com.ar
