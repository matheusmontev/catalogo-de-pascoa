// Vercel Function - será integrada com CallMeBot na próxima etapa
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pedido } = req.body;
  
  // TODO: chamar CallMeBot aqui
  console.log("Novo pedido recebido (via API):", JSON.stringify(pedido, null, 2));

  res.status(200).json({ ok: true });
}
