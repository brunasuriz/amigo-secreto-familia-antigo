# Amigo Secreto da Família

Aplicativo web em Next.js + Supabase. Interface em português, adaptada para celular e para pessoas com pouca familiaridade digital.

## O que está incluído
- Seleção de participante por avatar/nome.
- Confirmação simples pelo primeiro nome (não é autenticação forte).
- Resultado individual, sem exibir os pares no painel administrativo.
- Painel administrativo com senha, cadastro de participantes, núcleos familiares e acompanhamento de quem já sorteou.
- Geração de uma distribuição completa sem auto-sorteio, sem repetir destinatários e sem pares dentro do mesmo núcleo familiar.
- Banco protegido por RLS; a chave `SUPABASE_SERVICE_ROLE_KEY` é usada apenas no servidor.

## Antes de publicar
A aplicação ainda precisa ser conectada ao projeto Supabase e publicada em uma conta Vercel. Não compartilhe a `service_role key` com ninguém nem a coloque em variáveis `NEXT_PUBLIC_`.

### 1. Criar tabelas
No Supabase, abra **SQL Editor > New query**, copie todo o conteúdo de `supabase/schema.sql` e execute.

### 2. Configurar variáveis
No Supabase, em **Project Settings > API**, copie:
- Project URL
- `service_role` key (não a `anon` key)

Crie uma senha forte para o painel e um segredo aleatório longo para sessões.

Na Vercel, importe este projeto e adicione estas variáveis em **Settings > Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Use os valores correspondentes. Depois faça redeploy.

### 3. Publicar
Este projeto deve ser colocado em um repositório GitHub e importado pela Vercel como projeto Next.js. A pasta do projeto contém todo o código-fonte.

## Uso
1. Acesse `/admin` e entre com `ADMIN_PASSWORD`.
2. Cadastre os núcleos familiares.
3. Cadastre participantes e, se quiser, links de fotos acessíveis por HTTPS.
4. Confira os grupos e participantes.
5. Clique em **Gerar sorteio** somente quando o cadastro estiver completo.
6. Compartilhe o endereço público da página inicial.

## Observações importantes
- O primeiro nome funciona como confirmação simples, conforme solicitado. Qualquer pessoa que saiba o primeiro nome de outro participante pode tentar se passar por ele; isso evita erros acidentais, não ataques deliberados.
- Os resultados ficam na tabela `draws`, protegida por RLS e sem política de leitura pública. O painel administrativo não consulta essa tabela.
- O botão de reiniciar apaga os resultados e permite gerar outro sorteio. Use somente antes de divulgar resultados ou se houver erro de cadastro.
- A geração exige pelo menos 3 participantes e pode falhar se a composição dos núcleos tornar impossível uma distribuição sem pares internos. Nesse caso, reveja os núcleos ou decida quais exceções serão permitidas.
- Para simplificar a primeira versão, as fotos são cadastradas por URL. Recomenda-se usar links de imagens que não exijam login.
- Esta é uma base funcional inicial. Antes de usar com dados reais, teste com participantes fictícios e valide o fluxo completo.

## Atualização: fotos e edição do cadastro

O painel agora permite enviar fotos diretamente (JPG, PNG ou WEBP, até 5 MB), editar participantes e renomear núcleos familiares. Também permite excluir participantes e núcleos antes de gerar o sorteio.

Para habilitar o envio de fotos, execute novamente o arquivo `supabase/schema.sql` no SQL Editor do Supabase. Ele cria (ou confirma) o bucket público `participant-photos`. O envio dos arquivos é feito por uma rota protegida, acessível somente após login administrativo.

Depois que o sorteio tiver sido gerado, a edição de nome e foto continua disponível. A alteração de núcleo e a exclusão de participantes/núcleos ficam bloqueadas para não invalidar os pares já definidos. Para reorganizar cadastros após gerar o sorteio, use primeiro "Reiniciar resultados".
