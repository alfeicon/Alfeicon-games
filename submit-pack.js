export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxMiNdxcLxZXrJL0tyzerH0A_MwqrfZUQiwiNjXIlgnh_hw2Z5OKx9vYNBr1F2i67rL/exec';

  try {
    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al contactar al script:', error);
    res.status(500).json({ error: 'Error en el proxy al contactar al script' });
  }
}
