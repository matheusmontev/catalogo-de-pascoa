export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pedido, whatsapp, apikey } = req.body;

  if (!pedido || !whatsapp || !apikey) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  // Montar mensagem
  const listaItens = pedido.itens.map(i =>
    `- ${i.quantidade}x ${i.nome} — R$ ${(i.preco * i.quantidade).toFixed(2).replace('.', ',')}`
  ).join('\n');

  const totalFmt = `R$ ${pedido.total.toFixed(2).replace('.', ',')}`;

  const mensagem = encodeURIComponent(
    `🍬 *NOVO PEDIDO — Emilly Doces Artesanais*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 *Cliente:* ${pedido.cliente_nome}\n` +
    `📱 *WhatsApp:* ${pedido.cliente_whatsapp}\n\n` +
    `🛒 *Itens:*\n${listaItens}\n\n` +
    `💰 *Total: ${totalFmt}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📋 *MENSAGEM PARA ENVIAR AO CLIENTE:*\n\n` +
    `Olá, ${pedido.cliente_nome}! 😊\n` +
    `Recebi seu pedido pela Emilly Doces Artesanais.\n\n` +
    `🛒 *Seu pedido:*\n${listaItens}\n\n` +
    `💰 *Total: ${totalFmt}*\n\n` +
    `📌 *Informações importantes:*\n` +
    `• Atendemos apenas aos finais de semana\n` +
    `• Retirada a combinar pelo WhatsApp\n` +
    `• Pagamento somente na retirada do produto\n\n` +
    `Em breve entrarei em contato para confirmar os detalhes. 🍬`
  );

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
