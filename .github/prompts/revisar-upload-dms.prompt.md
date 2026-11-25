---
name: revisar-upload-dms
description: Revisa segurança e comportamento do fluxo de upload local do DMS.
argument-hint: caminho do arquivo ou alteração a revisar
agent: code-reviewer
---

# Revisar fluxo de upload do DMS

Revise `${input:alvo:backend/src/routes/documentRoutes.js}` e os arquivos relacionados ao upload no backend do Document Management System. Considere também `docs/specs/dms-spec.md`, os testes em `backend/test` e as instruções em `.github/copilot-instructions.md`.

Use como referência a orientação comunitária **AP3: File Upload Without Validation** do repositório [github/awesome-copilot](https://github.com/github/awesome-copilot/blob/main/instructions/security-and-owasp.instructions.md), adaptada às decisões deste projeto.

Verifique, com evidências nos arquivos:

- Se `multer` usa `diskStorage`, grava dentro do diretório local configurado e aplica o limite de tamanho definido por `MAX_FILE_SIZE_BYTES`.
- Se o nome físico é gerado pelo servidor e o nome original nunca é concatenado a um caminho de filesystem.
- Se upload sem arquivo, campos inesperados, limite excedido e erros de escrita produzem respostas HTTP coerentes com o contrato da API e não deixam metadados ou arquivos parciais inconsistentes.
- Se metadados e downloads ficam limitados ao `X-User-Id` informado, sem retornar caminhos internos.
- Se os testes exercitam sucesso, validações, isolamento por usuário e falhas relevantes do armazenamento local.

Não proponha armazenamento externo, banco de dados ou dependências novas. O MVP não exige allowlist de MIME types; trate sua ausência como problema somente se houver requisito explícito ou se a validação atual permitir um risco concreto. `X-User-Id` é identificação funcional, não autenticação: destaque essa limitação, mas não recomende tratá-la como autenticação existente.

Apresente apenas achados verificáveis, priorizados por severidade. Para cada achado, inclua arquivo/trecho, impacto e correção mínima. Separe claramente riscos que bloqueiam a entrega de recomendações opcionais. Não edite arquivos durante esta revisão.
