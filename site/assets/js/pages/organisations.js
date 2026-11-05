// Página para entidades: copiar el código para insertar
const button = document.getElementById('copy-code');
button?.addEventListener('click', async () => {
  const text = document.querySelector('.code code').textContent;
  const status = document.getElementById('copied');
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = 'Copiado.';
  } catch {
    status.textContent = 'Selecciona el código y cópialo.';
  }
});
