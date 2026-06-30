# Credenciais de Acesso — Controle Comercial

## Primeiro Acesso

| Campo  | Valor              |
|--------|--------------------|
| URL    | http://localhost:3000 |
| E-mail | admin@admin.com    |
| Senha  | admin123           |
| Tipo   | ADMIN              |

## Senha no Banco (bcrypt custo 12)

```
$2a$12$tLb2A9SDyAAqU3md7NCeXOWB/GlXBSGehHYx/Yo8sK7pW27cerpH.
```

> A senha está armazenada como hash bcrypt com custo 12.  
> Nunca é salva em texto puro no banco de dados.

---

## Como Iniciar

```bash
# 1. Instalar dependências (apenas na primeira vez)
npm install

# 2. Popular banco com dados iniciais (apenas na primeira vez)
node database/seed.js

# 3. Iniciar servidor
npm start

# 4. Acessar no navegador
http://localhost:3000
```

---

## ⚠️ Segurança

- Troque a senha do admin após o primeiro acesso em produção
- Altere o `JWT_SECRET` em `config.js` antes de publicar online
- Nunca exponha o arquivo `comercial.db` publicamente
