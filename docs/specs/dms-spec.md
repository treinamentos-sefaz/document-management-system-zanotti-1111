# Especificação - Document Management System

> Especificação do MVP para orientar o desenvolvimento guiado por especificação. Este documento define o comportamento esperado; sua criação não implementa nem altera arquivos de backend ou frontend.

## 1. Objetivo

Permitir que usuários identifiquem, enviem, listem e baixem documentos armazenados no filesystem local da aplicação, mantendo seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um arquivo por requisição.
- Listagem dos documentos associados ao usuário informado na requisição.
- Download de um documento pelo identificador, limitado ao usuário informado.
- Registro em memória dos metadados durante a execução do processo.
- Gravação dos arquivos em `backend/storage` por padrão, usando `multer` com `diskStorage`.
- Interface web React para envio, listagem e download, consumindo a API pelo prefixo `/api`.
- Identificação simples do usuário para atribuição e separação dos documentos no MVP.

### Fora do escopo

- Armazenamento externo, em nuvem ou em banco de dados.
- Persistência dos metadados após reinício do processo.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Login, cadastro, sessões, autorização forte ou administração de usuários.
- Busca avançada, pastas, categorias e paginação.
- Garantia de recuperação dos metadados após falha ou reinício.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar o envio de um único arquivo por requisição multipart, no campo `file`. |
| RF-02 | O sistema deve rejeitar requisição sem arquivo, arquivo acima do limite configurado ou requisição multipart inválida, informando erro compreensível. |
| RF-03 | Para cada envio aceito, o sistema deve gerar um identificador único e gravar o conteúdo em armazenamento local com nome interno não controlado pelo nome original. |
| RF-04 | O sistema deve registrar em memória os metadados do arquivo enviado, incluindo o identificador do usuário dono. |
| RF-05 | O sistema deve listar somente documentos pertencentes ao usuário indicado na requisição e manter a resposta sem expor o caminho local do arquivo. |
| RF-06 | O sistema deve permitir o download pelo identificador somente quando o documento existir e pertencer ao usuário indicado. |
| RF-07 | O download deve preservar o nome original como nome sugerido ao cliente, sem usar esse nome como caminho no filesystem. |
| RF-08 | A interface deve permitir selecionar e enviar um arquivo, apresentar estado de carregamento e erro ou sucesso e atualizar a lista após um envio bem-sucedido. |
| RF-09 | A interface deve apresentar os documentos do usuário, incluindo nome, tamanho e data de envio, e oferecer uma ação de download para cada documento. |
| RF-10 | Em falha de escrita ou leitura do arquivo, o sistema deve responder com erro apropriado e não registrar um documento como enviado com sucesso. |

### Regras de negócio

