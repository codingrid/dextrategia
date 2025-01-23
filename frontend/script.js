// Função para registrar um novo usuário
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('http://localhost:5000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.redirectUrl) {
                // Ajuste a URL para redirecionar para a porta 5500
                window.location.href = `http://localhost:5500${data.redirectUrl}`;
            } else {
                console.error('URL de redirecionamento não fornecida pelo backend.');
            }
        } else {
            console.error('Erro ao registrar usuário:', data.message);
        }
    } catch (error) {
        console.error('Erro na requisição de registro:', error);
    }
});

// Função para fazer login de um usuário
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:5000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.redirectUrl) {
                // Ajuste a URL para redirecionar para a porta 5500
                window.location.href = `http://127.0.0.1:5500${data.redirectUrl}`;
            } else {
                console.error('URL de redirecionamento não fornecida pelo backend.');
            }
        } else {
            console.error('Erro ao fazer login:', data.message);
        }
    } catch (error) {
        console.error('Erro na requisição de login:', error);
    }
});