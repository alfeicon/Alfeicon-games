// api/submit-pack.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", mensaje: "Método no permitido" });
  }

  const datos = req.body;

  try {
    const respuesta = await fetch("https://script.google.com/macros/s/AKfycbxMiNdxcLxZXrJL0tyzerH0A_MwqrfZUQiwiNjXIlgnh_hw2Z5OKx9vYNBr1F2i67rL/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();
    return res.status(200).json(resultado);

  } catch (error) {
    return res.status(500).json({ status: "error", mensaje: "Error en el servidor proxy." });
  }
}