- O identificador do documento deve ser único e independente do nome original do arquivo.
- `owner` é um identificador opaco fornecido pelo cliente por meio do cabeçalho `X-User-Id`; o MVP deve rejeitar valor ausente ou em branco. O valor não deve ser interpretado como caminho ou comando.
- `X-User-Id` serve somente para atribuição e isolamento funcional no MVP. Como não há autenticação, o cliente pode falsificar esse valor; ele não constitui uma fronteira de segurança para exposição pública.
- Envio, listagem e download devem usar a mesma identidade informada em `X-User-Id`.
- Uma falha ao persistir o arquivo não deve deixar metadados publicados. Se uma falha ocorrer após a gravação e antes do registro, remover o arquivo parcial quando possível.
- Reiniciar o processo limpa os metadados em memória. Arquivos já gravados podem permanecer órfãos; reconciliá-los ou removê-los automaticamente não faz parte deste MVP.

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados somente no filesystem local da aplicação, usando `multer` com `diskStorage`, em `backend/storage` por padrão. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase; não adicionar banco de dados nem serviço de armazenamento externo. |
| RNF-03 | Configurações operacionais devem ser obtidas de variáveis de ambiente, com valores padrão documentados quando aplicável. |
| RNF-04 | O servidor deve limitar o tamanho do arquivo recebido para proteger recursos; o padrão inicial é 10 MiB e pode ser alterado por `MAX_FILE_SIZE_BYTES`. |
| RNF-05 | O caminho de armazenamento deve ser configurável por `STORAGE_DIR`; caminhos relativos devem ser resolvidos de forma previsível em relação ao backend. |
| RNF-06 | O servidor deve responder em JSON para erros da API, sem retornar stack trace, caminhos internos ou detalhes sensíveis ao cliente. |
| RNF-07 | A API deve usar códigos HTTP consistentes e validar entradas na fronteira HTTP. |
| RNF-08 | O nome original deve ser tratado como dado não confiável; o nome físico do arquivo deve ser gerado pelo servidor. |
| RNF-09 | O frontend deve acessar a API sob `/api`, usando o proxy configurado no Vite em desenvolvimento, e não deve depender do caminho físico de armazenamento. |
| RNF-10 | A implementação deve seguir JavaScript puro, Express em CommonJS, React com componentes funcionais e testes backend com `node:test`, reutilizando dependências existentes. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único gerado pelo servidor, preferencialmente UUID. |
| `originalName` | string | Sim | Nome original fornecido pelo cliente; usado para exibição e nome sugerido no download. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Sim | Data e hora do envio em ISO 8601, normalizada para UTC. |
| `owner` | string | Sim | Identificador informado em `X-User-Id`. |

### Dados internos de armazenamento

| Campo | Tipo | Persistência | Descrição |
| --- | --- | --- | --- |
| `storedName` | string | Arquivo no filesystem; referência em memória | Nome aleatório/gerado pelo servidor, sem usar diretamente `originalName`. |
| `storagePath` | string | Referência em memória | Caminho absoluto resolvido pelo backend para leitura; nunca deve ser retornado pela API. |

O repositório em memória mantém os metadados e a referência interna necessários durante a vida do processo. O armazenamento de arquivos é local e não transacional com a memória. A resposta JSON contém apenas os metadados públicos, nunca `storedName` ou `storagePath`.

## 6. Contratos de API

### Convenções

- Rotas públicas sob o prefixo `/api`.
- Todas as respostas de erro usam o formato `{ "error": { "code": "CODIGO", "message": "Descrição" } }`.
- O cabeçalho `X-User-Id` é obrigatório em todas as rotas abaixo. Valor ausente ou em branco resulta em `400 Bad Request`.
- Tipos MIME não são restringidos pelo MVP; o limite de tamanho é aplicado pelo servidor.

### `POST /api/upload`

Envia um arquivo para o usuário indicado.

- Cabeçalhos: `X-User-Id: <identificador>`.
- Corpo: `multipart/form-data` com exatamente um arquivo no campo `file`.
- Sucesso: `201 Created`, corpo JSON com os metadados públicos criados.

```json
{
  "id": "5f0d7b8e-6b16-4e31-bf7e-7b6dfba33321",
  "originalName": "relatorio.pdf",
  "size": 48210,
  "uploadedAt": "2026-11-25T14:30:00.000Z",
  "owner": "usuario-123"
}
```

- Erros: `400 Bad Request` para cabeçalho ausente/inválido, campo de arquivo ausente ou multipart inválido; `413 Payload Too Large` para arquivo acima do limite; `500 Internal Server Error` para falha inesperada de armazenamento.
- Em erro, não retornar metadados de sucesso nem caminho local.

### `GET /api/documents`

Lista os documentos do usuário indicado.

- Cabeçalhos: `X-User-Id: <identificador>`.
- Sucesso: `200 OK`, corpo JSON é um array de metadados públicos; lista vazia é `[]`.
- Ordenação: mais recentes primeiro por `uploadedAt`; desempate determinístico por `id`.
- Erros: `400 Bad Request` se o cabeçalho estiver ausente ou em branco; `500 Internal Server Error` para falha inesperada.

