async function submitForm(event) {
  event.preventDefault();

  if (!window.sb) {
    alert("Supabase não configurado (config.js).");
    return;
  }

  // 1) Coleta dados
  const formData = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    material: document.getElementById("material").value,
    weight: document.getElementById("weight").value,
    observation: document.getElementById("observation").value.trim(),
    street: document.getElementById("street").value.trim(),
    neighborhood: document.getElementById("neighborhood").value.trim(),
    number: document.getElementById("number").value.trim(),
    complement: document.getElementById("complement").value.trim(),
  };

  // 2) Checa termos
  const termsCheckbox = document.getElementById("aceito");
  if (!termsCheckbox?.checked) {
    alert("Aceite os termos de uso para continuar.");
    return;
  }

  // 3) Garante que usuário está logado
  const { data: authData } = await sb.auth.getUser();
  if (!authData?.user) {
    alert("Você precisa entrar/criar uma conta para acompanhar o agendamento.");
    // aqui você pode redirecionar para login.html
    // window.location.href = "login.html";
    return;
  }

  // 4) Atualiza profile (nome/telefone) se necessário
  await sb.from("profiles").update({
    full_name: formData.name,
    phone: formData.phone
  }).eq("id", authData.user.id);

  // 5) Registra consentimento (aceite) - (simples)
  await sb.from("consents").insert({
    user_id: authData.user.id,
    terms_version: window.TERMS_VERSION || "v1",
    ip: "",
    user_agent: navigator.userAgent || ""
  });

  // 6) Cria o agendamento
  const { data: created, error } = await sb
    .from("collection_requests")
    .insert({
      user_id: authData.user.id,
      material: formData.material,
      weight_estimate: formData.weight,
      observation: formData.observation || "",
      street: formData.street,
      neighborhood: formData.neighborhood,
      number: formData.number,
      complement: formData.complement || "",
      status: "pending"
    })
    .select("id, protocol")
    .single();

  if (error) {
    console.error(error);
    alert("Erro ao criar agendamento. Tente novamente.");
    return;
  }

  // 7) Abre WhatsApp com protocolo + instrução de acompanhar no app
  const protocol = created.protocol;
  const phoneDigits = whatsappNumber.replace(/\D/g, "");

  const msg = `✅ *Agendamento criado com sucesso!*\n\n` +
    `🧾 *Protocolo:* #${protocol}\n` +
    `📍 *Endereço:* ${formData.street}, ${formData.neighborhood}, ${formData.number}${formData.complement ? ", " + formData.complement : ""}\n` +
    `♻️ *Material:* ${formData.material}\n` +
    `⚖️ *Peso:* ${formData.weight}\n\n` +
    `Acompanhe o andamento pelo app (Meus Agendamentos).`;

  const whatsappUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(msg)}`;
  window.open(whatsappUrl, "_blank");

  alert(`Agendamento criado! Protocolo: #${protocol}`);

  // limpar form
  document.getElementById("agendamentoForm").reset();
  updateSubmitState();
}
