const PackId = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
};

const CreditsPack = [
  {
    id: PackId.SMALL,
    name: 'Small Pack',
    label: '1,000 Credits',
    credits: 1000,
    price: 999,
    priceId: process.env.STRIPE_SMALL_PACK_PRICE_ID,
  },
  {
    id: PackId.MEDIUM,
    name: 'Medium Pack',
    label: '5,000 Credits',
    credits: 5000,
    price: 3999,
    priceId: process.env.STRIPE_MEDIUM_PACK_PRICE_ID,
  },
  {
    id: PackId.LARGE,
    name: 'Large Pack',
    label: '10,000 Credits',
    credits: 10000,
    price: 6999,
    priceId: process.env.STRIPE_LARGE_PACK_PRICE_ID,
  },
];

function getCreditsPack(id) {
  return CreditsPack.find((p) => p.id === id);
}

module.exports = {
  PackId,
  CreditsPack,
  getCreditsPack,
};

