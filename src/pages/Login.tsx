const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  toast.dismiss();
  setIsLoading(true);

  if (!email || !password) {
    toast.error("Error", {
      description: "Please enter both email and password",
      dismissible: true
    });
    setIsLoading(false);
    return;
  }

  try {
    const result = await login(email, password);
    
    // Verifica esplicita del risultato del login
    if (result && result.success) {
      if (email === "test@gmail.com") {
        toast.success("Admin login", {
          description: "Accesso completo come amministratore",
          dismissible: true,
        });
        navigate("/admin"); // Rimuovi il commento se hai una rotta admin
      } else {
        toast.success("Login successful", {
          description: "Welcome to your account!",
          dismissible: true
        });
        navigate("/");
      }
    } else {
      throw new Error("Login failed");
    }
  } catch (error: any) {
    console.error("Login error:", error);
    toast.error("Login failed", {
      description: error.message || "Invalid credentials. Please try again.",
      dismissible: true
    });
  } finally {
    setIsLoading(false);
  }
};
