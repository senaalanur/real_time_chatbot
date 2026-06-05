Deno.serve(async (req) => {
  try {
    const { user, email_data } = await req.json();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@lumaid.co",
        to: user.email,
        subject: email_data.subject,
        html: email_data.html_body ?? email_data.body,
      }),
    });

    const data = await res.json();
    console.log("Resend response:", JSON.stringify(data));

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204 });

  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
