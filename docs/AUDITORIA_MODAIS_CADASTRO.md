# Auditoria e padronização dos formulários de criação

Data: 28/10/2026.

## A. Inventário e cobertura

Foram identificadas e revisadas **40 declarações de diálogo de cadastro ou registro operacional**, distribuídas por 15 módulos. Uma declaração pode atender mais de uma operação ou compartilhar cadastro e edição; por exemplo, entrada/saída de estoque e limpeza/manutenção. O inventário não representa 40 tipos novos de entidade.

| Módulo | Declarações | Cadastros e registros cobertos |
| --- | ---: | --- |
| Reservas | 3 | Reserva; Recebimento de reserva; Cadastro rápido de cliente |
| CheckInOut | 4 | Check-in com reserva; Recebimento da hospedagem; Check-in sem reserva; Cadastro rápido de hóspede |
| Hospedes | 1 | Hóspede ou cliente |
| Quartos | 2 | Quarto; Categoria de quarto |
| Estoque | 2 | Produto de estoque; Entrada ou saída de estoque |
| Pacotes | 1 | Pacote comercial e benefícios |
| Eventos | 4 | Recebimento de evento; Sala de evento; Serviço de evento; Evento |
| Consumos | 1 | Consumo de hospedagem |
| Hospedagens | 2 | Registro de troca de quarto; Consumo na gestão da hospedagem |
| Financeiro | 9 | Recebimento de reserva ou fatura; Recebimento de evento no financeiro; Conta a pagar; Pagamento de conta; Abertura de caixa; Registro de fechamento de caixa; Movimentação manual de caixa; Centro de custo; Conciliação bancária simulada |
| Usuarios | 2 | Usuário; Perfil de acesso |
| Funcionarios | 5 | Funcionário; Cargo; Turno de trabalho; Atribuição de funcionário; Registro de ponto |
| LimpezaManutencao | 2 | Tarefa de limpeza ou manutenção; Registro de execução de limpeza ou manutenção |
| Fiscal | 1 | Documento fiscal ou recibo demonstrativo |
| Comunicacoes | 1 | Comunicação |

Também foram revisados os benefícios estruturados dentro de Pacotes, a associação de perfis dentro de Usuários e o formulário de geração de relatórios na página. Não foram encontrados drawers de cadastro. Consultas, estornos, confirmações, recuperação de senha e lançador do tour utilizam a estrutura comum de diálogo, mas não foram contabilizados como novos cadastros.

O inventário técnico com campos, tamanho e origem de cada diálogo está em [create-dialog-inventory.json](create-dialog-inventory.json).

## B. Problemas anteriores

- Larguras limitadas a duas opções, sem relação consistente com a complexidade do formulário.
- Cabeçalho, conteúdo e ações compartilhando a mesma rolagem em vários módulos.
- Rodapés dentro de grids e distribuídos entre abas, com hierarquia e espaçamentos diferentes.
- Campos longos comprimidos, ausência de grupos claros em reservas, estoque e pacotes e seções administrativas pouco diferenciadas.
- Grids rígidos em telas estreitas, campos monetários sem uma apresentação uniforme e controles de tabelas sem nome acessível.
- Gestão de foco e proteção de alterações disponíveis apenas parcialmente; ausência de um mecanismo comum para diálogos aninhados.
- Mensagens de erro frequentemente distantes das ações ou visíveis apenas em uma aba.

## C. Implementação

### Estrutura e dimensões

O componente Modal existente foi consolidado como estrutura única de cabeçalho, corpo e rodapé. Os 40 diálogos inventariados têm rodapé separado do corpo. Foram adicionadas variantes sm (420 px), md (640 px), lg (840 px) e xl (1.040 px), sempre limitadas à viewport. A opção wide permanece compatível.

Cabeçalho e ações permanecem disponíveis; somente o corpo rola. Os formulários extensos foram reorganizados com FormSection e FormGrid, sem novas etapas. As cinco abas de hóspedes e as etapas anteriores de check-in e eventos foram preservadas.

### Campos e grupos

