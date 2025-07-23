export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", mensaje: "Método no permitido" });
  }

  const datos = req.body;
  console.log("Datos recibidos:", datos); // 👈 Agregado

  try {
    const respuesta = await fetch("https://script.google.com/macros/s/AKfycbxMiNdxcLxZXrJL0tyzerH0A_MwqrfZUQiwiNjXIlgnh_hw2Z5OKx9vYNBr1F2i67rL/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.text(); // cambia json() por text() para ver posibles errores
    console.log("Respuesta Apps Script:", resultado); // 👈 Agregado

    return res.status(200).json({ status: "ok", resultado });

  } catch (error) {
    console.error("Error en el proxy:", error); // 👈 Agregado
    return res.status(500).json({ status: "error", mensaje: "Error en el servidor proxy." });
  }
}
