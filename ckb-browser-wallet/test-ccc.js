import { ccc } from '@ckb-ccc/core';
console.log('ccc keys:', Object.keys(ccc).sort());
console.log('ClientPublicTestnet:', ccc.ClientPublicTestnet);
console.log('SignerCkbPrivateKey:', ccc.SignerCkbPrivateKey);
console.log('SignerCkbMnemonic:', ccc.SignerCkbMnemonic);
console.log('Address:', ccc.Address);
console.log('Transaction:', ccc.Transaction);
console.log('mnemonic:', ccc.mnemonic);
console.log('fixedPointFrom:', ccc.fixedPointFrom);