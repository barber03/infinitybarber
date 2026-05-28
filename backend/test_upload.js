const loginAndUpload = async () => {
  const loginRes = await fetch("http://localhost:3000/api/auth/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "1234" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  const form = new FormData();
  const blob = new Blob(["dummy png content"], { type: "image/png" });
  form.append("image", blob, "test_image.png");

  const uploadRes = await fetch("http://localhost:3000/api/admin/gallery/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  console.log("Upload Status:", uploadRes.status);
  console.log("Upload Body:", await uploadRes.json());
};

loginAndUpload().catch(console.error);
