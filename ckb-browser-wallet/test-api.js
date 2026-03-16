import { ccc } from '@ckb-ccc/core';

// Test findCells signature
console.log('ccc.ClientPublicTestnet:', ccc.ClientPublicTestnet);
console.log('ccc.Address:', ccc.Address);
console.log('ccc.SignerCkbPrivateKey:', ccc.SignerCkbPrivateKey);

const client = new ccc.ClientPublicTestnet({ url: 'https://testnet.ckb.dev' });
console.log('client.findCells:', client.findCells);
console.log('client.findCells signature?', client.findCells.toString().slice(0, 100));