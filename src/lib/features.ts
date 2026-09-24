/**
 * Funcionalidades que existem no código mas estão desligadas na interface.
 * Trocar para true reativa sem outras mudanças.
 */
export const FEATURES = {
  /**
   * Seções globais (uma seção compartilhada entre páginas). Desligada até
   * resolver: desligar a chave não separar as páginas, e a republicação
   * automática levar rascunhos das outras páginas ao ar. O cabeçalho e o
   * rodapé do site usam o mesmo mecanismo e continuam ativos.
   */
  globalSections: false,
} as const;
