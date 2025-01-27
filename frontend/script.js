document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const toggleButtons = document.querySelectorAll('.toggle-form');

    // Alternar entre os formulários de login e registro
    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const formType = button.dataset.form;

            if (formType === 'login') {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            } else if (formType === 'register') {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            }
        });
    });

    // Submeter o formulário de registro
    registerForm.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm.querySelector('form'));

        try {
            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registro realizado com sucesso!');
                window.location.href = '/frontend/user-dashboard.html'; // Redirecionar para dashboard do usuário
            } else {
                alert(data.error || 'Erro ao registrar o usuário no banco de dados.');
            }
        } catch (error) {
            alert('Erro de conexão com o servidor.');
        }
    });

    // Submeter o formulário de login
    loginForm.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm.querySelector('form'));
    
        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });
    
            const data = await response.json();
    
            if (response.ok) {
                localStorage.setItem('token', data.token);
    
                // Ajustado o case para 'consultant'
                switch (data.user_type) {
                    case 'admin':
                        window.location.href = '/frontend/admin-dashboard.html';
                        break;
                    case 'consultant': // Alterado de 'consult' para 'consultant'
                        window.location.href = '/frontend/consultant-dashboard.html';
                        break;
                    default:
                        window.location.href = '/frontend/user-dashboard.html';
                }
            } else {
                alert(data.error || 'Erro ao fazer login.');
            }
        } catch (error) {
            console.error('Erro detalhado:', error);
            alert('Erro de conexão com o servidor.');
        }
    });
});
