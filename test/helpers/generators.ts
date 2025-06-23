// Funções utilitárias para geração de dados de teste

export function gerarISBN10(): string {
  const digitos = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digitos[i]) * (10 - i);
  }
  const digitoVerificador = (11 - (soma % 11)) % 11;
  return digitos + (digitoVerificador === 10 ? 'X' : digitoVerificador.toString());
}

export function gerarISBN13(): string {
  const prefixo = Math.random() < 0.5 ? '978' : '979';
  const digitos = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    const digito = parseInt((prefixo + digitos)[i]);
    soma += digito * (i % 2 === 0 ? 1 : 3);
  }
  const digitoVerificador = (10 - (soma % 10)) % 10;
  return prefixo + digitos + digitoVerificador.toString();
} 