- Reservas: responsável, período/acomodação, condições comerciais e informações adicionais.
- Estoque: identificação, valores/limites e armazenamento/fornecedor.
- Pacotes: identificação, elegibilidade, preço/vigência, benefícios e condições.
- Funcionários: identificação/contato e vínculo/permissões.
- Comunicações: destinatário/canal, agendamento/finalidade e conteúdo.
- Fiscal e recebimentos: conferência da origem/conta separada do preenchimento da operação.
- Nomes completos recebem largura apropriada. Os campos numéricos e datas preservam os tipos, valores, limites e conversões originais.
- Prefixo visual R$ nos campos monetários, sem máscara, novo parser ou transformação do valor salvo.
- FieldError, descrições auxiliares, aria-describedby, aria-invalid e indicação acessível de obrigatoriedade. Mensagens existentes de hóspedes e usuários também são apresentadas junto aos campos identificados.

### Interação e acessibilidade

- Diálogos renderizados em portal, com fundo inerte, bloqueio de rolagem de fundo e empilhamento para cadastros rápidos.
- Foco inicial, ciclo de Tab/Shift+Tab, Escape e restauração de foco no fechamento.
- Confirmação leve de descarte após alteração de campos, inclusive nos botões de cancelar do rodapé. Voltar entre etapas continua sendo navegação normal.
- Bloqueio de ativação repetida da mesma ação principal. Quando um handler retorna uma Promise, o botão representa o estado real de execução e fica indisponível durante a operação.
- Tour e roteiro operacional mantidos como superfícies explícitas de assistência, sem mudar seus comandos ou resultados.
- Controles editáveis de serviços e cronograma de eventos receberam nomes acessíveis.

### Responsividade estática

Os tamanhos máximos respeitam 1440 px, 1366 px, 768 px e 375 px por composição de largura máxima e consultas de container. Grids passam de três para duas e depois uma coluna conforme a largura real do diálogo. Em smartphones há margens menores, ações com quebra controlada e altura baseada em dvh para acomodar a área disponível. Tabelas mantêm rolagem própria.

## D. Arquivos

- src/components/ui.tsx: Modal, ConfirmDialog, Input, Select, Textarea, FieldError, FormSection, FormGrid e proteção/estado dos botões.
- src/components/use-dialog-layer.ts: foco, empilhamento, inércia e compatibilidade das superfícies de assistência.
- src/components/dialog-rules.ts e dialog-rules.test.ts: regras de interação e testes unitários.
- src/styles/dialogs.css: linguagem visual compartilhada dos diálogos e campos.
- src/styles/management.css e src/components/management-ui.tsx: remoção da estrutura concorrente de modais de Eventos/Financeiro e reutilização da base única.
- As 15 páginas inventariadas: tamanho, contexto, rodapés, grupos e ajustes individuais.
- src/components/pages/Relatorios.tsx: adaptação do formulário de geração existente, sem movê-lo para modal.
- src/components/demo/OperationalDemoPanel.tsx e src/components/tour/PresentationTour.tsx: preservação da assistência durante o uso de formulários.
- package.json: comando test:dialogs.
- docs/create-dialog-inventory.json e create-dialog-validation.json: evidências do inventário e da conferência estrutural.

## E. Validação e limites

- **TypeScript:** node node_modules/typescript/bin/tsc --noEmit, sem erros.
- **Testes unitários:** 49 aprovados, incluindo os 46 existentes e três de interação dos diálogos.
- **Build:** npm.cmd run build aprovado.
- **Conferência estrutural:** 40 diálogos com tamanho/contexto e rodapé; 407 usos de controles analisados nas 18 páginas. Valores, callbacks, tipos, limites e código operacional foram preservados, desconsiderando atributos/textos de apresentação e diferenças de formatação. Evidência em [create-dialog-validation.json](create-dialog-validation.json).
- Arquivos de domínio, HotelOperationsContext e acesso/persistência não foram alterados.
- Não foram executados Playwright, automações de interface ou verificações visuais em navegador. A conferência visual manual, inclusive teclado virtual e tecnologias assistivas reais, continua recomendada.
- A área de documentos de hóspedes mantém a simulação anterior; não foi criado serviço de upload ou persistência de arquivos.
- Mantidos os avisos anteriores do Vite sobre configuração futura e bundle acima de 500 kB. Eles não impediram o build.