```json
[
  {
    "id": "5f0d7b8e-6b16-4e31-bf7e-7b6dfba33321",
    "originalName": "relatorio.pdf",
    "size": 48210,
    "uploadedAt": "2026-11-25T14:30:00.000Z",
    "owner": "usuario-123"
  }
]
```

### `GET /api/documents/:id/download`

Transfere o conteúdo binário de um documento pertencente ao usuário indicado.

- Cabeçalhos: `X-User-Id: <identificador>`.
- Sucesso: `200 OK`, conteúdo binário com `Content-Disposition: attachment` e nome original seguro como nome sugerido.
- Erros: `400 Bad Request` se o cabeçalho estiver ausente ou em branco; `404 Not Found` se o identificador não existir, não pertencer ao usuário ou o arquivo não estiver disponível. A resposta não deve revelar se um documento de outro usuário existe; `500 Internal Server Error` para falha inesperada de leitura.

### Códigos de erro

| Código | HTTP | Uso |
| --- | --- | --- |
| `INVALID_REQUEST` | 400 | Cabeçalho, campo de arquivo ou corpo inválido. |
| `FILE_TOO_LARGE` | 413 | Arquivo excede `MAX_FILE_SIZE_BYTES`. |
| `DOCUMENT_NOT_FOUND` | 404 | Documento inexistente, de outro usuário ou arquivo indisponível. |
| `INTERNAL_ERROR` | 500 | Falha inesperada sem detalhes internos expostos. |

## 7. Decisões arquiteturais

### Backend

- Manter o fluxo de dependências `routes -> controllers -> services -> repositories`.
- `routes/` declara caminhos e encaminha requisições aos controllers.
- `controllers/` valida dados HTTP básicos, lê `X-User-Id` e arquivo, chama serviços e traduz resultados para status/corpos HTTP.
- `services/` aplica regras de negócio, coordena armazenamento e metadados e não depende de Express.
- `repositories/` mantém os metadados em memória e oferece operações para criar, listar por dono e buscar por identificador e dono.
- A integração de filesystem e `multer` deve ficar na borda do backend e ser configurada sem vazar dependências HTTP para as camadas internas.
- A pasta de armazenamento deve existir ou ser criada na inicialização; não incluir arquivos enviados no controle de versão.

### Frontend

- Usar componentes funcionais React e organização existente em `components/`, `pages/` e `services/`.
- Centralizar chamadas `fetch` à API na camada `services/`, sempre usando `/api`.
- Manter estados de carregamento, lista vazia, erro e envio em andamento visíveis e coerentes.
- O identificador `X-User-Id` deve vir de uma fonte de identidade simples configurada para o MVP; não tratar essa solução como autenticação segura.

### Configuração mínima

| Variável | Padrão | Finalidade |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local dos arquivos enviados. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Limite de tamanho por arquivo (10 MiB). |

## 8. Plano de execução

As etapas abaixo são uma sequência futura de implementação. Nesta entrega, somente esta especificação deve ser criada; nenhuma etapa de implementação de arquivos de backend ou frontend foi executada.

1. Revisar esta especificação e confirmar as decisões do MVP, em especial identidade por `X-User-Id`, limite de upload e semântica de perda de metadados ao reiniciar.
2. Definir configuração do backend, inicialização segura do diretório local e limites de upload via ambiente.
3. Implementar repositório em memória e serviço de documentos, incluindo isolamento por dono e tratamento de falhas de filesystem.
4. Implementar middleware/configuração `multer` com `diskStorage`, nome físico gerado pelo servidor e limite configurável.
5. Implementar rotas e controllers para upload, listagem e download, com os contratos e erros descritos nesta especificação.
6. Adicionar testes backend para fluxos de sucesso, validação, isolamento entre usuários, limite de tamanho e falhas de arquivo.
7. Implementar a camada frontend de chamadas à API e a interface para upload, listagem, estados de erro/carregamento e download.
8. Validar o fluxo integrado no ambiente local e atualizar a documentação operacional, incluindo variáveis de ambiente e limitações conhecidas.
