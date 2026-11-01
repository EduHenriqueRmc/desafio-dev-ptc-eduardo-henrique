# Relatório — Desafio de Back-end Folhagem & Cia

## 1. O que foi feito

Implementei a API da Folhagem & Cia seguindo a mesma organização em camadas do CRUD de usuários: `routes.ts` → Controller → Repository → banco (PostgreSQL via Prisma).

**Parte obrigatória (completa):**

- Model `Planta` e enum `Luminosidade` no `schema.prisma`, com a migration `create_planta_model`.
- `PlantaRepository.ts` e `PlantaController.ts`.
- As 7 rotas do enunciado, com todas as regras de negócio (campos obrigatórios, preço > 0, estoque ≥ 0, `regaACadaDias` ≥ 1, enum de luminosidade, 400 para dados inválidos, 404 para id inexistente e venda sem estoque negativo).

**Bônus (todos feitos):** busca por nome sem diferenciar maiúsculas, ordenação, rota de plantas esgotadas e script de seed. Estão explicados separadamente na seção 5.

**O que ficou de fora:** o tratamento da compra simultânea do último vaso (duas vendas ao mesmo tempo). Falo mais sobre isso na seção 4.

### Rotas obrigatórias

| Método | Rota | Handler | O que faz | Sucesso |
|---|---|---|---|---|
| POST | `/plantas` | `createPlanta` | Cadastra uma planta | 201 |
| GET | `/plantas` | `readAllPlantas` | Lista plantas, com filtros `?luminosidade=` e `?petFriendly=` | 200 |
| GET | `/plantas/:id` | `readPlantaById` | Busca uma planta | 200 |
| PATCH | `/plantas/:id` | `updatePlanta` | Edita só os campos enviados | 200 |
| DELETE | `/plantas/:id` | `deletePlanta` | Remove uma planta | 204 |
| POST | `/plantas/:id/venda` | `sellPlanta` | Recebe `{ "quantidade": n }` e diminui o estoque | 200 |
| GET | `/plantas/estoque/valor-total` | `readValorTotalEstoque` | Soma `preco × estoque` e o total de vasos | 200 |

A rota fixa `/plantas/estoque/valor-total` foi registrada antes das rotas com `:id`, porque o Express usa a primeira rota que combinar.

### Funções do Repository (`PlantaRepository.ts`)

O repository é a única camada que fala com o Prisma.

- `createPlanta(data)`: cria uma planta no banco.
- `findAllPlantas(filtros)`: lista as plantas. Recebe `luminosidade` e `petFriendly` e passa direto no `where`. Como o Prisma ignora condições `undefined`, uma única consulta resolve todas as combinações de filtros.
- `findPlantaById(id)`: busca uma planta pelo id, ou `null` se não existir.
- `updatePlanta(id, data)`: atualiza os campos enviados. Os `undefined` não são alterados.
- `deletePlanta(id)`: remove a planta.
- `decrementEstoque(id, quantidade)`: diminui o estoque com `{ estoque: { decrement: quantidade } }`. Usada na venda.
- `findAllPrecoEEstoque()`: busca só `preco` e `estoque` (com `select`), para o cálculo do valor total.

### Funções do Controller (`PlantaController.ts`)

Todos os handlers seguem o roteiro do `UserController`: ler, validar, chamar o repository e responder, dentro de um `try/catch` que responde 500 em erro inesperado.

