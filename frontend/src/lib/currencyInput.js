export const normalizeCurrencyInput = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.replace(/^0+(?=\d)/, '');
};

export const formatCurrencyInput = (value) => {
  const digits = normalizeCurrencyInput(value);
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
};
