# Chat App - Lawrana

Aplicação Angular para gerenciamento de chats com assistentes de IA.

## Tecnologias Utilizadas

- Angular 19
- TypeScript
- RxJS
- HttpClient

## Funcionalidades

- ✅ Login com autenticação JWT
- ✅ Listagem de chats
- ✅ Criação de novos chats
- ✅ Visualização de mensagens
- ✅ Envio de mensagens
- ✅ Polling automático para status de processamento
- ✅ Interface responsiva

## Estrutura do Projeto

```
src/app/
├── components/
│   ├── login/              # Componente de login
│   ├── chat-list/          # Listagem de chats
│   └── chat/               # Interface do chat
├── services/
│   ├── auth.service.ts     # Serviço de autenticação
│   ├── chat.service.ts     # Serviço de chat
│   └── message.service.ts  # Serviço de mensagens
├── models/
│   ├── auth.model.ts       # Modelos de autenticação
│   ├── chat.model.ts       # Modelos de chat
│   └── message.model.ts    # Modelos de mensagem
├── guards/
│   └── auth.guard.ts       # Guard de autenticação
└── interceptors/
    └── auth.interceptor.ts # Interceptor HTTP
```

## Instalação

1. Navegue até o diretório do projeto:
```bash
cd chat-app
```

2. Instale as dependências:
```bash
npm install
```

## Executar a Aplicação

```bash
ng serve
```

A aplicação estará disponível em `http://localhost:4200`

## Credenciais de Teste

- **Código da Empresa**: `d818907a-b7ea-42f5-84a7-a714fde8877d`
- **Email**: `diego@teste.com`
- **Senha**: `diego`

## API Endpoints

### Autenticação
- `POST /usuario/login` - Login do usuário

### Chats
- `GET /chat` - Listar chats
- `POST /chat` - Criar novo chat
- `GET /chat/:id` - Buscar chat por ID

### Mensagens
- `POST /mensagemV3` - Enviar mensagem
- `GET /mensagem/processamento/:id` - Status de processamento

## Recursos Implementados

### Autenticação
- Login com email e senha
- Armazenamento de token JWT
- Validação de expiração do token
- Guard para proteção de rotas

### Interceptor HTTP
- Adiciona automaticamente o token de autenticação
- Gera UUID para x-correlation-id em todas as requisições

### Chat
- Listagem de chats ordenados por data
- Criação de novos chats com nome personalizado
- Visualização de histórico de mensagens
- Interface de chat em tempo real

### Mensagens
- Envio de mensagens para o assistente
- Polling automático para verificar status de processamento
- Atualização automática quando a resposta está pronta
- Indicador visual de "digitando..."

## Build

```bash
ng build
```

Os arquivos de build serão gerados no diretório `dist/`.

## Observações

- A aplicação usa localStorage para persistir o token de autenticação
- O polling de status de mensagem verifica a cada 2 segundos
- Todas as requisições incluem um UUID único no header x-correlation-id
- A interface é responsiva e otimizada para desktop e mobile

## Desenvolvimento

Este projeto foi gerado com [Angular CLI](https://github.com/angular/angular-cli) versão 21.0.0.

```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