- `validarCampos(dados)` (função auxiliar): valida apenas os campos que foram enviados e devolve a mensagem de erro, ou `null`. Serve para o cadastro e para a edição.
- `createPlanta`: confere se todos os campos foram enviados (comparando com `=== undefined`, e não com `!campo`, para não recusar `estoque: 0` nem `petFriendly: false`), valida e cadastra. Responde 201.
- `readAllPlantas`: lê e valida os filtros de `req.query` e chama o repository. Filtro inválido é 400, e filtro válido sem resultado é 200 com `[]`.
- `readPlantaById`: valida o id (inteiro maior que zero), busca a planta e responde 404 se não existir.
- `updatePlanta`: valida o id e os campos enviados, confere se a planta existe (404) e atualiza só o que veio.
- `deletePlanta`: valida o id, confere se a planta existe (404), deleta e responde 204.
- `sellPlanta`: valida o id e a `quantidade` (inteiro maior que zero), busca a planta (404), confere se `estoque >= quantidade` (senão 400, sem alterar nada), diminui o estoque e responde 200 com a planta atualizada.
- `readValorTotalEstoque`: busca preço e estoque de todas as plantas e calcula, com `reduce`, o `valorTotalEmCentavos` e o `totalDeVasos`. Com a loja vazia, responde 200 com os valores zerados.

## 2. Como foi feito

Segui os passos sugeridos no enunciado, na ordem:

1. Li o `UserController`, o `UserRepository` e o `routes.ts` para usar como modelo.
2. Criei o enum e o model no `schema.prisma` e rodei a migration.
3. Escrevi o repository, o controller e as rotas.
4. Implementei os filtros, a venda e o valor total.
5. Fiz os bônus, um de cada vez.
6. Escrevi o seed e este relatório.

**Decisões de validação e organização:**

- **Validação em uma função só (`validarCampos`).** No cadastro todos os campos são obrigatórios e na edição nenhum é, mas os campos enviados passam pelas mesmas regras. Validar apenas o que não for `undefined` atende aos dois casos sem repetir código.
- **`=== undefined` em vez de `!campo`.** Como `!0` e `!false` são verdadeiros, `!estoque` recusaria `estoque: 0` e `!petFriendly` recusaria toda planta que não é pet-friendly, e as duas são válidas.
- **Inteiros com `Number.isInteger`.** Ele recusa `"8990"` (texto), `89.9` e `NaN`. O preço é inteiro em centavos justamente para evitar erro de arredondamento.
- **Busca antes de editar e deletar.** Sem isso, o erro do Prisma cairia no `catch` e viraria um 500 em vez de um 404.
- **Não passo `req.body` direto para o banco.** Desestruturo e envio só os campos da planta.
- **Valor total calculado no código**, porque o `aggregate` do Prisma soma uma coluna, mas não soma `preco × estoque`.

**Decisões além do que o enunciado detalha:**

- O filtro `?petFriendly=` só aceita `true` ou `false`, e qualquer outro valor retorna 400 (o enunciado diz que filtro inválido é 400).
- Um id inválido (como `abc` ou `0`) retorna 400 em todas as rotas com `:id`, não só no `GET`.
- No PATCH, a ordem é: validar id, validar campos, buscar a planta (404). Assim, dados inválidos retornam 400 antes de qualquer consulta ao banco.

## 3. Principais dificuldades

- **`Prisma has no exported member 'PlantaCreateInput'`.** O erro apareceu no repository porque o Prisma Client ainda não conhecia o model `Planta`. Percebi que o código estava certo e que faltava o model no schema, a migration e reiniciar o TypeScript no VS Code (`Restart TS Server`).
- **`Cannot find name 'process'` no seed.** O TypeScript não achava os tipos do Node para o arquivo da pasta `prisma`. O `@types/node` já estava nas dependências, então o ajuste foi reiniciar o TypeScript e incluir a pasta `prisma` no `tsconfig.json`, se necessário.
- **`ts-node` não existia no projeto.** O projeto só tinha o `ts-node-dev`, que é outra ferramenta. Instalei o `tsx` para rodar o seed.
- **`Can't reach database server at treinamento-crud-db:5432`.** Rodando `yarn seed` na minha máquina, o Prisma não resolvia o host do banco, que é o nome do container dentro da rede do Docker. A solução foi rodar o seed dentro do container (`docker compose exec server yarn seed`) ou trocar o host por `localhost` e usar a porta mapeada.
- **`tsx: not found` no container.** O container foi construído antes de eu instalar o `tsx`, então foi preciso reconstruir a imagem (`docker compose up -d --build`).

