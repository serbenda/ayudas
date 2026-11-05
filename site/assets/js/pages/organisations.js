// Página para entidades: copiar el código para insertar
const button = document.getElementById('copiar-codigo');
button?.addEventListener('click', async () => {
  const text = document.querySelector('.codigo code').textContent;
  const status = document.getElementById('copiado');
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = 'Copiado.';
  } catch {
    status.textContent = 'Selecciona el código y cópialo.';
  }
});
