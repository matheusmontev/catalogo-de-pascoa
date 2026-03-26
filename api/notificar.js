export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pedido, whatsapp, apikey } = req.body;

  if (!pedido || !whatsapp || !apikey) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  // Montar mensagem
  const itens = pedido.itens.map(i =>
    `- ${i.quantidade}x ${i.nome} — R$ ${(i.preco * i.quantidade).toFixed(2).replace('.', ',')}`
  ).join('%0A');

  const total = `R$ ${pedido.total.toFixed(2).replace('.', ',')}`;

  const mensagem = 
    `🍬 *Novo Pedido - Emilly Doces*%0A%0A` +
    `👤 *Cliente:* ${pedido.cliente_nome}%0A` +
    `📱 *WhatsApp:* ${pedido.cliente_whatsapp}%0A%0A` +
    `🛒 *Itens:*%0A${itens}%0A%0A` +
    `💰 *Total: ${total}*%0A%0A` +
    `📦 Retirada combinada pelo WhatsApp`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${whatsapp}&text=${mensagem}&apikey=${apikey}`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    console.log("CallMeBot response:", text);
    return res.status(200).json({ ok: true, callmebot: text });
  } catch (err) {
    console.error("Erro CallMeBot:", err);
    return res.status(500).json({ error: 'Falha ao notificar' });
  }
}
