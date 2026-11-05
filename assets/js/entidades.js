// Página para entidades: copiar el código para insertar
const boton = document.getElementById('copiar-codigo');
boton?.addEventListener('click', async () => {
  const texto = document.querySelector('.codigo code').textContent;
  const estado = document.getElementById('copiado');
  try {
    await navigator.clipboard.writeText(texto);
    estado.textContent = 'Copiado.';
  } catch {
    estado.textContent = 'Selecciona el código y cópialo.';
  }
});
