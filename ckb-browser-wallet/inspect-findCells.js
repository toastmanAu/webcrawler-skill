import { ccc } from '@ckb-ccc/core';
const client = new ccc.ClientPublicTestnet({ url: 'https://testnet.ckb.dev' });
console.log('findCells length:', client.findCells.length);
console.log('toString:', client.findCells.toString().slice(0, 300));