**Corrida do último vaso (não resolvida).** Se duas pessoas comprarem o último vaso ao mesmo tempo, as duas podem passar na checagem `estoque >= quantidade` antes de qualquer uma diminuir o estoque, e ele ficaria negativo. Não implementei uma proteção para isso. Uma solução possível seria fazer a checagem e o decremento em uma única operação atômica no banco, por exemplo um `updateMany` com `where: { id, estoque: { gte: quantidade } }`, ou uma transação.

## 4. Uso de IA

Usei o **Claude** durante o desafio, para:

- **Gerar código:** alguns blocos no `PlantaController.ts`e no `PlantaRepository.ts` e o script de seed.
- **Entender erros:** os erros do Prisma, do TypeScript e do Docker listados na seção 3.
- **Gerar dados de teste:** os bodies JSON para cadastrar plantas.

Cada bloco gerado com IA era imediatamente testado no Thunder Client, para evitar acumular erros e problemas de lógica nos códigos. Além disso, verifiquei o cálculo do valor total com IA e na mão.

## 5. Bônus

Cada bônus foi feito em cima do código obrigatório, sem alterar o comportamento das rotas originais.

### 5.1 Busca por nome sem diferenciar maiúsculas (`?nome=`)

- **Rota:** `GET /plantas?nome=costela`. Não precisou de rota nova, porque é mais um parâmetro de query.
- **Repository (`findAllPlantas`):** recebe `nome` e adiciona ao `where` a condição `{ contains: nome, mode: "insensitive" }`. O `contains` busca o texto em qualquer parte do nome e o `mode: "insensitive"` ignora maiúsculas e minúsculas. Se o nome não for enviado, a condição é `undefined` e o Prisma a ignora.
- **Controller (`readAllPlantas`):** lê `req.query.nome` e retorna 400 se ele não for texto (por exemplo `?nome=a&nome=b`, que o Express entrega como array). Combina com os outros filtros.

### 5.2 Ordenação (`?ordem=`)

- **Rota:** `GET /plantas?ordem=preco` ou `GET /plantas?ordem=nome`. Também não precisou de rota nova.
- **Repository (`findAllPlantas`):** recebe `ordem` e monta o `orderBy`: `{ preco: "asc" }` ou `{ nome: "asc" }`. Sem `ordem`, o `orderBy` é `undefined` e o comportamento fica igual ao de antes. A ordem é crescente (menor preço primeiro, ou A a Z).
- **Controller (`readAllPlantas`):** retorna 400 se `ordem` for qualquer valor diferente de `preco` e `nome`. Combina com os filtros e com a busca por nome.

### 5.3 Rota de plantas esgotadas

- **Rota:** `GET /plantas/esgotadas`, registrada antes de `/plantas/:id`. Se ficasse depois, a palavra "esgotadas" seria tratada como um id e retornaria 400.
- **Repository:** `findAllPlantasEsgotadas()` busca as plantas com `where: { estoque: 0 }`.
- **Controller:** `readPlantasEsgotadas` chama o repository e responde 200 com a lista. Se não houver plantas esgotadas, responde 200 com `[]`. Segue o padrão do `readAllUsers`.

### 5.4 Script de seed

- **Arquivo:** `prisma/seed.ts`, executado com `yarn seed` (script `"seed": "tsx prisma/seed.ts"` no `package.json`).
- **O que faz:** apaga as plantas existentes (`deleteMany`) e cadastra 8 plantas de exemplo com `createMany`. O `deleteMany` deixa o seed repetível.
- **Dados:** o seed inclui plantas de todas as luminosidades, com `petFriendly` verdadeiro e falso, e duas plantas com `estoque: 0`, o que permite testar os filtros e a rota de esgotadas.
- **Observação:** o script usa o `PrismaClient` diretamente, e não o `@database`, porque roda fora do servidor, onde os aliases podem não ser resolvidos. Ele precisa de acesso ao banco, então deve ser executado dentro do container (`docker compose exec server yarn seed`).
